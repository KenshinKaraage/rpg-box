/**
 * データスライス
 *
 * データタイプ（スキーマ）とデータエントリ（レコード）の状態管理
 */
import type { DataType, DataEntry } from '@/types/data';
import type { FieldType } from '@/types/fields/FieldType';

export interface DataSlice {
  /** データタイプ一覧 */
  dataTypes: DataType[];

  /** データエントリ（typeId → エントリ配列） */
  dataEntries: Record<string, DataEntry[]>;

  /** 選択中のデータタイプID */
  selectedDataTypeId: string | null;

  /** 選択中のデータエントリID */
  selectedDataEntryId: string | null;

  // DataType CRUD
  addDataType: (dataType: DataType) => void;
  updateDataType: (id: string, updates: Partial<DataType>) => void;
  deleteDataType: (id: string) => void;
  selectDataType: (id: string | null) => void;

  // DataType フィールド操作
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addFieldToDataType: (typeId: string, field: FieldType<any>) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  replaceDataTypeField: (typeId: string, fieldId: string, newField: FieldType<any>) => void;
  deleteDataTypeField: (typeId: string, fieldId: string) => void;
  reorderDataTypeFields: (typeId: string, fromIndex: number, toIndex: number) => void;

  // DataEntry CRUD
  addDataEntry: (entry: DataEntry) => void;
  updateDataEntry: (typeId: string, entryId: string, values: Record<string, unknown>) => void;
  deleteDataEntry: (typeId: string, entryId: string) => void;
  selectDataEntry: (id: string | null) => void;

  // Getter
  getDataEntriesByType: (typeId: string) => DataEntry[];
}

export const createDataSlice = <T extends DataSlice>(
  set: (fn: (state: T) => void) => void,
  get: () => T
): DataSlice => ({
  dataTypes: [],
  dataEntries: {},
  selectedDataTypeId: null,
  selectedDataEntryId: null,

  // =========================================================================
  // DataType CRUD
  // =========================================================================

  addDataType: (dataType: DataType) =>
    set((state) => {
      state.dataTypes.push(dataType);
      state.dataEntries[dataType.id] = [];
    }),

  updateDataType: (id: string, updates: Partial<DataType>) =>
    set((state) => {
      const index = state.dataTypes.findIndex((t) => t.id === id);
      if (index !== -1) {
        state.dataTypes[index] = { ...state.dataTypes[index], ...updates } as DataType;
      }
    }),

  deleteDataType: (id: string) =>
    set((state) => {
      state.dataTypes = state.dataTypes.filter((t) => t.id !== id);
      delete state.dataEntries[id];
      if (state.selectedDataTypeId === id) {
        state.selectedDataTypeId = null;
        state.selectedDataEntryId = null;
      }
    }),

  selectDataType: (id: string | null) =>
    set((state) => {
      state.selectedDataTypeId = id;
      state.selectedDataEntryId = null;
    }),

  // =========================================================================
  // DataType フィールド操作
  // =========================================================================

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addFieldToDataType: (typeId: string, field: FieldType<any>) =>
    set((state) => {
      const dt = state.dataTypes.find((t) => t.id === typeId);
      if (dt) {
        dt.fields.push(field);
      }
    }),

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  replaceDataTypeField: (typeId: string, fieldId: string, newField: FieldType<any>) =>
    set((state) => {
      const dt = state.dataTypes.find((t) => t.id === typeId);
      if (dt) {
        const fieldIndex = dt.fields.findIndex((f) => f.id === fieldId);
        if (fieldIndex !== -1) {
          dt.fields[fieldIndex] = newField;
        }
      }
    }),

  deleteDataTypeField: (typeId: string, fieldId: string) =>
    set((state) => {
      const dt = state.dataTypes.find((t) => t.id === typeId);
      if (dt) {
        dt.fields = dt.fields.filter((f) => f.id !== fieldId);
      }
    }),

  reorderDataTypeFields: (typeId: string, fromIndex: number, toIndex: number) =>
    set((state) => {
      const dt = state.dataTypes.find((t) => t.id === typeId);
      if (
        dt &&
        fromIndex >= 0 &&
        toIndex >= 0 &&
        fromIndex < dt.fields.length &&
        toIndex < dt.fields.length
      ) {
        const [removed] = dt.fields.splice(fromIndex, 1);
        if (removed) {
          dt.fields.splice(toIndex, 0, removed);
        }
      }
    }),

  // =========================================================================
  // DataEntry CRUD
  // =========================================================================

  addDataEntry: (entry: DataEntry) =>
    set((state) => {
      const entries = state.dataEntries[entry.typeId];
      if (entries) {
        entries.push(entry);
      }
    }),

  updateDataEntry: (typeId: string, entryId: string, values: Record<string, unknown>) =>
    set((state) => {
      const entries = state.dataEntries[typeId];
      if (entries) {
        const entry = entries.find((e) => e.id === entryId);
        if (entry) {
          entry.values = values;
        }
      }
    }),

  deleteDataEntry: (typeId: string, entryId: string) =>
    set((state) => {
      const entries = state.dataEntries[typeId];
      if (entries) {
        state.dataEntries[typeId] = entries.filter((e) => e.id !== entryId);
      }
      if (state.selectedDataEntryId === entryId) {
        state.selectedDataEntryId = null;
      }
    }),

  selectDataEntry: (id: string | null) =>
    set((state) => {
      state.selectedDataEntryId = id;
    }),

  // =========================================================================
  // Getter
  // =========================================================================

  getDataEntriesByType: (typeId: string) => {
    return get().dataEntries[typeId] ?? [];
  },
});
