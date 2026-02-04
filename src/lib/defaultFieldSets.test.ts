/**
 * デフォルトフィールドセットのテスト
 */
import {
  defaultFieldSets,
  STATUS_FIELD_SET_ID,
  EFFECT_FIELD_SET_ID,
  BATTLE_SKILL_RESULT_FIELD_SET_ID,
} from './defaultFieldSets';

describe('defaultFieldSets', () => {
  describe('定数', () => {
    it('ステータスフィールドセットIDが定義されている', () => {
      expect(STATUS_FIELD_SET_ID).toBe('fs_status');
    });

    it('エフェクトフィールドセットIDが定義されている', () => {
      expect(EFFECT_FIELD_SET_ID).toBe('fs_effect');
    });

    it('バトルスキル結果フィールドセットIDが定義されている', () => {
      expect(BATTLE_SKILL_RESULT_FIELD_SET_ID).toBe('fs_battle_skill_result');
    });
  });

  describe('ステータスフィールドセット', () => {
    it('定義されている', () => {
      const status = defaultFieldSets.find((fs) => fs.id === STATUS_FIELD_SET_ID);
      expect(status).toBeDefined();
    });

    it('HP, MP, ATK, DEFフィールドを持つ', () => {
      const status = defaultFieldSets.find((fs) => fs.id === STATUS_FIELD_SET_ID);
      expect(status?.fields.some((f) => f.id === 'hp')).toBe(true);
      expect(status?.fields.some((f) => f.id === 'mp')).toBe(true);
      expect(status?.fields.some((f) => f.id === 'atk')).toBe(true);
      expect(status?.fields.some((f) => f.id === 'def')).toBe(true);
    });

    it('全てのフィールドがnumber型', () => {
      const status = defaultFieldSets.find((fs) => fs.id === STATUS_FIELD_SET_ID);
      expect(status?.fields.every((f) => f.type === 'number')).toBe(true);
    });
  });

  describe('エフェクトフィールドセット', () => {
    it('定義されている', () => {
      const effect = defaultFieldSets.find((fs) => fs.id === EFFECT_FIELD_SET_ID);
      expect(effect).toBeDefined();
    });

    it('エフェクト関連フィールドを持つ', () => {
      const effect = defaultFieldSets.find((fs) => fs.id === EFFECT_FIELD_SET_ID);
      expect(effect?.fields.some((f) => f.id === 'effect_type')).toBe(true);
      expect(effect?.fields.some((f) => f.id === 'target')).toBe(true);
      expect(effect?.fields.some((f) => f.id === 'value')).toBe(true);
    });
  });

  describe('バトルスキル結果フィールドセット', () => {
    it('定義されている', () => {
      const result = defaultFieldSets.find((fs) => fs.id === BATTLE_SKILL_RESULT_FIELD_SET_ID);
      expect(result).toBeDefined();
    });

    it('スキル結果フィールドを持つ', () => {
      const result = defaultFieldSets.find((fs) => fs.id === BATTLE_SKILL_RESULT_FIELD_SET_ID);
      expect(result?.fields.some((f) => f.id === 'damage')).toBe(true);
      expect(result?.fields.some((f) => f.id === 'hit_rate')).toBe(true);
    });
  });
});
