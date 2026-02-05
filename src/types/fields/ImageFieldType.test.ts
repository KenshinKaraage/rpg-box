/**
 * ImageFieldType のテスト
 */
import { ImageFieldType } from './ImageFieldType';

describe('ImageFieldType', () => {
  let field: ImageFieldType;

  beforeEach(() => {
    field = new ImageFieldType();
    field.id = 'test_image';
    field.name = 'キャラクター画像';
  });

  describe('基本プロパティ', () => {
    it('type が "image" である', () => {
      expect(field.type).toBe('image');
    });

    it('label が "画像" である', () => {
      expect(field.label).toBe('画像');
    });
  });

  describe('getDefaultValue', () => {
    it('null を返す（未選択状態）', () => {
      expect(field.getDefaultValue()).toBeNull();
    });
  });

  describe('validate', () => {
    it('required=false の場合、null は有効', () => {
      field.required = false;
      const result = field.validate(null);
      expect(result.valid).toBe(true);
    });

    it('required=true の場合、null は無効', () => {
      field.required = true;
      const result = field.validate(null);
      expect(result.valid).toBe(false);
      expect(result.message).toBe('画像を選択してください');
    });

    it('アセットIDがある場合は有効', () => {
      field.required = true;
      const result = field.validate('asset_001');
      expect(result.valid).toBe(true);
    });
  });

  describe('serialize / deserialize', () => {
    it('アセットIDをそのままシリアライズ', () => {
      expect(field.serialize('asset_001')).toBe('asset_001');
    });

    it('null をシリアライズ', () => {
      expect(field.serialize(null)).toBeNull();
    });

    it('デシリアライズで文字列またはnullに変換', () => {
      expect(field.deserialize('asset_001')).toBe('asset_001');
      expect(field.deserialize(null)).toBeNull();
      expect(field.deserialize(undefined)).toBeNull();
    });
  });

  describe('getValue', () => {
    it('データから値を取得', () => {
      expect(field.getValue('asset_001')).toBe('asset_001');
      expect(field.getValue(null)).toBeNull();
    });
  });
});
