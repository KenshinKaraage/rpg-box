/**
 * マップエディタスライス
 *
 * ツール選択、チップ選択、ビューポート、グリッド表示、Undo/Redoスタックの状態管理
 */
import type { MapObject } from '@/types/map';

export type MapEditTool = 'select' | 'pen' | 'eraser' | 'fill' | 'rect';

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export type MapEditAction =
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

export const createMapEditorSlice = <T extends MapEditorSlice>(
  set: (fn: (state: T) => void) => void,
  _get: () => T
): MapEditorSlice => ({
  currentTool: 'pen',
  selectedChipId: null,
  viewport: { x: 0, y: 0, zoom: 1 },
  showGrid: true,
  undoStack: [],
  redoStack: [],

  setTool: (tool) =>
    set((s) => {
      s.currentTool = tool;
    }),
  selectChip: (chipId) =>
    set((s) => {
      s.selectedChipId = chipId;
    }),
  setViewport: (v) =>
    set((s) => {
      Object.assign(s.viewport, v);
    }),
  toggleGrid: () =>
    set((s) => {
      s.showGrid = !s.showGrid;
    }),

  pushUndo: (action) =>
    set((s) => {
      s.undoStack.push(action);
      if (s.undoStack.length > MAX_UNDO) s.undoStack.shift();
      s.redoStack = [];
    }),

  popUndo: () => {
    let popped: MapEditAction | undefined;
    set((s) => {
      const item = s.undoStack.pop();
      if (item) popped = structuredClone(item);
    });
    return popped;
  },

  pushRedo: (action) =>
    set((s) => {
      s.redoStack.push(action);
    }),

  popRedo: () => {
    let popped: MapEditAction | undefined;
    set((s) => {
      const item = s.redoStack.pop();
      if (item) popped = structuredClone(item);
    });
    return popped;
  },
});
