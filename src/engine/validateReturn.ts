/**
 * スクリプト返り値の型検証
 *
 * FieldType レジストリを使い、宣言された返り値定義と
 * 実際の返り値を突き合わせて型チェックする。
 */

import type { ScriptReturn } from '@/types/script';
import { createFieldTypeInstance } from '@/types/fields/registry';

/**
 * fieldType 文字列から期待される JavaScript の typeof 値を取得する。
 * レジストリのインスタンスを生成し、getDefaultValue() の typeof で判定。
 * レジストリに存在しない場合は null を返す（チェックをスキップ）。
 */
function expectedJsType(fieldType: string): string | null {
  const instance = createFieldTypeInstance(fieldType);
  if (!instance) return null;
  return typeof instance.getDefaultValue();
}

/**
 * 単一の値を fieldType に対してチェックする。
 * エラーメッセージを返す。問題なければ null。
 */
function checkValueType(value: unknown, fieldType: string): string | null {
  const expected = expectedJsType(fieldType);
  if (expected === null) return null; // unknown field type, skip

  const actual = typeof value;
  if (actual !== expected) {
    return `${expected} が期待されていますが、${actual} が返されました`;
  }
  return null;
}

/**
 * スクリプトの返り値を宣言された ScriptReturn[] と照合して検証する。
 *
 * - returns が空なら検証スキップ（エラーなし）
 * - returns が 1 件なら直接値をチェック
 * - returns が 2 件以上ならオブジェクトとして各キーをチェック
 *
 * @returns エラーメッセージの配列（空なら問題なし）
 */
export function validateScriptReturn(value: unknown, returns: ScriptReturn[]): string[] {
  if (returns.length === 0) return [];

  if (returns.length === 1) {
    const ret = returns[0]!;
    return validateSingleReturn(ret, value);
  }

  // Multiple returns: expect an object
  if (value === null || value === undefined || typeof value !== 'object' || Array.isArray(value)) {
    const keys = returns.map((r) => r.id).join(', ');
    return [`オブジェクト { ${keys} } が期待されていますが、${typeof value} が返されました`];
  }

  const obj = value as Record<string, unknown>;
  const errors: string[] = [];
  for (const ret of returns) {
    if (!(ret.id in obj)) {
      errors.push(`${ret.id}: キーが存在しません`);
      continue;
    }
    const errs = validateSingleReturn(ret, obj[ret.id]);
    errors.push(...errs.map((e) => `${ret.id}: ${e}`));
  }
  return errors;
}

function validateSingleReturn(ret: ScriptReturn, value: unknown): string[] {
  if (ret.isArray) {
    if (!Array.isArray(value)) {
      return [`配列が期待されていますが、${typeof value} が返されました`];
    }
    const errors: string[] = [];
    for (let i = 0; i < value.length; i++) {
      const err = checkValueType(value[i], ret.fieldType);
      if (err) errors.push(`[${i}]: ${err}`);
    }
    return errors;
  }

  const err = checkValueType(value, ret.fieldType);
  return err ? [err] : [];
}
