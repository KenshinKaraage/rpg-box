import { BooleanFieldType } from './BooleanFieldType.tsx';
import { registerFieldType, getFieldType, clearFieldTypeRegistry } from './index';

describe('BooleanFieldType', () => {
  describe('type property', () => {
    it('returns "boolean" as the type identifier', () => {
      const field = new BooleanFieldType();
      expect(field.type).toBe('boolean');
    });
  });

  describe('getDefaultValue', () => {
    it('returns false as the default value', () => {
      const field = new BooleanFieldType();
      expect(field.getDefaultValue()).toBe(false);
    });
  });

  describe('validate', () => {
    it('returns valid for true', () => {
      const field = new BooleanFieldType();
      const result = field.validate(true);
      expect(result.valid).toBe(true);
    });

    it('returns valid for false', () => {
      const field = new BooleanFieldType();
      const result = field.validate(false);
      expect(result.valid).toBe(true);
    });

    it('returns invalid when required and value is false', () => {
      const field = new BooleanFieldType();
      field.required = true;
      const result = field.validate(false);
      expect(result.valid).toBe(false);
      expect(result.message).toBe('チェックを入れてください');
    });

    it('returns valid when required and value is true', () => {
      const field = new BooleanFieldType();
      field.required = true;
      const result = field.validate(true);
      expect(result.valid).toBe(true);
    });
  });

  describe('serialize', () => {
    it('serializes true', () => {
      const field = new BooleanFieldType();
      expect(field.serialize(true)).toBe(true);
    });

    it('serializes false', () => {
      const field = new BooleanFieldType();
      expect(field.serialize(false)).toBe(false);
    });
  });

  describe('deserialize', () => {
    it('deserializes true', () => {
      const field = new BooleanFieldType();
      expect(field.deserialize(true)).toBe(true);
    });

    it('deserializes false', () => {
      const field = new BooleanFieldType();
      expect(field.deserialize(false)).toBe(false);
    });

    it('deserializes null as false', () => {
      const field = new BooleanFieldType();
      expect(field.deserialize(null)).toBe(false);
    });

    it('deserializes undefined as false', () => {
      const field = new BooleanFieldType();
      expect(field.deserialize(undefined)).toBe(false);
    });

    it('deserializes truthy values as true', () => {
      const field = new BooleanFieldType();
      expect(field.deserialize(1)).toBe(true);
      expect(field.deserialize('true')).toBe(true);
    });

    it('deserializes falsy values as false', () => {
      const field = new BooleanFieldType();
      expect(field.deserialize(0)).toBe(false);
      expect(field.deserialize('')).toBe(false);
    });
  });

  describe('getValue', () => {
    it('returns the boolean value from data', () => {
      const field = new BooleanFieldType();
      expect(field.getValue(true)).toBe(true);
      expect(field.getValue(false)).toBe(false);
    });

    it('returns default value for null data', () => {
      const field = new BooleanFieldType();
      expect(field.getValue(null)).toBe(false);
    });
  });

  describe('renderEditor', () => {
    it('returns a ReactNode', () => {
      const field = new BooleanFieldType();
      const props = {
        value: true,
        onChange: jest.fn(),
      };
      const result = field.renderEditor(props);
      expect(result).toBeDefined();
    });
  });

  describe('properties', () => {
    it('has optional label property', () => {
      const field = new BooleanFieldType();
      expect(field.label).toBeUndefined();
      field.label = '有効にする';
      expect(field.label).toBe('有効にする');
    });
  });

  describe('registry', () => {
    beforeEach(() => {
      clearFieldTypeRegistry();
    });

    it('can be registered and retrieved from the registry', () => {
      registerFieldType('boolean', BooleanFieldType);
      const FieldClass = getFieldType('boolean');
      expect(FieldClass).toBe(BooleanFieldType);
    });

    it('creates a valid instance from registry', () => {
      registerFieldType('boolean', BooleanFieldType);
      const FieldClass = getFieldType('boolean');
      expect(FieldClass).toBeDefined();
      if (FieldClass) {
        const field = new FieldClass();
        expect(field.type).toBe('boolean');
        expect(field.getDefaultValue()).toBe(false);
      }
    });
  });
});
