/**
 * DataSelectFieldType のテスト
 */
import { DataSelectFieldType } from './DataSelectFieldType';

describe('DataSelectFieldType', () => {
  let field: DataSelectFieldType;

  beforeEach(() => {
    field = new DataSelectFieldType();
    field.id = 'test_data_select';
    field.name = 'キャラクター参照';
  });

  describe('基本プロパティ', () => {
    it('type が "dataSelect" である', () => {
      expect(field.type).toBe('dataSelect');
    });

    it('label が "データ参照" である', () => {
      expect(field.label).toBe('データ参照');
    });

    it('referenceTypeId のデフォルト値が空文字列である', () => {
      expect(field.referenceTypeId).toBe('');
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
      expect(result.message).toBe('エントリを選択してください');
    });

    it('エントリIDがある場合は有効', () => {
      field.required = true;
      const result = field.validate('entry_001');
      expect(result.valid).toBe(true);
    });

    it('required=false でエントリIDがある場合は有効', () => {
      field.required = false;
      const result = field.validate('entry_001');
      expect(result.valid).toBe(true);
    });
  });

  describe('serialize / deserialize', () => {
    it('エントリIDをそのままシリアライズ', () => {
      expect(field.serialize('entry_001')).toBe('entry_001');
    });

    it('null をシリアライズ', () => {
      expect(field.serialize(null)).toBeNull();
    });

    it('デシリアライズで文字列またはnullに変換', () => {
      expect(field.deserialize('entry_001')).toBe('entry_001');
      expect(field.deserialize(null)).toBeNull();
      expect(field.deserialize(undefined)).toBeNull();
      expect(field.deserialize(123)).toBeNull();
      expect(field.deserialize({})).toBeNull();
    });
  });

  describe('getValue', () => {
    it('文字列データから値を取得', () => {
      expect(field.getValue('entry_001')).toBe('entry_001');
    });

    it('null の場合 null を返す', () => {
      expect(field.getValue(null)).toBeNull();
    });

    it('文字列以外の場合 null を返す', () => {
      expect(field.getValue(123)).toBeNull();
      expect(field.getValue({})).toBeNull();
      expect(field.getValue(undefined)).toBeNull();
    });
  });
});
