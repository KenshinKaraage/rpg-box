# マップ編集ページ 設計書

**日付:** 2026-02-25
**対象タスク:** T159〜T171a（Phase 13）
**参照:** design.md, requirements.md, ui-flow-design.md

---

## 決定事項

| 項目               | 決定                                            |
| ------------------ | ----------------------------------------------- |
| レンダリング       | WebGL + twgl.js                                 |
| Undo/Redo 対象     | タイル描画 + オブジェクト配置                   |
| 状態管理           | mapEditorSlice 新設（既存 mapSlice は変更なし） |
| レンダリングモデル | トップダウン RPG グリッド固定（エンジン非依存） |

---

## レイアウト・コンポーネント構成

```
MapEditPage（3カラムレイアウト）
├── 左パネル（w-sidebar: 240px）
│   ├── LeftPanelTabs（マップ一覧 / チップセット / オブジェクト）
│   ├── [マップ一覧タブ]  MapList
│   ├── [チップセットタブ]
│   │   ├── LayerTabs（レイヤー切り替え・表示トグル）
│   │   └── ChipPalette（タイル選択・複数選択）
│   └── [オブジェクトタブ]
│       ├── PrefabList（プレハブ一覧）
│       └── ObjectList（配置済みオブジェクト一覧）
│
├── 中央（flex-1）
│   ├── MapToolbar（ツール選択・ズーム・グリッドトグル）
│   └── MapCanvas（WebGL 描画）
│
└── 右パネル（w-inspector: 300px）
    └── MapPropertyPanel
        ├── [選択なし]           マップ設定（フィールド値）
        └── [オブジェクト選択時] コンポーネント編集
```

### ツール一覧

| ツール             | ショートカット | 動作                   |
| ------------------ | -------------- | ---------------------- |
| select（選択）     | —              | オブジェクト選択・移動 |
| pen（ペン）        | B              | タイル単体描画         |
| eraser（消しゴム） | E              | タイル削除             |
| fill（塗りつぶし） | G              | フラッドフィル         |
| rect（矩形）       | —              | 範囲一括描画           |

---

## 状態管理

### mapEditorSlice（新規）

```typescript
type MapEditTool = 'select' | 'pen' | 'eraser' | 'fill' | 'rect';

interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

// Undo/Redo 対象操作
type MapEditAction =
  | {
      type: 'setTile';
      mapId: string;
      layerId: string;
      x: number;
      y: number;
      prev: string;
      next: string;
    }
  | {
      type: 'setTileRange';
      mapId: string;
      layerId: string;
      tiles: Array<{ x: number; y: number; prev: string; next: string }>;
    }
  | { type: 'addObject'; mapId: string; layerId: string; object: MapObject }
  | { type: 'deleteObject'; mapId: string; layerId: string; object: MapObject };

interface MapEditorSlice {
  currentTool: MapEditTool;
  selectedChipId: string | null; // "chipsetId:chipIndex" 形式
  viewport: Viewport;
  showGrid: boolean;
  undoStack: MapEditAction[]; // 最大 100 件
  redoStack: MapEditAction[];

  setTool: (tool: MapEditTool) => void;
  selectChip: (chipId: string | null) => void;
  setViewport: (viewport: Partial<Viewport>) => void;
  toggleGrid: () => void;
  pushUndo: (action: MapEditAction) => void;
  undo: () => void;
  redo: () => void;
}
```

**既存 mapSlice は変更なし。**
`undo` / `redo` は mapEditorSlice が mapSlice のアクションを逆実行する形で実装する。

---

## MapCanvas / WebGL 設計

### twgl.js を使う理由

- タイルマップは「格子状の矩形 + UV マッピング」というシンプルなパターン
- 純粋 WebGL のボイラープレートを削減しつつシェーダーは自前で書ける
- PixiJS より軽量（約 18KB）でアーキテクチャへの干渉が少ない

### ファイル構成

```
features/map-editor/
├── components/
│   └── MapCanvas.tsx           ← <canvas> + useMapCanvas フック
├── hooks/
│   ├── useMapCanvas.ts         ← WebGL 初期化・レンダリングループ
│   ├── useTilePainting.ts      ← マウス → ツール別描画・Undo 記録
│   ├── useObjectPlacement.ts   ← ドラッグ配置・移動・削除
│   ├── useMapViewport.ts       ← ズーム・パン・座標変換
│   └── useMapShortcuts.ts      ← キーボードショートカット
├── shaders/
│   ├── tile.vert.glsl          ← タイル頂点シェーダー
│   ├── tile.frag.glsl          ← チップセット UV サンプリング
│   ├── grid.vert.glsl          ← グリッド線頂点シェーダー
│   └── grid.frag.glsl          ← グリッド線描画
└── utils/
    ├── tileBatch.ts            ← 可視タイルを頂点バッファに詰める
    ├── tileFill.ts             ← フラッドフィルアルゴリズム
    ├── visibleTiles.ts         ← ビューポートカリング
    └── coordTransform.ts       ← スクリーン座標 ↔ タイル座標変換
```

### 描画フロー（フレームごと）

```
requestAnimationFrame
  1. viewport 行列を更新（ズーム・パン → mat4 投影行列）
  2. visibleTiles で可視タイル範囲を計算
  3. レイヤー順に描画:
     a. tile レイヤー  → tileBatch で頂点バッファ生成 → twgl.js で drawArrays
     b. object レイヤー → TransformComponent から座標取得 → スプライト描画
  4. グリッドオーバーレイ（showGrid=true の場合）
  5. 選択オブジェクトのハイライト
```

### テスト方針

WebGL はブラウザ環境でないとモックが困難なため:

- **MapCanvas 自体の描画テストは省略**
- **ユーティリティ関数を単体テスト**: tileFill, visibleTiles, coordTransform, tileBatch
- **フックのロジック部分をテスト**: useMapViewport の座標計算, useTilePainting のツール分岐

---

## カスタムフック分担

| フック               | 責務                                        | テスト             |
| -------------------- | ------------------------------------------- | ------------------ |
| `useMapCanvas`       | WebGL 初期化・レンダリングループ・リサイズ  | 省略（WebGL）      |
| `useTilePainting`    | マウスイベント → ツール別描画・Undo 記録    | ツール分岐ロジック |
| `useObjectPlacement` | ドラッグ配置・移動・削除・Undo 記録         | 配置ロジック       |
| `useMapViewport`     | ズーム（ホイール）・パン・座標変換          | 座標計算           |
| `useMapShortcuts`    | B/E/G（ツール）・1〜9（レイヤー）・Ctrl+Z/Y | ショートカット発火 |

---

## 実装タスク順序

```
Step 1: mapEditorSlice（状態基盤）
Step 2: WebGL ユーティリティ（tileBatch, visibleTiles, coordTransform）
Step 3: シェーダー（tile.vert/frag, grid.vert/frag）
Step 4: useMapCanvas（WebGL 初期化・ループ）
Step 5: useMapViewport（ズーム・パン）
Step 6: MapCanvas コンポーネント（Step 4+5 を結合）
Step 7: useTilePainting + tileFill
Step 8: ChipPalette + LayerTabs
Step 9: MapToolbar + useMapShortcuts
Step 10: useObjectPlacement + ObjectList
Step 11: MapPropertyPanel
Step 12: MapEditPage（全体結合）
Step 13: PrefabList（左パネル・オブジェクトタブ）
```
