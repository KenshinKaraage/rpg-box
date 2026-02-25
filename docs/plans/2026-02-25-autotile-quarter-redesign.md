# オートタイル クォーター方式 再設計

**日付**: 2026-02-25
**タスク**: T242

## 概要

現在のオートタイルは「タイル全体に1つのバリアント（0〜4）」を計算・保存する方式だが、
これをウディタ形式のクォーター合成方式に刷新する。

- タイルを4つの四角（TL/TR/BL/BR）に分割
- 各クォーターが独立してバリアントを持つ（縦・斜め・横の3方向チェック）
- バリアント計算と合成は**描画側（`buildTileBatch`）のみが担当**
- sliceに保存するデータは通常タイルと同じ形式のまま

---

## チップセット画像フォーマット（ウディタ形式）

```
行0（無）: 隣接なし
行1（縦）: 上または下のみ隣接
行2（横）: 左または右のみ隣接
行3（隅）: 縦+横隣接あり・斜め隣接なし（内角）
行4（全）: 縦+横+斜めすべて隣接
```

列 = チップ種類（アニメーションの場合は列 = フレーム）

---

## クォーターバリアント決定ロジック

タイル(x, y)の各クォーターが参照する方向：

| クォーター | 縦 (v)      | 斜め (d)        | 横 (h)      |
| ---------- | ----------- | --------------- | ----------- |
| TL（左上） | 上 (x, y-1) | 左上 (x-1, y-1) | 左 (x-1, y) |
| TR（右上） | 上 (x, y-1) | 右上 (x+1, y-1) | 右 (x+1, y) |
| BL（左下） | 下 (x, y+1) | 左下 (x-1, y+1) | 左 (x-1, y) |
| BR（右下） | 下 (x, y+1) | 右下 (x+1, y+1) | 右 (x+1, y) |

「同じタイル」の判定：隣接セルのchipsetIdが一致し、かつそのchipsetがautotile=trueであること。

バリアント決定（各クォーター共通）：

| v   | d   | h   | バリアント |
| --- | --- | --- | ---------- |
| ×   | \*  | ×   | 0: 無      |
| ○   | \*  | ×   | 1: 縦      |
| ×   | \*  | ○   | 2: 横      |
| ○   | ×   | ○   | 3: 隅      |
| ○   | ○   | ○   | 4: 全      |

---

## データフロー

### 保存（変更なし）

```
ユーザーがチップ選択 → selectedChipId = "chipsetId:N"（行0のチップ）
塗り: setTile(x, y, "chipsetId:N") ← 通常タイルと同一フロー
```

`calcAutotileChanges` は削除。`useTilePainting` のオートタイル分岐も削除。

### 描画

```
buildTileBatch(tiles, range, chipset, ...) で:

1. tiles[ty][tx] = "csId:N" を読む
2. chipset.autotile === true の場合:
   a. col = N % tilesPerRow （チップ列を取得）
   b. getAutotileQuarters(tiles, tx, ty, csId, mapW, mapH) で
      { tl, tr, bl, br } を計算
   c. 4クォーターそれぞれのUVクアッドを出力（1タイルあたり4×2三角形）
3. chipset.autotile === false の場合:
   従来通り N → UV 直接変換（変更なし）
```

### UV計算（クォーターごと）

クォーター `q`（TL/TR/BL/BR）のバリアントを `v`（0〜4）、チップ列を `col` とする：

```
srcX = col * srcTileW + (qIsRight ? srcTileW/2 : 0)
srcY = v   * srcTileH + (qIsBottom ? srcTileH/2 : 0)
width  = srcTileW / 2
height = srcTileH / 2

UV: (srcX/imgW, srcY/imgH) サイズ (width/imgW, height/imgH)
スクリーン: (tx*tileSize + qOffsetX, ty*tileSize + qOffsetY) サイズ (tileSize/2, tileSize/2)
```

---

## 変更ファイル一覧

### 削除・大幅変更

| ファイル                                           | 変更内容                                                                         |
| -------------------------------------------------- | -------------------------------------------------------------------------------- |
| `src/features/map-editor/utils/autotile.ts`        | `calcAutotileChanges`・`getAutotileVariant` を削除。`getAutotileQuarters` を新設 |
| `src/features/map-editor/utils/tileBatch.ts`       | `isAutotile` + `mapWidth/Height` 引数追加。クォーター合成ロジックを追加          |
| `src/features/map-editor/hooks/useTilePainting.ts` | オートタイル専用分岐（`calcAutotileChanges` 呼び出し）を削除                     |

### 呼び出し元の引数追加

| ファイル                                        | 変更内容                                                                 |
| ----------------------------------------------- | ------------------------------------------------------------------------ |
| `src/features/map-editor/hooks/useMapCanvas.ts` | `buildTileBatch` 呼び出しに `isAutotile`, `mapWidth`, `mapHeight` を追加 |

### テスト

| ファイル                                          | 内容                                     |
| ------------------------------------------------- | ---------------------------------------- |
| `src/features/map-editor/utils/autotile.test.ts`  | `getAutotileQuarters` の全パターンテスト |
| `src/features/map-editor/utils/tileBatch.test.ts` | オートタイル合成パスのテスト追加         |

---

## テストケース方針

- 孤立タイル（8方向すべて非同一）→ 全クォーター=0（無）
- 上のみ隣接 → TL/TR の v=true → TL=1（縦）、TR=1（縦）、BL/BR=0（無）
- 十字接続 → 各クォーターで斜め有無で3 or 4
- マップ端（境界外は非同一扱い）

---

## 非変更範囲

- `ChipPalette.tsx`：オートタイルの表示ロジックは変更なし
- sliceのデータ形式：`"chipsetId:N"` のまま
- 非オートタイルの描画：完全に変更なし
- Undo/Redo：`setTile` / `setTileRange` はそのまま利用可能
