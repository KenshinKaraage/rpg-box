import type { Component } from '@/types/components/Component';
import type { ComponentField, Script } from '@/types/script';

type ComponentConstructor = new () => Component;

/**
 * JavaScript の値から FieldType の type 名を推論する
 */
export function inferFieldType(value: unknown): string {
  if (value === null || value === undefined) return 'string';
  if (Array.isArray(value)) return 'array';
  const t = typeof value;
  if (t === 'number' || t === 'string' || t === 'boolean' || t === 'object') return t;
  return 'string';
}

/**
 * ComponentField 配列から export default の JS コードを生成する（リッチフォーマット）
 */
export function generateScriptContent(fields: ComponentField[]): string {
  if (fields.length === 0) return 'export default {}';
  const lines = fields.map(
    (f) =>
      `  ${f.name}: { type: ${JSON.stringify(f.fieldType)}, default: ${JSON.stringify(f.defaultValue)}, label: ${JSON.stringify(f.label)} }`
  );
  return `export default {\n${lines.join(',\n')}\n}`;
}

/**
 * コード内の export default { ... } ブロックのみを新しいフィールドで置換する
 * export default ブロック以外のコード（コメント、関数等）は保持される
 */
export function replaceExportDefault(content: string, fields: ComponentField[]): string {
  const newBlock = generateScriptContent(fields);
  const start = content.search(/export\s+default\s*\{/);
  if (start === -1) return newBlock;

  const braceStart = content.indexOf('{', start);
  let depth = 0;
  let end = -1;
  let inString = false;
  let stringChar = '';
  let i = braceStart;
  while (i < content.length) {
    const c = content[i];
    if (inString) {
      if (c === '\\') {
        i++; // skip escaped character
      } else if (c === stringChar) {
        inString = false;
      }
    } else {
      if (c === '"' || c === "'" || c === '`') {
        inString = true;
        stringChar = c;
      } else if (c === '{') {
        depth++;
      } else if (c === '}') {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    i++;
  }
  if (end === -1) return newBlock;

  return content.slice(0, start) + newBlock + content.slice(end + 1);
}

/**
 * コンポーネントスクリプトのコード文字列から ComponentField[] をパースして返す
 *
 * @returns ComponentField[] — パース成功（0件の場合は空配列）
 *          null — シンタックスエラー等でパース不可
 */
export function parseComponentFields(content: string): ComponentField[] | null {
  // export default がなければ空（エラーではない）
  if (!/export\s+default\s*\{/.test(content)) return [];

  try {
    const start = content.search(/export\s+default\s*\{/);
    const braceStart = content.indexOf('{', start);
    let depth = 0;
    let end = -1;
    let inString = false;
    let stringChar = '';
    let i = braceStart;
    while (i < content.length) {
      const c = content[i];
      if (inString) {
        if (c === '\\') {
          i++; // skip escaped character
        } else if (c === stringChar) {
          inString = false;
        }
      } else {
        if (c === '"' || c === "'" || c === '`') {
          inString = true;
          stringChar = c;
        } else if (c === '{') {
          depth++;
        } else if (c === '}') {
          depth--;
          if (depth === 0) {
            end = i;
            break;
          }
        }
      }
      i++;
    }
    if (end === -1) return null;

    const block = content.slice(braceStart, end + 1);
    // eslint-disable-next-line no-new-func
    const obj = new Function(`return (${block})`)() as Record<string, unknown>;

    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return [];

    return Object.entries(obj).map(([name, def]) => {
      const d = def as { type?: unknown; default?: unknown; label?: unknown };
      return {
        name,
        fieldType: typeof d?.type === 'string' ? d.type : 'string',
        defaultValue: d?.default ?? null,
        label: typeof d?.label === 'string' ? d.label : name,
      };
    });
  } catch {
    return null;
  }
}

/**
 * Component クラスを Script (type: 'component') に変換する
 *
 * serialize() から デフォルト値を取得し、型を推論する。
 */
export function componentClassToScript(Cls: ComponentConstructor): Script {
  const instance = new Cls();
  const defaults = instance.serialize();

  const fields: ComponentField[] = Object.entries(defaults).map(([name, value]) => ({
    name,
    fieldType: inferFieldType(value),
    defaultValue: value,
    label: name,
  }));

  return {
    id: instance.type,
    name: instance.label,
    type: 'component',
    content: generateScriptContent(fields),
    fields,
    args: [],
    returns: [],
    isAsync: false,
    description: '',
  };
}
