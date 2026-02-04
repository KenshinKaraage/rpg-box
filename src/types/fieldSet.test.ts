/**
 * フィールドセット型のテスト
 */
import { createFieldSet, type FieldSet } from './fieldSet';
import { FieldType } from './fields/FieldType';

describe('FieldSet', () => {
  describe('createFieldSet', () => {
    it('IDと名前から新しいフィールドセットを作成する', () => {
      const fieldSet = createFieldSet('fs_status', 'ステータス');

      expect(fieldSet.id).toBe('fs_status');
      expect(fieldSet.name).toBe('ステータス');
      expect(fieldSet.fields).toEqual([]);
    });

    it('空の配列でフィールドを初期化する', () => {
      const fieldSet = createFieldSet('fs_test', 'テスト');

      expect(Array.isArray(fieldSet.fields)).toBe(true);
      expect(fieldSet.fields.length).toBe(0);
    });
  });

  describe('FieldSet interface', () => {
    it('フィールドにFieldType配列を保持できる', () => {
      // FieldTypeは抽象クラスなので、モックオブジェクトで型チェック
      const mockField = {
        type: 'number',
        id: 'hp',
        name: 'HP',
        required: false,
      } as unknown as FieldType;

      const fieldSet: FieldSet = {
        id: 'fs_status',
        name: 'ステータス',
        fields: [mockField],
      };

      expect(fieldSet.fields.length).toBe(1);
      expect(fieldSet.fields[0]).toBe(mockField);
    });
  });
});
