/**
 * 組み込みフィールドタイプをレジストリに登録
 *
 * アプリケーション起動時に一度だけ呼び出す
 */
import { registerFieldType } from './index';
import { NumberFieldType } from './NumberFieldType';
import { StringFieldType } from './StringFieldType';
import { TextareaFieldType } from './TextareaFieldType';

let initialized = false;

export function registerBuiltinFieldTypes(): void {
  if (initialized) return;

  registerFieldType('number', NumberFieldType);
  registerFieldType('string', StringFieldType);
  registerFieldType('textarea', TextareaFieldType);
  // 今後追加されるフィールドタイプもここに登録
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
