import { StringFieldType } from './StringFieldType.tsx';
import { registerFieldType, getFieldType, clearFieldTypeRegistry } from './index';

describe('StringFieldType', () => {
  describe('type property', () => {
    it('returns "string" as the type identifier', () => {
      const field = new StringFieldType();
      expect(field.type).toBe('string');
    });
  });

  describe('getDefaultValue', () => {
    it('returns empty string as the default value', () => {
      const field = new StringFieldType();
      expect(field.getDefaultValue()).toBe('');
    });
  });

  describe('validate', () => {
    it('returns valid for a string within maxLength', () => {
      const field = new StringFieldType();
      field.maxLength = 10;
      const result = field.validate('hello');
      expect(result.valid).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it('returns invalid when string exceeds maxLength', () => {
      const field = new StringFieldType();
      field.maxLength = 5;
      const result = field.validate('hello world');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('5文字以内で入力してください');
    });

    it('returns valid when maxLength is not set', () => {
      const field = new StringFieldType();
      const result = field.validate('a'.repeat(1000));
      expect(result.valid).toBe(true);
    });

    it('returns invalid when required and value is empty', () => {
      const field = new StringFieldType();
      field.required = true;
      const result = field.validate('');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('値を入力してください');
    });

    it('returns invalid when required and value is whitespace only', () => {
      const field = new StringFieldType();
      field.required = true;
      const result = field.validate('   ');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('値を入力してください');
    });

    it('returns valid when not required and value is empty', () => {
      const field = new StringFieldType();
      field.required = false;
      const result = field.validate('');
      expect(result.valid).toBe(true);
    });
  });

  describe('serialize', () => {
    it('serializes a string value', () => {
      const field = new StringFieldType();
      expect(field.serialize('hello')).toBe('hello');
    });

    it('serializes empty string', () => {
      const field = new StringFieldType();
      expect(field.serialize('')).toBe('');
    });
  });

  describe('deserialize', () => {
    it('deserializes a string value', () => {
      const field = new StringFieldType();
      expect(field.deserialize('hello')).toBe('hello');
    });

    it('deserializes null as empty string', () => {
      const field = new StringFieldType();
      expect(field.deserialize(null)).toBe('');
    });

    it('deserializes undefined as empty string', () => {
      const field = new StringFieldType();
      expect(field.deserialize(undefined)).toBe('');
    });

    it('deserializes number as string', () => {
      const field = new StringFieldType();
      expect(field.deserialize(123)).toBe('123');
    });
  });

  describe('getValue', () => {
    it('returns the string value from data', () => {
      const field = new StringFieldType();
      expect(field.getValue('hello')).toBe('hello');
    });

    it('returns default value for null data', () => {
      const field = new StringFieldType();
      expect(field.getValue(null)).toBe('');
    });
  });

  describe('renderEditor', () => {
    it('returns a ReactNode', () => {
      const field = new StringFieldType();
      const props = {
        value: 'test',
        onChange: jest.fn(),
      };
      const result = field.renderEditor(props);
      expect(result).toBeDefined();
    });
  });

  describe('properties', () => {
    it('has optional maxLength property', () => {
      const field = new StringFieldType();
      expect(field.maxLength).toBeUndefined();
      field.maxLength = 100;
      expect(field.maxLength).toBe(100);
    });

    it('has optional placeholder property', () => {
      const field = new StringFieldType();
      expect(field.placeholder).toBeUndefined();
      field.placeholder = '入力してください';
      expect(field.placeholder).toBe('入力してください');
    });
  });

  describe('registry', () => {
    beforeEach(() => {
      clearFieldTypeRegistry();
    });

    it('can be registered and retrieved from the registry', () => {
      registerFieldType('string', StringFieldType);
      const FieldClass = getFieldType('string');
      expect(FieldClass).toBe(StringFieldType);
    });

    it('creates a valid instance from registry', () => {
      registerFieldType('string', StringFieldType);
      const FieldClass = getFieldType('string');
      expect(FieldClass).toBeDefined();
      if (FieldClass) {
        const field = new FieldClass();
        expect(field.type).toBe('string');
        expect(field.getDefaultValue()).toBe('');
      }
    });
  });
});
