import '@/types/fields'; // register field types

import type { ScriptReturn } from '@/types/script';

import type { ReturnTemplateClassInfo } from './returnTemplate';
import { generateReturnTemplate, updateContentWithReturn } from './returnTemplate';

describe('generateReturnTemplate', () => {
  it('returns empty string when no returns', () => {
    expect(generateReturnTemplate([], [])).toBe('');
  });

  describe('single return', () => {
    it('generates number return', () => {
      const returns: ScriptReturn[] = [
        { id: 'damage', name: 'ダメージ', fieldType: 'number', isArray: false },
      ];
      expect(generateReturnTemplate(returns, [])).toBe('return 0;');
    });

    it('generates string return', () => {
      const returns: ScriptReturn[] = [
        { id: 'name', name: '名前', fieldType: 'string', isArray: false },
      ];
      expect(generateReturnTemplate(returns, [])).toBe("return '';");
    });

    it('generates boolean return', () => {
      const returns: ScriptReturn[] = [
        { id: 'flag', name: 'フラグ', fieldType: 'boolean', isArray: false },
      ];
      expect(generateReturnTemplate(returns, [])).toBe('return false;');
    });

    it('generates array return', () => {
      const returns: ScriptReturn[] = [
        { id: 'ids', name: 'ID一覧', fieldType: 'number', isArray: true },
      ];
      expect(generateReturnTemplate(returns, [])).toBe('return [0];');
    });

    it('generates class return with fields', () => {
      const returns: ScriptReturn[] = [
        { id: 'status', name: 'ステータス', fieldType: 'class', classId: 'cls1', isArray: false },
      ];
      const classes: ReturnTemplateClassInfo[] = [
        {
          id: 'cls1',
          fields: [
            { id: 'hp', type: 'number' },
            { id: 'name', type: 'string' },
          ],
        },
      ];
      expect(generateReturnTemplate(returns, classes)).toBe("return { hp: 0, name: '' };");
    });

    it('generates class return without classId as empty object', () => {
      const returns: ScriptReturn[] = [
        { id: 'data', name: 'データ', fieldType: 'class', isArray: false },
      ];
      // class fieldType without classId → falls through to defaultValueLiteral('class')
      // createFieldTypeInstance('class') exists, getDefaultValue() returns object
      expect(generateReturnTemplate(returns, [])).toBeDefined();
    });

    it('generates array of class return', () => {
      const returns: ScriptReturn[] = [
        { id: 'items', name: 'アイテム', fieldType: 'class', classId: 'cls1', isArray: true },
      ];
      const classes: ReturnTemplateClassInfo[] = [
        { id: 'cls1', fields: [{ id: 'id', type: 'number' }] },
      ];
      expect(generateReturnTemplate(returns, classes)).toBe('return [{ id: 0 }];');
    });

    it('generates unknown class as empty object', () => {
      const returns: ScriptReturn[] = [
        { id: 'x', name: 'X', fieldType: 'class', classId: 'unknown', isArray: false },
      ];
      expect(generateReturnTemplate(returns, [])).toBe('return {};');
    });

    it('expands nested class fields', () => {
      const returns: ScriptReturn[] = [
        {
          id: 'result',
          name: '結果',
          fieldType: 'class',
          classId: 'battle_result',
          isArray: false,
        },
      ];
      const classes: ReturnTemplateClassInfo[] = [
        {
          id: 'battle_result',
          fields: [
            { id: 'damage', type: 'number' },
            { id: 'status', type: 'class', classId: 'status' },
          ],
        },
        {
          id: 'status',
          fields: [
            { id: 'hp', type: 'number' },
            { id: 'name', type: 'string' },
          ],
        },
      ];
      expect(generateReturnTemplate(returns, classes)).toBe(
        "return { damage: 0, status: { hp: 0, name: '' } };"
      );
    });
  });

  describe('multiple returns', () => {
    it('generates object with multiple keys', () => {
      const returns: ScriptReturn[] = [
        { id: 'damage', name: 'ダメージ', fieldType: 'number', isArray: false },
        { id: 'isCritical', name: 'クリティカル', fieldType: 'boolean', isArray: false },
      ];
      const result = generateReturnTemplate(returns, []);
      expect(result).toBe('return {\n  damage: 0,\n  isCritical: false\n};');
    });

    it('generates object with class field', () => {
      const returns: ScriptReturn[] = [
        { id: 'damage', name: 'ダメージ', fieldType: 'number', isArray: false },
        { id: 'status', name: 'ステータス', fieldType: 'class', classId: 'cls1', isArray: false },
      ];
      const classes: ReturnTemplateClassInfo[] = [
        { id: 'cls1', fields: [{ id: 'hp', type: 'number' }] },
      ];
      const result = generateReturnTemplate(returns, classes);
      expect(result).toBe('return {\n  damage: 0,\n  status: { hp: 0 }\n};');
    });
  });
});

describe('updateContentWithReturn', () => {
  it('sets template as content when empty', () => {
    expect(updateContentWithReturn('', 'return 0;')).toBe('return 0;\n');
  });

  it('sets template as content when whitespace only', () => {
    expect(updateContentWithReturn('  \n  ', 'return 0;')).toBe('return 0;\n');
  });

  it('appends template when no return exists', () => {
    const content = 'const x = 10;';
    const result = updateContentWithReturn(content, 'return 0;');
    expect(result).toBe('const x = 10;\n\nreturn 0;\n');
  });

  it('replaces existing single-line return', () => {
    const content = 'const x = 10;\nreturn 42;';
    const result = updateContentWithReturn(content, 'return 0;');
    expect(result).toBe('const x = 10;\nreturn 0;\n');
  });

  it('replaces existing multi-line return', () => {
    const content = 'const x = 10;\nreturn {\n  damage: 42\n};';
    const result = updateContentWithReturn(
      content,
      'return {\n  damage: 0,\n  isCritical: false\n};'
    );
    expect(result).toBe('const x = 10;\nreturn {\n  damage: 0,\n  isCritical: false\n};\n');
  });

  it('preserves code before return', () => {
    const content = 'const a = 1;\nconst b = 2;\nreturn a + b;';
    const result = updateContentWithReturn(content, 'return 0;');
    expect(result).toBe('const a = 1;\nconst b = 2;\nreturn 0;\n');
  });

  it('returns content unchanged when template is empty', () => {
    const content = 'const x = 10;';
    expect(updateContentWithReturn(content, '')).toBe('const x = 10;');
  });

  it('handles content with trailing whitespace', () => {
    const content = 'const x = 10;\nreturn 42;\n\n';
    const result = updateContentWithReturn(content, 'return 0;');
    expect(result).toBe('const x = 10;\nreturn 0;\n');
  });
});
