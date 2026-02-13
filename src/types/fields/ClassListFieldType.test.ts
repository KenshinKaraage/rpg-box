import { ClassListFieldType } from './ClassListFieldType';

describe('ClassListFieldType', () => {
  let field: ClassListFieldType;

  beforeEach(() => {
    field = new ClassListFieldType();
    field.id = 'learned_skills';
    field.name = '習得スキル';
    field.classId = 'class_learned_skill';
  });

  it('type と label が正しい', () => {
    expect(field.type).toBe('classList');
    expect(field.label).toBe('クラスリスト');
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
      expect(field.validate([{ level: 1, skillId: 'skill_001' }])).toEqual({ valid: true });
    });
  });

  describe('serialize / deserialize', () => {
    it('配列をそのまま serialize', () => {
      const value = [{ level: 1 }, { level: 5 }];
      expect(field.serialize(value)).toEqual(value);
    });

    it('配列を deserialize', () => {
      const data = [{ level: 1 }, { level: 5 }];
      expect(field.deserialize(data)).toEqual(data);
    });

    it('非配列は空配列を返す', () => {
      expect(field.deserialize(null)).toEqual([]);
      expect(field.deserialize(undefined)).toEqual([]);
      expect(field.deserialize('invalid')).toEqual([]);
      expect(field.deserialize(42)).toEqual([]);
    });

    it('配列内の非オブジェクトをフィルタ', () => {
      const data = [{ a: 1 }, null, 'str', { b: 2 }];
      expect(field.deserialize(data)).toEqual([{ a: 1 }, { b: 2 }]);
    });
  });

  describe('getValue', () => {
    it('配列をそのまま返す', () => {
      const data = [{ level: 1 }];
      expect(field.getValue(data)).toEqual(data);
    });

    it('非配列は空配列を返す', () => {
      expect(field.getValue(null)).toEqual([]);
      expect(field.getValue(undefined)).toEqual([]);
    });
  });
});
