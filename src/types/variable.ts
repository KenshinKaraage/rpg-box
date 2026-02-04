/**
 * 変数の型定義
 *
 * ゲーム内で使用するグローバル変数を表現
 * - FieldTypeを使用して型を定義
 * - 配列対応
 */

import type { FieldType } from './fields/FieldType';
import { createFieldTypeInstance, NumberFieldType } from './fields';

/**
 * 変数インターフェース
 */
export interface Variable {
  /** 一意識別子 */
  id: string;

  /** 変数名 */
  name: string;

  /** 変数の型（FieldTypeインスタンス） */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fieldType: FieldType<any>;

  /** 配列かどうか */
  isArray: boolean;

  /** 初期値 */
  initialValue: unknown;

  /** 説明（オプション） */
  description?: string;
}

/**
 * 変数のデフォルト初期値を取得
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getDefaultInitialValue(fieldType: FieldType<any>, isArray: boolean): unknown {
  if (isArray) {
    return [];
  }
  return fieldType.getDefaultValue();
}

/**
 * 新しい変数を作成
 * @param id 変数ID
 * @param name 変数名
 * @param fieldTypeName フィールドタイプ名（デフォルト: 'number'）
 * @param isArray 配列かどうか（デフォルト: false）
 */
export function createVariable(
  id: string,
  name: string,
  fieldTypeName: string = 'number',
  isArray: boolean = false
): Variable {
  const fieldType = createFieldTypeInstance(fieldTypeName) ?? new NumberFieldType();
  return {
    id,
    name,
    fieldType,
    isArray,
    initialValue: getDefaultInitialValue(fieldType, isArray),
  };
}
