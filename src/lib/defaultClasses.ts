/**
 * デフォルトクラス
 *
 * ゲーム開発でよく使用されるクラスのプリセット
 */
import { createFieldTypeInstance } from '@/types/fields';
import type { FieldType } from '@/types/fields';
import type { CustomClass } from '@/types/customClass';

// =============================================================================
// ヘルパー
// =============================================================================

/**
 * フィールドインスタンスを生成するヘルパー
 * レジストリ経由で型を解決し、propsをObject.assignで設定
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function f(type: string, props: Record<string, unknown>): FieldType<any> {
  const instance = createFieldTypeInstance(type);
  if (!instance) throw new Error(`Unknown field type: ${type}`);
  return Object.assign(instance, props);
}

// =============================================================================
// ID定数
// =============================================================================

/** ステータスクラスID */
export const STATUS_CLASS_ID = 'class_status';

/** エフェクトクラスID */
export const EFFECT_CLASS_ID = 'class_effect';

/** バトルスキル結果クラスID */
export const BATTLE_SKILL_RESULT_CLASS_ID = 'class_battle_skill_result';

/** 習得スキルクラスID */
export const LEARN_SKILL_CLASS_ID = 'class_learn_skill';

/** ドロップアイテムクラスID */
export const DROP_ITEM_CLASS_ID = 'class_drop_item';

/** 敵グループ構成クラスID */
export const ENEMY_MEMBER_CLASS_ID = 'class_enemy_member';

/** 行動パターンクラスID */
export const ACTION_PATTERN_CLASS_ID = 'class_action_pattern';

/** パーティメンバークラスID */
export const PARTY_MEMBER_CLASS_ID = 'class_party_member';

// =============================================================================
// ファクトリ関数（既存クラス）
// =============================================================================

function createStatusClass(): CustomClass {
  return {
    id: STATUS_CLASS_ID,
    name: 'ステータス',
    description: 'キャラクターの基本ステータス',
    fields: [
      f('number', { id: 'hp', name: 'HP', min: 0, max: 99999 }),
      f('number', { id: 'mp', name: 'MP', min: 0, max: 9999 }),
      f('number', { id: 'atk', name: 'ATK', min: 0, max: 9999 }),
      f('number', { id: 'def', name: 'DEF', min: 0, max: 9999 }),
      f('number', { id: 'matk', name: 'MATK', min: 0, max: 9999 }),
      f('number', { id: 'mdef', name: 'MDEF', min: 0, max: 9999 }),
      f('number', { id: 'spd', name: 'SPD', min: 0, max: 999 }),
      f('number', { id: 'luk', name: 'LUK', min: 0, max: 999 }),
    ],
  };
}

function createEffectClass(): CustomClass {
  return {
    id: EFFECT_CLASS_ID,
    name: 'エフェクト',
    description: 'スキル・アイテムの効果定義',
    fields: [
      f('select', {
        id: 'effect_type',
        name: 'エフェクト種類',
        options: [
          { value: 'damage', label: 'ダメージ' },
          { value: 'heal', label: '回復' },
          { value: 'buff', label: 'バフ' },
          { value: 'debuff', label: 'デバフ' },
          { value: 'status', label: '状態異常' },
        ],
      }),
      f('select', {
        id: 'target',
        name: '対象',
        options: [
          { value: 'self', label: '自分' },
          { value: 'single_enemy', label: '敵単体' },
          { value: 'all_enemies', label: '敵全体' },
          { value: 'single_ally', label: '味方単体' },
          { value: 'all_allies', label: '味方全体' },
          { value: 'all', label: '全体' },
        ],
      }),
      f('number', { id: 'value', name: '効果値', min: 0, max: 99999 }),
      f('number', { id: 'duration', name: '持続ターン', min: 0, max: 99 }),
    ],
  };
}

function createBattleSkillResultClass(): CustomClass {
  return {
    id: BATTLE_SKILL_RESULT_CLASS_ID,
    name: 'バトルスキル結果',
    description: 'スキル使用時の結果計算パラメータ',
    fields: [
      f('number', { id: 'damage', name: 'ダメージ量', min: 0, max: 99999 }),
      f('number', { id: 'hit_rate', name: '命中率(%)', min: 0, max: 100 }),
      f('number', { id: 'crit_rate', name: 'クリティカル率(%)', min: 0, max: 100 }),
      f('number', { id: 'crit_multiplier', name: 'クリティカル倍率', min: 1, max: 10, step: 0.1 }),
      f('string', { id: 'formula', name: 'ダメージ計算式' }),
    ],
  };
}

// =============================================================================
// ファクトリ関数（サポートクラス）
// =============================================================================

function createLearnSkillClass(): CustomClass {
  return {
    id: LEARN_SKILL_CLASS_ID,
    name: '習得スキル',
    description: 'レベルごとに習得するスキルの定義',
    fields: [
      f('number', { id: 'level', name: '習得レベル', min: 1, max: 99 }),
      f('dataSelect', { id: 'skill', name: 'スキル', referenceTypeId: 'skill' }),
    ],
  };
}

function createDropItemClass(): CustomClass {
  return {
    id: DROP_ITEM_CLASS_ID,
    name: 'ドロップアイテム',
    description: '敵がドロップするアイテムと確率',
    fields: [
      f('dataSelect', { id: 'item', name: 'アイテム', referenceTypeId: 'item' }),
      f('number', { id: 'rate', name: 'ドロップ率(%)', min: 0, max: 100 }),
    ],
  };
}

function createEnemyMemberClass(): CustomClass {
  return {
    id: ENEMY_MEMBER_CLASS_ID,
    name: '敵グループ構成',
    description: '敵グループに含まれる敵とその数',
    fields: [
      f('dataSelect', { id: 'enemy', name: '敵', referenceTypeId: 'enemy' }),
      f('number', { id: 'count', name: '数', min: 1, max: 99 }),
    ],
  };
}

function createActionPatternClass(): CustomClass {
  return {
    id: ACTION_PATTERN_CLASS_ID,
    name: '行動パターン',
    description: '敵の行動パターン定義',
    fields: [
      f('dataSelect', { id: 'skill', name: 'スキル', referenceTypeId: 'skill' }),
      f('select', {
        id: 'condition',
        name: '発動条件',
        options: [
          { value: 'always', label: '常時' },
          { value: 'hp_low', label: 'HP低下時' },
          { value: 'hp_high', label: 'HP高い時' },
          { value: 'turn', label: '特定ターン' },
          { value: 'alone', label: '単独時' },
        ],
      }),
      f('number', { id: 'priority', name: '優先度', min: 1, max: 10 }),
    ],
  };
}

function createPartyMemberClass(): CustomClass {
  return {
    id: PARTY_MEMBER_CLASS_ID,
    name: 'パーティメンバー',
    description: 'パーティメンバーの名前とステータス',
    fields: [
      f('string', { id: 'name', name: '名前' }),
      f('number', { id: 'level', name: 'レベル', min: 1, max: 99 }),
      f('class', { id: 'stats', name: 'ステータス', classId: STATUS_CLASS_ID }),
    ],
  };
}

// =============================================================================
// デフォルトクラス一覧
// =============================================================================

export const defaultClasses: CustomClass[] = [
  createStatusClass(),
  createEffectClass(),
  createBattleSkillResultClass(),
  createLearnSkillClass(),
  createDropItemClass(),
  createEnemyMemberClass(),
  createActionPatternClass(),
  createPartyMemberClass(),
];
