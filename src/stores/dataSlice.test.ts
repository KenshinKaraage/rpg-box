/**
 * dataSlice のテスト
 */
import { act, renderHook } from '@testing-library/react';
import { useStore } from './index';
import { createDataType } from '@/types/data';
import { NumberFieldType, StringFieldType } from '@/types/fields';

describe('dataSlice', () => {
  beforeEach(() => {
    act(() => {
      const state = useStore.getState();
      state.dataTypes.forEach((t) => state.deleteDataType(t.id));
      state.selectDataType(null);
      state.selectDataEntry(null);
    });
  });

  describe('初期状態', () => {
    it('dataTypes は空配列', () => {
      const { result } = renderHook(() => useStore((state) => state.dataTypes));
      expect(result.current).toEqual([]);
    });

    it('dataEntries は空オブジェクト', () => {
      const { result } = renderHook(() => useStore((state) => state.dataEntries));
      expect(result.current).toEqual({});
    });

    it('selectedDataTypeId は null', () => {
      const { result } = renderHook(() => useStore((state) => state.selectedDataTypeId));
      expect(result.current).toBeNull();
    });

    it('selectedDataEntryId は null', () => {
      const { result } = renderHook(() => useStore((state) => state.selectedDataEntryId));
      expect(result.current).toBeNull();
    });
  });

  describe('addDataType', () => {
    it('データタイプを追加できる', () => {
      const { result } = renderHook(() => useStore());
      const dt = createDataType('character', 'キャラクター');

      act(() => {
        result.current.addDataType(dt);
      });

      expect(result.current.dataTypes).toHaveLength(1);
      expect(result.current.dataTypes[0]?.id).toBe('character');
    });

    it('エントリ配列が初期化される', () => {
      const { result } = renderHook(() => useStore());
      const dt = createDataType('character', 'キャラクター');

      act(() => {
        result.current.addDataType(dt);
      });

      expect(result.current.dataEntries['character']).toEqual([]);
    });
  });

  describe('updateDataType', () => {
    it('データタイプ名を更新できる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addDataType(createDataType('character', '元の名前'));
      });

      act(() => {
        result.current.updateDataType('character', { name: '新しい名前' });
      });

      expect(result.current.dataTypes[0]?.name).toBe('新しい名前');
    });
  });

  describe('deleteDataType', () => {
    it('データタイプを削除できる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addDataType(createDataType('character', 'キャラクター'));
      });

      act(() => {
        result.current.deleteDataType('character');
      });

      expect(result.current.dataTypes).toHaveLength(0);
    });

    it('関連エントリも削除される', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addDataType(createDataType('character', 'キャラクター'));
        result.current.addDataEntry({ id: 'alice', typeId: 'character', values: {} });
      });

      act(() => {
        result.current.deleteDataType('character');
      });

      expect(result.current.dataEntries['character']).toBeUndefined();
    });

    it('選択中のタイプを削除すると選択がクリアされる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addDataType(createDataType('character', 'キャラクター'));
        result.current.selectDataType('character');
        result.current.selectDataEntry('entry_001');
      });

      act(() => {
        result.current.deleteDataType('character');
      });

      expect(result.current.selectedDataTypeId).toBeNull();
      expect(result.current.selectedDataEntryId).toBeNull();
    });
  });

  describe('selectDataType', () => {
    it('データタイプを選択できる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.selectDataType('character');
      });

      expect(result.current.selectedDataTypeId).toBe('character');
    });

    it('タイプ選択時にエントリ選択がクリアされる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.selectDataEntry('entry_001');
      });

      act(() => {
        result.current.selectDataType('character');
      });

      expect(result.current.selectedDataEntryId).toBeNull();
    });
  });

  describe('フィールド操作', () => {
    it('addFieldToDataType: フィールドを追加できる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addDataType(createDataType('character', 'キャラクター'));
      });

      const field = new NumberFieldType();
      field.id = 'hp';
      field.name = 'HP';

      act(() => {
        result.current.addFieldToDataType('character', field);
      });

      expect(result.current.dataTypes[0]?.fields).toHaveLength(1);
      expect(result.current.dataTypes[0]?.fields[0]?.id).toBe('hp');
    });

    it('replaceDataTypeField: フィールドを置換できる', () => {
      const { result } = renderHook(() => useStore());

      const oldField = new NumberFieldType();
      oldField.id = 'hp';
      oldField.name = 'HP';

      act(() => {
        const dt = createDataType('character', 'キャラクター');
        dt.fields = [oldField];
        result.current.addDataType(dt);
      });

      const newField = new StringFieldType();
      newField.id = 'hp';
      newField.name = 'HP文字列';

      act(() => {
        result.current.replaceDataTypeField('character', 'hp', newField);
      });

      expect(result.current.dataTypes[0]?.fields[0]?.type).toBe('string');
    });

    it('deleteDataTypeField: フィールドを削除できる', () => {
      const { result } = renderHook(() => useStore());

      const field = new NumberFieldType();
      field.id = 'hp';
      field.name = 'HP';

      act(() => {
        const dt = createDataType('character', 'キャラクター');
        dt.fields = [field];
        result.current.addDataType(dt);
      });

      act(() => {
        result.current.deleteDataTypeField('character', 'hp');
      });

      expect(result.current.dataTypes[0]?.fields).toHaveLength(0);
    });

    it('reorderDataTypeFields: フィールドの順序を変更できる', () => {
      const { result } = renderHook(() => useStore());

      const f1 = new NumberFieldType();
      f1.id = 'hp';
      f1.name = 'HP';
      const f2 = new NumberFieldType();
      f2.id = 'mp';
      f2.name = 'MP';

      act(() => {
        const dt = createDataType('character', 'キャラクター');
        dt.fields = [f1, f2];
        result.current.addDataType(dt);
      });

      act(() => {
        result.current.reorderDataTypeFields('character', 0, 1);
      });

      expect(result.current.dataTypes[0]?.fields[0]?.id).toBe('mp');
      expect(result.current.dataTypes[0]?.fields[1]?.id).toBe('hp');
    });
  });

  describe('DataEntry CRUD', () => {
    it('addDataEntry: エントリを追加できる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addDataType(createDataType('character', 'キャラクター'));
      });

      act(() => {
        result.current.addDataEntry({
          id: 'alice',
          typeId: 'character',
          values: { name: 'アリス' },
        });
      });

      expect(result.current.dataEntries['character']).toHaveLength(1);
      expect(result.current.dataEntries['character']?.[0]?.id).toBe('alice');
    });

    it('updateDataEntry: エントリの値を更新できる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addDataType(createDataType('character', 'キャラクター'));
        result.current.addDataEntry({
          id: 'alice',
          typeId: 'character',
          values: { name: 'アリス', hp: 100 },
        });
      });

      act(() => {
        result.current.updateDataEntry('character', 'alice', { name: 'アリス', hp: 200 });
      });

      expect(result.current.dataEntries['character']?.[0]?.values['hp']).toBe(200);
    });

    it('deleteDataEntry: エントリを削除できる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addDataType(createDataType('character', 'キャラクター'));
        result.current.addDataEntry({
          id: 'alice',
          typeId: 'character',
          values: {},
        });
      });

      act(() => {
        result.current.deleteDataEntry('character', 'alice');
      });

      expect(result.current.dataEntries['character']).toHaveLength(0);
    });

    it('deleteDataEntry: 選択中のエントリを削除すると選択がクリアされる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addDataType(createDataType('character', 'キャラクター'));
        result.current.addDataEntry({ id: 'alice', typeId: 'character', values: {} });
        result.current.selectDataEntry('alice');
      });

      act(() => {
        result.current.deleteDataEntry('character', 'alice');
      });

      expect(result.current.selectedDataEntryId).toBeNull();
    });
  });

  describe('getDataEntriesByType', () => {
    it('タイプに属するエントリを返す', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addDataType(createDataType('character', 'キャラクター'));
        result.current.addDataEntry({ id: 'alice', typeId: 'character', values: {} });
        result.current.addDataEntry({ id: 'bob', typeId: 'character', values: {} });
      });

      const entries = result.current.getDataEntriesByType('character');
      expect(entries).toHaveLength(2);
    });

    it('存在しないタイプは空配列を返す', () => {
      const { result } = renderHook(() => useStore());

      const entries = result.current.getDataEntriesByType('nonexistent');
      expect(entries).toEqual([]);
    });
  });
});
