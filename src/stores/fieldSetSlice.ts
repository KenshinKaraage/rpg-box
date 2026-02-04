/**
 * フィールドセットスライス
 */
import type { FieldSet } from '@/types/fieldSet';

export interface FieldSetSlice {
  /** フィールドセット一覧 */
  fieldSets: FieldSet[];

  /** 選択中のフィールドセットID */
  selectedFieldSetId: string | null;

  /** フィールドセットを追加 */
  addFieldSet: (fieldSet: FieldSet) => void;

  /** フィールドセットを更新 */
  updateFieldSet: (id: string, updates: Partial<FieldSet>) => void;

  /** フィールドセットを削除 */
  deleteFieldSet: (id: string) => void;

  /** フィールドセットを選択 */
  selectFieldSet: (id: string | null) => void;
}

export const createFieldSetSlice = <T extends FieldSetSlice>(
  set: (fn: (state: T) => void) => void
): FieldSetSlice => ({
  fieldSets: [],
  selectedFieldSetId: null,

  addFieldSet: (fieldSet: FieldSet) =>
    set((state) => {
      state.fieldSets.push(fieldSet);
    }),

  updateFieldSet: (id: string, updates: Partial<FieldSet>) =>
    set((state) => {
      const index = state.fieldSets.findIndex((fs) => fs.id === id);
      if (index !== -1) {
        state.fieldSets[index] = { ...state.fieldSets[index], ...updates } as FieldSet;
      }
    }),

  deleteFieldSet: (id: string) =>
    set((state) => {
      state.fieldSets = state.fieldSets.filter((fs) => fs.id !== id);
      if (state.selectedFieldSetId === id) {
        state.selectedFieldSetId = null;
      }
    }),

  selectFieldSet: (id: string | null) =>
    set((state) => {
      state.selectedFieldSetId = id;
    }),
});
