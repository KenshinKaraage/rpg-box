// フィールドタイプ基底クラス
import { FieldType } from './FieldType';
export { FieldType };
export type {
  ValidationResult,
  DisplayCondition,
  FieldEditorProps,
  FieldConfigProps,
  FieldConfigContext,
  FilterCondition,
} from './FieldType';

// レジストリ関数（registry.tsから）
export {
  registerFieldType,
  getFieldType,
  getAllFieldTypes,
  getFieldTypeNames,
  clearFieldTypeRegistry,
  createFieldTypeInstance,
  getFieldTypeOptions,
  hydrateFieldType,
  hydrateFields,
} from './registry';

// 組み込みフィールドタイプ
import { NumberFieldType } from './NumberFieldType';
import { StringFieldType } from './StringFieldType';
import { TextareaFieldType } from './TextareaFieldType';
import { BooleanFieldType } from './BooleanFieldType';
import { SelectFieldType } from './SelectFieldType';
import { ColorFieldType } from './ColorFieldType';
import { ClassFieldType } from './ClassFieldType';
import { ImageFieldType } from './ImageFieldType';
import { AudioFieldType } from './AudioFieldType';
import { DataSelectFieldType } from './DataSelectFieldType';
import { DataListFieldType } from './DataListFieldType';
import { ClassListFieldType } from './ClassListFieldType';
import { DataTableFieldType } from './DataTableFieldType';

export {
  NumberFieldType,
  StringFieldType,
  TextareaFieldType,
  BooleanFieldType,
  SelectFieldType,
  ColorFieldType,
  ClassFieldType,
  ImageFieldType,
  AudioFieldType,
  DataSelectFieldType,
  DataListFieldType,
  ClassListFieldType,
  DataTableFieldType,
};
export type { SelectOption } from './SelectFieldType';
export type { ClassValue } from './ClassFieldType';
export type { DataTableRow, DataTableColumn } from './DataTableFieldType';

// 組み込みフィールドタイプの登録
import { registerFieldType } from './registry';

registerFieldType('number', NumberFieldType);
registerFieldType('string', StringFieldType);
registerFieldType('textarea', TextareaFieldType);
registerFieldType('boolean', BooleanFieldType);
registerFieldType('select', SelectFieldType);
registerFieldType('color', ColorFieldType);
registerFieldType('class', ClassFieldType);
registerFieldType('image', ImageFieldType);
registerFieldType('audio', AudioFieldType);
registerFieldType('dataSelect', DataSelectFieldType);
registerFieldType('dataList', DataListFieldType);
registerFieldType('classList', ClassListFieldType);
registerFieldType('dataTable', DataTableFieldType);
