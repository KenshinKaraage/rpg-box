import {
  inferFieldType,
  generateScriptContent,
  componentClassToScript,
} from './componentScriptUtils';
import { Component } from '@/types/components/Component';
import type { ComponentField } from '@/types/script';

class SimpleComponent extends Component {
  readonly type = 'simple';
  readonly label = 'Simple';
  count = 0;
  name = '';
  active = true;

  serialize() {
    return { count: this.count, name: this.name, active: this.active };
  }
  deserialize(data: Record<string, unknown>) {
    this.count = (data.count as number) ?? 0;
    this.name = (data.name as string) ?? '';
    this.active = (data.active as boolean) ?? true;
  }
  clone() {
    const c = new SimpleComponent();
    c.count = this.count;
    c.name = this.name;
    c.active = this.active;
    return c;
  }
}

class ArrayComponent extends Component {
  readonly type = 'array';
  readonly label = 'Array';
  items: { x: number; y: number }[] = [];

  serialize() {
    return { items: this.items.map((i) => ({ x: i.x, y: i.y })) };
  }
  deserialize(data: Record<string, unknown>) {
    this.items = (data.items as { x: number; y: number }[]) ?? [];
  }
  clone() {
    const c = new ArrayComponent();
    c.items = [...this.items];
    return c;
  }
}

describe('inferFieldType', () => {
  it('数値 → number', () => expect(inferFieldType(0)).toBe('number'));
  it('文字列 → string', () => expect(inferFieldType('')).toBe('string'));
  it('真偽値 → boolean', () => expect(inferFieldType(false)).toBe('boolean'));
  it('配列 → array', () => expect(inferFieldType([])).toBe('array'));
  it('オブジェクト → object', () => expect(inferFieldType({})).toBe('object'));
  it('undefined → string', () => expect(inferFieldType(undefined)).toBe('string'));
  it('null → string', () => expect(inferFieldType(null)).toBe('string'));
});

describe('generateScriptContent', () => {
  it('フィールドから export default コードを生成する', () => {
    const fields: ComponentField[] = [
      { name: 'count', fieldType: 'number', defaultValue: 0, label: 'Count' },
      { name: 'name', fieldType: 'string', defaultValue: '', label: 'Name' },
    ];
    const code = generateScriptContent(fields);
    expect(code).toBe('export default {\n  count: 0,\n  name: ""\n}');
  });

  it('フィールドが空の場合は空オブジェクトを生成する', () => {
    expect(generateScriptContent([])).toBe('export default {}');
  });
});

describe('componentClassToScript', () => {
  it('Script に変換できる', () => {
    const script = componentClassToScript(SimpleComponent);
    expect(script.id).toBe('simple');
    expect(script.name).toBe('Simple');
    expect(script.type).toBe('component');
    expect(script.fields).toHaveLength(3);
  });

  it('serialize() からフィールドの型とデフォルト値を推論する', () => {
    const script = componentClassToScript(SimpleComponent);
    expect(script.fields).toContainEqual({
      name: 'count',
      fieldType: 'number',
      defaultValue: 0,
      label: 'count',
    });
    expect(script.fields).toContainEqual({
      name: 'name',
      fieldType: 'string',
      defaultValue: '',
      label: 'name',
    });
    expect(script.fields).toContainEqual({
      name: 'active',
      fieldType: 'boolean',
      defaultValue: true,
      label: 'active',
    });
  });

  it('content に export default コードが含まれる', () => {
    const script = componentClassToScript(SimpleComponent);
    expect(script.content).toContain('export default');
    expect(script.content).toContain('count');
  });

  it('配列フィールドを array として推論する', () => {
    const script = componentClassToScript(ArrayComponent);
    expect(script.fields).toContainEqual(
      expect.objectContaining({ name: 'items', fieldType: 'array' })
    );
  });
});
