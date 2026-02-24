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
  for (let i = braceStart; i < content.length; i++) {
    if (content[i] === '{') depth++;
    else if (content[i] === '}') {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end === -1) return newBlock;

  return content.slice(0, start) + newBlock + content.slice(end + 1);
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
