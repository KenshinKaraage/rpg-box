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
 * ComponentField 配列から export default の JS コードを生成する
 */
export function generateScriptContent(fields: ComponentField[]): string {
  if (fields.length === 0) return 'export default {}';
  const lines = fields.map((f) => `  ${f.name}: ${JSON.stringify(f.defaultValue)}`);
  return `export default {\n${lines.join(',\n')}\n}`;
}

/**
 * Component クラスを Script (type: 'component') に変換する
 *
 * serialize() から デフォルト値を取得し、型を推論する。
 * label プロパティがあればそれを使用し、なければ type をフォールバックとして使用する。
 * Component クラスへの変更は不要。
 */
export function componentClassToScript(Cls: ComponentConstructor): Script {
  const instance = new Cls() as Component & { label?: string };
  const defaults = instance.serialize();

  const fields: ComponentField[] = Object.entries(defaults).map(([name, value]) => ({
    name,
    fieldType: inferFieldType(value),
    defaultValue: value,
    label: name,
  }));

  return {
    id: instance.type,
    name: instance.label ?? instance.type,
    type: 'component',
    content: generateScriptContent(fields),
    fields,
    args: [],
    returns: [],
    isAsync: false,
    description: '',
  };
}
