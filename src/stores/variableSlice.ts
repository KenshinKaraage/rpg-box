/**
 * 変数スライス
 */
import type { Variable } from '@/types/variable';

export interface VariableSlice {
  /** 変数一覧 */
  variables: Variable[];

  /** 選択中の変数ID */
  selectedVariableId: string | null;

  /** 変数を追加 */
  addVariable: (variable: Variable) => void;

  /** 変数を更新 */
  updateVariable: (id: string, updates: Partial<Variable>) => void;

  /** 変数を削除 */
  deleteVariable: (id: string) => void;

  /** 変数を選択 */
  selectVariable: (id: string | null) => void;

  /** IDで変数を取得 */
  getVariableById: (id: string) => Variable | undefined;
}

export const createVariableSlice = <T extends VariableSlice>(
  set: (fn: (state: T) => void) => void,
  get: () => T
): VariableSlice => ({
  variables: [],
  selectedVariableId: null,

  addVariable: (variable: Variable) =>
    set((state) => {
      state.variables.push(variable);
    }),

  updateVariable: (id: string, updates: Partial<Variable>) =>
    set((state) => {
      const index = state.variables.findIndex((v) => v.id === id);
      if (index !== -1) {
        state.variables[index] = { ...state.variables[index], ...updates } as Variable;
        if (updates.id && updates.id !== id && state.selectedVariableId === id) {
          state.selectedVariableId = updates.id;
        }
      }
    }),

  deleteVariable: (id: string) =>
    set((state) => {
      state.variables = state.variables.filter((v) => v.id !== id);
      if (state.selectedVariableId === id) {
        state.selectedVariableId = null;
      }
    }),

  selectVariable: (id: string | null) =>
    set((state) => {
      state.selectedVariableId = id;
    }),

  getVariableById: (id: string) => {
    return get().variables.find((v) => v.id === id);
  },
});
