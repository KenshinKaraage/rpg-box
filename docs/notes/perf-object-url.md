# Object URL 変換によるチップセット画像のパフォーマンス最適化

**対象タスク:** T242 / マップエディタ全般
**日付:** 2026-02-26

---

## 問題の概要

572KB の PNG チップセット画像は Base64 エンコード後に **約 762KB の文字列**として
Zustand の `assets` スライスに保存されている。
この長い文字列が複数の箇所でコピー・参照されることが、以下の症状の根本原因である。

- チップ選択に時間がかかる
- 初回ロード時のキャンバス表示が遅い
- タイルを置くたびにUI全体がもたつく

---

## ボトルネック詳細

### ボトルネック 1: ChipPalette の DOM ボタン群

`ChipPalette.tsx` は各チップを個別の `<button>` 要素として生成し、
`backgroundImage: url(data:image/png;base64,...)` をインラインスタイルとして各ボタンに適用する。

```
512×512px チップセット / 32×32px タイル → 256 個のボタン
各ボタンの style に 762KB 文字列が埋め込まれる
```

`selectedChipId` が変わるたびにページが再レンダリングされ、
256 ボタン分の仮想DOM差分計算・CSS 再計算が毎回走る。

### ボトルネック 2: WebGL テクスチャの初回ロード

`useMapCanvas.ts` では `img.src = asset.data`（762KB Base64 文字列）として
`<img>` 要素の src に直接設定してテクスチャをロードする。

ブラウザは `data:` URL を受け取ると毎回以下の処理を行う：

1. Base64 文字列全体を走査して MIME タイプを取得
2. `atob()` 相当の処理で 762KB → 572KB のバイト列に変換
3. PNG デコード
4. WebGL テクスチャ作成

---

## 解決策: Object URL (Blob URL) 変換

`URL.createObjectURL(blob)` を使い、Base64 文字列を一度だけ `Blob` に変換して
`blob:http://...` 形式の短い URL を発行する。

```
"data:image/png;base64,AAAA..." (762KB)
         ↓ 1回だけ変換
"blob:http://localhost:3000/abc-123-def" (~50B)
```

ブラウザは Blob URL に対してメモリ上のバイナリを直接参照するため、
文字列比較・CSS パース・Base64 デコードのコストがすべて消える。

### 効果比較

| 箇所                                 | Before                    | After                      |
| ------------------------------------ | ------------------------- | -------------------------- |
| ChipPalette ボタンの backgroundImage | 762KB 文字列 × ボタン数   | 〜50B 文字列 × ボタン数    |
| 仮想DOM差分計算                      | 長い文字列比較 × ボタン数 | 短い文字列比較 × ボタン数  |
| WebGL テクスチャロード               | Base64 デコード（毎回）   | メモリ参照（初回のみ変換） |
| CSS 再計算                           | 762KB 文字列のパース      | 〜50B URL の参照           |

### 制約

- Blob URL はそのタブのセッション中のみ有効（ページリロードで無効化される）
- 使い終わった Blob URL は `URL.revokeObjectURL()` で解放する必要がある
  - コンポーネントのアンマウント時
  - 同じ枠に別アセットをロードしたとき（上書き前に解放）

---

## 実装方針

### 1. `useBlobUrl` フック (`src/hooks/useBlobUrl.ts`) — 新規作成

data URL を受け取り、Blob URL を返すフック。
`dataUrl` が変わったとき（チップセット切り替え）に前の Blob URL を解放する。

```typescript
export function useBlobUrl(dataUrl: string | null): string | null;
```

内部で `dataUrlToBlob()` ユーティリティ（同ファイル内）を使い、
`useEffect` で非同期に変換・設定する。

### 2. `page.tsx` の修正 (`src/app/(editor)/map/page.tsx`)

ChipPalette に渡す画像 URL を `useBlobUrl` で変換した Blob URL に差し替える。

```typescript
// Before
imageDataUrl={(chipsetAsset?.data as string) ?? null}

// After
const chipsetBlobUrl = useBlobUrl((chipsetAsset?.data as string) ?? null);
// ...
imageDataUrl={chipsetBlobUrl}
```

### 3. `useMapCanvas.ts` の修正 (`src/features/map-editor/hooks/useMapCanvas.ts`)

WebGL テクスチャロード時に Base64 文字列ではなく Blob URL を使うよう変更。
Blob URL は `blobUrlCache`（`useRef<Map<string, string>>`）にキャッシュし、
同一アセットの二重変換を防ぐ。

```typescript
const blobUrlCache = useRef<Map<string, string>>(new Map()); // assetId → blobUrl

// テクスチャロード時:
let blobUrl = blobUrlCache.current.get(asset.id);
if (!blobUrl) {
  blobUrl = URL.createObjectURL(dataUrlToBlob(asset.data as string));
  blobUrlCache.current.set(asset.id, blobUrl);
}
img.src = blobUrl; // Base64 文字列の代わりに Blob URL を使用
```

---

## 変更ファイル一覧

| ファイル                                        | 変更種別 | 内容                                               |
| ----------------------------------------------- | -------- | -------------------------------------------------- |
| `src/hooks/useBlobUrl.ts`                       | 新規作成 | data URL → Blob URL 変換フック + ユーティリティ    |
| `src/app/(editor)/map/page.tsx`                 | 修正     | `useBlobUrl` を使い Blob URL を ChipPalette に渡す |
| `src/features/map-editor/hooks/useMapCanvas.ts` | 修正     | テクスチャロード時に Blob URL キャッシュを使用     |
| `src/hooks/useBlobUrl.test.ts`                  | 新規作成 | フックのユニットテスト                             |

---

## 今後の追加最適化（別タスク）

- **ChipPalette を Canvas 2D に変更**: DOM ボタンを `<canvas>` 1 枚に置き換え、
  ボタン数による線形コストをゼロにする
- **tileBatch ダーティチェック**: 変更されたチップセットのバッチのみ再構築する
- **WebGL バッファキャッシュ**: 毎フレームの `createBufferInfoFromArrays` を削減する
- **`assets` を useMapCanvas の deps から除外**:
  メタデータをテクスチャロード時にキャッシュし、不要な再レンダリングを防ぐ
