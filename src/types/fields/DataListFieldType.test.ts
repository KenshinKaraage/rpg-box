/**
 * DataListFieldType のテスト
 */
import { DataListFieldType } from './DataListFieldType';

describe('DataListFieldType', () => {
  let field: DataListFieldType;

  beforeEach(() => {
    field = new DataListFieldType();
    field.id = 'test_data_list';
    field.name = 'タグ一覧';
    field.referenceTypeId = 'tag_type';
  });

  describe('基本プロパティ', () => {
    it('type が "dataList" である', () => {
      expect(field.type).toBe('dataList');
    });

    it('label が "データ参照(複数)" である', () => {
      expect(field.label).toBe('データ参照(複数)');
    });

    it('referenceTypeId のデフォルト値は空文字列', () => {
      const newField = new DataListFieldType();
      expect(newField.referenceTypeId).toBe('');
    });
  });

  describe('getDefaultValue', () => {
    it('空配列を返す', () => {
      expect(field.getDefaultValue()).toEqual([]);
    });
  });

  describe('validate', () => {
    it('required=false の場合、空配列は有効', () => {
      field.required = false;
      const result = field.validate([]);
      expect(result.valid).toBe(true);
    });

    it('required=true の場合、空配列は無効', () => {
      field.required = true;
      const result = field.validate([]);
      expect(result.valid).toBe(false);
      expect(result.message).toBe('1件以上選択してください');
    });

    it('required=true の場合、1件以上の選択は有効', () => {
      field.required = true;
      const result = field.validate(['entry_001']);
      expect(result.valid).toBe(true);
    });

    it('required=false の場合、値がある場合も有効', () => {
      field.required = false;
      const result = field.validate(['entry_001', 'entry_002']);
      expect(result.valid).toBe(true);
    });
  });

  describe('serialize', () => {
    it('配列をそのままシリアライズする', () => {
      expect(field.serialize(['entry_001', 'entry_002'])).toEqual(['entry_001', 'entry_002']);
    });

    it('空配列をシリアライズする', () => {
      expect(field.serialize([])).toEqual([]);
    });
  });

  describe('deserialize', () => {
    it('文字列配列をデシリアライズする', () => {
      expect(field.deserialize(['entry_001', 'entry_002'])).toEqual(['entry_001', 'entry_002']);
    });

    it('null の場合は空配列を返す', () => {
      expect(field.deserialize(null)).toEqual([]);
    });

    it('undefined の場合は空配列を返す', () => {
      expect(field.deserialize(undefined)).toEqual([]);
    });

    it('配列でない場合は空配列を返す', () => {
      expect(field.deserialize('entry_001')).toEqual([]);
      expect(field.deserialize(42)).toEqual([]);
    });

    it('文字列以外の要素は除外する', () => {
      expect(field.deserialize(['entry_001', 42, null, 'entry_002'])).toEqual([
        'entry_001',
        'entry_002',
      ]);
    });
  });

  describe('getValue', () => {
    it('文字列配列をそのまま返す', () => {
      expect(field.getValue(['entry_001', 'entry_002'])).toEqual(['entry_001', 'entry_002']);
    });

    it('null の場合は空配列を返す', () => {
      expect(field.getValue(null)).toEqual([]);
    });

    it('undefined の場合は空配列を返す', () => {
      expect(field.getValue(undefined)).toEqual([]);
    });

    it('配列でない場合は空配列を返す', () => {
      expect(field.getValue('not_an_array')).toEqual([]);
    });

    it('文字列以外の要素は除外する', () => {
      expect(field.getValue(['entry_001', 99, 'entry_002'])).toEqual(['entry_001', 'entry_002']);
    });
  });
});
