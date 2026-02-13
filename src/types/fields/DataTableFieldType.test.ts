import { DataTableFieldType } from './DataTableFieldType';
import type { DataTableRow } from './DataTableFieldType';

describe('DataTableFieldType', () => {
  let field: DataTableFieldType;

  beforeEach(() => {
    field = new DataTableFieldType();
    field.id = 'element_resistance';
    field.name = '属性耐性';
    field.referenceTypeId = 'element_type';
    field.columns = [{ id: 'rate', name: '耐性率', fieldType: 'number' }];
  });

  it('type と label が正しい', () => {
    expect(field.type).toBe('dataTable');
    expect(field.label).toBe('データテーブル');
  });

  it('デフォルト値は空配列', () => {
    expect(field.getDefaultValue()).toEqual([]);
  });

  describe('validate', () => {
    it('required でなければ空配列でも valid', () => {
      field.required = false;
      expect(field.validate([])).toEqual({ valid: true });
    });

    it('required で空配列は invalid', () => {
      field.required = true;
      const result = field.validate([]);
      expect(result.valid).toBe(false);
      expect(result.message).toBeDefined();
    });

    it('required でも要素があれば valid', () => {
      field.required = true;
      const rows: DataTableRow[] = [{ id: 'fire', values: { rate: 50 } }];
      expect(field.validate(rows)).toEqual({ valid: true });
    });
  });

  describe('serialize / deserialize', () => {
    it('配列をそのまま serialize', () => {
      const value: DataTableRow[] = [
        { id: 'fire', values: { rate: 50 } },
        { id: 'water', values: { rate: 100 } },
      ];
      expect(field.serialize(value)).toEqual(value);
    });

    it('配列を deserialize', () => {
      const data = [
        { id: 'fire', values: { rate: 50 } },
        { id: 'water', values: { rate: 100 } },
      ];
      expect(field.deserialize(data)).toEqual(data);
    });

    it('非配列は空配列を返す', () => {
      expect(field.deserialize(null)).toEqual([]);
      expect(field.deserialize(undefined)).toEqual([]);
      expect(field.deserialize('invalid')).toEqual([]);
      expect(field.deserialize(42)).toEqual([]);
    });

    it('id を持たないオブジェクトをフィルタ', () => {
      const data = [{ id: 'fire', values: {} }, { notId: 'bad' }, { id: 'water', values: {} }];
      expect(field.deserialize(data)).toEqual([
        { id: 'fire', values: {} },
        { id: 'water', values: {} },
      ]);
    });

    it('null 要素をフィルタ', () => {
      const data = [{ id: 'fire', values: {} }, null, { id: 'water', values: {} }];
      expect(field.deserialize(data)).toEqual([
        { id: 'fire', values: {} },
        { id: 'water', values: {} },
      ]);
    });
  });

  describe('getValue', () => {
    it('配列をそのまま返す', () => {
      const data: DataTableRow[] = [{ id: 'fire', values: { rate: 50 } }];
      expect(field.getValue(data)).toEqual(data);
    });

    it('非配列は空配列を返す', () => {
      expect(field.getValue(null)).toEqual([]);
      expect(field.getValue(undefined)).toEqual([]);
    });
  });

  describe('columns プロパティ', () => {
    it('デフォルトは空配列', () => {
      const f = new DataTableFieldType();
      expect(f.columns).toEqual([]);
    });

    it('複数カラムを設定できる', () => {
      field.columns = [
        { id: 'rate', name: '耐性率', fieldType: 'number' },
        { id: 'note', name: '備考', fieldType: 'string' },
      ];
      expect(field.columns).toHaveLength(2);
    });
  });
});
