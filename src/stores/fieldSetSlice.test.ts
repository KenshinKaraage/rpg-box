/**
 * フィールドセットスライスのテスト
 */
import { act, renderHook } from '@testing-library/react';
import { useStore } from './index';
import type { FieldSet } from '@/types/fieldSet';

describe('fieldSetSlice', () => {
  beforeEach(() => {
    // ストアをリセット
    act(() => {
      const state = useStore.getState();
      state.fieldSets.forEach((fs) => state.deleteFieldSet(fs.id));
    });
  });

  describe('addFieldSet', () => {
    it('フィールドセットを追加できる', () => {
      const fieldSet: FieldSet = {
        id: 'fs_status',
        name: 'ステータス',
        fields: [],
      };

      act(() => {
        useStore.getState().addFieldSet(fieldSet);
      });

      const { result } = renderHook(() => useStore((state) => state.fieldSets));

      expect(result.current).toHaveLength(1);
      expect(result.current[0]).toEqual(fieldSet);
    });
  });

  describe('updateFieldSet', () => {
    it('フィールドセットを更新できる', () => {
      const fieldSet: FieldSet = {
        id: 'fs_status',
        name: 'ステータス',
        fields: [],
      };

      act(() => {
        useStore.getState().addFieldSet(fieldSet);
        useStore.getState().updateFieldSet('fs_status', { name: '基本ステータス' });
      });

      const { result } = renderHook(() => useStore((state) => state.fieldSets));

      expect(result.current[0]?.name).toBe('基本ステータス');
    });

    it('存在しないIDの場合は何もしない', () => {
      act(() => {
        useStore.getState().updateFieldSet('non_existent', { name: 'テスト' });
      });

      const { result } = renderHook(() => useStore((state) => state.fieldSets));

      expect(result.current).toHaveLength(0);
    });
  });

  describe('deleteFieldSet', () => {
    it('フィールドセットを削除できる', () => {
      const fieldSet: FieldSet = {
        id: 'fs_status',
        name: 'ステータス',
        fields: [],
      };

      act(() => {
        useStore.getState().addFieldSet(fieldSet);
        useStore.getState().deleteFieldSet('fs_status');
      });

      const { result } = renderHook(() => useStore((state) => state.fieldSets));

      expect(result.current).toHaveLength(0);
    });

    it('選択中のフィールドセットを削除すると選択が解除される', () => {
      const fieldSet: FieldSet = {
        id: 'fs_status',
        name: 'ステータス',
        fields: [],
      };

      act(() => {
        useStore.getState().addFieldSet(fieldSet);
        useStore.getState().selectFieldSet('fs_status');
        useStore.getState().deleteFieldSet('fs_status');
      });

      const { result } = renderHook(() => useStore((state) => state.selectedFieldSetId));

      expect(result.current).toBeNull();
    });
  });

  describe('selectFieldSet', () => {
    it('フィールドセットを選択できる', () => {
      const fieldSet: FieldSet = {
        id: 'fs_status',
        name: 'ステータス',
        fields: [],
      };

      act(() => {
        useStore.getState().addFieldSet(fieldSet);
        useStore.getState().selectFieldSet('fs_status');
      });

      const { result } = renderHook(() => useStore((state) => state.selectedFieldSetId));

      expect(result.current).toBe('fs_status');
    });

    it('nullを渡すと選択解除できる', () => {
      act(() => {
        useStore.getState().selectFieldSet('fs_status');
        useStore.getState().selectFieldSet(null);
      });

      const { result } = renderHook(() => useStore((state) => state.selectedFieldSetId));

      expect(result.current).toBeNull();
    });
  });
});
