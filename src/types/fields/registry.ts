import { FieldType } from './FieldType';

// 異なる型パラメータを持つサブクラスを格納するため any を使用
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FieldTypeConstructor = new () => FieldType<any>;

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
 *   const field = new NumberField();
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

/**
 * タイプ名からフィールドタイプインスタンスを生成
 *
 * @param type フィールドタイプの識別子
 * @returns 新しいインスタンス、存在しない場合はundefined
 *
 * @example
 * ```typescript
 * const field = createFieldTypeInstance('number');
 * if (field) {
 *   field.id = 'hp';
 *   field.name = 'HP';
 * }
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createFieldTypeInstance(type: string): FieldType<any> | undefined {
  const FieldClass = fieldTypeRegistry.get(type);
  if (!FieldClass) return undefined;
  return new FieldClass();
}

/**
 * ドロップダウン用のフィールドタイプオプション一覧を取得
 *
 * @param allowedTypes 許可するタイプ名の配列（省略時は全タイプ）
 * @returns { type, label } の配列
 *
 * @example
 * ```typescript
 * // 全タイプ取得
 * const allOptions = getFieldTypeOptions();
 *
 * // 特定タイプのみ取得
 * const basicOptions = getFieldTypeOptions(['number', 'string', 'boolean']);
 * ```
 */
export function getFieldTypeOptions(
  allowedTypes?: string[]
): Array<{ type: string; label: string }> {
  const entries = Array.from(fieldTypeRegistry.entries());
  return entries
    .filter(([type]) => !allowedTypes || allowedTypes.includes(type))
    .map(([type, FieldClass]) => {
      const instance = new FieldClass();
      return { type, label: instance.label };
    });
}
