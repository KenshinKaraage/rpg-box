/**
 * 参照整合性チェックユーティリティ
 *
 * DataType / DataEntry 削除前に、他のデータから参照されているか検出する。
 */
import type { DataType, DataEntry } from '@/types/data';

/** referenceTypeId を持つフィールドタイプ名 */
const REFERENCE_FIELD_TYPES = new Set(['dataSelect', 'dataList', 'dataTable']);

export interface ReferenceInfo {
  dataTypeId: string;
  dataTypeName: string;
  fieldId: string;
  fieldName: string;
  entryId?: string;
  description: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface ReferenceField {
  referenceTypeId: string;
  type: string;
  id: string;
  name: string;
}

/**
 * DataType を参照しているフィールドを検出
 *
 * 全DataTypeのフィールドで referenceTypeId === typeId のものを返す。
 * 自分自身は除外する。
 */
export function findDataTypeReferences(dataTypes: DataType[], typeId: string): ReferenceInfo[] {
  const refs: ReferenceInfo[] = [];

  for (const dt of dataTypes) {
    if (dt.id === typeId) continue;
    for (const field of dt.fields) {
      if (!REFERENCE_FIELD_TYPES.has(field.type)) continue;
      const ref = field as unknown as ReferenceField;
      if (ref.referenceTypeId === typeId) {
        refs.push({
          dataTypeId: dt.id,
          dataTypeName: dt.name,
          fieldId: field.id,
          fieldName: field.name,
          description: `「${dt.name}」の「${field.name}」フィールドが参照しています`,
        });
      }
    }
  }

  return refs;
}

/**
 * DataEntry を参照しているエントリを検出
 *
 * 全DataTypeのフィールドで referenceTypeId === typeId のものについて、
 * 全エントリの値に entryId が含まれるかチェック。
 */
export function findDataEntryReferences(
  dataTypes: DataType[],
  dataEntries: Record<string, DataEntry[]>,
  typeId: string,
  entryId: string
): ReferenceInfo[] {
  const refs: ReferenceInfo[] = [];

  for (const dt of dataTypes) {
    const entries = dataEntries[dt.id];
    if (!entries) continue;

    for (const field of dt.fields) {
      if (!REFERENCE_FIELD_TYPES.has(field.type)) continue;
      const ref = field as unknown as ReferenceField;
      if (ref.referenceTypeId !== typeId) continue;

      for (const entry of entries) {
        const value = entry.values[field.id];
        let found = false;

        if (field.type === 'dataSelect') {
          found = value === entryId;
        } else if (field.type === 'dataList') {
          found = Array.isArray(value) && value.includes(entryId);
        } else if (field.type === 'dataTable') {
          found =
            Array.isArray(value) &&
            value.some(
              (row) => row && typeof row === 'object' && 'id' in row && row.id === entryId
            );
        }

        if (found) {
          refs.push({
            dataTypeId: dt.id,
            dataTypeName: dt.name,
            fieldId: field.id,
            fieldName: field.name,
            entryId: entry.id,
            description: `「${dt.name}」のエントリ「${entry.id}」の「${field.name}」が参照しています`,
          });
        }
      }
    }
  }

  return refs;
}
