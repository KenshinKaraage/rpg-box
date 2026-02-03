import { TextareaFieldType } from './TextareaFieldType.tsx';
import { registerFieldType, getFieldType, clearFieldTypeRegistry } from './index';

describe('TextareaFieldType', () => {
  describe('type property', () => {
    it('returns "textarea" as the type identifier', () => {
      const field = new TextareaFieldType();
      expect(field.type).toBe('textarea');
    });
  });

  describe('getDefaultValue', () => {
    it('returns empty string as the default value', () => {
      const field = new TextareaFieldType();
      expect(field.getDefaultValue()).toBe('');
    });
  });

  describe('validate', () => {
    it('returns valid for a string within maxLength', () => {
      const field = new TextareaFieldType();
      field.maxLength = 1000;
      const result = field.validate('hello\nworld');
      expect(result.valid).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it('returns invalid when string exceeds maxLength', () => {
      const field = new TextareaFieldType();
      field.maxLength = 10;
      const result = field.validate('hello world with many chars');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('10文字以内で入力してください');
    });

    it('returns valid when maxLength is not set', () => {
      const field = new TextareaFieldType();
      const result = field.validate('a'.repeat(10000));
      expect(result.valid).toBe(true);
    });

    it('returns invalid when required and value is empty', () => {
      const field = new TextareaFieldType();
      field.required = true;
      const result = field.validate('');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('値を入力してください');
    });

    it('returns valid when not required and value is empty', () => {
      const field = new TextareaFieldType();
      field.required = false;
      const result = field.validate('');
      expect(result.valid).toBe(true);
    });

    it('handles multiline text correctly', () => {
      const field = new TextareaFieldType();
      const multilineText = 'line1\nline2\nline3';
      const result = field.validate(multilineText);
      expect(result.valid).toBe(true);
    });
  });

  describe('serialize', () => {
    it('serializes a string value', () => {
      const field = new TextareaFieldType();
      expect(field.serialize('hello\nworld')).toBe('hello\nworld');
    });

    it('serializes empty string', () => {
      const field = new TextareaFieldType();
      expect(field.serialize('')).toBe('');
    });
  });

  describe('deserialize', () => {
    it('deserializes a string value', () => {
      const field = new TextareaFieldType();
      expect(field.deserialize('hello\nworld')).toBe('hello\nworld');
    });

    it('deserializes null as empty string', () => {
      const field = new TextareaFieldType();
      expect(field.deserialize(null)).toBe('');
    });

    it('deserializes undefined as empty string', () => {
      const field = new TextareaFieldType();
      expect(field.deserialize(undefined)).toBe('');
    });
  });

  describe('getValue', () => {
    it('returns the string value from data', () => {
      const field = new TextareaFieldType();
      expect(field.getValue('hello\nworld')).toBe('hello\nworld');
    });

    it('returns default value for null data', () => {
      const field = new TextareaFieldType();
      expect(field.getValue(null)).toBe('');
    });
  });

  describe('renderEditor', () => {
    it('returns a ReactNode', () => {
      const field = new TextareaFieldType();
      const props = {
        value: 'test\nmultiline',
        onChange: jest.fn(),
      };
      const result = field.renderEditor(props);
      expect(result).toBeDefined();
    });
  });

  describe('properties', () => {
    it('has optional maxLength property', () => {
      const field = new TextareaFieldType();
      expect(field.maxLength).toBeUndefined();
      field.maxLength = 5000;
      expect(field.maxLength).toBe(5000);
    });

    it('has optional rows property', () => {
      const field = new TextareaFieldType();
      expect(field.rows).toBeUndefined();
      field.rows = 10;
      expect(field.rows).toBe(10);
    });

    it('has optional placeholder property', () => {
      const field = new TextareaFieldType();
      expect(field.placeholder).toBeUndefined();
      field.placeholder = '詳細を入力';
      expect(field.placeholder).toBe('詳細を入力');
    });
  });

  describe('registry', () => {
    beforeEach(() => {
      clearFieldTypeRegistry();
    });

    it('can be registered and retrieved from the registry', () => {
      registerFieldType('textarea', TextareaFieldType);
      const FieldClass = getFieldType('textarea');
      expect(FieldClass).toBe(TextareaFieldType);
    });

    it('creates a valid instance from registry', () => {
      registerFieldType('textarea', TextareaFieldType);
      const FieldClass = getFieldType('textarea');
      expect(FieldClass).toBeDefined();
      if (FieldClass) {
        const field = new FieldClass();
        expect(field.type).toBe('textarea');
        expect(field.getDefaultValue()).toBe('');
      }
    });
  });
});
