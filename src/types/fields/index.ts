export { FieldType } from './FieldType';
export type { ValidationResult, DisplayCondition, FieldEditorProps } from './FieldType';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FieldTypeConstructor = new (...args: any[]) => FieldType;

/**
 * フィールドタイプのレジストリ
 * カスタムフィールドタイプを登録・取得するためのマップ
 */
const fieldTypeRegistry = new Map<string, FieldTypeConstructor>();

/**
 * フィールドタイプをレジストリに登録
 *
 * @param type フィールドタイプの識別子
 * @param fieldTypeClass フィールドタイプのコンストラクタ
 *
 * @example
 * ```typescript
 * registerFieldType('number', NumberFieldType);
 * registerFieldType('string', StringFieldType);
 * ```
 */
export function registerFieldType(type: string, fieldTypeClass: FieldTypeConstructor): void {
  if (fieldTypeRegistry.has(type)) {
    console.warn(`FieldType "${type}" is already registered. Overwriting.`);
  }
  fieldTypeRegistry.set(type, fieldTypeClass);
}

/**
 * レジストリからフィールドタイプを取得
 *
 * @param type フィールドタイプの識別子
 * @returns フィールドタイプのコンストラクタ、存在しない場合はundefined
 *
 * @example
 * ```typescript
 * const NumberField = getFieldType('number');
 * if (NumberField) {
 *   const field = new NumberField('age', '年齢');
 * }
 * ```
 */
export function getFieldType(type: string): FieldTypeConstructor | undefined {
  return fieldTypeRegistry.get(type);
}

/**
 * 登録されている全てのフィールドタイプを取得
 *
 * @returns フィールドタイプの識別子とコンストラクタのペア配列
 *
 * @example
 * ```typescript
 * const allTypes = getAllFieldTypes();
 * // [['number', NumberFieldType], ['string', StringFieldType], ...]
 * ```
 */
export function getAllFieldTypes(): [string, FieldTypeConstructor][] {
  return Array.from(fieldTypeRegistry.entries());
}

/**
 * 登録されているフィールドタイプの識別子一覧を取得
 *
 * @returns フィールドタイプの識別子配列
 */
export function getFieldTypeNames(): string[] {
  return Array.from(fieldTypeRegistry.keys());
}

/**
 * レジストリをクリア（テスト用）
 */
export function clearFieldTypeRegistry(): void {
  fieldTypeRegistry.clear();
}
