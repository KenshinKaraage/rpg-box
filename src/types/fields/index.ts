// フィールドタイプ基底クラス
import { FieldType } from './FieldType';
export { FieldType };
export type { ValidationResult, DisplayCondition, FieldEditorProps } from './FieldType';

// レジストリ関数（registry.tsから）
export {
  registerFieldType,
  getFieldType,
  getAllFieldTypes,
  getFieldTypeNames,
  clearFieldTypeRegistry,
  createFieldTypeInstance,
  getFieldTypeOptions,
} from './registry';

// 組み込みフィールドタイプ
import { NumberFieldType } from './NumberFieldType';
import { StringFieldType } from './StringFieldType';
import { TextareaFieldType } from './TextareaFieldType';
import { BooleanFieldType } from './BooleanFieldType';
import { SelectFieldType } from './SelectFieldType';
import { ColorFieldType } from './ColorFieldType';
import { FieldSetFieldType } from './FieldSetFieldType';

export {
  NumberFieldType,
  StringFieldType,
  TextareaFieldType,
  BooleanFieldType,
  SelectFieldType,
  ColorFieldType,
  FieldSetFieldType,
};
export type { SelectOption } from './SelectFieldType';
export type { FieldSetValue } from './FieldSetFieldType';

// 組み込みフィールドタイプの登録
import { registerFieldType } from './registry';

registerFieldType('number', NumberFieldType);
registerFieldType('string', StringFieldType);
registerFieldType('textarea', TextareaFieldType);
registerFieldType('boolean', BooleanFieldType);
registerFieldType('select', SelectFieldType);
registerFieldType('color', ColorFieldType);
registerFieldType('fieldSet', FieldSetFieldType);
