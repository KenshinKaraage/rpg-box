import { NumberFieldType } from './NumberFieldType.tsx';
import { registerFieldType, getFieldType, clearFieldTypeRegistry } from './index';

describe('NumberFieldType', () => {
  describe('type property', () => {
    it('returns "number" as the type identifier', () => {
      const field = new NumberFieldType();
      expect(field.type).toBe('number');
    });
  });

  describe('getDefaultValue', () => {
    it('returns 0 as the default value', () => {
      const field = new NumberFieldType();
      expect(field.getDefaultValue()).toBe(0);
    });
  });

  describe('validate', () => {
    it('returns valid for a number within range', () => {
      const field = new NumberFieldType();
      field.min = 0;
      field.max = 100;
      const result = field.validate(50);
      expect(result.valid).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it('returns invalid when value is below min', () => {
      const field = new NumberFieldType();
      field.min = 10;
      const result = field.validate(5);
      expect(result.valid).toBe(false);
      expect(result.message).toBe('10以上の値を入力してください');
    });

    it('returns invalid when value is above max', () => {
      const field = new NumberFieldType();
      field.max = 100;
      const result = field.validate(150);
      expect(result.valid).toBe(false);
      expect(result.message).toBe('100以下の値を入力してください');
    });

    it('returns valid when min and max are not set', () => {
      const field = new NumberFieldType();
      const result = field.validate(999999);
      expect(result.valid).toBe(true);
    });

    it('returns invalid when required and value is NaN', () => {
      const field = new NumberFieldType();
      field.required = true;
      const result = field.validate(NaN);
      expect(result.valid).toBe(false);
      expect(result.message).toBe('値を入力してください');
    });

    it('returns valid when not required and value is NaN', () => {
      const field = new NumberFieldType();
      field.required = false;
      const result = field.validate(NaN);
      expect(result.valid).toBe(true);
    });
  });

  describe('serialize', () => {
    it('serializes a number value', () => {
      const field = new NumberFieldType();
      expect(field.serialize(42)).toBe(42);
    });

    it('serializes NaN as null', () => {
      const field = new NumberFieldType();
      expect(field.serialize(NaN)).toBeNull();
    });
  });

  describe('deserialize', () => {
    it('deserializes a number value', () => {
      const field = new NumberFieldType();
      expect(field.deserialize(42)).toBe(42);
    });

    it('deserializes null as NaN', () => {
      const field = new NumberFieldType();
      expect(field.deserialize(null)).toBeNaN();
    });

    it('deserializes undefined as NaN', () => {
      const field = new NumberFieldType();
      expect(field.deserialize(undefined)).toBeNaN();
    });

    it('deserializes string number as number', () => {
      const field = new NumberFieldType();
      expect(field.deserialize('123')).toBe(123);
    });

    it('deserializes invalid string as NaN', () => {
      const field = new NumberFieldType();
      expect(field.deserialize('invalid')).toBeNaN();
    });
  });

  describe('getValue', () => {
    it('returns the number value from data', () => {
      const field = new NumberFieldType();
      expect(field.getValue(42)).toBe(42);
    });

    it('returns default value for null data', () => {
      const field = new NumberFieldType();
      expect(field.getValue(null)).toBe(0);
    });
  });

  describe('renderEditor', () => {
    it('returns a ReactNode', () => {
      const field = new NumberFieldType();
      const props = {
        value: 10,
        onChange: jest.fn(),
      };
      const result = field.renderEditor(props);
      expect(result).toBeDefined();
    });
  });

  describe('properties', () => {
    it('has optional min property', () => {
      const field = new NumberFieldType();
      expect(field.min).toBeUndefined();
      field.min = 0;
      expect(field.min).toBe(0);
    });

    it('has optional max property', () => {
      const field = new NumberFieldType();
      expect(field.max).toBeUndefined();
      field.max = 100;
      expect(field.max).toBe(100);
    });

    it('has optional step property', () => {
      const field = new NumberFieldType();
      expect(field.step).toBeUndefined();
      field.step = 0.1;
      expect(field.step).toBe(0.1);
    });
  });

  describe('registry', () => {
    beforeEach(() => {
      clearFieldTypeRegistry();
    });

    it('can be registered and retrieved from the registry', () => {
      registerFieldType('number', NumberFieldType);
      const FieldClass = getFieldType('number');
      expect(FieldClass).toBe(NumberFieldType);
    });

    it('creates a valid instance from registry', () => {
      registerFieldType('number', NumberFieldType);
      const FieldClass = getFieldType('number');
      expect(FieldClass).toBeDefined();
      if (FieldClass) {
        const field = new FieldClass();
        expect(field.type).toBe('number');
        expect(field.getDefaultValue()).toBe(0);
      }
    });
  });
});
