# マップエディタ バグ解説集

> このドキュメントは、マップエディタの実装中に発生した実際のバグとその修正を、
> プログラミング初学者向けにわかりやすく解説したものです。

---

## バグ1: レイヤーが描画されない（`visible` の undefined 問題）

### 何が起きていたか

マップにレイヤーを追加してチップを置いても、キャンバスに何も表示されませんでした。

### 原因

レンダリングコード（`useMapCanvas.ts`）にこんな処理がありました：

```ts
for (const layer of map.layers) {
  if (!layer.visible) continue; // ← ここが問題
  // ...描画処理
}
```

`layer.visible` は TypeScript の型定義で **省略可能（optional）** なフィールドでした：

```ts
interface MapLayer {
  visible?: boolean; // ? がついている = undefined でもOK
}
```

新しく作ったレイヤーは `visible` プロパティを持たないため、`layer.visible` は `undefined` になります。

ここで JavaScript の落とし穴があります：

```ts
!undefined; // → true（!演算子はundefinedをtrueに変換する）
```

つまり「`visible` が設定されていない = 表示する」と設計したのに、
コードでは「`visible` が falsy（undefined含む）= 非表示」と判定していました。

### 修正

```ts
// 修正前
if (!layer.visible) continue;

// 修正後
if (layer.visible === false) continue;
```

`=== false` を使うことで「明示的に `false` に設定したときだけ非表示」という意図が正確に表現されます。
`undefined` のときは `undefined === false` → `false` なので continue しません（= 表示する）。

### 教訓

**省略可能なフラグを条件分岐で使うときは、`=== false` で明示的に比較する。**
`!value` は `null`、`undefined`、`0`、`''` をすべて同じように扱ってしまうので注意が必要です。

---

## バグ2: チップが正しい場所に表示されない（UV座標の計算ミス）

### 何が起きていたか

チップをマップに置くと、見た目がおかしい状態になりました：

- チップセット画像全体が1タイルに縮小されて表示される
- チップがズレて表示される
- 白く表示される

### 前提知識: UV座標とは

WebGL でテクスチャ（画像）を表示するとき、**UV座標** を使って「この三角形にテクスチャのどの部分を貼り付けるか」を指定します。

UV座標は 0.0 〜 1.0 の範囲で表し、テクスチャ全体に対する割合を示します：

```
(0,0)---------(1,0)
  |              |
  |   画像全体   |
  |              |
(0,1)---------(1,1)
```

たとえば 128×64 ピクセルの画像に 32×32 ピクセルのチップが並んでいる場合：

- 1チップの横幅は `32/128 = 0.25`（全体の25%）
- 1チップの縦幅は `32/64 = 0.5`（全体の50%）

### 原因その1: `imgH` に間違った値を渡していた

`useMapCanvas.ts` でバッチデータを作る関数の呼び出しに誤りがありました：

```ts
// 修正前（バグあり）
const batch = buildTileBatch(
  layer.tiles,
  range,
  TILE_SIZE, // 表示サイズ = 32
  meta.width, // 画像の横幅 = 例: 128
  chipset.tileHeight, // ← バグ！チップの高さ(例:32)を渡している
  tilesPerRow // = 4
);
```

本来は **画像全体の高さ**（例: 64）を渡すべきところに、
**チップ1枚の高さ**（例: 32）を渡していました。

結果として UV の縦方向の計算がおかしくなります：

```
正しい: uvH = 32(チップ高) / 64(画像高) = 0.5
誤り:   uvH = 32(表示サイズ) / 32(チップ高として誤用) = 1.0 ← 画像全体の高さになる！
```

`uvH = 1.0` は「テクスチャの縦全体を1タイルに詰め込む」という意味なので、
画像が縦方向に圧縮されて見えました。

### 原因その2: UV計算に表示サイズを使っていた

`buildTileBatch.ts` の UV 計算にも問題がありました：

```ts
// 修正前
const uvW = tileSize / imgW; // tileSize = 表示上のサイズ（32px固定）
const uvH = tileSize / imgH;
```

チップセットのネイティブサイズ（例: 48×48）が表示サイズ（32）と異なる場合、
UV が正しく計算されません。

### 修正

`buildTileBatch` に `srcTileW`（チップの元の横幅）と `srcTileH`（チップの元の縦幅）を追加：

```ts
// 修正後の関数シグネチャ
function buildTileBatch(
  tiles,
  range,
  tileSize, // 表示サイズ（32、ワールド座標に使う）
  imgW, // 画像全体の横幅
  imgH, // 画像全体の縦幅 ← meta.height を渡す
  srcTileW, // チップ1枚のネイティブ横幅
  srcTileH, // チップ1枚のネイティブ縦幅
  tilesPerRow
);

// UV計算（修正後）
const uvW = srcTileW / imgW; // ネイティブサイズ / 画像サイズ
const uvH = srcTileH / imgH;
```

### 教訓

**関数の引数を渡すとき、「型が合う」だけでは不十分。意味も一致させる。**
`chipset.tileHeight`（チップの高さ）と `meta.height`（画像の高さ）はどちらも `number` 型ですが、
全く別の意味を持ちます。パラメータ名を明確にして、呼び出し元で混同しないようにしましょう。

---

## バグ3: 透明部分が黒でなく白く表示される（ブレンディング未設定）

### 何が起きていたか

PNG 画像で透明（alpha=0）のはずの部分が、白く表示されていました。

### 原因

WebGL のデフォルト設定では **アルファブレンディング（透過合成）が無効** です。

ブレンディングなしの場合、フラグメントシェーダーが出力した RGBA 値がそのまま画面に書き込まれます。
多くの PNG ファイルでは透明ピクセルが `(R=1, G=1, B=1, A=0)`（白・透明）として保存されており、
ブレンディングなしで描画すると **白として表示** されます。

### ブレンディングの仕組み

```
最終色 = 描画色 × src係数 + 背景色 × dst係数
```

`SRC_ALPHA / ONE_MINUS_SRC_ALPHA` の設定では：

```
最終色 = 描画色 × alpha + 背景色 × (1 - alpha)
```

alpha が 0（完全透明）のとき：

```
最終色 = 描画色 × 0 + 背景色 × 1 = 背景色（黒）
```

alpha が 1（完全不透明）のとき：

```
最終色 = 描画色 × 1 + 背景色 × 0 = 描画色
```

### 修正

WebGL の初期化時に1行追加：

```ts
gl.clearColor(0, 0, 0, 1); // 背景色：黒
gl.enable(gl.BLEND); // ← ブレンディングを有効化
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); // ← 透過合成の方式を指定
```

### 教訓

**WebGL はデフォルトで「最低限の機能しかONにしない」設計。**
透過、深度テスト（z-buffer）、ステンシルなど、多くの機能は明示的に有効化が必要です。

---

## バグ4: ズームがマウスカーソルの位置を中心にならない（ピボット計算の符号ミス）

### 何が起きていたか

マウスホイールでズームすると、カーソル位置ではなくキャンバスの左上を中心にズームしていました。

### 前提知識: ビューポートとは

このマップエディタでは、「カメラがどこを見ているか」をビューポート座標 `(x, y, zoom)` で管理しています。

```
ワールド座標（マップ上の位置）
  world_x = (viewport.x + 画面上のピクセル位置) / zoom
```

### 原因

`applyZoom` 関数のピボット計算に符号ミスがありました：

```ts
// 修正前（バグあり）
return {
  x: pivotX - (pivotX - v.x) * scale,
  // = pivotX*(1 - scale) + v.x*scale
};
```

**正しいピボットズームの導出：**

ズーム前後でカーソル位置のワールド座標が変わらないようにしたい：

```
ズーム前のワールドx = (v.x + pivotX) / zoom
ズーム後のワールドx = (new_v.x + pivotX) / newZoom

これらを等しくすると：
new_v.x = (v.x + pivotX) * (newZoom / zoom) - pivotX
        = (v.x + pivotX) * scale - pivotX
```

修正前の式を展開すると `pivotX*(1-scale) + v.x*scale`、
正しい式は `pivotX*(scale-1) + v.x*scale` で、`pivotX` の係数の符号が逆でした。

### 修正

```ts
// 修正後
const scale = newZoom / v.zoom;
return {
  x: (v.x + pivotX) * scale - pivotX,
  y: (v.y + pivotY) * scale - pivotY,
  zoom: newZoom,
};
```

### 教訓

**座標変換の計算式は、実際に数値を当てはめて検証する。**
たとえば `zoom=1 → 1.1`、`pivot=(100, 0)`、`v.x=0` のとき：

- 正しい式: `(0 + 100) * 1.1 - 100 = 10`（pivot より右に少しスクロール）
- 誤った式: `100 - (100 - 0) * 1.1 = -10`（逆方向にスクロール）

正しい式は「ズームインしてカーソル右側を見ると少し右にスクロールされる」という直感と一致します。

---

## バグ5: Undo で「revoked proxy」エラー（Immer の Proxy 問題）

### 何が起きていたか

Ctrl+Z で Undo を実行すると、以下のエラーが発生しました：

```
TypeError: illegal operation attempted on a revoked proxy
```

### 原因

Zustand + Immer の組み合わせでは、状態の変更を `set()` というコールバック関数の中で行います。
Immer はコールバック内のオブジェクトを **Proxy** でラップし、変更を追跡しています。

```ts
// Proxy の仕組み（概念）
set((state) => {
  // ここでは state はProxyオブジェクト
  // state.someValue へのアクセスはProxyが監視している
  state.undoStack.pop(); // Proxyが変更を記録
});
// ↑ ここでコールバック終了 → Proxyが「revoke（無効化）」される
```

問題のコードはこうなっていました：

```ts
popUndo: () => {
  let popped: MapEditAction | undefined;
  set((s) => {
    popped = s.undoStack.pop(); // ← Proxy オブジェクトを外の変数に代入
  });
  return popped; // ← ここで使おうとすると、Proxy は既に revoke 済み！
},
```

`s.undoStack.pop()` の戻り値は Immer の Proxy でラップされたオブジェクトです。
これをコールバック外の変数 `popped` に代入して、コールバック終了後にアクセスすると、
「もう無効化された Proxy を操作しようとした」として TypeError になります。

### 修正

`structuredClone()` でコールバック内に **ディープコピー** を作る：

```ts
popUndo: () => {
  let popped: MapEditAction | undefined;
  set((s) => {
    const item = s.undoStack.pop();
    if (item) popped = structuredClone(item); // ← Proxyではなく普通のオブジェクトにコピー
  });
  return popped; // ← 普通のオブジェクトなので安全
},
```

`structuredClone()` はブラウザ組み込みのディープコピー関数で、
ネストしたオブジェクトや配列も含めて完全な複製を作ります。

### Proxy とは何か（補足）

JavaScript の Proxy は「オブジェクトへのアクセスに横から割り込む」仕組みです：

```ts
const handler = {
  get(target, key) {
    console.log(`${key} にアクセスされた`);
    return target[key];
  },
};
const proxy = new Proxy({ name: 'Alice' }, handler);
proxy.name; // コンソールに "name にアクセスされた" と表示
```

Immer はこれを使って「どのプロパティが変更されたか」を追跡しています。
`Proxy.revocable()` で作られた Proxy は `revoke()` を呼ぶと無効化され、
その後アクセスすると TypeError が発生します。

### 教訓

**Immer の `set()` コールバック内のオブジェクトは、コールバック外に「生のまま」持ち出してはいけない。**
外で使いたい場合は、コールバック内で `structuredClone()` や spread 演算子 (`{ ...obj }`) でコピーする。

---

## まとめ

| バグ                   | 根本原因                   | 修正のポイント               |
| ---------------------- | -------------------------- | ---------------------------- |
| レイヤーが描画されない | `!undefined === true` の罠 | `=== false` で明示比較       |
| チップ表示がおかしい   | 引数の「意味」の取り違え   | 画像高さ vs チップ高さを区別 |
| 透明部分が白い         | WebGL ブレンディング未設定 | `gl.enable(gl.BLEND)` を追加 |
| ズームが中心からずれる | 座標変換式の符号ミス       | 数値を代入して式を検証       |
| Undo でクラッシュ      | Immer Proxy の revoke      | `structuredClone()` でコピー |

---

## 共通して言えること

1. **型が同じでも意味が違う** — `number` 型でも「画像の高さ」と「チップの高さ」は別物
2. **falsy 判定に注意** — `undefined`, `null`, `0`, `''` はすべて `!value` で `true` になる
3. **フレームワークの制約を知る** — Immer、WebGL など各ライブラリには独自のルールがある
4. **計算式は具体的な数値で検証** — 特に座標変換は数値を当てはめて直感と一致するか確認する
