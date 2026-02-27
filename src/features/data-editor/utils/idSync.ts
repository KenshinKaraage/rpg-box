/**
 * ID変更同期ユーティリティ
 *
 * DataType ID や DataEntry ID が変更された際に、
 * 参照フィールド (dataSelect, dataList, dataTable) の値を追従させる。
 */
import type { DataType, DataEntry } from '@/types/data';

/** referenceTypeId を持つフィールドタイプ名 */
const REFERENCE_FIELD_TYPES = new Set(['dataSelect', 'dataList', 'dataTable']);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface ReferenceField {
  referenceTypeId: string;
  type: string;
  id: string;
}

/**
 * DataType ID変更時に、他DataTypeのフィールドの referenceTypeId を同期する
 *
 * Immer draft を直接 mutate する想定。
 */
export function syncDataTypeIdChange(dataTypes: DataType[], oldId: string, newId: string): void {
  for (const dt of dataTypes) {
    for (const field of dt.fields) {
      if (!REFERENCE_FIELD_TYPES.has(field.type)) continue;
      const ref = field as unknown as ReferenceField;
      if (ref.referenceTypeId === oldId) {
        ref.referenceTypeId = newId;
      }
    }
  }
}

/**
 * DataEntry ID変更時に、他エントリの参照フィールド値を同期する
 *
 * typeId: 変更されたエントリが属するDataType ID
 * oldId / newId: エントリの旧ID / 新ID
 *
 * 全DataTypeの全フィールドで referenceTypeId === typeId のものについて、
 * 全エントリの値を走査し、oldId → newId に置換する。
 *
 * Immer draft を直接 mutate する想定。
 */
export function syncDataEntryIdChange(
  dataTypes: DataType[],
  dataEntries: Record<string, DataEntry[]>,
  typeId: string,
  oldId: string,
  newId: string
): void {
  for (const dt of dataTypes) {
    const entries = dataEntries[dt.id];
    if (!entries) continue;

    for (const field of dt.fields) {
      if (!REFERENCE_FIELD_TYPES.has(field.type)) continue;
      const ref = field as unknown as ReferenceField;
      if (ref.referenceTypeId !== typeId) continue;

      for (const entry of entries) {
        const value = entry.values[field.id];

        if (field.type === 'dataSelect') {
          if (value === oldId) {
            entry.values[field.id] = newId;
          }
        } else if (field.type === 'dataList') {
          if (Array.isArray(value)) {
            for (let i = 0; i < value.length; i++) {
              if (value[i] === oldId) {
                value[i] = newId;
              }
            }
          }
        } else if (field.type === 'dataTable') {
          if (Array.isArray(value)) {
            for (const row of value) {
              if (row && typeof row === 'object' && 'id' in row && row.id === oldId) {
                (row as { id: string }).id = newId;
              }
            }
          }
        }
      }
    }
  }
}
