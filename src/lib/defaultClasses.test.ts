/**
 * デフォルトクラスのテスト
 */
import {
  defaultClasses,
  STATUS_CLASS_ID,
  EFFECT_CLASS_ID,
  BATTLE_SKILL_RESULT_CLASS_ID,
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
});
