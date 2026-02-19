/**
 * prefabSlice のテスト
 */
import { act, renderHook } from '@testing-library/react';
import { useStore } from './index';
import type { Prefab } from '@/types/map';

const createTestPrefab = (id: string, name: string): Prefab => ({
  id,
  name,
  components: [],
});

describe('prefabSlice', () => {
  beforeEach(() => {
    act(() => {
      const state = useStore.getState();
      state.prefabs.forEach((p) => state.deletePrefab(p.id));
      state.selectPrefab(null);
    });
  });

  // ===========================================================================
  // 初期状態
  // ===========================================================================

  describe('初期状態', () => {
    it('prefabs は空配列', () => {
      const { result } = renderHook(() => useStore((state) => state.prefabs));
      expect(result.current).toEqual([]);
    });

    it('selectedPrefabId は null', () => {
      const { result } = renderHook(() => useStore((state) => state.selectedPrefabId));
      expect(result.current).toBeNull();
    });
  });

  // ===========================================================================
  // Prefab CRUD
  // ===========================================================================

  describe('addPrefab', () => {
    it('プレハブを追加できる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addPrefab(createTestPrefab('prefab_001', 'NPC'));
      });

      expect(result.current.prefabs).toHaveLength(1);
      expect(result.current.prefabs[0]?.id).toBe('prefab_001');
    });

    it('複数のプレハブを追加できる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addPrefab(createTestPrefab('prefab_001', 'NPC'));
        result.current.addPrefab(createTestPrefab('prefab_002', '宝箱'));
      });

      expect(result.current.prefabs).toHaveLength(2);
    });
  });

  describe('updatePrefab', () => {
    it('プレハブ名を更新できる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addPrefab(createTestPrefab('prefab_001', '元の名前'));
      });

      act(() => {
        result.current.updatePrefab('prefab_001', { name: '新しい名前' });
      });

      expect(result.current.prefabs[0]?.name).toBe('新しい名前');
    });

    it('存在しないプレハブを更新しても何も起きない', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.updatePrefab('nonexistent', { name: 'test' });
      });

      expect(result.current.prefabs).toHaveLength(0);
    });
  });

  describe('deletePrefab', () => {
    it('プレハブを削除できる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addPrefab(createTestPrefab('prefab_001', 'NPC'));
      });

      act(() => {
        result.current.deletePrefab('prefab_001');
      });

      expect(result.current.prefabs).toHaveLength(0);
    });

    it('選択中のプレハブを削除すると選択がクリアされる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addPrefab(createTestPrefab('prefab_001', 'NPC'));
        result.current.selectPrefab('prefab_001');
      });

      act(() => {
        result.current.deletePrefab('prefab_001');
      });

      expect(result.current.selectedPrefabId).toBeNull();
    });

    it('選択中でないプレハブを削除しても選択は変わらない', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addPrefab(createTestPrefab('prefab_001', 'NPC'));
        result.current.addPrefab(createTestPrefab('prefab_002', '宝箱'));
        result.current.selectPrefab('prefab_002');
      });

      act(() => {
        result.current.deletePrefab('prefab_001');
      });

      expect(result.current.selectedPrefabId).toBe('prefab_002');
    });

    it('存在しないプレハブを削除しても何も起きない', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.deletePrefab('nonexistent');
      });

      expect(result.current.prefabs).toHaveLength(0);
    });
  });

  describe('selectPrefab', () => {
    it('プレハブを選択できる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.selectPrefab('prefab_001');
      });

      expect(result.current.selectedPrefabId).toBe('prefab_001');
    });

    it('null で選択解除できる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.selectPrefab('prefab_001');
      });

      act(() => {
        result.current.selectPrefab(null);
      });

      expect(result.current.selectedPrefabId).toBeNull();
    });
  });
});
