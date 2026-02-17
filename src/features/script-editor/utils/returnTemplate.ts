/**
 * 返り値テンプレート生成
 *
 * ScriptReturn[] 定義からデフォルト値を含む return 文を生成し、
 * スクリプトコンテンツに挿入・更新する。
 */

import { createFieldTypeInstance } from '@/types/fields/registry';
import type { ScriptReturn } from '@/types/script';

/**
 * テンプレート生成用のクラス情報（軽量）
 */
export interface ReturnTemplateClassInfo {
  id: string;
  fields: Array<{ id: string; type: string; classId?: string }>;
}

/**
 * fieldType からデフォルト値のリテラル文字列を取得する。
 * レジストリの getDefaultValue() の typeof で判定。
 */
function defaultValueLiteral(fieldType: string): string {
  const instance = createFieldTypeInstance(fieldType);
  if (!instance) return 'null';
  const val = instance.getDefaultValue();
  if (typeof val === 'string') return "''";
  if (typeof val === 'number') return '0';
  if (typeof val === 'boolean') return 'false';
  return JSON.stringify(val);
}

/**
 * フィールドの値リテラルを生成する。
 * クラス型フィールドはネストされたクラスを再帰展開する。
 * 循環参照はクラス設定側で防止済みのため、ここでは検出しない。
 */
function fieldValueLiteral(
  fieldType: string,
  classId: string | undefined,
  classes: ReturnTemplateClassInfo[]
): string {
  if (fieldType === 'class' && classId) {
    const cls = classes.find((c) => c.id === classId);
    if (!cls) return '{}';
    return classLiteral(cls, classes);
  }
  return defaultValueLiteral(fieldType);
}

/**
 * クラス定義からオブジェクトリテラル文字列を生成する。
 * ネストされたクラスフィールドを再帰展開する。
 */
function classLiteral(
  classInfo: ReturnTemplateClassInfo,
  classes: ReturnTemplateClassInfo[]
): string {
  if (classInfo.fields.length === 0) return '{}';
  const pairs = classInfo.fields.map(
    (f) => `${f.id}: ${fieldValueLiteral(f.type, f.classId, classes)}`
  );
  return `{ ${pairs.join(', ')} }`;
}

/**
 * 単一の返り値のリテラル文字列を生成する。
 */
function singleValueLiteral(ret: ScriptReturn, classes: ReturnTemplateClassInfo[]): string {
  const literal = fieldValueLiteral(ret.fieldType, ret.classId, classes);
  return ret.isArray ? `[${literal}]` : literal;
}

/**
 * ScriptReturn[] からreturn文テンプレートを生成する。
 *
 * - returns が空 → 空文字列
 * - 1件 → `return <value>;`
 * - 2件以上 → `return { key1: <value>, key2: <value> };`
 */
export function generateReturnTemplate(
  returns: ScriptReturn[],
  classes: ReturnTemplateClassInfo[]
): string {
  if (returns.length === 0) return '';

  if (returns.length === 1) {
    return `return ${singleValueLiteral(returns[0]!, classes)};`;
  }

  const entries = returns.map((r) => `  ${r.id}: ${singleValueLiteral(r, classes)}`);
  return `return {\n${entries.join(',\n')}\n};`;
}

/**
 * スクリプトコンテンツ内のreturn文をテンプレートで更新する。
 *
 * - コンテンツが空 → テンプレートのみ
 * - 末尾にreturn文がある → テンプレートで置換
 * - return文がない → 末尾にテンプレートを追加
 *
 * @param content 現在のスクリプトコンテンツ
 * @param newReturnTemplate 新しいreturn文テンプレート
 * @returns 更新されたコンテンツ
 */
export function updateContentWithReturn(content: string, newReturnTemplate: string): string {
  if (!newReturnTemplate) return content;

  const trimmed = content.trimEnd();

  if (!trimmed) {
    return newReturnTemplate + '\n';
  }

  // 最後の return 文の開始行を探す
  const lines = trimmed.split('\n');
  let returnStartLine = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    const stripped = lines[i]!.trimStart();
    if (stripped.startsWith('return ') || stripped.startsWith('return{') || stripped === 'return') {
      returnStartLine = i;
      break;
    }
  }

  if (returnStartLine >= 0) {
    // return文より前のコードを保持し、テンプレートで置換
    const before = lines.slice(0, returnStartLine).join('\n');
    if (before.trim()) {
      return before + '\n' + newReturnTemplate + '\n';
    }
    return newReturnTemplate + '\n';
  }

  // return文がない → 末尾に追加
  return trimmed + '\n\n' + newReturnTemplate + '\n';
}
