/**
 * 組み込みフィールドタイプをレジストリに登録
 *
 * アプリケーション起動時に一度だけ呼び出す
 */
import { registerFieldType } from './index';
import { NumberFieldType } from './NumberFieldType';

let initialized = false;

export function registerBuiltinFieldTypes(): void {
  if (initialized) return;

  registerFieldType('number', NumberFieldType);
  // 今後追加されるフィールドタイプもここに登録
  // registerFieldType('string', StringFieldType);
  // registerFieldType('boolean', BooleanFieldType);
  // etc.

  initialized = true;
}

/**
 * 登録状態をリセット（テスト用）
 */
export function resetBuiltinFieldTypesRegistration(): void {
  initialized = false;
}
