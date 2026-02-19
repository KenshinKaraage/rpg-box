/**
 * マップスライス
 *
 * マップ、レイヤー、タイル、オブジェクト、チップセットの状態管理
 */
import type { GameMap, MapLayer, MapObject, Chipset } from '@/types/map';

export interface MapSlice {
  /** マップ一覧 */
  maps: GameMap[];

  /** チップセット一覧 */
  chipsets: Chipset[];

  /** 選択中のマップID */
  selectedMapId: string | null;

  /** 選択中のレイヤーID */
  selectedLayerId: string | null;

  /** 選択中のオブジェクトID */
  selectedObjectId: string | null;

  // Map CRUD
  addMap: (map: GameMap) => void;
  updateMap: (id: string, updates: Partial<GameMap>) => void;
  deleteMap: (id: string) => void;
  selectMap: (id: string | null) => void;

  // Layer operations
  addLayer: (mapId: string, layer: MapLayer) => void;
  updateLayer: (mapId: string, layerId: string, updates: Partial<MapLayer>) => void;
  deleteLayer: (mapId: string, layerId: string) => void;
  selectLayer: (id: string | null) => void;
  reorderLayers: (mapId: string, fromIndex: number, toIndex: number) => void;

  // Tile operations
  setTile: (mapId: string, layerId: string, x: number, y: number, chipId: string) => void;

  // Object operations
  addObject: (mapId: string, layerId: string, object: MapObject) => void;
  updateObject: (
    mapId: string,
    layerId: string,
    objectId: string,
    updates: Partial<MapObject>
  ) => void;
  deleteObject: (mapId: string, layerId: string, objectId: string) => void;
  selectObject: (id: string | null) => void;

  // Chipset CRUD
  addChipset: (chipset: Chipset) => void;
  updateChipset: (id: string, updates: Partial<Chipset>) => void;
  deleteChipset: (id: string) => void;
}

export const createMapSlice = <T extends MapSlice>(
  set: (fn: (state: T) => void) => void,
  _get: () => T
): MapSlice => ({
  maps: [],
  chipsets: [],
  selectedMapId: null,
  selectedLayerId: null,
  selectedObjectId: null,

  // =========================================================================
  // Map CRUD
  // =========================================================================

  addMap: (map: GameMap) =>
    set((state) => {
      state.maps.push(map);
    }),

  updateMap: (id: string, updates: Partial<GameMap>) =>
    set((state) => {
      const index = state.maps.findIndex((m) => m.id === id);
      if (index !== -1) {
        state.maps[index] = { ...state.maps[index], ...updates } as GameMap;
        // IDが変更された場合、選択を更新
        if (updates.id && updates.id !== id && state.selectedMapId === id) {
          state.selectedMapId = updates.id;
        }
      }
    }),

  deleteMap: (id: string) =>
    set((state) => {
      state.maps = state.maps.filter((m) => m.id !== id);
      if (state.selectedMapId === id) {
        state.selectedMapId = null;
        state.selectedLayerId = null;
        state.selectedObjectId = null;
      }
    }),

  selectMap: (id: string | null) =>
    set((state) => {
      state.selectedMapId = id;
      state.selectedLayerId = null;
      state.selectedObjectId = null;
    }),

  // =========================================================================
  // Layer operations
  // =========================================================================

  addLayer: (mapId: string, layer: MapLayer) =>
    set((state) => {
      const map = state.maps.find((m) => m.id === mapId);
      if (map) {
        map.layers.push(layer);
      }
    }),

  updateLayer: (mapId: string, layerId: string, updates: Partial<MapLayer>) =>
    set((state) => {
      const map = state.maps.find((m) => m.id === mapId);
      if (map) {
        const index = map.layers.findIndex((l) => l.id === layerId);
        if (index !== -1) {
          map.layers[index] = { ...map.layers[index], ...updates } as MapLayer;
        }
      }
    }),

  deleteLayer: (mapId: string, layerId: string) =>
    set((state) => {
      const map = state.maps.find((m) => m.id === mapId);
      if (map) {
        map.layers = map.layers.filter((l) => l.id !== layerId);
      }
      if (state.selectedLayerId === layerId) {
        state.selectedLayerId = null;
      }
    }),

  selectLayer: (id: string | null) =>
    set((state) => {
      state.selectedLayerId = id;
      state.selectedObjectId = null;
    }),

  reorderLayers: (mapId: string, fromIndex: number, toIndex: number) =>
    set((state) => {
      const map = state.maps.find((m) => m.id === mapId);
      if (
        map &&
        fromIndex >= 0 &&
        toIndex >= 0 &&
        fromIndex < map.layers.length &&
        toIndex < map.layers.length
      ) {
        const [removed] = map.layers.splice(fromIndex, 1);
        if (removed) {
          map.layers.splice(toIndex, 0, removed);
        }
      }
    }),

  // =========================================================================
  // Tile operations
  // =========================================================================

  setTile: (mapId: string, layerId: string, x: number, y: number, chipId: string) =>
    set((state) => {
      const map = state.maps.find((m) => m.id === mapId);
      if (map) {
        const layer = map.layers.find((l) => l.id === layerId);
        if (layer && layer.tiles) {
          const row = layer.tiles[y];
          if (row) {
            row[x] = chipId;
          }
        }
      }
    }),

  // =========================================================================
  // Object operations
  // =========================================================================

  addObject: (mapId: string, layerId: string, object: MapObject) =>
    set((state) => {
      const map = state.maps.find((m) => m.id === mapId);
      if (map) {
        const layer = map.layers.find((l) => l.id === layerId);
        if (layer) {
          if (!layer.objects) {
            layer.objects = [];
          }
          layer.objects.push(object);
        }
      }
    }),

  updateObject: (mapId: string, layerId: string, objectId: string, updates: Partial<MapObject>) =>
    set((state) => {
      const map = state.maps.find((m) => m.id === mapId);
      if (map) {
        const layer = map.layers.find((l) => l.id === layerId);
        if (layer && layer.objects) {
          const index = layer.objects.findIndex((o) => o.id === objectId);
          if (index !== -1) {
            layer.objects[index] = { ...layer.objects[index], ...updates } as MapObject;
          }
        }
      }
    }),

  deleteObject: (mapId: string, layerId: string, objectId: string) =>
    set((state) => {
      const map = state.maps.find((m) => m.id === mapId);
      if (map) {
        const layer = map.layers.find((l) => l.id === layerId);
        if (layer && layer.objects) {
          layer.objects = layer.objects.filter((o) => o.id !== objectId);
        }
      }
      if (state.selectedObjectId === objectId) {
        state.selectedObjectId = null;
      }
    }),

  selectObject: (id: string | null) =>
    set((state) => {
      state.selectedObjectId = id;
    }),

  // =========================================================================
  // Chipset CRUD
  // =========================================================================

  addChipset: (chipset: Chipset) =>
    set((state) => {
      state.chipsets.push(chipset);
    }),

  updateChipset: (id: string, updates: Partial<Chipset>) =>
    set((state) => {
      const index = state.chipsets.findIndex((c) => c.id === id);
      if (index !== -1) {
        state.chipsets[index] = { ...state.chipsets[index], ...updates } as Chipset;
      }
    }),

  deleteChipset: (id: string) =>
    set((state) => {
      state.chipsets = state.chipsets.filter((c) => c.id !== id);
    }),
});
