import type { ReactNode } from 'react';

import {
  FieldType,
  type FieldEditorProps,
  type ValidationResult,
  registerFieldType,
  getFieldType,
  getAllFieldTypes,
  getFieldTypeNames,
  clearFieldTypeRegistry,
} from './index';

// テスト用の具象クラス
class TestFieldType extends FieldType<string> {
  readonly type = 'test';

  getDefaultValue(): string {
    return '';
  }

  validate(value: string): ValidationResult {
    if (this.required && !value) {
      return { valid: false, message: '必須項目です' };
    }
    return { valid: true };
  }

  serialize(value: string): unknown {
    return value;
  }

  deserialize(data: unknown): string {
    return String(data);
  }

  renderEditor(_props: FieldEditorProps<string>): ReactNode {
    return null;
  }

  getValue(data: unknown): string {
    return String(data);
  }
}

class AnotherFieldType extends FieldType<number> {
  readonly type = 'another';

  getDefaultValue(): number {
    return 0;
  }

  validate(_value: number): ValidationResult {
    return { valid: true };
  }

  serialize(value: number): unknown {
    return value;
  }

  deserialize(data: unknown): number {
    return Number(data);
  }

  renderEditor(_props: FieldEditorProps<number>): ReactNode {
    return null;
  }

  getValue(data: unknown): number {
    return Number(data);
  }
}

describe('FieldType registry', () => {
  beforeEach(() => {
    clearFieldTypeRegistry();
  });

  describe('registerFieldType', () => {
    it('registers a field type', () => {
      registerFieldType('test', TestFieldType);
      expect(getFieldType('test')).toBe(TestFieldType);
    });

    it('overwrites existing registration with warning', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      registerFieldType('test', TestFieldType);
      registerFieldType('test', AnotherFieldType);

      expect(warnSpy).toHaveBeenCalledWith('FieldType "test" is already registered. Overwriting.');
      expect(getFieldType('test')).toBe(AnotherFieldType);

      warnSpy.mockRestore();
    });
  });

  describe('getFieldType', () => {
    it('returns undefined for unregistered type', () => {
      expect(getFieldType('nonexistent')).toBeUndefined();
    });

    it('returns registered field type', () => {
      registerFieldType('test', TestFieldType);
      expect(getFieldType('test')).toBe(TestFieldType);
    });
  });

  describe('getAllFieldTypes', () => {
    it('returns empty array when no types registered', () => {
      expect(getAllFieldTypes()).toEqual([]);
    });

    it('returns all registered types', () => {
      registerFieldType('test', TestFieldType);
      registerFieldType('another', AnotherFieldType);

      const types = getAllFieldTypes();
      expect(types).toHaveLength(2);
      expect(types).toContainEqual(['test', TestFieldType]);
      expect(types).toContainEqual(['another', AnotherFieldType]);
    });
  });

  describe('getFieldTypeNames', () => {
    it('returns empty array when no types registered', () => {
      expect(getFieldTypeNames()).toEqual([]);
    });

    it('returns all type names', () => {
      registerFieldType('test', TestFieldType);
      registerFieldType('another', AnotherFieldType);

      const names = getFieldTypeNames();
      expect(names).toHaveLength(2);
      expect(names).toContain('test');
      expect(names).toContain('another');
    });
  });

  describe('clearFieldTypeRegistry', () => {
    it('clears all registrations', () => {
      registerFieldType('test', TestFieldType);
      registerFieldType('another', AnotherFieldType);

      clearFieldTypeRegistry();

      expect(getAllFieldTypes()).toEqual([]);
    });
  });
});

describe('FieldType abstract class', () => {
  it('can be instantiated through subclass', () => {
    const field = new TestFieldType('test_id', 'テストフィールド');

    expect(field.id).toBe('test_id');
    expect(field.name).toBe('テストフィールド');
    expect(field.required).toBe(false);
    expect(field.type).toBe('test');
  });

  it('accepts required parameter', () => {
    const field = new TestFieldType('required_id', '必須フィールド', true);

    expect(field.required).toBe(true);
  });

  it('supports displayCondition', () => {
    const field = new TestFieldType('conditional', '条件付き');
    field.displayCondition = {
      fieldId: 'category',
      value: 'special',
    };

    expect(field.displayCondition).toEqual({
      fieldId: 'category',
      value: 'special',
    });
  });

  describe('abstract methods', () => {
    let field: TestFieldType;

    beforeEach(() => {
      field = new TestFieldType('test', 'Test', true);
    });

    it('getDefaultValue returns default', () => {
      expect(field.getDefaultValue()).toBe('');
    });

    it('validate checks required', () => {
      expect(field.validate('')).toEqual({
        valid: false,
        message: '必須項目です',
      });
      expect(field.validate('value')).toEqual({ valid: true });
    });

    it('serialize returns value', () => {
      expect(field.serialize('test')).toBe('test');
    });

    it('deserialize converts data', () => {
      expect(field.deserialize(123)).toBe('123');
    });

    it('getValue returns value', () => {
      expect(field.getValue('data')).toBe('data');
    });
  });
});
