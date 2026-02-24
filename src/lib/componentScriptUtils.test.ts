import {
  inferFieldType,
  generateScriptContent,
  componentClassToScript,
  replaceExportDefault,
  parseComponentFields,
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
  it('フィールドから export default コードを生成する（新フォーマット）', () => {
    const fields: ComponentField[] = [
      { name: 'count', fieldType: 'number', defaultValue: 0, label: 'カウント' },
      { name: 'label', fieldType: 'string', defaultValue: '', label: 'ラベル' },
    ];
    const code = generateScriptContent(fields);
    expect(code).toBe(
      'export default {\n' +
        '  count: { type: "number", default: 0, label: "カウント" },\n' +
        '  label: { type: "string", default: "", label: "ラベル" }\n' +
        '}'
    );
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

describe('replaceExportDefault', () => {
  it('export default ブロックを新しいフィールドで置換する', () => {
    const content = 'export default {\n  x: { type: "number", default: 0, label: "x" }\n}';
    const newFields: ComponentField[] = [
      { name: 'x', fieldType: 'number', defaultValue: 0, label: 'x' },
      { name: 'y', fieldType: 'number', defaultValue: 0, label: 'y' },
    ];
    const result = replaceExportDefault(content, newFields);
    expect(result).toBe(generateScriptContent(newFields));
  });

  it('export default ブロック以外のコードを保持する', () => {
    const content =
      '// helper\nfunction helper() {}\nexport default {\n  x: { type: "number", default: 0, label: "x" }\n}';
    const newFields: ComponentField[] = [
      { name: 'z', fieldType: 'string', defaultValue: '', label: 'z' },
    ];
    const result = replaceExportDefault(content, newFields);
    expect(result).toMatch(/\/\/ helper[\s\S]*export default/);
    expect(result).toContain('// helper');
    expect(result).toContain('function helper()');
    expect(result).toContain('z: { type: "string"');
  });

  it('export default がない場合は新しいコンテンツをそのまま返す', () => {
    const content = '';
    const newFields: ComponentField[] = [
      { name: 'x', fieldType: 'number', defaultValue: 0, label: 'x' },
    ];
    const result = replaceExportDefault(content, newFields);
    expect(result).toBe(generateScriptContent(newFields));
  });

  it('デフォルト値に波括弧を含む文字列があっても正しく置換する', () => {
    const content =
      'export default {\n  msg: { type: "string", default: "hello {world", label: "msg" }\n}';
    const newFields: ComponentField[] = [
      { name: 'x', fieldType: 'number', defaultValue: 0, label: 'x' },
    ];
    const result = replaceExportDefault(content, newFields);
    expect(result).toBe(generateScriptContent(newFields));
  });
});

describe('parseComponentFields', () => {
  it('新フォーマットのコードをパースしてフィールドを返す', () => {
    const content =
      'export default {\n' +
      '  x: { type: "number", default: 0, label: "X座標" },\n' +
      '  name: { type: "string", default: "", label: "名前" }\n' +
      '}';
    const fields = parseComponentFields(content);
    expect(fields).toHaveLength(2);
    expect(fields).toContainEqual({
      name: 'x',
      fieldType: 'number',
      defaultValue: 0,
      label: 'X座標',
    });
    expect(fields).toContainEqual({
      name: 'name',
      fieldType: 'string',
      defaultValue: '',
      label: '名前',
    });
  });

  it('export default がなければ空配列を返す', () => {
    expect(parseComponentFields('')).toEqual([]);
    expect(parseComponentFields('// comment')).toEqual([]);
  });

  it('空オブジェクトなら空配列を返す', () => {
    expect(parseComponentFields('export default {}')).toEqual([]);
  });

  it('シンタックスエラーがあれば null を返す', () => {
    expect(parseComponentFields('export default { x: { type: ')).toBeNull();
  });

  it('export default 以外のコードも正しくパースできる', () => {
    const content =
      '// helper\nexport default {\n  hp: { type: "number", default: 100, label: "HP" }\n}';
    const fields = parseComponentFields(content);
    expect(fields).toHaveLength(1);
    expect(fields![0]).toMatchObject({ name: 'hp', fieldType: 'number' });
  });
});
