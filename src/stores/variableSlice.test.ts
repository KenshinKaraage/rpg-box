/**
 * variableSlice のテスト
 */
import { act, renderHook } from '@testing-library/react';
import { useStore } from './index';
import type { Variable } from '@/types/variable';

describe('variableSlice', () => {
  beforeEach(() => {
    // ストアをリセット
    act(() => {
      const state = useStore.getState();
      // 変数をクリア
      state.variables.forEach((v) => state.deleteVariable(v.id));
    });
  });

  describe('初期状態', () => {
    it('variables は空配列', () => {
      const { result } = renderHook(() => useStore((state) => state.variables));
      expect(result.current).toEqual([]);
    });

    it('selectedVariableId は null', () => {
      const { result } = renderHook(() => useStore((state) => state.selectedVariableId));
      expect(result.current).toBeNull();
    });
  });

  describe('addVariable', () => {
    it('変数を追加できる', () => {
      const { result } = renderHook(() => useStore());

      const newVariable: Variable = {
        id: 'var_001',
        name: 'テスト変数',
        type: 'number',
        isArray: false,
        initialValue: 0,
      };

      act(() => {
        result.current.addVariable(newVariable);
      });

      expect(result.current.variables).toHaveLength(1);
      expect(result.current.variables[0]).toEqual(newVariable);
    });

    it('複数の変数を追加できる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addVariable({
          id: 'var_001',
          name: '変数1',
          type: 'number',
          isArray: false,
          initialValue: 0,
        });
        result.current.addVariable({
          id: 'var_002',
          name: '変数2',
          type: 'string',
          isArray: false,
          initialValue: '',
        });
      });

      expect(result.current.variables).toHaveLength(2);
    });
  });

  describe('updateVariable', () => {
    it('変数を更新できる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addVariable({
          id: 'var_001',
          name: '元の名前',
          type: 'number',
          isArray: false,
          initialValue: 0,
        });
      });

      act(() => {
        result.current.updateVariable('var_001', { name: '新しい名前' });
      });

      expect(result.current.variables[0]?.name).toBe('新しい名前');
    });

    it('存在しないIDの場合は何も起きない', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addVariable({
          id: 'var_001',
          name: '変数',
          type: 'number',
          isArray: false,
          initialValue: 0,
        });
      });

      act(() => {
        result.current.updateVariable('non_existent', { name: '新しい名前' });
      });

      expect(result.current.variables[0]?.name).toBe('変数');
    });

    it('型と初期値を同時に更新できる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addVariable({
          id: 'var_001',
          name: '変数',
          type: 'number',
          isArray: false,
          initialValue: 0,
        });
      });

      act(() => {
        result.current.updateVariable('var_001', {
          type: 'string',
          initialValue: 'hello',
        });
      });

      expect(result.current.variables[0]?.type).toBe('string');
      expect(result.current.variables[0]?.initialValue).toBe('hello');
    });
  });

  describe('deleteVariable', () => {
    it('変数を削除できる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addVariable({
          id: 'var_001',
          name: '変数',
          type: 'number',
          isArray: false,
          initialValue: 0,
        });
      });

      act(() => {
        result.current.deleteVariable('var_001');
      });

      expect(result.current.variables).toHaveLength(0);
    });

    it('選択中の変数を削除すると selectedVariableId が null になる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addVariable({
          id: 'var_001',
          name: '変数',
          type: 'number',
          isArray: false,
          initialValue: 0,
        });
        result.current.selectVariable('var_001');
      });

      expect(result.current.selectedVariableId).toBe('var_001');

      act(() => {
        result.current.deleteVariable('var_001');
      });

      expect(result.current.selectedVariableId).toBeNull();
    });
  });

  describe('selectVariable', () => {
    it('変数を選択できる', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addVariable({
          id: 'var_001',
          name: '変数',
          type: 'number',
          isArray: false,
          initialValue: 0,
        });
      });

      act(() => {
        result.current.selectVariable('var_001');
      });

      expect(result.current.selectedVariableId).toBe('var_001');
    });

    it('null を渡すと選択解除', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addVariable({
          id: 'var_001',
          name: '変数',
          type: 'number',
          isArray: false,
          initialValue: 0,
        });
        result.current.selectVariable('var_001');
      });

      act(() => {
        result.current.selectVariable(null);
      });

      expect(result.current.selectedVariableId).toBeNull();
    });
  });

  describe('getVariableById', () => {
    it('IDで変数を取得できる', () => {
      const { result } = renderHook(() => useStore());

      const variable: Variable = {
        id: 'var_001',
        name: '変数',
        type: 'number',
        isArray: false,
        initialValue: 0,
      };

      act(() => {
        result.current.addVariable(variable);
      });

      const found = result.current.getVariableById('var_001');
      expect(found).toEqual(variable);
    });

    it('存在しない場合は undefined を返す', () => {
      const { result } = renderHook(() => useStore());

      const found = result.current.getVariableById('non_existent');
      expect(found).toBeUndefined();
    });
  });
});
