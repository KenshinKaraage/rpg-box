import '@/types/fields'; // register field types

import type { ScriptReturn } from '@/types/script';

import type { ClassDef } from './validateReturn';
import { validateScriptReturn } from './validateReturn';

describe('validateScriptReturn', () => {
  it('returns no errors when returns is empty', () => {
    expect(validateScriptReturn(42, [])).toEqual([]);
  });

  describe('single return value', () => {
    const numberReturn: ScriptReturn[] = [
      { id: 'damage', name: 'ダメージ', fieldType: 'number', isArray: false },
    ];

    it('passes when type matches', () => {
      expect(validateScriptReturn(42, numberReturn)).toEqual([]);
    });

    it('fails when type mismatches', () => {
      const errors = validateScriptReturn('hello', numberReturn);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('number');
      expect(errors[0]).toContain('string');
    });

    it('validates string return', () => {
      const stringReturn: ScriptReturn[] = [
        { id: 'name', name: '名前', fieldType: 'string', isArray: false },
      ];
      expect(validateScriptReturn('hello', stringReturn)).toEqual([]);
      expect(validateScriptReturn(42, stringReturn)).toHaveLength(1);
    });

    it('validates boolean return', () => {
      const boolReturn: ScriptReturn[] = [
        { id: 'flag', name: 'フラグ', fieldType: 'boolean', isArray: false },
      ];
      expect(validateScriptReturn(true, boolReturn)).toEqual([]);
      expect(validateScriptReturn(1, boolReturn)).toHaveLength(1);
    });

    it('validates class without classId falls back to object check', () => {
      const classReturn: ScriptReturn[] = [
        { id: 'status', name: 'ステータス', fieldType: 'class', isArray: false },
      ];
      expect(validateScriptReturn({}, classReturn)).toEqual([]);
      expect(validateScriptReturn('hello', classReturn)).toHaveLength(1);
    });
  });

  describe('array return', () => {
    const arrayReturn: ScriptReturn[] = [
      { id: 'ids', name: 'ID一覧', fieldType: 'number', isArray: true },
    ];

    it('passes when value is array of correct type', () => {
      expect(validateScriptReturn([1, 2, 3], arrayReturn)).toEqual([]);
    });

    it('fails when value is not an array', () => {
      const errors = validateScriptReturn(42, arrayReturn);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('配列');
    });

    it('fails when array element has wrong type', () => {
      const errors = validateScriptReturn([1, 'two', 3], arrayReturn);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('[1]');
    });

    it('passes with empty array', () => {
      expect(validateScriptReturn([], arrayReturn)).toEqual([]);
    });
  });

  describe('multiple return values', () => {
    const multiReturn: ScriptReturn[] = [
      { id: 'damage', name: 'ダメージ', fieldType: 'number', isArray: false },
      { id: 'isCritical', name: 'クリティカル', fieldType: 'boolean', isArray: false },
    ];

    it('passes when all keys match', () => {
      expect(validateScriptReturn({ damage: 10, isCritical: true }, multiReturn)).toEqual([]);
    });

    it('fails when value is not an object', () => {
      const errors = validateScriptReturn(42, multiReturn);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('オブジェクト');
    });

    it('fails when a key is missing', () => {
      const errors = validateScriptReturn({ damage: 10 }, multiReturn);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('isCritical');
      expect(errors[0]).toContain('キーが存在しません');
    });

    it('fails when a value has wrong type', () => {
      const errors = validateScriptReturn({ damage: 'ten', isCritical: true }, multiReturn);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('damage');
    });

    it('reports multiple errors', () => {
      const errors = validateScriptReturn({ damage: 'ten', isCritical: 'yes' }, multiReturn);
      expect(errors).toHaveLength(2);
    });
  });

  describe('class with classId', () => {
    const classes: ClassDef[] = [
      {
        id: 'class_status',
        name: 'ステータス',
        fields: [
          { id: 'hp', fieldType: 'number' },
          { id: 'name', fieldType: 'string' },
        ],
      },
    ];

    const classReturn: ScriptReturn[] = [
      {
        id: 'status',
        name: 'ステータス',
        fieldType: 'class',
        classId: 'class_status',
        isArray: false,
      },
    ];

    it('passes when object matches class fields', () => {
      expect(validateScriptReturn({ hp: 100, name: '勇者' }, classReturn, classes)).toEqual([]);
    });

    it('fails when value is not an object', () => {
      const errors = validateScriptReturn(42, classReturn, classes);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('ステータス');
    });

    it('fails when a field is missing', () => {
      const errors = validateScriptReturn({ hp: 100 }, classReturn, classes);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('name');
      expect(errors[0]).toContain('存在しません');
    });

    it('fails when a field has wrong type', () => {
      const errors = validateScriptReturn({ hp: 'hundred', name: '勇者' }, classReturn, classes);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('hp');
      expect(errors[0]).toContain('number');
    });

    it('reports error when classId not found', () => {
      const badReturn: ScriptReturn[] = [
        { id: 'x', name: 'X', fieldType: 'class', classId: 'nonexistent', isArray: false },
      ];
      const errors = validateScriptReturn({}, badReturn, classes);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('nonexistent');
    });

    it('validates array of class objects', () => {
      const arrayClassReturn: ScriptReturn[] = [
        {
          id: 'statuses',
          name: 'ステータス一覧',
          fieldType: 'class',
          classId: 'class_status',
          isArray: true,
        },
      ];
      expect(
        validateScriptReturn(
          [
            { hp: 100, name: '勇者' },
            { hp: 50, name: '魔法使い' },
          ],
          arrayClassReturn,
          classes
        )
      ).toEqual([]);

      const errors = validateScriptReturn(
        [
          { hp: 100, name: '勇者' },
          { hp: 'fifty', name: '魔法使い' },
        ],
        arrayClassReturn,
        classes
      );
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('[1]');
    });
  });

  describe('unknown field type', () => {
    it('skips validation for unregistered field types', () => {
      const unknownReturn: ScriptReturn[] = [
        { id: 'custom', name: 'カスタム', fieldType: 'unknownType', isArray: false },
      ];
      expect(validateScriptReturn('anything', unknownReturn)).toEqual([]);
    });
  });
});
