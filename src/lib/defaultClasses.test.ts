/**
 * デフォルトクラスのテスト
 */
import {
  defaultClasses,
  STATUS_CLASS_ID,
  EFFECT_CLASS_ID,
  BATTLE_SKILL_RESULT_CLASS_ID,
  LEARN_SKILL_CLASS_ID,
  DROP_ITEM_CLASS_ID,
  ENEMY_MEMBER_CLASS_ID,
  ACTION_PATTERN_CLASS_ID,
} from './defaultClasses';

describe('defaultClasses', () => {
  describe('定数', () => {
    it('ステータスクラスIDが定義されている', () => {
      expect(STATUS_CLASS_ID).toBe('class_status');
    });

    it('エフェクトクラスIDが定義されている', () => {
      expect(EFFECT_CLASS_ID).toBe('class_effect');
    });

    it('バトルスキル結果クラスIDが定義されている', () => {
      expect(BATTLE_SKILL_RESULT_CLASS_ID).toBe('class_battle_skill_result');
    });
  });

  describe('ステータスクラス', () => {
    it('定義されている', () => {
      const status = defaultClasses.find((c) => c.id === STATUS_CLASS_ID);
      expect(status).toBeDefined();
    });

    it('HP, MP, ATK, DEFフィールドを持つ', () => {
      const status = defaultClasses.find((c) => c.id === STATUS_CLASS_ID);
      expect(status?.fields.some((f) => f.id === 'hp')).toBe(true);
      expect(status?.fields.some((f) => f.id === 'mp')).toBe(true);
      expect(status?.fields.some((f) => f.id === 'atk')).toBe(true);
      expect(status?.fields.some((f) => f.id === 'def')).toBe(true);
    });

    it('全てのフィールドがnumber型', () => {
      const status = defaultClasses.find((c) => c.id === STATUS_CLASS_ID);
      expect(status?.fields.every((f) => f.type === 'number')).toBe(true);
    });
  });

  describe('エフェクトクラス', () => {
    it('定義されている', () => {
      const effect = defaultClasses.find((c) => c.id === EFFECT_CLASS_ID);
      expect(effect).toBeDefined();
    });

    it('エフェクト関連フィールドを持つ', () => {
      const effect = defaultClasses.find((c) => c.id === EFFECT_CLASS_ID);
      expect(effect?.fields.some((f) => f.id === 'effect_type')).toBe(true);
      expect(effect?.fields.some((f) => f.id === 'target')).toBe(true);
      expect(effect?.fields.some((f) => f.id === 'value')).toBe(true);
    });
  });

  describe('バトルスキル結果クラス', () => {
    it('定義されている', () => {
      const result = defaultClasses.find((c) => c.id === BATTLE_SKILL_RESULT_CLASS_ID);
      expect(result).toBeDefined();
    });

    it('スキル結果フィールドを持つ', () => {
      const result = defaultClasses.find((c) => c.id === BATTLE_SKILL_RESULT_CLASS_ID);
      expect(result?.fields.some((f) => f.id === 'damage')).toBe(true);
      expect(result?.fields.some((f) => f.id === 'hit_rate')).toBe(true);
    });
  });

  describe('習得スキルクラス', () => {
    it('定義されている', () => {
      const cls = defaultClasses.find((c) => c.id === LEARN_SKILL_CLASS_ID);
      expect(cls).toBeDefined();
      expect(cls?.name).toBe('習得スキル');
    });

    it('level(number)とskill(dataSelect)フィールドを持つ', () => {
      const cls = defaultClasses.find((c) => c.id === LEARN_SKILL_CLASS_ID)!;
      const level = cls.fields.find((f) => f.id === 'level');
      const skill = cls.fields.find((f) => f.id === 'skill');
      expect(level?.type).toBe('number');
      expect(skill?.type).toBe('dataSelect');
    });
  });

  describe('ドロップアイテムクラス', () => {
    it('定義されている', () => {
      const cls = defaultClasses.find((c) => c.id === DROP_ITEM_CLASS_ID);
      expect(cls).toBeDefined();
      expect(cls?.name).toBe('ドロップアイテム');
    });

    it('item(dataSelect)とrate(number)フィールドを持つ', () => {
      const cls = defaultClasses.find((c) => c.id === DROP_ITEM_CLASS_ID)!;
      const item = cls.fields.find((f) => f.id === 'item');
      const rate = cls.fields.find((f) => f.id === 'rate');
      expect(item?.type).toBe('dataSelect');
      expect(rate?.type).toBe('number');
    });
  });

  describe('敵グループ構成クラス', () => {
    it('定義されている', () => {
      const cls = defaultClasses.find((c) => c.id === ENEMY_MEMBER_CLASS_ID);
      expect(cls).toBeDefined();
      expect(cls?.name).toBe('敵グループ構成');
    });

    it('enemy(dataSelect)とcount(number)フィールドを持つ', () => {
      const cls = defaultClasses.find((c) => c.id === ENEMY_MEMBER_CLASS_ID)!;
      const enemy = cls.fields.find((f) => f.id === 'enemy');
      const count = cls.fields.find((f) => f.id === 'count');
      expect(enemy?.type).toBe('dataSelect');
      expect(count?.type).toBe('number');
    });
  });

  describe('行動パターンクラス', () => {
    it('定義されている', () => {
      const cls = defaultClasses.find((c) => c.id === ACTION_PATTERN_CLASS_ID);
      expect(cls).toBeDefined();
      expect(cls?.name).toBe('行動パターン');
    });

    it('skill(dataSelect), condition(select), priority(number)フィールドを持つ', () => {
      const cls = defaultClasses.find((c) => c.id === ACTION_PATTERN_CLASS_ID)!;
      const skill = cls.fields.find((f) => f.id === 'skill');
      const condition = cls.fields.find((f) => f.id === 'condition');
      const priority = cls.fields.find((f) => f.id === 'priority');
      expect(skill?.type).toBe('dataSelect');
      expect(condition?.type).toBe('select');
      expect(priority?.type).toBe('number');
    });
  });
});
