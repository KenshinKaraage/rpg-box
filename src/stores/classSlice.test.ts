/**
 * classSlice のテスト
 */
import { act, renderHook } from '@testing-library/react';
import { useStore } from './index';
import type { CustomClass } from '@/types/customClass';
import { NumberFieldType } from '@/types/fields';

describe('classSlice', () => {
  beforeEach(() => {
    // ストアをリセット
    act(() => {
      const state = useStore.getState();
      state.classes.forEach((c) => state.deleteClass(c.id));
      state.selectClass(null);
    });
  });

  describe('初期状態', () => {
    it('classes は空配列', () => {
      const { result } = renderHook(() => useStore((state) => state.classes));
      expect(result.current).toEqual([]);
    });

    it('selectedClassId は null', () => {
      const { result } = renderHook(() => useStore((state) => state.selectedClassId));
      expect(result.current).toBeNull();
    });
  });

  describe('addClass', () => {
    it('クラスを追加できる', () => {
      const { result } = renderHook(() => useStore());

      const newClass: CustomClass = {
        id: 'class_001',
        name: 'キャラクター',
        fields: [],
      };

      act(() => {
        result.current.addClass(newClass);
      });

      expect(result.current.classes).toHaveLength(1);
      expect(result.current.classes[0]).toEqual(newClass);
    });
  });

  describe('updateClass', () => {
    it('クラス名を更新できる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addClass({
          id: 'class_001',
          name: '元の名前',
          fields: [],
        });
      });

      act(() => {
        result.current.updateClass('class_001', { name: '新しい名前' });
      });

      expect(result.current.classes[0]?.name).toBe('新しい名前');
    });
  });

  describe('deleteClass', () => {
    it('クラスを削除できる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addClass({
          id: 'class_001',
          name: 'クラス',
          fields: [],
        });
      });

      act(() => {
        result.current.deleteClass('class_001');
      });

      expect(result.current.classes).toHaveLength(0);
    });

    it('選択中のクラスを削除すると selectedClassId が null になる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addClass({
          id: 'class_001',
          name: 'クラス',
          fields: [],
        });
        result.current.selectClass('class_001');
      });

      expect(result.current.selectedClassId).toBe('class_001');

      act(() => {
        result.current.deleteClass('class_001');
      });

      expect(result.current.selectedClassId).toBeNull();
    });
  });

  describe('selectClass', () => {
    it('クラスを選択できる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addClass({
          id: 'class_001',
          name: 'クラス',
          fields: [],
        });
      });

      act(() => {
        result.current.selectClass('class_001');
      });

      expect(result.current.selectedClassId).toBe('class_001');
    });
  });

  describe('addFieldToClass', () => {
    it('クラスにフィールドを追加できる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addClass({
          id: 'class_001',
          name: 'クラス',
          fields: [],
        });
      });

      const newField = new NumberFieldType();
      newField.id = 'field_001';
      newField.name = 'HP';

      act(() => {
        result.current.addFieldToClass('class_001', newField);
      });

      expect(result.current.classes[0]?.fields).toHaveLength(1);
      expect(result.current.classes[0]?.fields[0]?.id).toBe('field_001');
      expect(result.current.classes[0]?.fields[0]?.name).toBe('HP');
      expect(result.current.classes[0]?.fields[0]?.type).toBe('number');
    });
  });

  describe('replaceClassField', () => {
    it('フィールドを置換できる', () => {
      const { result } = renderHook(() => useStore());

      const oldField = new NumberFieldType();
      oldField.id = 'field_001';
      oldField.name = 'HP';

      act(() => {
        result.current.addClass({
          id: 'class_001',
          name: 'クラス',
          fields: [oldField],
        });
      });

      const newField = new NumberFieldType();
      newField.id = 'field_001';
      newField.name = 'MaxHP';

      act(() => {
        result.current.replaceClassField('class_001', 'field_001', newField);
      });

      expect(result.current.classes[0]?.fields[0]?.name).toBe('MaxHP');
    });
  });

  describe('deleteClassField', () => {
    it('フィールドを削除できる', () => {
      const { result } = renderHook(() => useStore());

      const field = new NumberFieldType();
      field.id = 'field_001';
      field.name = 'HP';

      act(() => {
        result.current.addClass({
          id: 'class_001',
          name: 'クラス',
          fields: [field],
        });
      });

      act(() => {
        result.current.deleteClassField('class_001', 'field_001');
      });

      expect(result.current.classes[0]?.fields).toHaveLength(0);
    });
  });

  describe('reorderClassFields', () => {
    it('フィールドの順序を変更できる', () => {
      const { result } = renderHook(() => useStore());

      const field1 = new NumberFieldType();
      field1.id = 'field_001';
      field1.name = 'HP';

      const field2 = new NumberFieldType();
      field2.id = 'field_002';
      field2.name = 'MP';

      const field3 = new NumberFieldType();
      field3.id = 'field_003';
      field3.name = 'ATK';

      act(() => {
        result.current.addClass({
          id: 'class_001',
          name: 'クラス',
          fields: [field1, field2, field3],
        });
      });

      // HP(0) -> ATK(2)の後に移動
      act(() => {
        result.current.reorderClassFields('class_001', 0, 2);
      });

      expect(result.current.classes[0]?.fields[0]?.name).toBe('MP');
      expect(result.current.classes[0]?.fields[1]?.name).toBe('ATK');
      expect(result.current.classes[0]?.fields[2]?.name).toBe('HP');
    });
  });
});
