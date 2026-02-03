import { ColorFieldType } from './ColorFieldType.tsx';
import { registerFieldType, getFieldType, clearFieldTypeRegistry } from './index';

describe('ColorFieldType', () => {
  describe('type property', () => {
    it('returns "color" as the type identifier', () => {
      const field = new ColorFieldType();
      expect(field.type).toBe('color');
    });
  });

  describe('getDefaultValue', () => {
    it('returns #000000 as the default value', () => {
      const field = new ColorFieldType();
      expect(field.getDefaultValue()).toBe('#000000');
    });
  });

  describe('validate', () => {
    it('returns valid for a valid hex color', () => {
      const field = new ColorFieldType();
      const result = field.validate('#ff5500');
      expect(result.valid).toBe(true);
    });

    it('returns valid for uppercase hex color', () => {
      const field = new ColorFieldType();
      const result = field.validate('#FF5500');
      expect(result.valid).toBe(true);
    });

    it('returns valid for short hex color', () => {
      const field = new ColorFieldType();
      const result = field.validate('#f50');
      expect(result.valid).toBe(true);
    });

    it('returns invalid for invalid hex format', () => {
      const field = new ColorFieldType();
      const result = field.validate('ff5500'); // missing #
      expect(result.valid).toBe(false);
      expect(result.message).toBe('有効な色コードを入力してください（例: #ff0000）');
    });

    it('returns invalid for invalid characters', () => {
      const field = new ColorFieldType();
      const result = field.validate('#gggggg');
      expect(result.valid).toBe(false);
    });

    it('returns invalid when required and value is empty', () => {
      const field = new ColorFieldType();
      field.required = true;
      const result = field.validate('');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('色を選択してください');
    });

    it('returns valid when not required and value is empty', () => {
      const field = new ColorFieldType();
      field.required = false;
      const result = field.validate('');
      expect(result.valid).toBe(true);
    });
  });

  describe('serialize', () => {
    it('serializes a hex color', () => {
      const field = new ColorFieldType();
      expect(field.serialize('#ff5500')).toBe('#ff5500');
    });

    it('serializes to lowercase', () => {
      const field = new ColorFieldType();
      expect(field.serialize('#FF5500')).toBe('#ff5500');
    });
  });

  describe('deserialize', () => {
    it('deserializes a hex color', () => {
      const field = new ColorFieldType();
      expect(field.deserialize('#ff5500')).toBe('#ff5500');
    });

    it('deserializes null as default color', () => {
      const field = new ColorFieldType();
      expect(field.deserialize(null)).toBe('#000000');
    });

    it('deserializes undefined as default color', () => {
      const field = new ColorFieldType();
      expect(field.deserialize(undefined)).toBe('#000000');
    });
  });

  describe('getValue', () => {
    it('returns the color value from data', () => {
      const field = new ColorFieldType();
      expect(field.getValue('#ff5500')).toBe('#ff5500');
    });

    it('returns default value for null data', () => {
      const field = new ColorFieldType();
      expect(field.getValue(null)).toBe('#000000');
    });
  });

  describe('renderEditor', () => {
    it('returns a ReactNode', () => {
      const field = new ColorFieldType();
      const props = {
        value: '#ff5500',
        onChange: jest.fn(),
      };
      const result = field.renderEditor(props);
      expect(result).toBeDefined();
    });
  });

  describe('properties', () => {
    it('has optional showHexInput property', () => {
      const field = new ColorFieldType();
      expect(field.showHexInput).toBeUndefined();
      field.showHexInput = true;
      expect(field.showHexInput).toBe(true);
    });
  });

  describe('registry', () => {
    beforeEach(() => {
      clearFieldTypeRegistry();
    });

    it('can be registered and retrieved from the registry', () => {
      registerFieldType('color', ColorFieldType);
      const FieldClass = getFieldType('color');
      expect(FieldClass).toBe(ColorFieldType);
    });

    it('creates a valid instance from registry', () => {
      registerFieldType('color', ColorFieldType);
      const FieldClass = getFieldType('color');
      expect(FieldClass).toBeDefined();
      if (FieldClass) {
        const field = new FieldClass();
        expect(field.type).toBe('color');
        expect(field.getDefaultValue()).toBe('#000000');
      }
    });
  });
});
