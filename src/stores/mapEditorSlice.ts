/**
 * マップエディタスライス
 *
 * ツール選択、チップ選択、ビューポート、グリッド表示の状態管理
 *
 * Undo/Redo は editorSlice.ts（design.md#EditorSlice）に統合されている。
 */
import type { ChipRangeSelection } from '@/types/map';

export type MapEditTool = 'select' | 'pen' | 'eraser' | 'fill' | 'rect';

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export interface TileCell {
  x: number;
  y: number;
}

/** マップキャンバス上で範囲選択した既存タイル（コピー用） */
export interface TileSelection {
  layerId: string;
  cells: TileCell[];
}

/** 空オブジェクト配置用の特別ID */
export const EMPTY_OBJECT_PREFAB_ID = '__empty__';

export interface MapEditorSlice {
  currentTool: MapEditTool;
  selectedChipId: string | null;
  /** チップパレットで範囲選択した複数タイル（スタンプ用）。単一チップ選択とは排他 */
  selectedChipRange: ChipRangeSelection | null;
  /** マップキャンバス上で範囲選択した既存タイル（コピー用） */
  tileSelection: TileSelection | null;
  /** マップキャンバス上でマウスカーソルが乗っているタイル座標（ペースト位置に使用） */
  hoverTile: TileCell | null;
  viewport: Viewport;
  showGrid: boolean;

  /** オブジェクト枠の色 */
  objectFrameColor: string;
  /** 配置用に選択中のプレハブID（null=未選択、'__empty__'=空オブジェクト） */
  selectedPrefabId: string | null;

  setTool: (tool: MapEditTool) => void;
  selectChip: (chipId: string | null) => void;
  selectChipRange: (range: ChipRangeSelection | null) => void;
  setTileSelection: (selection: TileSelection | null) => void;
  setHoverTile: (cell: TileCell | null) => void;
  setViewport: (v: Partial<Viewport>) => void;
  toggleGrid: () => void;
  setObjectFrameColor: (color: string) => void;
  selectPrefabForPlacement: (id: string | null) => void;
}

export const createMapEditorSlice = <T extends MapEditorSlice>(
  set: (fn: (state: T) => void) => void,
  _get: () => T
): MapEditorSlice => ({
  currentTool: 'pen',
  selectedChipId: null,
  selectedChipRange: null,
  tileSelection: null,
  hoverTile: null,
  viewport: { x: 0, y: 0, zoom: 1 },
  showGrid: true,
  objectFrameColor: '#3b82f6',
  selectedPrefabId: null,

  setTool: (tool) =>
    set((s) => {
      s.currentTool = tool;
    }),
  selectChip: (chipId) =>
    set((s) => {
      s.selectedChipId = chipId;
      s.selectedChipRange = null;
    }),
  selectChipRange: (range) =>
    set((s) => {
      s.selectedChipRange = range;
    }),
  setTileSelection: (selection) =>
    set((s) => {
      s.tileSelection = selection;
    }),
  setHoverTile: (cell) =>
    set((s) => {
      s.hoverTile = cell;
    }),
  setViewport: (v) =>
    set((s) => {
      Object.assign(s.viewport, v);
    }),
  toggleGrid: () =>
    set((s) => {
      s.showGrid = !s.showGrid;
    }),
  setObjectFrameColor: (color) =>
    set((s) => {
      s.objectFrameColor = color;
    }),
  selectPrefabForPlacement: (id) =>
    set((s) => {
      s.selectedPrefabId = id;
    }),
});
