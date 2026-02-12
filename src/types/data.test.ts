import {
  createDataType,
  createDataEntry,
  validateDataId,
  isDataIdUnique,
  MAX_DATA_TYPES,
  MAX_DATA_ENTRIES_PER_TYPE,
} from './data';
import { NumberFieldType, StringFieldType, BooleanFieldType } from './fields';

describe('DataType / DataEntry', () => {
  describe('createDataType', () => {
    it('デフォルト構造で作成される', () => {
      const dt = createDataType('character', 'キャラクター');

      expect(dt.id).toBe('character');
      expect(dt.name).toBe('キャラクター');
      expect(dt.fields).toEqual([]);
      expect(dt.maxEntries).toBeUndefined();
      expect(dt.description).toBeUndefined();
    });
  });

  describe('createDataEntry', () => {
    it('フィールドのデフォルト値で初期化される', () => {
      const numField = new NumberFieldType();
      numField.id = 'hp';
      numField.name = 'HP';

      const strField = new StringFieldType();
      strField.id = 'name';
      strField.name = '名前';

      const boolField = new BooleanFieldType();
      boolField.id = 'active';
      boolField.name = '有効';

      const entry = createDataEntry('entry_001', 'character', [numField, strField, boolField]);

      expect(entry.id).toBe('entry_001');
      expect(entry.typeId).toBe('character');
      expect(entry.values['hp']).toBe(0);
      expect(entry.values['name']).toBe('');
      expect(entry.values['active']).toBe(false);
    });

    it('フィールドが空でも作成できる', () => {
      const entry = createDataEntry('entry_001', 'character', []);

      expect(entry.id).toBe('entry_001');
      expect(entry.typeId).toBe('character');
      expect(entry.values).toEqual({});
    });
  });

  describe('validateDataId', () => {
    it('空文字列はエラー', () => {
      const result = validateDataId('');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('IDは必須です');
    });

    it('数字始まりはエラー', () => {
      const result = validateDataId('1abc');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('先頭は数字不可');
    });

    it('特殊文字はエラー', () => {
      expect(validateDataId('hello-world').valid).toBe(false);
      expect(validateDataId('hello world').valid).toBe(false);
      expect(validateDataId('hello.world').valid).toBe(false);
    });

    it('有効なIDは通る', () => {
      expect(validateDataId('character').valid).toBe(true);
      expect(validateDataId('_private').valid).toBe(true);
      expect(validateDataId('item_001').valid).toBe(true);
      expect(validateDataId('HP').valid).toBe(true);
    });
  });

  describe('isDataIdUnique', () => {
    it('既存IDと重複しない場合はtrue', () => {
      expect(isDataIdUnique('new_id', ['existing_1', 'existing_2'])).toBe(true);
    });

    it('既存IDと重複する場合はfalse', () => {
      expect(isDataIdUnique('existing_1', ['existing_1', 'existing_2'])).toBe(false);
    });
  });

  describe('定数', () => {
    it('MAX_DATA_TYPES は 100', () => {
      expect(MAX_DATA_TYPES).toBe(100);
    });

    it('MAX_DATA_ENTRIES_PER_TYPE は 1000', () => {
      expect(MAX_DATA_ENTRIES_PER_TYPE).toBe(1000);
    });
  });
});
