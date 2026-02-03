import { SelectFieldType } from './SelectFieldType.tsx';
import { registerFieldType, getFieldType, clearFieldTypeRegistry } from './index';

describe('SelectFieldType', () => {
  const sampleOptions = [
    { value: 'option1', label: 'オプション1' },
    { value: 'option2', label: 'オプション2' },
    { value: 'option3', label: 'オプション3' },
  ];

  describe('type property', () => {
    it('returns "select" as the type identifier', () => {
      const field = new SelectFieldType();
      expect(field.type).toBe('select');
    });
  });

  describe('getDefaultValue', () => {
    it('returns the first option value as default when options exist', () => {
      const field = new SelectFieldType();
      field.options = sampleOptions;
      expect(field.getDefaultValue()).toBe('option1');
    });

    it('returns empty string when no options exist', () => {
      const field = new SelectFieldType();
      field.options = [];
      expect(field.getDefaultValue()).toBe('');
    });
  });

  describe('validate', () => {
    it('returns valid for a value in options', () => {
      const field = new SelectFieldType();
      field.options = sampleOptions;
      const result = field.validate('option2');
      expect(result.valid).toBe(true);
    });

    it('returns invalid for a value not in options', () => {
      const field = new SelectFieldType();
      field.options = sampleOptions;
      const result = field.validate('invalid');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('有効な選択肢を選んでください');
    });

    it('returns invalid when required and value is empty', () => {
      const field = new SelectFieldType();
      field.options = sampleOptions;
      field.required = true;
      const result = field.validate('');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('選択してください');
    });

    it('returns valid when not required and value is empty', () => {
      const field = new SelectFieldType();
      field.options = sampleOptions;
      field.required = false;
      const result = field.validate('');
      expect(result.valid).toBe(true);
    });
  });

  describe('serialize', () => {
    it('serializes the value', () => {
      const field = new SelectFieldType();
      expect(field.serialize('option1')).toBe('option1');
    });

    it('serializes empty string', () => {
      const field = new SelectFieldType();
      expect(field.serialize('')).toBe('');
    });
  });

  describe('deserialize', () => {
    it('deserializes a string value', () => {
      const field = new SelectFieldType();
      expect(field.deserialize('option1')).toBe('option1');
    });

    it('deserializes null as empty string', () => {
      const field = new SelectFieldType();
      expect(field.deserialize(null)).toBe('');
    });

    it('deserializes undefined as empty string', () => {
      const field = new SelectFieldType();
      expect(field.deserialize(undefined)).toBe('');
    });
  });

  describe('getValue', () => {
    it('returns the string value from data', () => {
      const field = new SelectFieldType();
      expect(field.getValue('option1')).toBe('option1');
    });

    it('returns first option value for null data when options exist', () => {
      const field = new SelectFieldType();
      field.options = sampleOptions;
      expect(field.getValue(null)).toBe('option1');
    });

    it('returns empty string for null data when no options exist', () => {
      const field = new SelectFieldType();
      field.options = [];
      expect(field.getValue(null)).toBe('');
    });
  });

  describe('renderEditor', () => {
    it('returns a ReactNode', () => {
      const field = new SelectFieldType();
      field.options = sampleOptions;
      const props = {
        value: 'option1',
        onChange: jest.fn(),
      };
      const result = field.renderEditor(props);
      expect(result).toBeDefined();
    });
  });

  describe('properties', () => {
    it('has options property', () => {
      const field = new SelectFieldType();
      expect(field.options).toEqual([]);
      field.options = sampleOptions;
      expect(field.options).toEqual(sampleOptions);
    });

    it('has optional placeholder property', () => {
      const field = new SelectFieldType();
      expect(field.placeholder).toBeUndefined();
      field.placeholder = '選択してください';
      expect(field.placeholder).toBe('選択してください');
    });
  });

  describe('registry', () => {
    beforeEach(() => {
      clearFieldTypeRegistry();
    });

    it('can be registered and retrieved from the registry', () => {
      registerFieldType('select', SelectFieldType);
      const FieldClass = getFieldType('select');
      expect(FieldClass).toBe(SelectFieldType);
    });

    it('creates a valid instance from registry', () => {
      registerFieldType('select', SelectFieldType);
      const FieldClass = getFieldType('select');
      expect(FieldClass).toBeDefined();
      if (FieldClass) {
        const field = new FieldClass();
        expect(field.type).toBe('select');
      }
    });
  });
});
