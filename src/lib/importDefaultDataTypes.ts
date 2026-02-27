/**
 * デフォルトデータタイプ＆サポートクラスのインポート
 */
import { defaultDataTypes } from './defaultDataTypes';
import { defaultClasses } from './defaultClasses';
import type { DataType } from '@/types/data';
import type { CustomClass } from '@/types/customClass';

export interface ImportResult {
  importedTypes: number;
  skippedTypes: number;
  importedClasses: number;
  skippedClasses: number;
}

export function importDefaultDataTypes(
  existingDataTypes: DataType[],
  existingClasses: CustomClass[],
  addDataType: (dataType: DataType) => void,
  addClass: (customClass: CustomClass) => void
): ImportResult {
  let importedClasses = 0;
  let skippedClasses = 0;
  let importedTypes = 0;
  let skippedTypes = 0;

  const existingClassIds = new Set(existingClasses.map((c) => c.id));
  const existingTypeIds = new Set(existingDataTypes.map((t) => t.id));

  // サポートクラスを先にインポート（データタイプが参照するため）
  for (const cls of defaultClasses) {
    if (existingClassIds.has(cls.id)) {
      skippedClasses++;
      continue;
    }
    addClass(cls);
    importedClasses++;
  }

  // データタイプをインポート
  for (const dt of defaultDataTypes) {
    if (existingTypeIds.has(dt.id)) {
      skippedTypes++;
      continue;
    }
    addDataType(dt);
    importedTypes++;
  }

  return { importedTypes, skippedTypes, importedClasses, skippedClasses };
}
