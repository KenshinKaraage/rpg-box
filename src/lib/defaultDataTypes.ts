/**
 * デフォルトデータタイプ
 *
 * RPG開発でよく使用されるデータタイプのプリセット
 * デフォルトクラスを最大限活用した構成
 */
import { createFieldTypeInstance } from '@/types/fields';
import type { FieldType } from '@/types/fields';
import { createDataType, type DataType } from '@/types/data';
import {
  STATUS_CLASS_ID,
  EFFECT_CLASS_ID,
  BATTLE_SKILL_RESULT_CLASS_ID,
  LEARN_SKILL_CLASS_ID,
  DROP_ITEM_CLASS_ID,
  ENEMY_MEMBER_CLASS_ID,
  ACTION_PATTERN_CLASS_ID,
} from './defaultClasses';

// =============================================================================
// ヘルパー
// =============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function f(type: string, props: Record<string, unknown>): FieldType<any> {
  const instance = createFieldTypeInstance(type);
  if (!instance) throw new Error(`Unknown field type: ${type}`);
  return Object.assign(instance, props);
}

/** createDataType のフィールドに追加フィールドを付加 */
function dt(
  id: string,
  name: string,
  description: string,
  extraFields: ReturnType<typeof f>[]
): DataType {
  const base = createDataType(id, name);
  base.description = description;
  base.fields.push(...extraFields);
  return base;
}

// =============================================================================
// ID定数
// =============================================================================

export const CHARACTER_TYPE_ID = 'character';
export const JOB_TYPE_ID = 'job';
export const SKILL_TYPE_ID = 'skill';
export const ITEM_TYPE_ID = 'item';
export const ENEMY_TYPE_ID = 'enemy';
export const ENEMY_GROUP_TYPE_ID = 'enemy_group';
export const STATUS_TYPE_ID = 'status';
export const ELEMENT_TYPE_ID = 'element';

// =============================================================================
// ファクトリ関数
// =============================================================================

function createCharacterType(): DataType {
  return dt('character', 'キャラクター', 'プレイヤーキャラクター', [
    f('textarea', { id: 'description', name: '説明' }),
    f('image', { id: 'face_graphic', name: '顔グラフィック' }),
    f('image', { id: 'walk_graphic', name: '歩行グラフィック' }),
    f('dataSelect', { id: 'job', name: 'ジョブ', referenceTypeId: 'job' }),
    f('number', { id: 'initial_level', name: '初期レベル', min: 1, max: 99 }),
    f('class', { id: 'base_stats', name: '基本ステータス', classId: STATUS_CLASS_ID }),
    f('dataList', { id: 'element_resistance', name: '属性耐性', referenceTypeId: 'element' }),
    f('dataList', { id: 'status_resistance', name: '状態異常耐性', referenceTypeId: 'status' }),
    f('dataSelect', { id: 'initial_equipment', name: '初期装備', referenceTypeId: 'item' }),
  ]);
}

function createJobType(): DataType {
  return dt('job', 'ジョブ', 'キャラクターの職業', [
    f('textarea', { id: 'description', name: '説明' }),
    f('image', { id: 'icon', name: 'アイコン' }),
    f('class', { id: 'growth_rates', name: '成長率', classId: STATUS_CLASS_ID }),
    f('classList', { id: 'learn_skills', name: '習得スキル', classId: LEARN_SKILL_CLASS_ID }),
    f('dataList', { id: 'equippable_types', name: '装備可能タイプ', referenceTypeId: 'item' }),
  ]);
}

function createSkillType(): DataType {
  return dt('skill', 'スキル', '戦闘で使用するスキル', [
    f('textarea', { id: 'description', name: '説明' }),
    f('image', { id: 'icon', name: 'アイコン' }),
    f('select', {
      id: 'skill_type',
      name: 'スキル種類',
      options: [
        { value: 'physical', label: '物理' },
        { value: 'magical', label: '魔法' },
        { value: 'special', label: '特殊' },
      ],
    }),
    f('number', { id: 'mp_cost', name: 'MP消費', min: 0, max: 9999 }),
    f('select', {
      id: 'target_scope',
      name: '対象範囲',
      options: [
        { value: 'single', label: '単体' },
        { value: 'all', label: '全体' },
        { value: 'random', label: 'ランダム' },
      ],
    }),
    f('select', {
      id: 'target_side',
      name: '対象側',
      options: [
        { value: 'enemy', label: '敵' },
        { value: 'ally', label: '味方' },
        { value: 'self', label: '自分' },
      ],
    }),
    f('class', {
      id: 'battle_result',
      name: 'バトル結果',
      classId: BATTLE_SKILL_RESULT_CLASS_ID,
    }),
    f('classList', { id: 'effects', name: '効果', classId: EFFECT_CLASS_ID }),
    f('dataSelect', { id: 'element', name: '属性', referenceTypeId: 'element' }),
    f('dataList', { id: 'status_effects', name: '状態異常効果', referenceTypeId: 'status' }),
    f('select', {
      id: 'usable_scene',
      name: '使用可能シーン',
      options: [
        { value: 'battle', label: '戦闘中' },
        { value: 'menu', label: 'メニュー' },
        { value: 'both', label: '両方' },
        { value: 'none', label: '使用不可' },
      ],
    }),
    f('audio', { id: 'se', name: '効果音' }),
  ]);
}

function createItemType(): DataType {
  return dt('item', 'アイテム', '消費アイテム・装備品', [
    f('textarea', { id: 'description', name: '説明' }),
    f('image', { id: 'icon', name: 'アイコン' }),
    f('select', {
      id: 'item_type',
      name: 'アイテム種類',
      options: [
        { value: 'consumable', label: '消費アイテム' },
        { value: 'weapon', label: '武器' },
        { value: 'armor', label: '防具' },
        { value: 'accessory', label: 'アクセサリ' },
        { value: 'key', label: '大事なもの' },
      ],
      visibilityMap: {
        consumable: ['effects', 'target', 'usable_scene'],
        weapon: ['equip_slot', 'status_bonus', 'element_bonus'],
        armor: ['equip_slot', 'status_bonus', 'status_resistance'],
        accessory: ['equip_slot', 'status_bonus'],
      },
    }),
    f('number', { id: 'price', name: '価格', min: 0, max: 999999 }),
    f('classList', {
      id: 'effects',
      name: '効果',
      classId: EFFECT_CLASS_ID,
      displayCondition: { fieldId: 'item_type', value: 'consumable' },
    }),
    f('select', {
      id: 'target',
      name: '使用対象',
      displayCondition: { fieldId: 'item_type', value: 'consumable' },
      options: [
        { value: 'single_ally', label: '味方単体' },
        { value: 'all_allies', label: '味方全体' },
        { value: 'single_enemy', label: '敵単体' },
      ],
    }),
    f('select', {
      id: 'equip_slot',
      name: '装備部位',
      displayCondition: { fieldId: 'item_type', value: 'weapon' },
      options: [
        { value: 'none', label: 'なし' },
        { value: 'weapon', label: '武器' },
        { value: 'shield', label: '盾' },
        { value: 'head', label: '頭' },
        { value: 'body', label: '体' },
        { value: 'accessory', label: 'アクセサリ' },
      ],
    }),
    f('class', {
      id: 'status_bonus',
      name: 'ステータスボーナス',
      classId: STATUS_CLASS_ID,
      displayCondition: { fieldId: 'item_type', value: 'weapon' },
    }),
    f('dataSelect', {
      id: 'element_bonus',
      name: '属性ボーナス',
      referenceTypeId: 'element',
      displayCondition: { fieldId: 'item_type', value: 'weapon' },
    }),
    f('dataList', {
      id: 'status_resistance',
      name: '状態異常耐性',
      referenceTypeId: 'status',
      displayCondition: { fieldId: 'item_type', value: 'armor' },
    }),
    f('select', {
      id: 'usable_scene',
      name: '使用可能シーン',
      displayCondition: { fieldId: 'item_type', value: 'consumable' },
      options: [
        { value: 'battle', label: '戦闘中' },
        { value: 'menu', label: 'メニュー' },
        { value: 'both', label: '両方' },
        { value: 'none', label: '使用不可' },
      ],
    }),
    f('audio', { id: 'use_se', name: '使用時SE' }),
  ]);
}

function createEnemyType(): DataType {
  return dt('enemy', '敵', '敵キャラクター', [
    f('textarea', { id: 'description', name: '説明' }),
    f('image', { id: 'graphic', name: 'グラフィック' }),
    f('class', { id: 'base_stats', name: '基本ステータス', classId: STATUS_CLASS_ID }),
    f('number', { id: 'exp', name: '経験値', min: 0, max: 99999 }),
    f('number', { id: 'gold', name: 'ゴールド', min: 0, max: 99999 }),
    f('classList', { id: 'drop_items', name: 'ドロップアイテム', classId: DROP_ITEM_CLASS_ID }),
    f('dataList', { id: 'element_resistance', name: '属性耐性', referenceTypeId: 'element' }),
    f('dataList', { id: 'status_resistance', name: '状態異常耐性', referenceTypeId: 'status' }),
    f('classList', {
      id: 'action_patterns',
      name: '行動パターン',
      classId: ACTION_PATTERN_CLASS_ID,
    }),
  ]);
}

function createEnemyGroupType(): DataType {
  return dt('enemy_group', '敵グループ', '敵の出現グループ', [
    f('string', { id: 'location', name: '出現場所' }),
    f('classList', { id: 'members', name: 'メンバー', classId: ENEMY_MEMBER_CLASS_ID }),
    f('audio', { id: 'battle_bgm', name: '戦闘BGM' }),
    f('image', { id: 'background', name: '背景' }),
  ]);
}

function createStatusType(): DataType {
  return dt('status', '異常状態', '状態異常の定義', [
    f('textarea', { id: 'description', name: '説明' }),
    f('image', { id: 'icon', name: 'アイコン' }),
    f('select', {
      id: 'effect_type',
      name: '効果種類',
      options: [
        { value: 'damage_over_time', label: '継続ダメージ' },
        { value: 'stat_down', label: 'ステータス低下' },
        { value: 'disable', label: '行動不能' },
        { value: 'confusion', label: '混乱' },
        { value: 'other', label: 'その他' },
      ],
    }),
    f('number', { id: 'effect_value', name: '効果値', min: 0, max: 9999 }),
    f('number', { id: 'duration', name: '持続ターン', min: 0, max: 99 }),
    f('select', {
      id: 'cancel_condition',
      name: '解除条件',
      options: [
        { value: 'turn_end', label: 'ターン経過' },
        { value: 'damage', label: 'ダメージ受ける' },
        { value: 'action', label: '行動時' },
        { value: 'battle_end', label: '戦闘終了' },
      ],
    }),
    f('number', { id: 'priority', name: '優先度', min: 0, max: 100 }),
  ]);
}

function createElementType(): DataType {
  return dt('element', '属性', '属性の定義', [
    f('textarea', { id: 'description', name: '説明' }),
    f('image', { id: 'icon', name: 'アイコン' }),
    f('color', { id: 'color', name: '色' }),
  ]);
}

// =============================================================================
// デフォルトデータタイプ一覧
// =============================================================================

export const defaultDataTypes: DataType[] = [
  createCharacterType(),
  createJobType(),
  createSkillType(),
  createItemType(),
  createEnemyType(),
  createEnemyGroupType(),
  createStatusType(),
  createElementType(),
];
