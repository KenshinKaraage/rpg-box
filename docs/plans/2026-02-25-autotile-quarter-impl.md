# オートタイル クォーター方式 実装計画

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** オートタイルのバリアント計算をsliceから分離し、描画側でクォーター合成する方式に刷新する

**Architecture:** `autotile.ts` を `getAutotileQuarters` 純粋関数のみに書き直し、`buildTileBatch` がオートタイル判定時に8近傍チェック→4クォーターUVクアッドを出力する。sliceへの保存・`useTilePainting` は通常タイルと同一フローになる。

**Tech Stack:** TypeScript, Jest, WebGL (twgl.js), Zustand

---

## 変更ファイル一覧

| ファイル                                           | 操作                                |
| -------------------------------------------------- | ----------------------------------- |
| `src/features/map-editor/utils/autotile.ts`        | 全面書き直し                        |
| `src/features/map-editor/utils/autotile.test.ts`   | 全面書き直し                        |
| `src/features/map-editor/utils/tileBatch.ts`       | 引数追加・オートタイルパス追加      |
| `src/features/map-editor/utils/tileBatch.test.ts`  | オートタイルテスト追加              |
| `src/features/map-editor/hooks/useTilePainting.ts` | オートタイル専用分岐を削除          |
| `src/features/map-editor/hooks/useMapCanvas.ts`    | `buildTileBatch` 呼び出しに引数追加 |

---

## Task 1: `autotile.ts` を `getAutotileQuarters` に書き直す

**Files:**

- Modify: `src/features/map-editor/utils/autotile.ts`
- Modify: `src/features/map-editor/utils/autotile.test.ts`

### Step 1: 既存テストをすべて削除して新テストを書く

`src/features/map-editor/utils/autotile.test.ts` を以下で**完全に置き換える**:

```typescript
import { getAutotileQuarters } from './autotile';

const W = 5;
const H = 5;
const CS = 'cs1';

function makeTiles(chips: Array<[number, number]>, chipsetId = CS): string[][] {
  const t = Array.from({ length: H }, () => Array<string>(W).fill(''));
  for (const [x, y] of chips) {
    t[y]![x] = `${chipsetId}:0`;
  }
  return t;
}

describe('getAutotileQuarters', () => {
  it('孤立タイル（8方向すべて非同一）→ 全クォーター=0（無）', () => {
    const tiles = makeTiles([[2, 2]]);
    const q = getAutotileQuarters(tiles, 2, 2, CS, W, H);
    expect(q).toEqual({ tl: 0, tr: 0, bl: 0, br: 0 });
  });

  it('上のみ隣接 → TL=1（縦）, TR=1（縦）, BL=0, BR=0', () => {
    const tiles = makeTiles([
      [2, 2],
      [2, 1],
    ]);
    const q = getAutotileQuarters(tiles, 2, 2, CS, W, H);
    expect(q.tl).toBe(1); // 縦
    expect(q.tr).toBe(1); // 縦
    expect(q.bl).toBe(0); // 無
    expect(q.br).toBe(0); // 無
  });

  it('下のみ隣接 → TL=0, TR=0, BL=1（縦）, BR=1（縦）', () => {
    const tiles = makeTiles([
      [2, 2],
      [2, 3],
    ]);
    const q = getAutotileQuarters(tiles, 2, 2, CS, W, H);
    expect(q.tl).toBe(0);
    expect(q.tr).toBe(0);
    expect(q.bl).toBe(1);
    expect(q.br).toBe(1);
  });

  it('左のみ隣接 → TL=2（横）, TR=0, BL=2（横）, BR=0', () => {
    const tiles = makeTiles([
      [2, 2],
      [1, 2],
    ]);
    const q = getAutotileQuarters(tiles, 2, 2, CS, W, H);
    expect(q.tl).toBe(2); // 横
    expect(q.tr).toBe(0); // 無
    expect(q.bl).toBe(2); // 横
    expect(q.br).toBe(0); // 無
  });

  it('右のみ隣接 → TL=0, TR=2（横）, BL=0, BR=2（横）', () => {
    const tiles = makeTiles([
      [2, 2],
      [3, 2],
    ]);
    const q = getAutotileQuarters(tiles, 2, 2, CS, W, H);
    expect(q.tl).toBe(0);
    expect(q.tr).toBe(2);
    expect(q.bl).toBe(0);
    expect(q.br).toBe(2);
  });

  it('上+左（斜め=なし）→ TL=3（隅）', () => {
    // 上(2,1), 左(1,2) に隣接。左上斜め(1,1)はなし
    const tiles = makeTiles([
      [2, 2],
      [2, 1],
      [1, 2],
    ]);
    const q = getAutotileQuarters(tiles, 2, 2, CS, W, H);
    expect(q.tl).toBe(3); // 隅: v=上○, d=左上×, h=左○
  });

  it('上+左+左上斜め → TL=4（全）', () => {
    // 上(2,1), 左(1,2), 左上(1,1) すべてあり
    const tiles = makeTiles([
      [2, 2],
      [2, 1],
      [1, 2],
      [1, 1],
    ]);
    const q = getAutotileQuarters(tiles, 2, 2, CS, W, H);
    expect(q.tl).toBe(4); // 全: v=上○, d=左上○, h=左○
  });

  it('上+右（斜め=なし）→ TR=3（隅）', () => {
    const tiles = makeTiles([
      [2, 2],
      [2, 1],
      [3, 2],
    ]);
    const q = getAutotileQuarters(tiles, 2, 2, CS, W, H);
    expect(q.tr).toBe(3);
  });

  it('下+左（斜め=なし）→ BL=3（隅）', () => {
    const tiles = makeTiles([
      [2, 2],
      [2, 3],
      [1, 2],
    ]);
    const q = getAutotileQuarters(tiles, 2, 2, CS, W, H);
    expect(q.bl).toBe(3);
  });

  it('下+右（斜め=なし）→ BR=3（隅）', () => {
    const tiles = makeTiles([
      [2, 2],
      [2, 3],
      [3, 2],
    ]);
    const q = getAutotileQuarters(tiles, 2, 2, CS, W, H);
    expect(q.br).toBe(3);
  });

  it('4方向+斜めすべてあり → 全クォーター=4（全）', () => {
    const tiles = makeTiles([
      [2, 2],
      [2, 1],
      [2, 3],
      [1, 2],
      [3, 2], // 上下左右
      [1, 1],
      [3, 1],
      [1, 3],
      [3, 3], // 斜め4方向
    ]);
    const q = getAutotileQuarters(tiles, 2, 2, CS, W, H);
    expect(q).toEqual({ tl: 4, tr: 4, bl: 4, br: 4 });
  });

  it('別チップセットは「同じタイル」と判定しない', () => {
    const tiles = makeTiles([[2, 2]]);
    tiles[1]![2] = 'cs2:0'; // 上は別チップセット
    const q = getAutotileQuarters(tiles, 2, 2, CS, W, H);
    expect(q.tl).toBe(0); // 上が同チップセットでないので縦なし
    expect(q.tr).toBe(0);
  });

  it('マップ端（0,0）でクラッシュしない → 全クォーター=0', () => {
    const tiles = makeTiles([[0, 0]]);
    const q = getAutotileQuarters(tiles, 0, 0, CS, W, H);
    expect(q).toEqual({ tl: 0, tr: 0, bl: 0, br: 0 });
  });

  it('マップ端（右下隅）でクラッシュしない', () => {
    const tiles = makeTiles([[W - 1, H - 1]]);
    expect(() => getAutotileQuarters(tiles, W - 1, H - 1, CS, W, H)).not.toThrow();
  });
});
```

### Step 2: テスト実行（失敗を確認）

```bash
npx jest src/features/map-editor/utils/autotile.test.ts --no-coverage
```

Expected: `getAutotileQuarters is not a function` などのエラーで FAIL

### Step 3: `autotile.ts` を書き直す

`src/features/map-editor/utils/autotile.ts` を以下で**完全に置き換える**:

```typescript
/** 各クォーターのバリアント値 */
export const AUTOTILE_NONE = 0; // 無: 縦も横も隣接なし
export const AUTOTILE_VERTICAL = 1; // 縦: 縦のみ隣接
export const AUTOTILE_HORIZONTAL = 2; // 横: 横のみ隣接
export const AUTOTILE_CORNER = 3; // 隅: 縦+横あり・斜めなし（内角）
export const AUTOTILE_ALL = 4; // 全: 縦+横+斜めすべてあり

export interface AutotileQuarters {
  tl: number; // 左上クォーター (0-4)
  tr: number; // 右上クォーター (0-4)
  bl: number; // 左下クォーター (0-4)
  br: number; // 右下クォーター (0-4)
}

/**
 * タイル (x, y) の4クォーターバリアントを計算する
 *
 * 各クォーターは縦・斜め・横の3方向の同チップセット隣接を確認し、
 * 0=無 / 1=縦 / 2=横 / 3=隅 / 4=全 のいずれかを返す。
 *
 * @param tiles    tiles[y][x] = "chipsetId:N" 形式（空文字は空セル）
 * @param x        対象タイルのX座標
 * @param y        対象タイルのY座標
 * @param chipsetId 対象チップセットID
 * @param mapWidth  マップ幅
 * @param mapHeight マップ高さ
 */
export function getAutotileQuarters(
  tiles: string[][],
  x: number,
  y: number,
  chipsetId: string,
  mapWidth: number,
  mapHeight: number
): AutotileQuarters {
  const prefix = chipsetId + ':';
  const isSame = (nx: number, ny: number): boolean => {
    if (nx < 0 || ny < 0 || nx >= mapWidth || ny >= mapHeight) return false;
    return (tiles[ny]?.[nx] ?? '').startsWith(prefix);
  };

  const up = isSame(x, y - 1);
  const down = isSame(x, y + 1);
  const left = isSame(x - 1, y);
  const right = isSame(x + 1, y);
  const topLeft = isSame(x - 1, y - 1);
  const topRight = isSame(x + 1, y - 1);
  const bottomLeft = isSame(x - 1, y + 1);
  const bottomRight = isSame(x + 1, y + 1);

  return {
    tl: calcQuarterVariant(up, topLeft, left),
    tr: calcQuarterVariant(up, topRight, right),
    bl: calcQuarterVariant(down, bottomLeft, left),
    br: calcQuarterVariant(down, bottomRight, right),
  };
}

function calcQuarterVariant(v: boolean, d: boolean, h: boolean): number {
  if (!v && !h) return AUTOTILE_NONE;
  if (v && !h) return AUTOTILE_VERTICAL;
  if (!v && h) return AUTOTILE_HORIZONTAL;
  if (!d) return AUTOTILE_CORNER; // v && !d && h
  return AUTOTILE_ALL; // v && d && h
}
```

### Step 4: テスト実行（全パス確認）

```bash
npx jest src/features/map-editor/utils/autotile.test.ts --no-coverage
```

Expected: すべて PASS

### Step 5: コミット

```bash
git add src/features/map-editor/utils/autotile.ts src/features/map-editor/utils/autotile.test.ts
git commit -m "feat(map-editor): replace autotile variant calc with quarter-tile system [T242]"
```

---

## Task 2: `tileBatch.ts` にオートタイル合成パスを追加する

**Files:**

- Modify: `src/features/map-editor/utils/tileBatch.ts`
- Modify: `src/features/map-editor/utils/tileBatch.test.ts`

### Step 1: `tileBatch.test.ts` にオートタイルテストを追加する

既存テストの末尾（`});` の後）に以下を**追記**する:

```typescript
import { buildTileBatch } from './tileBatch';

// ─── 既存テストはそのまま ──────────────────────────────────────────────────────

describe('buildTileBatch (autotile)', () => {
  // オートタイルチップセット設定:
  // - imgW=32, imgH=160（32x32 タイル × 1列 × 5行）
  // - tilesPerRow=1, srcTileW=32, srcTileH=32
  // - tileSize=32（スクリーン）

  it('孤立オートタイル → 4クォーター × 2三角形 = 48 floats', () => {
    // 周囲に同チップセットなし → 全クォーターが無(0) → 全部行0から取得
    const tiles = [['cs1:0']];
    const result = buildTileBatch(
      tiles,
      { minX: 0, minY: 0, maxX: 1, maxY: 1 },
      'cs1',
      32,
      32,
      160,
      32,
      32,
      1,
      true,
      1,
      1
    );
    // 4クォーター × 2三角形 × 3頂点 × 2成分 = 48
    expect(result.positions).toHaveLength(48);
    expect(result.texcoords).toHaveLength(48);
  });

  it('TLクォーター=無(0) → UV左上が (0, 0)', () => {
    // imgW=32, imgH=160, srcTileW=32, srcTileH=32
    // 行0=無: uvY = 0 * (32/160) = 0
    // TL = 左半分・上半分: uvX=0, uvY=0, size=(0.5, 32/160/2)
    const tiles = [['cs1:0']];
    const result = buildTileBatch(
      tiles,
      { minX: 0, minY: 0, maxX: 1, maxY: 1 },
      'cs1',
      32,
      32,
      160,
      32,
      32,
      1,
      true,
      1,
      1
    );
    // TLクォーターの最初の頂点（左上）のtexcoord = (0, 0)
    expect(result.texcoords[0]).toBeCloseTo(0); // u
    expect(result.texcoords[1]).toBeCloseTo(0); // v
  });

  it('TLクォーター=縦(1) → UV左上のvが 1行目の位置', () => {
    // 上に同チップセットあり → TL/TRが縦(1)
    // imgH=160, srcTileH=32 → uvH = 32/160 = 0.2
    // 行1のuvY = 1 * 0.2 = 0.2
    const tiles = [['cs1:0'], ['cs1:0']]; // tiles[0][0], tiles[1][0]
    const result = buildTileBatch(
      tiles,
      { minX: 0, minY: 1, maxX: 1, maxY: 2 }, // (0,1) を描画
      'cs1',
      32,
      32,
      160,
      32,
      32,
      1,
      true,
      1,
      2 // mapHeight=2
    );
    // tiles[1][0] の上 = tiles[0][0] = 同チップセット → TL=縦(1)
    // TLクォーターの最初の頂点のv = 行1の上半分 = 1 * (32/160) = 0.2
    expect(result.texcoords[1]).toBeCloseTo(0.2);
  });

  it('非オートタイルパスは従来通り1タイル=12 floats', () => {
    const tiles = [['cs1:0']];
    const result = buildTileBatch(
      tiles,
      { minX: 0, minY: 0, maxX: 1, maxY: 1 },
      'cs1',
      32,
      64,
      64,
      32,
      32,
      2,
      false,
      1,
      1
    );
    expect(result.positions).toHaveLength(12);
  });

  it('isAutotile未指定（既存呼び出し形式）も動作する', () => {
    const tiles = [['cs1:0']];
    const result = buildTileBatch(
      tiles,
      { minX: 0, minY: 0, maxX: 1, maxY: 1 },
      'cs1',
      32,
      64,
      64,
      32,
      32,
      2
    );
    expect(result.positions).toHaveLength(12);
  });
});
```

### Step 2: テスト実行（新テストだけ失敗することを確認）

```bash
npx jest src/features/map-editor/utils/tileBatch.test.ts --no-coverage
```

Expected: 既存テストはPASS、追加した `(autotile)` テストがFAIL（引数が多いエラーなど）

### Step 3: `tileBatch.ts` を更新する

`src/features/map-editor/utils/tileBatch.ts` を以下で**完全に置き換える**:

```typescript
import type { TileRange } from './visibleTiles';
import { getAutotileQuarters } from './autotile';

export interface TileBatch {
  positions: number[];
  texcoords: number[];
  count: number;
}

/**
 * 可視タイル範囲の頂点バッファデータを生成する
 * @param tiles      tiles[y][x] = "chipsetId:chipIndex" 形式
 * @param range      可視タイル範囲
 * @param chipsetId  このバッチで描画するチップセットID
 * @param tileSize   表示タイルサイズ（スクリーンピクセル）
 * @param imgW       チップセット画像の幅
 * @param imgH       チップセット画像の高さ
 * @param srcTileW   チップセット内のネイティブタイル幅
 * @param srcTileH   チップセット内のネイティブタイル高さ
 * @param tilesPerRow チップセット1行あたりのタイル数
 * @param isAutotile オートタイルチップセットかどうか（省略時=false）
 * @param mapWidth   マップ幅（isAutotile=true のとき必須）
 * @param mapHeight  マップ高さ（isAutotile=true のとき必須）
 */
export function buildTileBatch(
  tiles: string[][],
  range: TileRange,
  chipsetId: string,
  tileSize: number,
  imgW: number,
  imgH: number,
  srcTileW: number,
  srcTileH: number,
  tilesPerRow: number,
  isAutotile = false,
  mapWidth = 0,
  mapHeight = 0
): TileBatch {
  const positions: number[] = [];
  const texcoords: number[] = [];

  const uvW = srcTileW / imgW;
  const uvH = srcTileH / imgH;

  for (let ty = range.minY; ty < range.maxY; ty++) {
    for (let tx = range.minX; tx < range.maxX; tx++) {
      const chipId = tiles[ty]?.[tx] ?? '';
      if (!chipId) continue;

      const colonIdx = chipId.indexOf(':');
      if (colonIdx === -1) continue;
      if (chipId.slice(0, colonIdx) !== chipsetId) continue;

      const chipIndex = parseInt(chipId.slice(colonIdx + 1), 10);
      if (isNaN(chipIndex)) continue;

      const sx = tx * tileSize;
      const sy = ty * tileSize;

      if (isAutotile) {
        const col = chipIndex % tilesPerRow;
        const { tl, tr, bl, br } = getAutotileQuarters(
          tiles,
          tx,
          ty,
          chipsetId,
          mapWidth,
          mapHeight
        );
        pushQuarter(positions, texcoords, sx, sy, tileSize, col, tl, uvW, uvH, false, false);
        pushQuarter(positions, texcoords, sx, sy, tileSize, col, tr, uvW, uvH, true, false);
        pushQuarter(positions, texcoords, sx, sy, tileSize, col, bl, uvW, uvH, false, true);
        pushQuarter(positions, texcoords, sx, sy, tileSize, col, br, uvW, uvH, true, true);
      } else {
        const ux = (chipIndex % tilesPerRow) * uvW;
        const uy = Math.floor(chipIndex / tilesPerRow) * uvH;
        // 三角形1: 左上, 右上, 左下
        positions.push(sx, sy, sx + tileSize, sy, sx, sy + tileSize);
        texcoords.push(ux, uy, ux + uvW, uy, ux, uy + uvH);
        // 三角形2: 右上, 右下, 左下
        positions.push(sx + tileSize, sy, sx + tileSize, sy + tileSize, sx, sy + tileSize);
        texcoords.push(ux + uvW, uy, ux + uvW, uy + uvH, ux, uy + uvH);
      }
    }
  }

  return { positions, texcoords, count: positions.length / 2 };
}

/**
 * クォーター1枚分（tileSize/2 × tileSize/2）の頂点データを追加する
 * @param isRight  右半分のクォーターかどうか
 * @param isBottom 下半分のクォーターかどうか
 */
function pushQuarter(
  positions: number[],
  texcoords: number[],
  sx: number,
  sy: number,
  tileSize: number,
  col: number,
  variant: number,
  uvW: number,
  uvH: number,
  isRight: boolean,
  isBottom: boolean
): void {
  const qs = tileSize / 2;
  const qx = sx + (isRight ? qs : 0);
  const qy = sy + (isBottom ? qs : 0);

  const uOff = isRight ? uvW / 2 : 0;
  const vOff = isBottom ? uvH / 2 : 0;
  const ux = col * uvW + uOff;
  const uy = variant * uvH + vOff;
  const quvW = uvW / 2;
  const quvH = uvH / 2;

  // 三角形1: 左上, 右上, 左下
  positions.push(qx, qy, qx + qs, qy, qx, qy + qs);
  texcoords.push(ux, uy, ux + quvW, uy, ux, uy + quvH);
  // 三角形2: 右上, 右下, 左下
  positions.push(qx + qs, qy, qx + qs, qy + qs, qx, qy + qs);
  texcoords.push(ux + quvW, uy, ux + quvW, uy + quvH, ux, uy + quvH);
}
```

### Step 4: テスト実行（全パス確認）

```bash
npx jest src/features/map-editor/utils/tileBatch.test.ts --no-coverage
```

Expected: すべて PASS

### Step 5: コミット

```bash
git add src/features/map-editor/utils/tileBatch.ts src/features/map-editor/utils/tileBatch.test.ts
git commit -m "feat(map-editor): add autotile quarter compositing to buildTileBatch [T242]"
```

---

## Task 3: `useTilePainting.ts` のオートタイル専用分岐を削除する

**Files:**

- Modify: `src/features/map-editor/hooks/useTilePainting.ts`

### Step 1: 以下の変更を適用する

削除するコード（`paint` 関数内、fill分岐の後）:

```typescript
// 削除: autotileChipsetIds の計算（useTilePainting 関数の中、mapId/layerId 直後）
const autotileChipsetIds = new Set(
  layer.chipsetIds.filter((id) => chipsets.find((c) => c.id === id)?.autotile)
);
```

```typescript
// 削除: このif全体
if (autotileChipsetIds.size > 0 && (currentTool === 'pen' || currentTool === 'eraser')) {
  const tiles = layer.tiles ?? [];
  const paintChipsetId =
    currentTool === 'pen' && selectedChipId ? (selectedChipId.split(':')[0] ?? null) : null;
  const changes = calcAutotileChanges(
    tiles,
    tx,
    ty,
    paintChipsetId,
    map.width,
    map.height,
    autotileChipsetIds
  );
  if (changes.length === 0) return;
  changes.forEach(({ x, y, chipId }) => setTile(mapId, layerId, x, y, chipId));
  pushUndo({
    type: 'setTileRange',
    mapId,
    layerId,
    tiles: changes.map(({ x, y, chipId }) => ({
      x,
      y,
      prev: layer.tiles?.[y]?.[x] ?? '',
      next: chipId,
    })),
  });
  return;
}
```

削除するimport:

```typescript
import { calcAutotileChanges } from '../utils/autotile';
```

削除するuseStore:

```typescript
const chipsets = useStore((s) => s.chipsets);
```

削除後、`useCallback` の依存配列から `chipsets` も削除する:

```typescript
// 変更前
[currentTool, selectedChipId, viewport, maps, chipsets, mapId, layerId, setTile, pushUndo][
  // 変更後
  (currentTool, selectedChipId, viewport, maps, mapId, layerId, setTile, pushUndo)
];
```

### Step 2: TypeScriptコンパイル確認

```bash
npx tsc --noEmit
```

Expected: エラーなし（`calcAutotileChanges` の未使用import警告が消えること）

### Step 3: コミット

```bash
git add src/features/map-editor/hooks/useTilePainting.ts
git commit -m "refactor(map-editor): remove autotile propagation from useTilePainting [T242]"
```

---

## Task 4: `useMapCanvas.ts` の `buildTileBatch` 呼び出しを更新する

**Files:**

- Modify: `src/features/map-editor/hooks/useMapCanvas.ts`

### Step 1: `buildTileBatch` の呼び出し部分を更新する

`useMapCanvas.ts` の `buildTileBatch` 呼び出し箇所（現在9引数）を探して更新する:

```typescript
// 変更前
const batch = buildTileBatch(
  layer.tiles,
  range,
  chipsetId,
  TILE_SIZE,
  meta.width,
  meta.height,
  chipset.tileWidth,
  chipset.tileHeight,
  tilesPerRow
);

// 変更後
const batch = buildTileBatch(
  layer.tiles,
  range,
  chipsetId,
  TILE_SIZE,
  meta.width,
  meta.height,
  chipset.tileWidth,
  chipset.tileHeight,
  tilesPerRow,
  chipset.autotile,
  map.width,
  map.height
);
```

### Step 2: TypeScriptコンパイル確認

```bash
npx tsc --noEmit
```

Expected: エラーなし

### Step 3: 全テスト実行

```bash
npx jest src/features/map-editor/ --no-coverage
```

Expected: すべて PASS

### Step 4: コミット

```bash
git add src/features/map-editor/hooks/useMapCanvas.ts
git commit -m "feat(map-editor): wire autotile quarter rendering in useMapCanvas [T242]"
```

---

## Task 5: 不要な定数・型をcleanupしてfinal確認

**Files:**

- Modify: `src/features/map-editor/utils/autotile.ts`（エクスポートしている旧定数が残っていれば削除）

### Step 1: 全テスト実行

```bash
npx jest --no-coverage
```

Expected: すべて PASS（既存テストへの回帰なし）

### Step 2: TypeScriptコンパイル確認

```bash
npx tsc --noEmit
```

Expected: エラーなし

### Step 3: 最終コミット（変更があれば）

```bash
git add -p  # 変更内容を確認してステージング
git commit -m "chore(map-editor): cleanup unused autotile exports [T242]"
```

---

## 補足: 既存タイルデータについて

現在のsliceに保存されているオートタイルデータは `"cs:variant"` 形式（variant=0〜4）。
新システムでは `chipIndex % tilesPerRow` でチップ列を計算するため、
**tilesPerRow=1の単チップオートタイルは `N % 1 = 0` で常に正しい列（col=0）を返す**。
既存データの再塗りは不要。複数チップのオートタイルは旧システムでもチップ情報が失われていたため影響なし。
