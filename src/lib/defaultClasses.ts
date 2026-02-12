/**
 * デフォルトクラス
 *
 * ゲーム開発でよく使用されるクラスのプリセット
 */
import { NumberFieldType, StringFieldType, SelectFieldType } from '@/types/fields';
import type { CustomClass } from '@/types/customClass';

/** ステータスクラスID */
export const STATUS_CLASS_ID = 'class_status';

/** エフェクトクラスID */
export const EFFECT_CLASS_ID = 'class_effect';

/** バトルスキル結果クラスID */
export const BATTLE_SKILL_RESULT_CLASS_ID = 'class_battle_skill_result';

/**
 * ステータスクラスを作成
 */
function createStatusClass(): CustomClass {
  const hpField = new NumberFieldType();
  hpField.id = 'hp';
  hpField.name = 'HP';
  hpField.min = 0;
  hpField.max = 99999;

  const mpField = new NumberFieldType();
  mpField.id = 'mp';
  mpField.name = 'MP';
  mpField.min = 0;
  mpField.max = 9999;

  const atkField = new NumberFieldType();
  atkField.id = 'atk';
  atkField.name = 'ATK';
  atkField.min = 0;
  atkField.max = 9999;

  const defField = new NumberFieldType();
  defField.id = 'def';
  defField.name = 'DEF';
  defField.min = 0;
  defField.max = 9999;

  const spdField = new NumberFieldType();
  spdField.id = 'spd';
  spdField.name = 'SPD';
  spdField.min = 0;
  spdField.max = 999;

  const lukField = new NumberFieldType();
  lukField.id = 'luk';
  lukField.name = 'LUK';
  lukField.min = 0;
  lukField.max = 999;

  return {
    id: STATUS_CLASS_ID,
    name: 'ステータス',
    description: 'キャラクターの基本ステータス',
    fields: [hpField, mpField, atkField, defField, spdField, lukField],
  };
}

/**
 * エフェクトクラスを作成
 */
function createEffectClass(): CustomClass {
  const effectTypeField = new SelectFieldType();
  effectTypeField.id = 'effect_type';
  effectTypeField.name = 'エフェクト種類';
  effectTypeField.options = [
    { value: 'damage', label: 'ダメージ' },
    { value: 'heal', label: '回復' },
    { value: 'buff', label: 'バフ' },
    { value: 'debuff', label: 'デバフ' },
    { value: 'status', label: '状態異常' },
  ];

  const targetField = new SelectFieldType();
  targetField.id = 'target';
  targetField.name = '対象';
  targetField.options = [
    { value: 'self', label: '自分' },
    { value: 'single_enemy', label: '敵単体' },
    { value: 'all_enemies', label: '敵全体' },
    { value: 'single_ally', label: '味方単体' },
    { value: 'all_allies', label: '味方全体' },
    { value: 'all', label: '全体' },
  ];

  const valueField = new NumberFieldType();
  valueField.id = 'value';
  valueField.name = '効果値';
  valueField.min = 0;
  valueField.max = 99999;

  const durationField = new NumberFieldType();
  durationField.id = 'duration';
  durationField.name = '持続ターン';
  durationField.min = 0;
  durationField.max = 99;

  return {
    id: EFFECT_CLASS_ID,
    name: 'エフェクト',
    description: 'スキル・アイテムの効果定義',
    fields: [effectTypeField, targetField, valueField, durationField],
  };
}

/**
 * バトルスキル結果クラスを作成
 */
function createBattleSkillResultClass(): CustomClass {
  const damageField = new NumberFieldType();
  damageField.id = 'damage';
  damageField.name = 'ダメージ量';
  damageField.min = 0;
  damageField.max = 99999;

  const hitRateField = new NumberFieldType();
  hitRateField.id = 'hit_rate';
  hitRateField.name = '命中率(%)';
  hitRateField.min = 0;
  hitRateField.max = 100;

  const critRateField = new NumberFieldType();
  critRateField.id = 'crit_rate';
  critRateField.name = 'クリティカル率(%)';
  critRateField.min = 0;
  critRateField.max = 100;

  const critMultiplierField = new NumberFieldType();
  critMultiplierField.id = 'crit_multiplier';
  critMultiplierField.name = 'クリティカル倍率';
  critMultiplierField.min = 1;
  critMultiplierField.max = 10;
  critMultiplierField.step = 0.1;

  const formulaField = new StringFieldType();
  formulaField.id = 'formula';
  formulaField.name = 'ダメージ計算式';

  return {
    id: BATTLE_SKILL_RESULT_CLASS_ID,
    name: 'バトルスキル結果',
    description: 'スキル使用時の結果計算パラメータ',
    fields: [damageField, hitRateField, critRateField, critMultiplierField, formulaField],
  };
}

/**
 * デフォルトクラス一覧
 */
export const defaultClasses: CustomClass[] = [
  createStatusClass(),
  createEffectClass(),
  createBattleSkillResultClass(),
];
