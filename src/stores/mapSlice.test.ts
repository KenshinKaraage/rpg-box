/**
 * mapSlice のテスト
 */
import { act, renderHook } from '@testing-library/react';
import { useStore } from './index';
import type { GameMap, MapLayer, MapObject, Chipset } from '@/types/map';
import { createFieldTypeInstance } from '@/types/fields';

const createTestMap = (id: string, name: string): GameMap => ({
  id,
  name,
  width: 20,
  height: 15,
  layers: [],
  fields: [],
  values: {},
});

const createTestLayer = (id: string, name: string, type: 'tile' | 'object'): MapLayer => ({
  id,
  name,
  type,
  chipsetIds: [],
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
  fields: [],
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
        chipsetIds: [],
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

      const layer: MapLayer = {
        id: 'layer_001',
        name: '地面',
        type: 'tile',
        chipsetIds: [],
        tiles: [],
      };

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

  // ===========================================================================
  // Chip property operations
  // ===========================================================================

  describe('updateChipProperty', () => {
    it('既存チップの values を更新する', () => {
      const { result } = renderHook(() => useStore());

      const chipset: Chipset = {
        id: 'cs_001',
        name: 'テスト',
        imageId: '',
        tileWidth: 32,
        tileHeight: 32,
        fields: [],
        chips: [{ index: 0, values: { passable: false } }],
      };

      act(() => {
        result.current.addChipset(chipset);
        result.current.updateChipProperty('cs_001', 0, { passable: true });
      });

      const updated = result.current.chipsets.find((c) => c.id === 'cs_001');
      expect(updated?.chips[0]?.values['passable']).toBe(true);
    });

    it('存在しないチップインデックスなら新規追加する', () => {
      const { result } = renderHook(() => useStore());

      const chipset: Chipset = {
        id: 'cs_002',
        name: 'テスト2',
        imageId: '',
        tileWidth: 32,
        tileHeight: 32,
        fields: [],
        chips: [],
      };

      act(() => {
        result.current.addChipset(chipset);
        result.current.updateChipProperty('cs_002', 5, { passable: true });
      });

      const updated = result.current.chipsets.find((c) => c.id === 'cs_002');
      expect(updated?.chips).toHaveLength(1);
      expect(updated?.chips[0]?.index).toBe(5);
      expect(updated?.chips[0]?.values['passable']).toBe(true);
    });

    it('存在しないチップセットIDは何もしない', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.updateChipProperty('nonexistent', 0, { passable: true });
      });

      // エラーが出ないこと
      expect(result.current.chipsets).toHaveLength(0);
    });
  });

  // ===========================================================================
  // Map field operations
  // ===========================================================================

  describe('addFieldToMap', () => {
    it('マップにフィールドを追加できる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addMap(createTestMap('map_001', 'フィールド'));
      });

      const field = createFieldTypeInstance('number')!;
      field.id = 'hp';
      field.name = 'HP';

      act(() => {
        result.current.addFieldToMap('map_001', field);
      });

      expect(result.current.maps[0]?.fields).toHaveLength(1);
      expect(result.current.maps[0]?.fields[0]?.id).toBe('hp');
      expect(result.current.maps[0]?.fields[0]?.name).toBe('HP');
    });

    it('存在しないマップにフィールドを追加しても何も起きない', () => {
      const { result } = renderHook(() => useStore());

      const field = createFieldTypeInstance('number')!;
      field.id = 'hp';
      field.name = 'HP';

      act(() => {
        result.current.addFieldToMap('nonexistent', field);
      });

      expect(result.current.maps).toHaveLength(0);
    });
  });

  describe('replaceMapField', () => {
    it('フィールドを置換できる（IDと名前は保持される）', () => {
      const { result } = renderHook(() => useStore());

      const originalField = createFieldTypeInstance('number')!;
      originalField.id = 'field_1';
      originalField.name = 'HP';

      act(() => {
        result.current.addMap(createTestMap('map_001', 'フィールド'));
        result.current.addFieldToMap('map_001', originalField);
      });

      const newField = createFieldTypeInstance('string')!;
      newField.id = 'temp';
      newField.name = 'temp';

      act(() => {
        result.current.replaceMapField('map_001', 'field_1', newField);
      });

      expect(result.current.maps[0]?.fields).toHaveLength(1);
      expect(result.current.maps[0]?.fields[0]?.id).toBe('field_1');
      expect(result.current.maps[0]?.fields[0]?.name).toBe('HP');
      expect(result.current.maps[0]?.fields[0]?.type).toBe('string');
    });

    it('存在しないフィールドを置換しても何も起きない', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addMap(createTestMap('map_001', 'フィールド'));
      });

      const newField = createFieldTypeInstance('string')!;

      act(() => {
        result.current.replaceMapField('map_001', 'nonexistent', newField);
      });

      expect(result.current.maps[0]?.fields).toHaveLength(0);
    });
  });

  describe('deleteMapField', () => {
    it('フィールドを削除し、対応するvaluesもクリアされる', () => {
      const { result } = renderHook(() => useStore());

      const field = createFieldTypeInstance('number')!;
      field.id = 'hp';
      field.name = 'HP';

      act(() => {
        const map = createTestMap('map_001', 'フィールド');
        map.values = { hp: 100 };
        result.current.addMap(map);
        result.current.addFieldToMap('map_001', field);
      });

      act(() => {
        result.current.deleteMapField('map_001', 'hp');
      });

      expect(result.current.maps[0]?.fields).toHaveLength(0);
      expect(result.current.maps[0]?.values).not.toHaveProperty('hp');
    });
  });

  describe('reorderMapFields', () => {
    it('フィールドの順序を変更できる', () => {
      const { result } = renderHook(() => useStore());

      const field1 = createFieldTypeInstance('number')!;
      field1.id = 'field_1';
      field1.name = 'HP';

      const field2 = createFieldTypeInstance('string')!;
      field2.id = 'field_2';
      field2.name = '名前';

      act(() => {
        result.current.addMap(createTestMap('map_001', 'フィールド'));
        result.current.addFieldToMap('map_001', field1);
        result.current.addFieldToMap('map_001', field2);
      });

      act(() => {
        result.current.reorderMapFields('map_001', 0, 1);
      });

      expect(result.current.maps[0]?.fields[0]?.id).toBe('field_2');
      expect(result.current.maps[0]?.fields[1]?.id).toBe('field_1');
    });

    it('無効なインデックスでは何も起きない', () => {
      const { result } = renderHook(() => useStore());

      const field = createFieldTypeInstance('number')!;
      field.id = 'field_1';
      field.name = 'HP';

      act(() => {
        result.current.addMap(createTestMap('map_001', 'フィールド'));
        result.current.addFieldToMap('map_001', field);
      });

      act(() => {
        result.current.reorderMapFields('map_001', 0, 5);
      });

      expect(result.current.maps[0]?.fields[0]?.id).toBe('field_1');
    });
  });

  describe('updateMapValues', () => {
    it('valuesをマージできる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        const map = createTestMap('map_001', 'フィールド');
        map.values = { hp: 100 };
        result.current.addMap(map);
      });

      act(() => {
        result.current.updateMapValues('map_001', { mp: 50 });
      });

      expect(result.current.maps[0]?.values).toEqual({ hp: 100, mp: 50 });
    });

    it('既存のvalueを上書きできる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        const map = createTestMap('map_001', 'フィールド');
        map.values = { hp: 100 };
        result.current.addMap(map);
      });

      act(() => {
        result.current.updateMapValues('map_001', { hp: 200 });
      });

      expect(result.current.maps[0]?.values).toEqual({ hp: 200 });
    });

    it('存在しないマップを更新しても何も起きない', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.updateMapValues('nonexistent', { hp: 100 });
      });

      expect(result.current.maps).toHaveLength(0);
    });
  });

  // ===========================================================================
  // Chipset field operations
  // ===========================================================================

  describe('addFieldToChipset', () => {
    it('チップセットにフィールドを追加できる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addChipset(createTestChipset('chipset_001', '草原'));
      });

      const field = createFieldTypeInstance('boolean')!;
      field.id = 'passable';
      field.name = '通行可能';

      act(() => {
        result.current.addFieldToChipset('chipset_001', field);
      });

      expect(result.current.chipsets[0]?.fields).toHaveLength(1);
      expect(result.current.chipsets[0]?.fields[0]?.id).toBe('passable');
    });

    it('存在しないチップセットにフィールドを追加しても何も起きない', () => {
      const { result } = renderHook(() => useStore());

      const field = createFieldTypeInstance('boolean')!;
      field.id = 'passable';
      field.name = '通行可能';

      act(() => {
        result.current.addFieldToChipset('nonexistent', field);
      });

      expect(result.current.chipsets).toHaveLength(0);
    });
  });

  describe('replaceChipsetField', () => {
    it('フィールドを置換できる（IDと名前は保持される）', () => {
      const { result } = renderHook(() => useStore());

      const originalField = createFieldTypeInstance('boolean')!;
      originalField.id = 'field_1';
      originalField.name = '通行可能';

      act(() => {
        result.current.addChipset(createTestChipset('chipset_001', '草原'));
        result.current.addFieldToChipset('chipset_001', originalField);
      });

      const newField = createFieldTypeInstance('number')!;
      newField.id = 'temp';
      newField.name = 'temp';

      act(() => {
        result.current.replaceChipsetField('chipset_001', 'field_1', newField);
      });

      expect(result.current.chipsets[0]?.fields).toHaveLength(1);
      expect(result.current.chipsets[0]?.fields[0]?.id).toBe('field_1');
      expect(result.current.chipsets[0]?.fields[0]?.name).toBe('通行可能');
      expect(result.current.chipsets[0]?.fields[0]?.type).toBe('number');
    });
  });

  describe('deleteChipsetField', () => {
    it('フィールドを削除し、全チップのvaluesもクリアされる', () => {
      const { result } = renderHook(() => useStore());

      const field = createFieldTypeInstance('boolean')!;
      field.id = 'passable';
      field.name = '通行可能';

      act(() => {
        const chipset = createTestChipset('chipset_001', '草原');
        chipset.chips = [
          { index: 0, values: { passable: true } },
          { index: 1, values: { passable: false } },
        ];
        result.current.addChipset(chipset);
        result.current.addFieldToChipset('chipset_001', field);
      });

      act(() => {
        result.current.deleteChipsetField('chipset_001', 'passable');
      });

      expect(result.current.chipsets[0]?.fields).toHaveLength(0);
      expect(result.current.chipsets[0]?.chips[0]?.values).not.toHaveProperty('passable');
      expect(result.current.chipsets[0]?.chips[1]?.values).not.toHaveProperty('passable');
    });
  });

  describe('reorderChipsetFields', () => {
    it('フィールドの順序を変更できる', () => {
      const { result } = renderHook(() => useStore());

      const field1 = createFieldTypeInstance('boolean')!;
      field1.id = 'passable';
      field1.name = '通行可能';

      const field2 = createFieldTypeInstance('string')!;
      field2.id = 'footstep';
      field2.name = '足音';

      act(() => {
        result.current.addChipset(createTestChipset('chipset_001', '草原'));
        result.current.addFieldToChipset('chipset_001', field1);
        result.current.addFieldToChipset('chipset_001', field2);
      });

      act(() => {
        result.current.reorderChipsetFields('chipset_001', 0, 1);
      });

      expect(result.current.chipsets[0]?.fields[0]?.id).toBe('footstep');
      expect(result.current.chipsets[0]?.fields[1]?.id).toBe('passable');
    });

    it('無効なインデックスでは何も起きない', () => {
      const { result } = renderHook(() => useStore());

      const field = createFieldTypeInstance('boolean')!;
      field.id = 'passable';
      field.name = '通行可能';

      act(() => {
        result.current.addChipset(createTestChipset('chipset_001', '草原'));
        result.current.addFieldToChipset('chipset_001', field);
      });

      act(() => {
        result.current.reorderChipsetFields('chipset_001', 0, 5);
      });

      expect(result.current.chipsets[0]?.fields[0]?.id).toBe('passable');
    });
  });
});
