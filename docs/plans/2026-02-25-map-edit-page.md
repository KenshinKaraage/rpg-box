# Map Edit Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the full map edit page (Phase 13, T159–T171a) — a 3-column WebGL tile map editor with tile painting, object placement, and undo/redo.

**Architecture:** mapEditorSlice holds editor UI state (tool, viewport, undo stack) separately from mapSlice (data). MapCanvas uses twgl.js for WebGL rendering. Custom hooks isolate canvas init, viewport, tile painting, object placement, and keyboard shortcuts.

**Tech Stack:** Next.js App Router, twgl.js (WebGL helper), Zustand + Immer, React Testing Library, Jest

---

## Prerequisites

### Task 0: Install twgl.js

**Files:**
- Modify: `package.json`

**Step 1: Install the package**

```bash
npm install twgl.js
npm install --save-dev @types/twgl.js
```

**Step 2: Verify types resolve**

```bash
npx tsc --noEmit 2>&1 | grep twgl
```

Expected: no output (no errors)

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add twgl.js for WebGL tile rendering [T160]"
```

---

## Task 1: mapEditorSlice

**Files:**
- Create: `src/stores/mapEditorSlice.ts`
- Create: `src/stores/mapEditorSlice.test.ts`
- Modify: `src/stores/index.ts`

### What it does

Holds editor-only UI state: active tool, selected chip, viewport, grid toggle, and undo/redo stack for tile + object operations.

### Step 1: Write the failing tests

```typescript
// src/stores/mapEditorSlice.test.ts
import { createMapEditorSlice } from './mapEditorSlice';

// テスト用のスタンドアロンストアを作る
function makeSlice() {
  let state = createMapEditorSlice((fn) => { fn(state); }, () => state);
  const set = (fn: (s: typeof state) => void) => { fn(state); };
  state = createMapEditorSlice(set, () => state);
  return { get: () => state, set };
}

describe('mapEditorSlice', () => {
  it('初期値が正しい', () => {
    const { get } = makeSlice();
    expect(get().currentTool).toBe('pen');
    expect(get().selectedChipId).toBeNull();
    expect(get().viewport).toEqual({ x: 0, y: 0, zoom: 1 });
    expect(get().showGrid).toBe(true);
    expect(get().undoStack).toHaveLength(0);
    expect(get().redoStack).toHaveLength(0);
  });

  it('setTool でツールを変更できる', () => {
    const { get } = makeSlice();
    get().setTool('eraser');
    expect(get().currentTool).toBe('eraser');
  });

  it('selectChip でチップを選択できる', () => {
    const { get } = makeSlice();
    get().selectChip('cs1:0');
    expect(get().selectedChipId).toBe('cs1:0');
  });

  it('setViewport で部分更新できる', () => {
    const { get } = makeSlice();
    get().setViewport({ zoom: 2 });
    expect(get().viewport).toEqual({ x: 0, y: 0, zoom: 2 });
  });

  it('toggleGrid で切り替えできる', () => {
    const { get } = makeSlice();
    get().toggleGrid();
    expect(get().showGrid).toBe(false);
    get().toggleGrid();
    expect(get().showGrid).toBe(true);
  });

  it('pushUndo → undo → redo が動作する', () => {
    const { get } = makeSlice();
    const action = {
      type: 'setTile' as const,
      mapId: 'm1', layerId: 'l1', x: 0, y: 0,
      prev: '', next: 'cs1:0',
    };
    get().pushUndo(action);
    expect(get().undoStack).toHaveLength(1);
    expect(get().redoStack).toHaveLength(0);

    const popped = get().popUndo();
    expect(popped).toEqual(action);
    expect(get().undoStack).toHaveLength(0);

    get().pushRedo(action);
    expect(get().redoStack).toHaveLength(1);

    const repopped = get().popRedo();
    expect(repopped).toEqual(action);
    expect(get().redoStack).toHaveLength(0);
  });

  it('pushUndo は undoStack が 100 件を超えたら古いものを捨てる', () => {
    const { get } = makeSlice();
    for (let i = 0; i < 101; i++) {
      get().pushUndo({
        type: 'setTile', mapId: 'm1', layerId: 'l1',
        x: i, y: 0, prev: '', next: 'cs1:0',
      });
    }
    expect(get().undoStack).toHaveLength(100);
  });

  it('pushUndo は redoStack をクリアする', () => {
    const { get } = makeSlice();
    get().pushRedo({ type: 'setTile', mapId: 'm1', layerId: 'l1', x: 0, y: 0, prev: '', next: 'cs1:0' });
    get().pushUndo({ type: 'setTile', mapId: 'm1', layerId: 'l1', x: 1, y: 0, prev: '', next: 'cs1:1' });
    expect(get().redoStack).toHaveLength(0);
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
npx jest src/stores/mapEditorSlice.test.ts
```

Expected: FAIL — `createMapEditorSlice` not found

**Step 3: Implement mapEditorSlice**

```typescript
// src/stores/mapEditorSlice.ts
import type { MapObject } from '@/types/map';
import type { StateCreator } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export type MapEditTool = 'select' | 'pen' | 'eraser' | 'fill' | 'rect';

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export type MapEditAction =
  | { type: 'setTile'; mapId: string; layerId: string; x: number; y: number; prev: string; next: string }
  | { type: 'setTileRange'; mapId: string; layerId: string; tiles: Array<{ x: number; y: number; prev: string; next: string }> }
  | { type: 'addObject'; mapId: string; layerId: string; object: MapObject }
  | { type: 'deleteObject'; mapId: string; layerId: string; object: MapObject };

const MAX_UNDO = 100;

export interface MapEditorSlice {
  currentTool: MapEditTool;
  selectedChipId: string | null;
  viewport: Viewport;
  showGrid: boolean;
  undoStack: MapEditAction[];
  redoStack: MapEditAction[];

  setTool: (tool: MapEditTool) => void;
  selectChip: (chipId: string | null) => void;
  setViewport: (v: Partial<Viewport>) => void;
  toggleGrid: () => void;
  pushUndo: (action: MapEditAction) => void;
  popUndo: () => MapEditAction | undefined;
  pushRedo: (action: MapEditAction) => void;
  popRedo: () => MapEditAction | undefined;
}

export const createMapEditorSlice: StateCreator<
  MapEditorSlice,
  [['zustand/immer', never]],
  [],
  MapEditorSlice
> = (set, get) => ({
  currentTool: 'pen',
  selectedChipId: null,
  viewport: { x: 0, y: 0, zoom: 1 },
  showGrid: true,
  undoStack: [],
  redoStack: [],

  setTool: (tool) => set((s) => { s.currentTool = tool; }),
  selectChip: (chipId) => set((s) => { s.selectedChipId = chipId; }),
  setViewport: (v) => set((s) => { Object.assign(s.viewport, v); }),
  toggleGrid: () => set((s) => { s.showGrid = !s.showGrid; }),

  pushUndo: (action) => set((s) => {
    s.undoStack.push(action);
    if (s.undoStack.length > MAX_UNDO) s.undoStack.shift();
    s.redoStack = [];
  }),

  popUndo: () => {
    let popped: MapEditAction | undefined;
    set((s) => { popped = s.undoStack.pop(); });
    return popped;
  },

  pushRedo: (action) => set((s) => { s.redoStack.push(action); }),

  popRedo: () => {
    let popped: MapEditAction | undefined;
    set((s) => { popped = s.redoStack.pop(); });
    return popped;
  },
});
```

**Step 4: Integrate into store**

`src/stores/index.ts` に追加:

```typescript
import { createMapEditorSlice, MapEditorSlice } from './mapEditorSlice';

type StoreState = UISlice &
  GameSettingsSlice &
  VariableSlice &
  ClassSlice &
  AssetSlice &
  DataSlice &
  ScriptSlice &
  MapSlice &
  PrefabSlice &
  MapEditorSlice;  // ← 追加

// immer(...args) の中に ...createMapEditorSlice(...args) を追加
```

**Step 5: Run tests**

```bash
npx jest src/stores/mapEditorSlice.test.ts
```

Expected: PASS (8 tests)

**Step 6: Commit**

```bash
git add src/stores/mapEditorSlice.ts src/stores/mapEditorSlice.test.ts src/stores/index.ts
git commit -m "feat(map-editor): add mapEditorSlice with tool/viewport/undo state [T159]"
```

---

## Task 2: WebGL ユーティリティ — coordTransform

**Files:**
- Create: `src/features/map-editor/utils/coordTransform.ts`
- Create: `src/features/map-editor/utils/coordTransform.test.ts`

### Step 1: Write the failing tests

```typescript
// src/features/map-editor/utils/coordTransform.test.ts
import { screenToTile, tileToScreen } from './coordTransform';

describe('screenToTile', () => {
  it('ズーム1・オフセット0でタイル座標を返す', () => {
    expect(screenToTile(64, 32, { x: 0, y: 0, zoom: 1 }, 32)).toEqual({ tx: 2, ty: 1 });
  });

  it('ズーム2でタイル座標を返す', () => {
    expect(screenToTile(128, 64, { x: 0, y: 0, zoom: 2 }, 32)).toEqual({ tx: 2, ty: 1 });
  });

  it('オフセットを考慮する', () => {
    expect(screenToTile(96, 64, { x: 32, y: 32, zoom: 1 }, 32)).toEqual({ tx: 2, ty: 1 });
  });
});

describe('tileToScreen', () => {
  it('タイル座標をスクリーン座標に変換する', () => {
    expect(tileToScreen(2, 1, { x: 0, y: 0, zoom: 1 }, 32)).toEqual({ sx: 64, sy: 32 });
  });

  it('ズーム2を考慮する', () => {
    expect(tileToScreen(2, 1, { x: 0, y: 0, zoom: 2 }, 32)).toEqual({ sx: 128, sy: 64 });
  });
});
```

### Step 2: Run tests (expect FAIL)

```bash
npx jest src/features/map-editor/utils/coordTransform.test.ts
```

### Step 3: Implement

```typescript
// src/features/map-editor/utils/coordTransform.ts
import type { Viewport } from '@/stores/mapEditorSlice';

export function screenToTile(
  sx: number, sy: number,
  viewport: Viewport,
  tileSize: number
): { tx: number; ty: number } {
  return {
    tx: Math.floor((sx + viewport.x) / (tileSize * viewport.zoom)),
    ty: Math.floor((sy + viewport.y) / (tileSize * viewport.zoom)),
  };
}

export function tileToScreen(
  tx: number, ty: number,
  viewport: Viewport,
  tileSize: number
): { sx: number; sy: number } {
  return {
    sx: tx * tileSize * viewport.zoom - viewport.x,
    sy: ty * tileSize * viewport.zoom - viewport.y,
  };
}
```

### Step 4: Run tests (expect PASS)

```bash
npx jest src/features/map-editor/utils/coordTransform.test.ts
```

### Step 5: Commit

```bash
git add src/features/map-editor/utils/coordTransform.ts src/features/map-editor/utils/coordTransform.test.ts
git commit -m "feat(map-editor): add coordTransform utility [T166]"
```

---

## Task 3: WebGL ユーティリティ — visibleTiles

**Files:**
- Create: `src/features/map-editor/utils/visibleTiles.ts`
- Create: `src/features/map-editor/utils/visibleTiles.test.ts`

### Step 1: Write the failing tests

```typescript
// src/features/map-editor/utils/visibleTiles.test.ts
import { getVisibleTileRange } from './visibleTiles';

describe('getVisibleTileRange', () => {
  const viewport = { x: 0, y: 0, zoom: 1 };
  const canvasSize = { w: 320, h: 160 };
  const mapSize = { w: 20, h: 15 };
  const tileSize = 32;

  it('ズーム1でキャンバスに収まるタイル範囲を返す', () => {
    const r = getVisibleTileRange(viewport, canvasSize, mapSize, tileSize);
    expect(r.minX).toBe(0);
    expect(r.minY).toBe(0);
    expect(r.maxX).toBe(10); // 320/32 = 10
    expect(r.maxY).toBe(5);  // 160/32 = 5
  });

  it('マップ範囲を超えない', () => {
    const r = getVisibleTileRange(viewport, { w: 9999, h: 9999 }, mapSize, tileSize);
    expect(r.maxX).toBe(20);
    expect(r.maxY).toBe(15);
  });

  it('パン済みの場合にオフセットを反映する', () => {
    const r = getVisibleTileRange({ x: 64, y: 32, zoom: 1 }, canvasSize, mapSize, tileSize);
    expect(r.minX).toBe(2);
    expect(r.minY).toBe(1);
  });
});
```

### Step 2: Run tests (expect FAIL)

```bash
npx jest src/features/map-editor/utils/visibleTiles.test.ts
```

### Step 3: Implement

```typescript
// src/features/map-editor/utils/visibleTiles.ts
import type { Viewport } from '@/stores/mapEditorSlice';

export interface TileRange {
  minX: number; minY: number;
  maxX: number; maxY: number;
}

export function getVisibleTileRange(
  viewport: Viewport,
  canvas: { w: number; h: number },
  map: { w: number; h: number },
  tileSize: number
): TileRange {
  const scaledTile = tileSize * viewport.zoom;
  return {
    minX: Math.max(0, Math.floor(viewport.x / scaledTile)),
    minY: Math.max(0, Math.floor(viewport.y / scaledTile)),
    maxX: Math.min(map.w, Math.ceil((viewport.x + canvas.w) / scaledTile)),
    maxY: Math.min(map.h, Math.ceil((viewport.y + canvas.h) / scaledTile)),
  };
}
```

### Step 4: Run tests (expect PASS)

```bash
npx jest src/features/map-editor/utils/visibleTiles.test.ts
```

### Step 5: Commit

```bash
git add src/features/map-editor/utils/visibleTiles.ts src/features/map-editor/utils/visibleTiles.test.ts
git commit -m "feat(map-editor): add visibleTiles viewport culling utility [T171]"
```

---

## Task 4: WebGL ユーティリティ — tileFill（フラッドフィル）

**Files:**
- Create: `src/features/map-editor/utils/tileFill.ts`
- Create: `src/features/map-editor/utils/tileFill.test.ts`

### Step 1: Write the failing tests

```typescript
// src/features/map-editor/utils/tileFill.test.ts
import { floodFill } from './tileFill';

function makeGrid(rows: string[][]): string[][] {
  return rows.map(row => [...row]);
}

describe('floodFill', () => {
  it('同じチップの隣接タイルを置き換える', () => {
    const grid = makeGrid([
      ['A', 'A', 'B'],
      ['A', 'A', 'B'],
      ['B', 'B', 'B'],
    ]);
    const changes = floodFill(grid, 0, 0, 'C', 3, 3);
    expect(changes).toContainEqual({ x: 0, y: 0, prev: 'A', next: 'C' });
    expect(changes).toContainEqual({ x: 1, y: 0, prev: 'A', next: 'C' });
    expect(changes).toContainEqual({ x: 0, y: 1, prev: 'A', next: 'C' });
    expect(changes).toHaveLength(4);
  });

  it('既に同じチップなら変更なし', () => {
    const grid = makeGrid([['A', 'A'], ['A', 'A']]);
    const changes = floodFill(grid, 0, 0, 'A', 2, 2);
    expect(changes).toHaveLength(0);
  });

  it('マップ範囲外に出ない', () => {
    const grid = makeGrid([['A']]);
    const changes = floodFill(grid, 0, 0, 'B', 1, 1);
    expect(changes).toHaveLength(1);
  });
});
```

### Step 2: Run tests (expect FAIL)

```bash
npx jest src/features/map-editor/utils/tileFill.test.ts
```

### Step 3: Implement（BFS）

```typescript
// src/features/map-editor/utils/tileFill.ts
export interface TileChange {
  x: number; y: number;
  prev: string; next: string;
}

export function floodFill(
  grid: string[][],
  startX: number,
  startY: number,
  newChip: string,
  mapW: number,
  mapH: number
): TileChange[] {
  const targetChip = grid[startY]?.[startX] ?? '';
  if (targetChip === newChip) return [];

  const changes: TileChange[] = [];
  const visited = new Set<string>();
  const queue: Array<{ x: number; y: number }> = [{ x: startX, y: startY }];

  while (queue.length > 0) {
    const cell = queue.shift()!;
    const key = `${cell.x},${cell.y}`;
    if (visited.has(key)) continue;
    if (cell.x < 0 || cell.x >= mapW || cell.y < 0 || cell.y >= mapH) continue;
    if (grid[cell.y]?.[cell.x] !== targetChip) continue;

    visited.add(key);
    changes.push({ x: cell.x, y: cell.y, prev: targetChip, next: newChip });

    queue.push(
      { x: cell.x + 1, y: cell.y },
      { x: cell.x - 1, y: cell.y },
      { x: cell.x, y: cell.y + 1 },
      { x: cell.x, y: cell.y - 1 },
    );
  }

  return changes;
}
```

### Step 4: Run tests (expect PASS)

```bash
npx jest src/features/map-editor/utils/tileFill.test.ts
```

### Step 5: Commit

```bash
git add src/features/map-editor/utils/tileFill.ts src/features/map-editor/utils/tileFill.test.ts
git commit -m "feat(map-editor): add floodFill algorithm utility [T170]"
```

---

## Task 5: WebGL シェーダー + tileBatch

**Files:**
- Create: `src/features/map-editor/utils/shaders.ts`
- Create: `src/features/map-editor/utils/tileBatch.ts`
- Create: `src/features/map-editor/utils/tileBatch.test.ts`

### Step 1: シェーダー定義

テストなし（GLSL 文字列の定数）:

```typescript
// src/features/map-editor/utils/shaders.ts

export const TILE_VERT = `
attribute vec2 a_position;
attribute vec2 a_texcoord;
uniform mat4 u_matrix;
varying vec2 v_texcoord;
void main() {
  gl_Position = u_matrix * vec4(a_position, 0.0, 1.0);
  v_texcoord = a_texcoord;
}
`;

export const TILE_FRAG = `
precision mediump float;
varying vec2 v_texcoord;
uniform sampler2D u_texture;
void main() {
  gl_FragColor = texture2D(u_texture, v_texcoord);
}
`;

export const GRID_VERT = `
attribute vec2 a_position;
uniform mat4 u_matrix;
void main() {
  gl_Position = u_matrix * vec4(a_position, 0.0, 1.0);
}
`;

export const GRID_FRAG = `
precision mediump float;
uniform vec4 u_color;
void main() {
  gl_FragColor = u_color;
}
`;
```

### Step 2: tileBatch のテスト

```typescript
// src/features/map-editor/utils/tileBatch.test.ts
import { buildTileBatch } from './tileBatch';

describe('buildTileBatch', () => {
  it('空のレイヤーなら空の配列を返す', () => {
    const result = buildTileBatch([], { minX: 0, minY: 0, maxX: 2, maxY: 2 }, 32, 128, 128, 1);
    expect(result.positions).toHaveLength(0);
    expect(result.texcoords).toHaveLength(0);
  });

  it('タイル1枚分の頂点データを生成する', () => {
    // "chipsetId:0" → チップ0番 = 左上 UV (0,0)-(tileW/imgW, tileH/imgH)
    const tiles = [['cs1:0']];
    const result = buildTileBatch(tiles, { minX: 0, minY: 0, maxX: 1, maxY: 1 }, 32, 64, 64, 1);
    // 1タイル = 2三角形 = 6頂点 = 12 floats (x,y per vertex)
    expect(result.positions).toHaveLength(12);
    expect(result.texcoords).toHaveLength(12);
  });
});
```

### Step 3: tileBatch の実装

```typescript
// src/features/map-editor/utils/tileBatch.ts
import type { TileRange } from './visibleTiles';

export interface TileBatch {
  positions: number[];
  texcoords: number[];
  count: number;
}

/**
 * 可視タイル範囲の頂点バッファデータを生成する
 * @param tiles tiles[y][x] = "chipsetId:chipIndex" 形式
 * @param range 可視タイル範囲
 * @param tileSize タイルのピクセルサイズ（正方形想定）
 * @param imgW チップセット画像の幅
 * @param imgH チップセット画像の高さ
 * @param tilesPerRow チップセット1行あたりのタイル数
 */
export function buildTileBatch(
  tiles: string[][],
  range: TileRange,
  tileSize: number,
  imgW: number,
  imgH: number,
  tilesPerRow: number
): TileBatch {
  const positions: number[] = [];
  const texcoords: number[] = [];

  const uvW = tileSize / imgW;
  const uvH = tileSize / imgH;

  for (let ty = range.minY; ty < range.maxY; ty++) {
    for (let tx = range.minX; tx < range.maxX; tx++) {
      const chipId = tiles[ty]?.[tx] ?? '';
      if (!chipId) continue;

      const colonIdx = chipId.indexOf(':');
      if (colonIdx === -1) continue;
      const chipIndex = parseInt(chipId.slice(colonIdx + 1), 10);
      if (isNaN(chipIndex)) continue;

      // スクリーン座標（ビューポート変換はシェーダーの u_matrix で行う）
      const sx = tx * tileSize;
      const sy = ty * tileSize;

      // UV座標
      const ux = (chipIndex % tilesPerRow) * uvW;
      const uy = Math.floor(chipIndex / tilesPerRow) * uvH;

      // 2三角形（時計回り）
      // 三角形1: 左上, 右上, 左下
      positions.push(sx, sy, sx + tileSize, sy, sx, sy + tileSize);
      texcoords.push(ux, uy, ux + uvW, uy, ux, uy + uvH);
      // 三角形2: 右上, 右下, 左下
      positions.push(sx + tileSize, sy, sx + tileSize, sy + tileSize, sx, sy + tileSize);
      texcoords.push(ux + uvW, uy, ux + uvW, uy + uvH, ux, uy + uvH);
    }
  }

  return { positions, texcoords, count: positions.length / 2 };
}
```

### Step 4: Run tests (expect PASS)

```bash
npx jest src/features/map-editor/utils/tileBatch.test.ts
```

### Step 5: Commit

```bash
git add src/features/map-editor/utils/shaders.ts src/features/map-editor/utils/tileBatch.ts src/features/map-editor/utils/tileBatch.test.ts
git commit -m "feat(map-editor): add GLSL shaders and tileBatch vertex builder [T160]"
```

---

## Task 6: useMapViewport フック

**Files:**
- Create: `src/features/map-editor/hooks/useMapViewport.ts`
- Create: `src/features/map-editor/hooks/useMapViewport.test.ts`

### What it does

ホイールでズーム・スペース+ドラッグでパン・座標変換を提供する。ストアの `setViewport` を呼ぶ。

### Step 1: テスト（ロジック部分のみ）

```typescript
// src/features/map-editor/hooks/useMapViewport.test.ts
import { clampViewport, applyZoom } from './useMapViewport';

describe('clampViewport', () => {
  it('マップ範囲外にパンしない', () => {
    const result = clampViewport(
      { x: -100, y: -100, zoom: 1 },
      { w: 200, h: 200 },  // canvas
      { w: 10, h: 10 },    // map tiles
      32
    );
    expect(result.x).toBeGreaterThanOrEqual(0);
    expect(result.y).toBeGreaterThanOrEqual(0);
  });
});

describe('applyZoom', () => {
  it('ズームイン後にズーム値が増加する', () => {
    const result = applyZoom({ x: 0, y: 0, zoom: 1 }, 1, 160, 80);
    expect(result.zoom).toBeGreaterThan(1);
  });

  it('ズームアウト後にズーム値が減少する', () => {
    const result = applyZoom({ x: 0, y: 0, zoom: 2 }, -1, 160, 80);
    expect(result.zoom).toBeLessThan(2);
  });

  it('最小ズーム0.25を下回らない', () => {
    const result = applyZoom({ x: 0, y: 0, zoom: 0.25 }, -1, 160, 80);
    expect(result.zoom).toBeGreaterThanOrEqual(0.25);
  });

  it('最大ズーム4を超えない', () => {
    const result = applyZoom({ x: 0, y: 0, zoom: 4 }, 1, 160, 80);
    expect(result.zoom).toBeLessThanOrEqual(4);
  });
});
```

### Step 2: Run tests (expect FAIL)

```bash
npx jest src/features/map-editor/hooks/useMapViewport.test.ts
```

### Step 3: Implement

```typescript
// src/features/map-editor/hooks/useMapViewport.ts
'use client';
import { useCallback, useRef } from 'react';
import { useStore } from '@/stores';
import type { Viewport } from '@/stores/mapEditorSlice';

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.1;

export function clampViewport(
  v: Viewport,
  canvas: { w: number; h: number },
  map: { w: number; h: number },
  tileSize: number
): Viewport {
  const maxX = Math.max(0, map.w * tileSize * v.zoom - canvas.w);
  const maxY = Math.max(0, map.h * tileSize * v.zoom - canvas.h);
  return {
    x: Math.max(0, Math.min(v.x, maxX)),
    y: Math.max(0, Math.min(v.y, maxY)),
    zoom: v.zoom,
  };
}

export function applyZoom(v: Viewport, delta: number, pivotX: number, pivotY: number): Viewport {
  const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, v.zoom + delta * ZOOM_STEP));
  // ズームの中心点をピボットに保つ
  const scale = newZoom / v.zoom;
  return {
    x: pivotX - (pivotX - v.x) * scale,
    y: pivotY - (pivotY - v.y) * scale,
    zoom: newZoom,
  };
}

export function useMapViewport(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  mapW: number,
  mapH: number,
  tileSize: number
) {
  const viewport = useStore((s) => s.viewport);
  const setViewport = useStore((s) => s.setViewport);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const pivotX = e.clientX - rect.left;
    const pivotY = e.clientY - rect.top;
    const delta = e.deltaY > 0 ? -1 : 1;
    const newVp = applyZoom(viewport, delta, pivotX, pivotY);
    const clamped = clampViewport(newVp, { w: canvas.width, h: canvas.height }, { w: mapW, h: mapH }, tileSize);
    setViewport(clamped);
  }, [viewport, setViewport, canvasRef, mapW, mapH, tileSize]);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.getModifierState('Space'))) {
      isPanning.current = true;
      panStart.current = { x: e.clientX + viewport.x, y: e.clientY + viewport.y };
    }
  }, [viewport]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isPanning.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const newVp = {
      ...viewport,
      x: panStart.current.x - e.clientX,
      y: panStart.current.y - e.clientY,
    };
    const clamped = clampViewport(newVp, { w: canvas.width, h: canvas.height }, { w: mapW, h: mapH }, tileSize);
    setViewport(clamped);
  }, [viewport, setViewport, canvasRef, mapW, mapH, tileSize]);

  const handleMouseUp = useCallback(() => { isPanning.current = false; }, []);

  return { viewport, handleWheel, handleMouseDown, handleMouseMove, handleMouseUp };
}
```

### Step 4: Run tests (expect PASS)

```bash
npx jest src/features/map-editor/hooks/useMapViewport.test.ts
```

### Step 5: Commit

```bash
git add src/features/map-editor/hooks/useMapViewport.ts src/features/map-editor/hooks/useMapViewport.test.ts
git commit -m "feat(map-editor): add useMapViewport hook with zoom/pan logic [T169]"
```

---

## Task 7: useMapCanvas フック + MapCanvas コンポーネント

**Files:**
- Create: `src/features/map-editor/hooks/useMapCanvas.ts`
- Create: `src/features/map-editor/components/MapCanvas.tsx`
- Create: `src/features/map-editor/components/MapCanvas.test.tsx`

### What it does

`useMapCanvas` が twgl.js で WebGL を初期化しレンダリングループを回す。`MapCanvas` はそれを `<canvas>` に繋ぐ。

### Step 1: MapCanvas のテスト（レンダリング省略・マウント確認のみ）

```typescript
// src/features/map-editor/components/MapCanvas.test.tsx
import { render, screen } from '@testing-library/react';
import { MapCanvas } from './MapCanvas';

// WebGL はモックできないので canvas 要素の存在のみ確認
describe('MapCanvas', () => {
  it('canvas 要素をレンダリングする', () => {
    render(<MapCanvas mapId="m1" />);
    expect(screen.getByTestId('map-canvas')).toBeInTheDocument();
  });
});
```

### Step 2: Run test (expect FAIL)

```bash
npx jest src/features/map-editor/components/MapCanvas.test.tsx
```

### Step 3: useMapCanvas の実装

```typescript
// src/features/map-editor/hooks/useMapCanvas.ts
'use client';
import { useEffect, useRef } from 'react';
import * as twgl from 'twgl.js';
import { useStore } from '@/stores';
import { TILE_VERT, TILE_FRAG, GRID_VERT, GRID_FRAG } from '../utils/shaders';
import { getVisibleTileRange } from '../utils/visibleTiles';
import { buildTileBatch } from '../utils/tileBatch';

export function useMapCanvas(canvasRef: React.RefObject<HTMLCanvasElement | null>, mapId: string) {
  const maps = useStore((s) => s.maps);
  const chipsets = useStore((s) => s.chipsets);
  const assets = useStore((s) => s.assets);
  const viewport = useStore((s) => s.viewport);
  const showGrid = useStore((s) => s.showGrid);

  const glRef = useRef<WebGLRenderingContext | null>(null);
  const tileProgramRef = useRef<twgl.ProgramInfo | null>(null);
  const gridProgramRef = useRef<twgl.ProgramInfo | null>(null);
  const textureCache = useRef<Map<string, WebGLTexture>>(new Map());
  const rafRef = useRef<number>(0);

  // WebGL 初期化
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl');
    if (!gl) return;
    glRef.current = gl;
    tileProgramRef.current = twgl.createProgramInfo(gl, [TILE_VERT, TILE_FRAG]);
    gridProgramRef.current = twgl.createProgramInfo(gl, [GRID_VERT, GRID_FRAG]);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [canvasRef]);

  // レンダリングループ
  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = glRef.current;
    const tileProgram = tileProgramRef.current;
    if (!canvas || !gl || !tileProgram) return;

    const map = maps.find((m) => m.id === mapId);
    if (!map) return;

    cancelAnimationFrame(rafRef.current);

    const render = () => {
      twgl.resizeCanvasToDisplaySize(canvas);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clear(gl.COLOR_BUFFER_BIT);

      const canvasSize = { w: canvas.width, h: canvas.height };
      const mapSize = { w: map.width, h: map.height };
      const TILE_SIZE = 32;

      // 投影行列（スクリーン座標 → クリップ座標）
      const proj = twgl.m4.ortho(
        viewport.x, viewport.x + canvas.width,
        viewport.y + canvas.height, viewport.y,
        -1, 1
      );
      const matrix = twgl.m4.scale(proj, [viewport.zoom, viewport.zoom, 1]);

      const range = getVisibleTileRange(viewport, canvasSize, mapSize, TILE_SIZE);

      // レイヤーを順番に描画
      for (const layer of map.layers) {
        if (!layer.visible) continue;
        if (layer.type !== 'tile' || !layer.tiles) continue;

        for (const chipsetId of layer.chipsetIds) {
          const chipset = chipsets.find((c) => c.id === chipsetId);
          if (!chipset) continue;

          // テクスチャ取得（キャッシュ優先）
          let texture = textureCache.current.get(chipsetId);
          if (!texture) {
            const asset = assets.find((a) => a.id === chipset.imageId);
            if (!asset?.data) continue;
            const img = new Image();
            img.src = asset.data as string;
            // 非同期なので初回は skip し、ロード完了後に再描画される
            img.onload = () => {
              if (!gl) return;
              const tex = twgl.createTexture(gl, { src: img, minMag: gl.NEAREST });
              textureCache.current.set(chipsetId, tex);
            };
            continue;
          }

          const tilesPerRow = Math.floor((chipset.tileWidth > 0 ? 32 / chipset.tileWidth : 1));
          const batch = buildTileBatch(
            layer.tiles, range, TILE_SIZE,
            chipset.tileWidth * tilesPerRow, chipset.tileHeight,
            tilesPerRow
          );
          if (batch.count === 0) continue;

          const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
            a_position: { numComponents: 2, data: new Float32Array(batch.positions) },
            a_texcoord: { numComponents: 2, data: new Float32Array(batch.texcoords) },
          });

          gl.useProgram(tileProgram.program);
          twgl.setBuffersAndAttributes(gl, tileProgram, bufferInfo);
          twgl.setUniforms(tileProgram, { u_matrix: matrix, u_texture: texture });
          twgl.drawBufferInfo(gl, bufferInfo);
        }
      }

      rafRef.current = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(rafRef.current);
  }, [maps, chipsets, assets, viewport, showGrid, mapId, canvasRef]);
}
```

### Step 4: MapCanvas コンポーネント

```typescript
// src/features/map-editor/components/MapCanvas.tsx
'use client';
import { useRef } from 'react';
import { useMapCanvas } from '../hooks/useMapCanvas';
import { useMapViewport } from '../hooks/useMapViewport';
import { useStore } from '@/stores';

interface MapCanvasProps {
  mapId: string;
}

export function MapCanvas({ mapId }: MapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maps = useStore((s) => s.maps);
  const map = maps.find((m) => m.id === mapId);

  useMapCanvas(canvasRef, mapId);
  useMapViewport(canvasRef, map?.width ?? 20, map?.height ?? 15, 32);

  return (
    <canvas
      ref={canvasRef}
      data-testid="map-canvas"
      className="block w-full h-full"
    />
  );
}
```

### Step 5: Run test (expect PASS)

```bash
npx jest src/features/map-editor/components/MapCanvas.test.tsx
```

### Step 6: Commit

```bash
git add src/features/map-editor/hooks/useMapCanvas.ts src/features/map-editor/components/MapCanvas.tsx src/features/map-editor/components/MapCanvas.test.tsx
git commit -m "feat(map-editor): add useMapCanvas and MapCanvas WebGL component [T160]"
```

---

## Task 8: useTilePainting フック

**Files:**
- Create: `src/features/map-editor/hooks/useTilePainting.ts`
- Create: `src/features/map-editor/hooks/useTilePainting.test.ts`

### Step 1: テスト

```typescript
// src/features/map-editor/hooks/useTilePainting.test.ts
import { getTilesToPaint } from './useTilePainting';

describe('getTilesToPaint', () => {
  it('pen ツール: 1タイルを返す', () => {
    const result = getTilesToPaint('pen', { tx: 2, ty: 3 }, null, 'cs1:0');
    expect(result).toEqual([{ x: 2, y: 3, chipId: 'cs1:0' }]);
  });

  it('eraser ツール: 空文字チップを返す', () => {
    const result = getTilesToPaint('eraser', { tx: 1, ty: 1 }, null, 'cs1:0');
    expect(result).toEqual([{ x: 1, y: 1, chipId: '' }]);
  });

  it('selectedChipId が null なら pen でも空配列', () => {
    const result = getTilesToPaint('pen', { tx: 0, ty: 0 }, null, null);
    expect(result).toHaveLength(0);
  });
});
```

### Step 2: Run tests (expect FAIL)

```bash
npx jest src/features/map-editor/hooks/useTilePainting.test.ts
```

### Step 3: Implement

```typescript
// src/features/map-editor/hooks/useTilePainting.ts
'use client';
import { useCallback } from 'react';
import { useStore } from '@/stores';
import type { MapEditTool } from '@/stores/mapEditorSlice';
import { screenToTile } from '../utils/coordTransform';
import { floodFill } from '../utils/tileFill';

export interface TilePaintTarget {
  x: number; y: number; chipId: string;
}

export function getTilesToPaint(
  tool: MapEditTool,
  tilePos: { tx: number; ty: number },
  _rectStart: { tx: number; ty: number } | null,
  selectedChipId: string | null
): TilePaintTarget[] {
  if (tool === 'pen') {
    if (!selectedChipId) return [];
    return [{ x: tilePos.tx, y: tilePos.ty, chipId: selectedChipId }];
  }
  if (tool === 'eraser') {
    return [{ x: tilePos.tx, y: tilePos.ty, chipId: '' }];
  }
  return [];
}

export function useTilePainting(mapId: string, layerId: string) {
  const currentTool = useStore((s) => s.currentTool);
  const selectedChipId = useStore((s) => s.selectedChipId);
  const viewport = useStore((s) => s.viewport);
  const maps = useStore((s) => s.maps);
  const setTile = useStore((s) => s.setTile);
  const pushUndo = useStore((s) => s.pushUndo);

  const paint = useCallback((screenX: number, screenY: number) => {
    const { tx, ty } = screenToTile(screenX, screenY, viewport, 32);
    const map = maps.find((m) => m.id === mapId);
    const layer = map?.layers.find((l) => l.id === layerId);
    if (!map || !layer || !layer.tiles) return;
    if (tx < 0 || tx >= map.width || ty < 0 || ty >= map.height) return;

    if (currentTool === 'fill') {
      if (!selectedChipId) return;
      const changes = floodFill(layer.tiles, tx, ty, selectedChipId, map.width, map.height);
      if (changes.length === 0) return;
      changes.forEach((c) => setTile(mapId, layerId, c.x, c.y, c.next));
      pushUndo({ type: 'setTileRange', mapId, layerId, tiles: changes });
      return;
    }

    const targets = getTilesToPaint(currentTool, { tx, ty }, null, selectedChipId);
    targets.forEach(({ x, y, chipId }) => {
      const prev = layer.tiles?.[y]?.[x] ?? '';
      setTile(mapId, layerId, x, y, chipId);
      pushUndo({ type: 'setTile', mapId, layerId, x, y, prev, next: chipId });
    });
  }, [currentTool, selectedChipId, viewport, maps, mapId, layerId, setTile, pushUndo]);

  return { paint };
}
```

### Step 4: Run tests (expect PASS)

```bash
npx jest src/features/map-editor/hooks/useTilePainting.test.ts
```

### Step 5: Commit

```bash
git add src/features/map-editor/hooks/useTilePainting.ts src/features/map-editor/hooks/useTilePainting.test.ts
git commit -m "feat(map-editor): add useTilePainting hook with flood fill support [T167]"
```

---

## Task 9: ChipPalette コンポーネント

**Files:**
- Create: `src/features/map-editor/components/ChipPalette.tsx`
- Create: `src/features/map-editor/components/ChipPalette.test.tsx`

### Step 1: テスト

```typescript
// src/features/map-editor/components/ChipPalette.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ChipPalette } from './ChipPalette';

const mockChipset = {
  id: 'cs1',
  name: 'テストチップセット',
  imageId: 'img1',
  tileWidth: 32,
  tileHeight: 32,
  autotile: false,
  animated: false,
  animFrameCount: 1,
  animIntervalMs: 100,
  fields: [],
  chips: [],
};

describe('ChipPalette', () => {
  it('チップセットが未選択の場合にメッセージを表示', () => {
    render(<ChipPalette chipset={null} imageDataUrl={null} onSelectChip={jest.fn()} selectedChipId={null} />);
    expect(screen.getByText(/チップセットを選択/)).toBeInTheDocument();
  });

  it('チップをクリックすると onSelectChip が呼ばれる', () => {
    const onSelect = jest.fn();
    render(
      <ChipPalette
        chipset={mockChipset}
        imageDataUrl="data:image/png;base64,test"
        onSelectChip={onSelect}
        selectedChipId={null}
      />
    );
    const chips = screen.getAllByRole('button', { name: /チップ/ });
    fireEvent.click(chips[0]!);
    expect(onSelect).toHaveBeenCalledWith('cs1:0');
  });
});
```

### Step 2: Run tests (expect FAIL)

```bash
npx jest src/features/map-editor/components/ChipPalette.test.tsx
```

### Step 3: Implement

```typescript
// src/features/map-editor/components/ChipPalette.tsx
'use client';
import type { Chipset } from '@/types/map';

interface ChipPaletteProps {
  chipset: Chipset | null;
  imageDataUrl: string | null;
  selectedChipId: string | null;
  onSelectChip: (chipId: string) => void;
}

export function ChipPalette({ chipset, imageDataUrl, selectedChipId, onSelectChip }: ChipPaletteProps) {
  if (!chipset || !imageDataUrl) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        チップセットを選択してください
      </div>
    );
  }

  const tilesPerRow = Math.floor(128 / chipset.tileWidth) || 4;
  const totalTiles = 64; // TODO: 画像サイズから動的計算

  return (
    <div className="overflow-auto p-2">
      <div
        className="grid gap-0"
        style={{ gridTemplateColumns: `repeat(${tilesPerRow}, ${chipset.tileWidth}px)` }}
      >
        {Array.from({ length: totalTiles }, (_, i) => {
          const chipId = `${chipset.id}:${i}`;
          const col = i % tilesPerRow;
          const row = Math.floor(i / tilesPerRow);
          const isSelected = selectedChipId === chipId;
          return (
            <button
              key={i}
              aria-label={`チップ ${i}`}
              onClick={() => onSelectChip(chipId)}
              className={`border-0 p-0 cursor-pointer ${isSelected ? 'ring-2 ring-primary' : ''}`}
              style={{
                width: chipset.tileWidth,
                height: chipset.tileHeight,
                backgroundImage: `url(${imageDataUrl})`,
                backgroundPosition: `-${col * chipset.tileWidth}px -${row * chipset.tileHeight}px`,
                backgroundRepeat: 'no-repeat',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
```

### Step 4: Run tests (expect PASS)

```bash
npx jest src/features/map-editor/components/ChipPalette.test.tsx
```

### Step 5: Commit

```bash
git add src/features/map-editor/components/ChipPalette.tsx src/features/map-editor/components/ChipPalette.test.tsx
git commit -m "feat(map-editor): add ChipPalette tile selector component [T161]"
```

---

## Task 10: LayerTabs コンポーネント

**Files:**
- Create: `src/features/map-editor/components/LayerTabs.tsx`
- Create: `src/features/map-editor/components/LayerTabs.test.tsx`

### Step 1: テスト

```typescript
// src/features/map-editor/components/LayerTabs.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { LayerTabs } from './LayerTabs';
import type { MapLayer } from '@/types/map';

const layers: MapLayer[] = [
  { id: 'l1', name: '地面', type: 'tile', visible: true, chipsetIds: [], tiles: [] },
  { id: 'l2', name: '装飾', type: 'tile', visible: false, chipsetIds: [], tiles: [] },
];

describe('LayerTabs', () => {
  it('レイヤー名を表示する', () => {
    render(<LayerTabs layers={layers} selectedLayerId="l1" onSelectLayer={jest.fn()} onToggleVisibility={jest.fn()} />);
    expect(screen.getByText('地面')).toBeInTheDocument();
    expect(screen.getByText('装飾')).toBeInTheDocument();
  });

  it('レイヤークリックで onSelectLayer が呼ばれる', () => {
    const onSelect = jest.fn();
    render(<LayerTabs layers={layers} selectedLayerId="l1" onSelectLayer={onSelect} onToggleVisibility={jest.fn()} />);
    fireEvent.click(screen.getByText('装飾'));
    expect(onSelect).toHaveBeenCalledWith('l2');
  });

  it('表示トグルボタンで onToggleVisibility が呼ばれる', () => {
    const onToggle = jest.fn();
    render(<LayerTabs layers={layers} selectedLayerId="l1" onSelectLayer={jest.fn()} onToggleVisibility={onToggle} />);
    const toggleBtns = screen.getAllByRole('button', { name: /表示|非表示/ });
    fireEvent.click(toggleBtns[0]!);
    expect(onToggle).toHaveBeenCalledWith('l1');
  });
});
```

### Step 2: Run tests (expect FAIL)

```bash
npx jest src/features/map-editor/components/LayerTabs.test.tsx
```

### Step 3: Implement

```typescript
// src/features/map-editor/components/LayerTabs.tsx
'use client';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { MapLayer } from '@/types/map';

interface LayerTabsProps {
  layers: MapLayer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string) => void;
  onToggleVisibility: (id: string) => void;
}

export function LayerTabs({ layers, selectedLayerId, onSelectLayer, onToggleVisibility }: LayerTabsProps) {
  return (
    <div className="flex flex-col gap-1 p-2">
      {layers.map((layer) => (
        <div
          key={layer.id}
          className={`flex items-center gap-1 rounded px-2 py-1 cursor-pointer text-sm
            ${selectedLayerId === layer.id ? 'bg-accent' : 'hover:bg-muted'}`}
          onClick={() => onSelectLayer(layer.id)}
        >
          <span className="flex-1 truncate">{layer.name}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 shrink-0"
            aria-label={layer.visible !== false ? '非表示にする' : '表示する'}
            onClick={(e) => { e.stopPropagation(); onToggleVisibility(layer.id); }}
          >
            {layer.visible !== false ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          </Button>
        </div>
      ))}
    </div>
  );
}
```

### Step 4: Run tests (expect PASS)

```bash
npx jest src/features/map-editor/components/LayerTabs.test.tsx
```

### Step 5: Commit

```bash
git add src/features/map-editor/components/LayerTabs.tsx src/features/map-editor/components/LayerTabs.test.tsx
git commit -m "feat(map-editor): add LayerTabs layer visibility component [T162]"
```

---

## Task 11: MapToolbar + useMapShortcuts

**Files:**
- Create: `src/features/map-editor/components/MapToolbar.tsx`
- Create: `src/features/map-editor/components/MapToolbar.test.tsx`
- Create: `src/features/map-editor/hooks/useMapShortcuts.ts`
- Create: `src/features/map-editor/hooks/useMapShortcuts.test.ts`

### Step 1: MapToolbar のテスト

```typescript
// src/features/map-editor/components/MapToolbar.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { MapToolbar } from './MapToolbar';

describe('MapToolbar', () => {
  const props = {
    currentTool: 'pen' as const,
    onSetTool: jest.fn(),
    showGrid: true,
    onToggleGrid: jest.fn(),
    zoom: 1,
    onZoomIn: jest.fn(),
    onZoomOut: jest.fn(),
  };

  it('ツールボタンを表示する', () => {
    render(<MapToolbar {...props} />);
    expect(screen.getByRole('button', { name: /ペン/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /消しゴム/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /塗りつぶし/ })).toBeInTheDocument();
  });

  it('ツールクリックで onSetTool が呼ばれる', () => {
    render(<MapToolbar {...props} />);
    fireEvent.click(screen.getByRole('button', { name: /消しゴム/ }));
    expect(props.onSetTool).toHaveBeenCalledWith('eraser');
  });

  it('グリッドトグルで onToggleGrid が呼ばれる', () => {
    render(<MapToolbar {...props} />);
    fireEvent.click(screen.getByRole('button', { name: /グリッド/ }));
    expect(props.onToggleGrid).toHaveBeenCalled();
  });
});
```

### Step 2: useMapShortcuts のテスト

```typescript
// src/features/map-editor/hooks/useMapShortcuts.test.ts
import { renderHook } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { useMapShortcuts } from './useMapShortcuts';

describe('useMapShortcuts', () => {
  it('B キーで onSetTool(pen) が呼ばれる', () => {
    const onSetTool = jest.fn();
    renderHook(() => useMapShortcuts({ onSetTool, onUndo: jest.fn(), onRedo: jest.fn() }));
    fireEvent.keyDown(window, { key: 'b' });
    expect(onSetTool).toHaveBeenCalledWith('pen');
  });

  it('E キーで onSetTool(eraser) が呼ばれる', () => {
    const onSetTool = jest.fn();
    renderHook(() => useMapShortcuts({ onSetTool, onUndo: jest.fn(), onRedo: jest.fn() }));
    fireEvent.keyDown(window, { key: 'e' });
    expect(onSetTool).toHaveBeenCalledWith('eraser');
  });

  it('Ctrl+Z で onUndo が呼ばれる', () => {
    const onUndo = jest.fn();
    renderHook(() => useMapShortcuts({ onSetTool: jest.fn(), onUndo, onRedo: jest.fn() }));
    fireEvent.keyDown(window, { key: 'z', ctrlKey: true });
    expect(onUndo).toHaveBeenCalled();
  });
});
```

### Step 3: Run tests (expect FAIL)

```bash
npx jest src/features/map-editor/components/MapToolbar.test.tsx src/features/map-editor/hooks/useMapShortcuts.test.ts
```

### Step 4: MapToolbar の実装

```typescript
// src/features/map-editor/components/MapToolbar.tsx
'use client';
import { Pencil, Eraser, PaintBucket, Square, MousePointer, Grid3X3, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { MapEditTool } from '@/stores/mapEditorSlice';

interface MapToolbarProps {
  currentTool: MapEditTool;
  onSetTool: (tool: MapEditTool) => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

const TOOLS: Array<{ tool: MapEditTool; label: string; icon: React.ReactNode; shortcut: string }> = [
  { tool: 'select',  label: '選択',       icon: <MousePointer className="h-4 w-4" />, shortcut: '' },
  { tool: 'pen',     label: 'ペン',       icon: <Pencil className="h-4 w-4" />,       shortcut: 'B' },
  { tool: 'eraser',  label: '消しゴム',   icon: <Eraser className="h-4 w-4" />,       shortcut: 'E' },
  { tool: 'fill',    label: '塗りつぶし', icon: <PaintBucket className="h-4 w-4" />,  shortcut: 'G' },
  { tool: 'rect',    label: '矩形',       icon: <Square className="h-4 w-4" />,       shortcut: '' },
];

export function MapToolbar({ currentTool, onSetTool, showGrid, onToggleGrid, zoom, onZoomIn, onZoomOut }: MapToolbarProps) {
  return (
    <div className="flex h-header items-center gap-1 border-b bg-background px-2">
      {TOOLS.map(({ tool, label, icon, shortcut }) => (
        <Button
          key={tool}
          variant={currentTool === tool ? 'default' : 'ghost'}
          size="icon"
          aria-label={shortcut ? `${label} (${shortcut})` : label}
          onClick={() => onSetTool(tool)}
        >
          {icon}
        </Button>
      ))}
      <div className="mx-2 h-5 w-px bg-border" />
      <Button variant="ghost" size="icon" aria-label="グリッド表示切替" onClick={onToggleGrid}>
        <Grid3X3 className={`h-4 w-4 ${showGrid ? 'text-primary' : 'text-muted-foreground'}`} />
      </Button>
      <Button variant="ghost" size="icon" aria-label="ズームイン" onClick={onZoomIn}>
        <ZoomIn className="h-4 w-4" />
      </Button>
      <span className="w-12 text-center text-xs">{Math.round(zoom * 100)}%</span>
      <Button variant="ghost" size="icon" aria-label="ズームアウト" onClick={onZoomOut}>
        <ZoomOut className="h-4 w-4" />
      </Button>
    </div>
  );
}
```

### Step 5: useMapShortcuts の実装

```typescript
// src/features/map-editor/hooks/useMapShortcuts.ts
'use client';
import { useEffect } from 'react';
import type { MapEditTool } from '@/stores/mapEditorSlice';

interface Handlers {
  onSetTool: (tool: MapEditTool) => void;
  onUndo: () => void;
  onRedo: () => void;
}

export function useMapShortcuts({ onSetTool, onUndo, onRedo }: Handlers) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key.toLowerCase();
      if (key === 'b') { onSetTool('pen'); return; }
      if (key === 'e') { onSetTool('eraser'); return; }
      if (key === 'g') { onSetTool('fill'); return; }
      if (key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) { e.preventDefault(); onUndo(); return; }
      if ((key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey) ||
          (key === 'y' && (e.ctrlKey || e.metaKey))) {
        e.preventDefault(); onRedo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onSetTool, onUndo, onRedo]);
}
```

### Step 6: Run tests (expect PASS)

```bash
npx jest src/features/map-editor/components/MapToolbar.test.tsx src/features/map-editor/hooks/useMapShortcuts.test.ts
```

### Step 7: Commit

```bash
git add src/features/map-editor/components/MapToolbar.tsx src/features/map-editor/components/MapToolbar.test.tsx src/features/map-editor/hooks/useMapShortcuts.ts src/features/map-editor/hooks/useMapShortcuts.test.ts
git commit -m "feat(map-editor): add MapToolbar and useMapShortcuts [T163]"
```

---

## Task 12: ObjectList コンポーネント

**Files:**
- Create: `src/features/map-editor/components/MapObjectList.tsx`
- Create: `src/features/map-editor/components/MapObjectList.test.tsx`

### Step 1: テスト

```typescript
// src/features/map-editor/components/MapObjectList.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { MapObjectList } from './MapObjectList';
import type { MapObject } from '@/types/map';

const objects: MapObject[] = [
  { id: 'o1', name: 'NPC', components: [], prefabId: 'p1' },
  { id: 'o2', name: '宝箱', components: [] },
];

describe('MapObjectList', () => {
  it('オブジェクト名を表示する', () => {
    render(<MapObjectList objects={objects} selectedObjectId={null} onSelectObject={jest.fn()} onDeleteObject={jest.fn()} />);
    expect(screen.getByText('NPC')).toBeInTheDocument();
    expect(screen.getByText('宝箱')).toBeInTheDocument();
  });

  it('クリックで onSelectObject が呼ばれる', () => {
    const onSelect = jest.fn();
    render(<MapObjectList objects={objects} selectedObjectId={null} onSelectObject={onSelect} onDeleteObject={jest.fn()} />);
    fireEvent.click(screen.getByText('NPC'));
    expect(onSelect).toHaveBeenCalledWith('o1');
  });

  it('削除ボタンで onDeleteObject が呼ばれる', () => {
    const onDelete = jest.fn();
    render(<MapObjectList objects={objects} selectedObjectId={null} onSelectObject={jest.fn()} onDeleteObject={onDelete} />);
    const deleteBtns = screen.getAllByRole('button', { name: /削除/ });
    fireEvent.click(deleteBtns[0]!);
    expect(onDelete).toHaveBeenCalledWith('o1');
  });
});
```

### Step 2: Run tests (expect FAIL)

```bash
npx jest src/features/map-editor/components/MapObjectList.test.tsx
```

### Step 3: Implement

```typescript
// src/features/map-editor/components/MapObjectList.tsx
'use client';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { MapObject } from '@/types/map';

interface MapObjectListProps {
  objects: MapObject[];
  selectedObjectId: string | null;
  onSelectObject: (id: string) => void;
  onDeleteObject: (id: string) => void;
}

export function MapObjectList({ objects, selectedObjectId, onSelectObject, onDeleteObject }: MapObjectListProps) {
  if (objects.length === 0) {
    return <div className="p-4 text-sm text-muted-foreground">オブジェクトなし</div>;
  }

  return (
    <div className="flex flex-col gap-1 p-2">
      {objects.map((obj) => (
        <div
          key={obj.id}
          className={`flex items-center gap-1 rounded px-2 py-1 cursor-pointer text-sm
            ${selectedObjectId === obj.id ? 'bg-accent' : 'hover:bg-muted'}`}
          onClick={() => onSelectObject(obj.id)}
        >
          <span className="flex-1 truncate">{obj.name}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 shrink-0"
            aria-label={`${obj.name}を削除`}
            onClick={(e) => { e.stopPropagation(); onDeleteObject(obj.id); }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ))}
    </div>
  );
}
```

### Step 4: Run tests (expect PASS)

```bash
npx jest src/features/map-editor/components/MapObjectList.test.tsx
```

### Step 5: Commit

```bash
git add src/features/map-editor/components/MapObjectList.tsx src/features/map-editor/components/MapObjectList.test.tsx
git commit -m "feat(map-editor): add MapObjectList component [T164]"
```

---

## Task 13: MapPropertyPanel

**Files:**
- Create: `src/features/map-editor/components/MapPropertyPanel.tsx`
- Create: `src/features/map-editor/components/MapPropertyPanel.test.tsx`

### Step 1: テスト

```typescript
// src/features/map-editor/components/MapPropertyPanel.test.tsx
import { render, screen } from '@testing-library/react';
import { MapPropertyPanel } from './MapPropertyPanel';

describe('MapPropertyPanel', () => {
  it('オブジェクト未選択時は「選択なし」を表示', () => {
    render(<MapPropertyPanel selectedObjectId={null} mapId="m1" layerId="l1" />);
    expect(screen.getByText(/オブジェクトを選択/)).toBeInTheDocument();
  });
});
```

### Step 2: Run tests (expect FAIL)

```bash
npx jest src/features/map-editor/components/MapPropertyPanel.test.tsx
```

### Step 3: Implement（MVP: 選択状態の表示のみ）

```typescript
// src/features/map-editor/components/MapPropertyPanel.tsx
'use client';
import { useStore } from '@/stores';
import { ComponentEditor } from './ComponentEditor';

interface MapPropertyPanelProps {
  selectedObjectId: string | null;
  mapId: string;
  layerId: string | null;
}

export function MapPropertyPanel({ selectedObjectId, mapId, layerId }: MapPropertyPanelProps) {
  const maps = useStore((s) => s.maps);

  if (!selectedObjectId || !layerId) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        オブジェクトを選択してください
      </div>
    );
  }

  const map = maps.find((m) => m.id === mapId);
  const layer = map?.layers.find((l) => l.id === layerId);
  const obj = layer?.objects?.find((o) => o.id === selectedObjectId);

  if (!obj) return null;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex h-header items-center border-b px-4 font-semibold text-sm">
        {obj.name}
      </div>
      <div className="flex-1 overflow-auto">
        <ComponentEditor prefabId={obj.prefabId ?? null} />
      </div>
    </div>
  );
}
```

### Step 4: Run tests (expect PASS)

```bash
npx jest src/features/map-editor/components/MapPropertyPanel.test.tsx
```

### Step 5: Commit

```bash
git add src/features/map-editor/components/MapPropertyPanel.tsx src/features/map-editor/components/MapPropertyPanel.test.tsx
git commit -m "feat(map-editor): add MapPropertyPanel component [T165]"
```

---

## Task 14: MapEditPage — 全体結合

**Files:**
- Create: `src/app/(editor)/map/page.tsx`
- Create: `src/app/(editor)/map/page.test.tsx`

### Step 1: テスト（マウント確認のみ）

```typescript
// src/app/(editor)/map/page.test.tsx
import { render, screen } from '@testing-library/react';
import MapEditPage from './page';

describe('MapEditPage', () => {
  it('3カラムレイアウトをレンダリングする', () => {
    render(<MapEditPage />);
    // 左パネルのタブ
    expect(screen.getByRole('tab', { name: /マップ/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /チップセット/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /オブジェクト/ })).toBeInTheDocument();
  });
});
```

### Step 2: Run tests (expect FAIL)

```bash
npx jest src/app/\(editor\)/map/page.test.tsx
```

### Step 3: MapEditPage の実装

```typescript
// src/app/(editor)/map/page.tsx
'use client';
import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useStore } from '@/stores';
import { MapList } from '@/features/map-editor/components/MapList';
import { MapCanvas } from '@/features/map-editor/components/MapCanvas';
import { MapToolbar } from '@/features/map-editor/components/MapToolbar';
import { LayerTabs } from '@/features/map-editor/components/LayerTabs';
import { ChipPalette } from '@/features/map-editor/components/ChipPalette';
import { MapObjectList } from '@/features/map-editor/components/MapObjectList';
import { PrefabList } from '@/features/map-editor/components/PrefabList';
import { MapPropertyPanel } from '@/features/map-editor/components/MapPropertyPanel';
import { useMapShortcuts } from '@/features/map-editor/hooks/useMapShortcuts';
import { applyZoom, clampViewport } from '@/features/map-editor/hooks/useMapViewport';

export default function MapEditPage() {
  const selectedMapId = useStore((s) => s.selectedMapId);
  const selectedLayerId = useStore((s) => s.selectedLayerId);
  const selectedObjectId = useStore((s) => s.selectedObjectId);
  const maps = useStore((s) => s.maps);
  const chipsets = useStore((s) => s.chipsets);
  const assets = useStore((s) => s.assets);

  const currentTool = useStore((s) => s.currentTool);
  const selectedChipId = useStore((s) => s.selectedChipId);
  const viewport = useStore((s) => s.viewport);
  const showGrid = useStore((s) => s.showGrid);

  const setTool = useStore((s) => s.setTool);
  const selectChip = useStore((s) => s.selectChip);
  const setViewport = useStore((s) => s.setViewport);
  const toggleGrid = useStore((s) => s.toggleGrid);
  const selectLayer = useStore((s) => s.selectLayer);
  const updateLayer = useStore((s) => s.updateLayer);
  const selectObject = useStore((s) => s.selectObject);
  const deleteObject = useStore((s) => s.deleteObject);
  const popUndo = useStore((s) => s.popUndo);
  const pushRedo = useStore((s) => s.pushRedo);
  const popRedo = useStore((s) => s.popRedo);
  const setTile = useStore((s) => s.setTile);
  const addObject = useStore((s) => s.addObject);

  const selectedMap = maps.find((m) => m.id === selectedMapId) ?? null;
  const selectedLayer = selectedMap?.layers.find((l) => l.id === selectedLayerId) ?? null;

  const handleUndo = () => {
    const action = popUndo();
    if (!action) return;
    if (action.type === 'setTile') {
      setTile(action.mapId, action.layerId, action.x, action.y, action.prev);
      pushRedo(action);
    } else if (action.type === 'setTileRange') {
      action.tiles.forEach((t) => setTile(action.mapId, action.layerId, t.x, t.y, t.prev));
      pushRedo(action);
    } else if (action.type === 'addObject') {
      deleteObject(action.mapId, action.layerId, action.object.id);
      pushRedo(action);
    } else if (action.type === 'deleteObject') {
      addObject(action.mapId, action.layerId, action.object);
      pushRedo(action);
    }
  };

  const handleRedo = () => {
    const action = popRedo();
    if (!action) return;
    if (action.type === 'setTile') {
      setTile(action.mapId, action.layerId, action.x, action.y, action.next);
    } else if (action.type === 'setTileRange') {
      action.tiles.forEach((t) => setTile(action.mapId, action.layerId, t.x, t.y, t.next));
    } else if (action.type === 'addObject') {
      addObject(action.mapId, action.layerId, action.object);
    } else if (action.type === 'deleteObject') {
      deleteObject(action.mapId, action.layerId, action.object.id);
    }
  };

  useMapShortcuts({ onSetTool: setTool, onUndo: handleUndo, onRedo: handleRedo });

  // 選択中チップセットの画像データを取得
  const selectedChipsetId = selectedChipId?.split(':')[0] ?? null;
  const selectedChipset = chipsets.find((c) => c.id === selectedChipsetId) ?? null;
  const chipsetAsset = selectedChipset ? assets.find((a) => a.id === selectedChipset.imageId) : null;

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* 左パネル */}
      <aside className="w-sidebar shrink-0 border-r bg-muted/20 flex flex-col overflow-hidden">
        <Tabs defaultValue="chipset" className="flex flex-col h-full">
          <TabsList className="shrink-0 w-full rounded-none border-b">
            <TabsTrigger value="map" className="flex-1">マップ</TabsTrigger>
            <TabsTrigger value="chipset" className="flex-1">チップセット</TabsTrigger>
            <TabsTrigger value="object" className="flex-1">オブジェクト</TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="flex-1 overflow-auto mt-0">
            <MapList />
          </TabsContent>

          <TabsContent value="chipset" className="flex-1 overflow-hidden flex flex-col mt-0">
            {selectedMap && (
              <LayerTabs
                layers={selectedMap.layers}
                selectedLayerId={selectedLayerId}
                onSelectLayer={selectLayer}
                onToggleVisibility={(id) =>
                  updateLayer(selectedMapId!, id, {
                    visible: !(selectedMap.layers.find((l) => l.id === id)?.visible ?? true),
                  })
                }
              />
            )}
            <div className="flex-1 overflow-auto min-h-0">
              <ChipPalette
                chipset={selectedChipset}
                imageDataUrl={chipsetAsset?.data as string ?? null}
                selectedChipId={selectedChipId}
                onSelectChip={selectChip}
              />
            </div>
          </TabsContent>

          <TabsContent value="object" className="flex-1 overflow-hidden flex flex-col mt-0">
            <div className="border-b p-2 text-xs font-semibold text-muted-foreground">プレハブ</div>
            <PrefabList />
            <div className="border-b border-t p-2 text-xs font-semibold text-muted-foreground">配置済み</div>
            <div className="flex-1 overflow-auto min-h-0">
              <MapObjectList
                objects={selectedLayer?.objects ?? []}
                selectedObjectId={selectedObjectId}
                onSelectObject={selectObject}
                onDeleteObject={(id) => {
                  if (!selectedMapId || !selectedLayerId) return;
                  const obj = selectedLayer?.objects?.find((o) => o.id === id);
                  if (obj) {
                    deleteObject(selectedMapId, selectedLayerId, id);
                    pushRedo({ type: 'deleteObject', mapId: selectedMapId, layerId: selectedLayerId, object: obj });
                  }
                }}
              />
            </div>
          </TabsContent>
        </Tabs>
      </aside>

      {/* 中央: キャンバス */}
      <main className="flex flex-1 flex-col overflow-hidden">
        <MapToolbar
          currentTool={currentTool}
          onSetTool={setTool}
          showGrid={showGrid}
          onToggleGrid={toggleGrid}
          zoom={viewport.zoom}
          onZoomIn={() => setViewport(applyZoom(viewport, 1, 0, 0))}
          onZoomOut={() => setViewport(applyZoom(viewport, -1, 0, 0))}
        />
        <div className="flex-1 overflow-hidden bg-neutral-800">
          {selectedMapId ? (
            <MapCanvas mapId={selectedMapId} />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              マップを選択してください
            </div>
          )}
        </div>
      </main>

      {/* 右パネル */}
      <aside className="w-inspector shrink-0 border-l bg-muted/20 overflow-hidden">
        <MapPropertyPanel
          selectedObjectId={selectedObjectId}
          mapId={selectedMapId ?? ''}
          layerId={selectedLayerId}
        />
      </aside>
    </div>
  );
}
```

### Step 4: Run tests (expect PASS)

```bash
npx jest src/app/\(editor\)/map/page.test.tsx
```

### Step 5: Run all Phase 13 tests

```bash
npx jest src/features/map-editor/ src/stores/mapEditorSlice.test.ts src/app/\(editor\)/map/
```

Expected: すべて PASS

### Step 6: Commit

```bash
git add src/app/\(editor\)/map/page.tsx src/app/\(editor\)/map/page.test.tsx
git commit -m "feat(map-editor): add MapEditPage integrating all Phase 13 components [T159]"
```

---

## 最終確認

```bash
# 全テスト
npx jest --testPathPattern="map-editor|mapEditor"

# 型チェック
npx tsc --noEmit

# ビルド確認
npm run build
```

---

## タスクIDとの対応

| Plan Task | タスクID |
|---|---|
| Task 0: twgl.js install | T160 前提 |
| Task 1: mapEditorSlice | T159 |
| Task 2: coordTransform | T166, T169 |
| Task 3: visibleTiles | T171 |
| Task 4: tileFill | T170 |
| Task 5: shaders + tileBatch | T160 |
| Task 6: useMapViewport | T169 |
| Task 7: useMapCanvas + MapCanvas | T160, T166 |
| Task 8: useTilePainting | T167 |
| Task 9: ChipPalette | T161 |
| Task 10: LayerTabs | T162 |
| Task 11: MapToolbar + useMapShortcuts | T163, T171a |
| Task 12: MapObjectList | T164 |
| Task 13: MapPropertyPanel | T165 |
| Task 14: MapEditPage | T159 |
