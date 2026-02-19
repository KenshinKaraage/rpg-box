/**
 * mapSlice のテスト
 */
import { act, renderHook } from '@testing-library/react';
import { useStore } from './index';
import type { GameMap, MapLayer, MapObject, Chipset } from '@/types/map';

const createTestMap = (id: string, name: string): GameMap => ({
  id,
  name,
  width: 20,
  height: 15,
  layers: [],
});

const createTestLayer = (id: string, name: string, type: 'tile' | 'object'): MapLayer => ({
  id,
  name,
  type,
  ...(type === 'tile' ? { tiles: [] } : { objects: [] }),
});

const createTestObject = (id: string, name: string): MapObject => ({
  id,
  name,
  components: [],
});

const createTestChipset = (id: string, name: string): Chipset => ({
  id,
  name,
  imageId: 'img_001',
  tileWidth: 32,
  tileHeight: 32,
  chips: [],
});

describe('mapSlice', () => {
  beforeEach(() => {
    act(() => {
      const state = useStore.getState();
      state.maps.forEach((m) => state.deleteMap(m.id));
      state.chipsets.forEach((c) => state.deleteChipset(c.id));
      state.selectMap(null);
    });
  });

  // ===========================================================================
  // 初期状態
  // ===========================================================================

  describe('初期状態', () => {
    it('maps は空配列', () => {
      const { result } = renderHook(() => useStore((state) => state.maps));
      expect(result.current).toEqual([]);
    });

    it('chipsets は空配列', () => {
      const { result } = renderHook(() => useStore((state) => state.chipsets));
      expect(result.current).toEqual([]);
    });

    it('selectedMapId は null', () => {
      const { result } = renderHook(() => useStore((state) => state.selectedMapId));
      expect(result.current).toBeNull();
    });

    it('selectedLayerId は null', () => {
      const { result } = renderHook(() => useStore((state) => state.selectedLayerId));
      expect(result.current).toBeNull();
    });

    it('selectedObjectId は null', () => {
      const { result } = renderHook(() => useStore((state) => state.selectedObjectId));
      expect(result.current).toBeNull();
    });
  });

  // ===========================================================================
  // Map CRUD
  // ===========================================================================

  describe('addMap', () => {
    it('マップを追加できる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addMap(createTestMap('map_001', 'フィールド'));
      });

      expect(result.current.maps).toHaveLength(1);
      expect(result.current.maps[0]?.id).toBe('map_001');
    });
  });

  describe('updateMap', () => {
    it('マップ名を更新できる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addMap(createTestMap('map_001', '元の名前'));
      });

      act(() => {
        result.current.updateMap('map_001', { name: '新しい名前' });
      });

      expect(result.current.maps[0]?.name).toBe('新しい名前');
    });

    it('IDが変更された場合、選択が更新される', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addMap(createTestMap('map_001', 'フィールド'));
        result.current.selectMap('map_001');
      });

      act(() => {
        result.current.updateMap('map_001', { id: 'map_renamed' });
      });

      expect(result.current.selectedMapId).toBe('map_renamed');
    });

    it('存在しないマップを更新しても何も起きない', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.updateMap('nonexistent', { name: 'test' });
      });

      expect(result.current.maps).toHaveLength(0);
    });
  });

  describe('deleteMap', () => {
    it('マップを削除できる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addMap(createTestMap('map_001', 'フィールド'));
      });

      act(() => {
        result.current.deleteMap('map_001');
      });

      expect(result.current.maps).toHaveLength(0);
    });

    it('選択中のマップを削除すると全選択がクリアされる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addMap(createTestMap('map_001', 'フィールド'));
        result.current.selectMap('map_001');
        result.current.selectLayer('layer_001');
        result.current.selectObject('obj_001');
      });

      act(() => {
        result.current.deleteMap('map_001');
      });

      expect(result.current.selectedMapId).toBeNull();
      expect(result.current.selectedLayerId).toBeNull();
      expect(result.current.selectedObjectId).toBeNull();
    });

    it('存在しないマップを削除しても何も起きない', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.deleteMap('nonexistent');
      });

      expect(result.current.maps).toHaveLength(0);
    });
  });

  describe('selectMap', () => {
    it('マップを選択できる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.selectMap('map_001');
      });

      expect(result.current.selectedMapId).toBe('map_001');
    });

    it('マップ選択時にレイヤーとオブジェクトの選択がクリアされる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.selectLayer('layer_001');
        result.current.selectObject('obj_001');
      });

      act(() => {
        result.current.selectMap('map_001');
      });

      expect(result.current.selectedLayerId).toBeNull();
      expect(result.current.selectedObjectId).toBeNull();
    });

    it('null で選択解除できる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.selectMap('map_001');
      });

      act(() => {
        result.current.selectMap(null);
      });

      expect(result.current.selectedMapId).toBeNull();
    });
  });

  // ===========================================================================
  // Layer operations
  // ===========================================================================

  describe('addLayer', () => {
    it('マップにレイヤーを追加できる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addMap(createTestMap('map_001', 'フィールド'));
      });

      act(() => {
        result.current.addLayer('map_001', createTestLayer('layer_001', '地面', 'tile'));
      });

      expect(result.current.maps[0]?.layers).toHaveLength(1);
      expect(result.current.maps[0]?.layers[0]?.id).toBe('layer_001');
    });

    it('存在しないマップにレイヤーを追加しても何も起きない', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addLayer('nonexistent', createTestLayer('layer_001', '地面', 'tile'));
      });

      expect(result.current.maps).toHaveLength(0);
    });
  });

  describe('updateLayer', () => {
    it('レイヤー名を更新できる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addMap(createTestMap('map_001', 'フィールド'));
        result.current.addLayer('map_001', createTestLayer('layer_001', '元の名前', 'tile'));
      });

      act(() => {
        result.current.updateLayer('map_001', 'layer_001', { name: '新しい名前' });
      });

      expect(result.current.maps[0]?.layers[0]?.name).toBe('新しい名前');
    });
  });

  describe('deleteLayer', () => {
    it('レイヤーを削除できる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addMap(createTestMap('map_001', 'フィールド'));
        result.current.addLayer('map_001', createTestLayer('layer_001', '地面', 'tile'));
      });

      act(() => {
        result.current.deleteLayer('map_001', 'layer_001');
      });

      expect(result.current.maps[0]?.layers).toHaveLength(0);
    });

    it('選択中のレイヤーを削除すると選択がクリアされる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addMap(createTestMap('map_001', 'フィールド'));
        result.current.addLayer('map_001', createTestLayer('layer_001', '地面', 'tile'));
        result.current.selectLayer('layer_001');
      });

      act(() => {
        result.current.deleteLayer('map_001', 'layer_001');
      });

      expect(result.current.selectedLayerId).toBeNull();
    });
  });

  describe('selectLayer', () => {
    it('レイヤーを選択できる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.selectLayer('layer_001');
      });

      expect(result.current.selectedLayerId).toBe('layer_001');
    });

    it('レイヤー選択時にオブジェクト選択がクリアされる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.selectObject('obj_001');
      });

      act(() => {
        result.current.selectLayer('layer_001');
      });

      expect(result.current.selectedObjectId).toBeNull();
    });
  });

  describe('reorderLayers', () => {
    it('レイヤーの順序を変更できる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addMap(createTestMap('map_001', 'フィールド'));
        result.current.addLayer('map_001', createTestLayer('layer_001', '地面', 'tile'));
        result.current.addLayer('map_001', createTestLayer('layer_002', 'オブジェクト', 'object'));
      });

      act(() => {
        result.current.reorderLayers('map_001', 0, 1);
      });

      expect(result.current.maps[0]?.layers[0]?.id).toBe('layer_002');
      expect(result.current.maps[0]?.layers[1]?.id).toBe('layer_001');
    });

    it('無効なインデックスでは何も起きない', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addMap(createTestMap('map_001', 'フィールド'));
        result.current.addLayer('map_001', createTestLayer('layer_001', '地面', 'tile'));
      });

      act(() => {
        result.current.reorderLayers('map_001', 0, 5);
      });

      expect(result.current.maps[0]?.layers[0]?.id).toBe('layer_001');
    });
  });

  // ===========================================================================
  // Tile operations
  // ===========================================================================

  describe('setTile', () => {
    it('タイルを設定できる', () => {
      const { result } = renderHook(() => useStore());

      const layer: MapLayer = {
        id: 'layer_001',
        name: '地面',
        type: 'tile',
        tiles: [
          ['', '', ''],
          ['', '', ''],
        ],
      };

      act(() => {
        result.current.addMap(createTestMap('map_001', 'フィールド'));
        result.current.addLayer('map_001', layer);
      });

      act(() => {
        result.current.setTile('map_001', 'layer_001', 1, 0, 'chip_grass');
      });

      expect(result.current.maps[0]?.layers[0]?.tiles?.[0]?.[1]).toBe('chip_grass');
    });

    it('tiles が未定義の場合は何も起きない', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addMap(createTestMap('map_001', 'フィールド'));
        result.current.addLayer('map_001', createTestLayer('layer_001', 'オブジェクト', 'object'));
      });

      act(() => {
        result.current.setTile('map_001', 'layer_001', 0, 0, 'chip_grass');
      });

      // No error thrown
      expect(result.current.maps[0]?.layers[0]?.tiles).toBeUndefined();
    });
  });

  // ===========================================================================
  // Object operations
  // ===========================================================================

  describe('addObject', () => {
    it('レイヤーにオブジェクトを追加できる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addMap(createTestMap('map_001', 'フィールド'));
        result.current.addLayer('map_001', createTestLayer('layer_001', 'オブジェクト', 'object'));
      });

      act(() => {
        result.current.addObject('map_001', 'layer_001', createTestObject('obj_001', '宝箱'));
      });

      expect(result.current.maps[0]?.layers[0]?.objects).toHaveLength(1);
      expect(result.current.maps[0]?.layers[0]?.objects?.[0]?.id).toBe('obj_001');
    });

    it('objects が未定義のレイヤーにも追加できる', () => {
      const { result } = renderHook(() => useStore());

      const layer: MapLayer = { id: 'layer_001', name: '地面', type: 'tile', tiles: [] };

      act(() => {
        result.current.addMap(createTestMap('map_001', 'フィールド'));
        result.current.addLayer('map_001', layer);
      });

      act(() => {
        result.current.addObject('map_001', 'layer_001', createTestObject('obj_001', '宝箱'));
      });

      expect(result.current.maps[0]?.layers[0]?.objects).toHaveLength(1);
    });
  });

  describe('updateObject', () => {
    it('オブジェクト名を更新できる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addMap(createTestMap('map_001', 'フィールド'));
        result.current.addLayer('map_001', createTestLayer('layer_001', 'オブジェクト', 'object'));
        result.current.addObject('map_001', 'layer_001', createTestObject('obj_001', '元の名前'));
      });

      act(() => {
        result.current.updateObject('map_001', 'layer_001', 'obj_001', { name: '新しい名前' });
      });

      expect(result.current.maps[0]?.layers[0]?.objects?.[0]?.name).toBe('新しい名前');
    });

    it('存在しないオブジェクトを更新しても何も起きない', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addMap(createTestMap('map_001', 'フィールド'));
        result.current.addLayer('map_001', createTestLayer('layer_001', 'オブジェクト', 'object'));
      });

      act(() => {
        result.current.updateObject('map_001', 'layer_001', 'nonexistent', { name: 'test' });
      });

      expect(result.current.maps[0]?.layers[0]?.objects).toHaveLength(0);
    });
  });

  describe('deleteObject', () => {
    it('オブジェクトを削除できる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addMap(createTestMap('map_001', 'フィールド'));
        result.current.addLayer('map_001', createTestLayer('layer_001', 'オブジェクト', 'object'));
        result.current.addObject('map_001', 'layer_001', createTestObject('obj_001', '宝箱'));
      });

      act(() => {
        result.current.deleteObject('map_001', 'layer_001', 'obj_001');
      });

      expect(result.current.maps[0]?.layers[0]?.objects).toHaveLength(0);
    });

    it('選択中のオブジェクトを削除すると選択がクリアされる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addMap(createTestMap('map_001', 'フィールド'));
        result.current.addLayer('map_001', createTestLayer('layer_001', 'オブジェクト', 'object'));
        result.current.addObject('map_001', 'layer_001', createTestObject('obj_001', '宝箱'));
        result.current.selectObject('obj_001');
      });

      act(() => {
        result.current.deleteObject('map_001', 'layer_001', 'obj_001');
      });

      expect(result.current.selectedObjectId).toBeNull();
    });
  });

  describe('selectObject', () => {
    it('オブジェクトを選択できる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.selectObject('obj_001');
      });

      expect(result.current.selectedObjectId).toBe('obj_001');
    });

    it('null で選択解除できる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.selectObject('obj_001');
      });

      act(() => {
        result.current.selectObject(null);
      });

      expect(result.current.selectedObjectId).toBeNull();
    });
  });

  // ===========================================================================
  // Chipset CRUD
  // ===========================================================================

  describe('addChipset', () => {
    it('チップセットを追加できる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addChipset(createTestChipset('chipset_001', '草原'));
      });

      expect(result.current.chipsets).toHaveLength(1);
      expect(result.current.chipsets[0]?.id).toBe('chipset_001');
    });
  });

  describe('updateChipset', () => {
    it('チップセット名を更新できる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addChipset(createTestChipset('chipset_001', '元の名前'));
      });

      act(() => {
        result.current.updateChipset('chipset_001', { name: '新しい名前' });
      });

      expect(result.current.chipsets[0]?.name).toBe('新しい名前');
    });

    it('存在しないチップセットを更新しても何も起きない', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.updateChipset('nonexistent', { name: 'test' });
      });

      expect(result.current.chipsets).toHaveLength(0);
    });
  });

  describe('deleteChipset', () => {
    it('チップセットを削除できる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addChipset(createTestChipset('chipset_001', '草原'));
      });

      act(() => {
        result.current.deleteChipset('chipset_001');
      });

      expect(result.current.chipsets).toHaveLength(0);
    });

    it('存在しないチップセットを削除しても何も起きない', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.deleteChipset('nonexistent');
      });

      expect(result.current.chipsets).toHaveLength(0);
    });
  });
});
