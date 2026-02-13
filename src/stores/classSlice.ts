/**
 * クラススライス
 */
import type { CustomClass } from '@/types/customClass';
import type { FieldType } from '@/types/fields/FieldType';

export interface ClassSlice {
  /** クラス一覧 */
  classes: CustomClass[];

  /** 選択中のクラスID */
  selectedClassId: string | null;

  /** クラスを追加 */
  addClass: (customClass: CustomClass) => void;

  /** クラスを更新 */
  updateClass: (id: string, updates: Partial<CustomClass>) => void;

  /** クラスを削除 */
  deleteClass: (id: string) => void;

  /** クラスを選択 */
  selectClass: (id: string | null) => void;

  /** クラスにフィールドを追加 */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addFieldToClass: (classId: string, field: FieldType<any>) => void;

  /** クラスのフィールドを置き換え */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  replaceClassField: (classId: string, fieldId: string, newField: FieldType<any>) => void;

  /** クラスからフィールドを削除 */
  deleteClassField: (classId: string, fieldId: string) => void;

  /** クラスのフィールド順序を変更 */
  reorderClassFields: (classId: string, fromIndex: number, toIndex: number) => void;
}

export const createClassSlice = <T extends ClassSlice>(
  set: (fn: (state: T) => void) => void
): ClassSlice => ({
  classes: [],
  selectedClassId: null,

  addClass: (customClass: CustomClass) =>
    set((state) => {
      state.classes.push(customClass);
    }),

  updateClass: (id: string, updates: Partial<CustomClass>) =>
    set((state) => {
      const index = state.classes.findIndex((c) => c.id === id);
      if (index !== -1) {
        state.classes[index] = { ...state.classes[index], ...updates } as CustomClass;
        if (updates.id && updates.id !== id && state.selectedClassId === id) {
          state.selectedClassId = updates.id;
        }
      }
    }),

  deleteClass: (id: string) =>
    set((state) => {
      state.classes = state.classes.filter((c) => c.id !== id);
      if (state.selectedClassId === id) {
        state.selectedClassId = null;
      }
    }),

  selectClass: (id: string | null) =>
    set((state) => {
      state.selectedClassId = id;
    }),

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addFieldToClass: (classId: string, field: FieldType<any>) =>
    set((state) => {
      const classItem = state.classes.find((c) => c.id === classId);
      if (classItem) {
        classItem.fields.push(field);
      }
    }),

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  replaceClassField: (classId: string, fieldId: string, newField: FieldType<any>) =>
    set((state) => {
      const classItem = state.classes.find((c) => c.id === classId);
      if (classItem) {
        const fieldIndex = classItem.fields.findIndex((f) => f.id === fieldId);
        if (fieldIndex !== -1) {
          classItem.fields[fieldIndex] = newField;
        }
      }
    }),

  deleteClassField: (classId: string, fieldId: string) =>
    set((state) => {
      const classItem = state.classes.find((c) => c.id === classId);
      if (classItem) {
        classItem.fields = classItem.fields.filter((f) => f.id !== fieldId);
      }
    }),

  reorderClassFields: (classId: string, fromIndex: number, toIndex: number) =>
    set((state) => {
      const classItem = state.classes.find((c) => c.id === classId);
      if (
        classItem &&
        fromIndex >= 0 &&
        toIndex >= 0 &&
        fromIndex < classItem.fields.length &&
        toIndex < classItem.fields.length
      ) {
        const [removed] = classItem.fields.splice(fromIndex, 1);
        if (removed) {
          classItem.fields.splice(toIndex, 0, removed);
        }
      }
    }),
});
