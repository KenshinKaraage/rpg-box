/**
 * プレハブスライス
 *
 * プレハブ（再利用可能なオブジェクトテンプレート）の状態管理
 */
import type { Prefab } from '@/types/map';

export interface PrefabSlice {
  /** プレハブ一覧 */
  prefabs: Prefab[];

  /** 選択中のプレハブID */
  selectedPrefabId: string | null;

  // Prefab CRUD
  addPrefab: (prefab: Prefab) => void;
  updatePrefab: (id: string, updates: Partial<Prefab>) => void;
  deletePrefab: (id: string) => void;
  selectPrefab: (id: string | null) => void;
}

export const createPrefabSlice = <T extends PrefabSlice>(
  set: (fn: (state: T) => void) => void,
  _get: () => T
): PrefabSlice => ({
  prefabs: [],
  selectedPrefabId: null,

  // =========================================================================
  // Prefab CRUD
  // =========================================================================

  addPrefab: (prefab: Prefab) =>
    set((state) => {
      state.prefabs.push(prefab);
    }),

  updatePrefab: (id: string, updates: Partial<Prefab>) =>
    set((state) => {
      const index = state.prefabs.findIndex((p) => p.id === id);
      if (index !== -1) {
        state.prefabs[index] = { ...state.prefabs[index], ...updates } as Prefab;
      }
    }),

  deletePrefab: (id: string) =>
    set((state) => {
      state.prefabs = state.prefabs.filter((p) => p.id !== id);
      if (state.selectedPrefabId === id) {
        state.selectedPrefabId = null;
      }
    }),

  selectPrefab: (id: string | null) =>
    set((state) => {
      state.selectedPrefabId = id;
    }),
});
