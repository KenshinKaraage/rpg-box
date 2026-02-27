/**
 * デフォルトデータタイプのテスト
 */
import {
  defaultDataTypes,
  CHARACTER_TYPE_ID,
  JOB_TYPE_ID,
  SKILL_TYPE_ID,
  ITEM_TYPE_ID,
  ENEMY_TYPE_ID,
  ENEMY_GROUP_TYPE_ID,
  STATUS_TYPE_ID,
  ELEMENT_TYPE_ID,
} from './defaultDataTypes';

describe('defaultDataTypes', () => {
  it('8つのデータタイプが定義されている', () => {
    expect(defaultDataTypes).toHaveLength(8);
  });

  describe('ID定数', () => {
    it.each([
      ['character', CHARACTER_TYPE_ID],
      ['job', JOB_TYPE_ID],
      ['skill', SKILL_TYPE_ID],
      ['item', ITEM_TYPE_ID],
      ['enemy', ENEMY_TYPE_ID],
      ['enemy_group', ENEMY_GROUP_TYPE_ID],
      ['status', STATUS_TYPE_ID],
      ['element', ELEMENT_TYPE_ID],
    ])('%s のIDが正しい', (expected, actual) => {
      expect(actual).toBe(expected);
    });
  });

  describe('全データタイプ共通', () => {
    it('全てnameフィールドを持つ', () => {
      for (const dt of defaultDataTypes) {
        const nameField = dt.fields.find((f) => f.id === 'name');
        expect(nameField).toBeDefined();
        expect(nameField?.type).toBe('string');
      }
    });
  });

  describe('キャラクター', () => {
    const dt = defaultDataTypes.find((t) => t.id === CHARACTER_TYPE_ID)!;

    it('定義されている', () => {
      expect(dt).toBeDefined();
      expect(dt.name).toBe('キャラクター');
    });

    it('主要フィールドの型が正しい', () => {
      expect(dt.fields.find((f) => f.id === 'job')?.type).toBe('dataSelect');
      expect(dt.fields.find((f) => f.id === 'initial_level')?.type).toBe('number');
      expect(dt.fields.find((f) => f.id === 'hp')?.type).toBe('number');
      expect(dt.fields.find((f) => f.id === 'face_graphic')?.type).toBe('image');
      expect(dt.fields.find((f) => f.id === 'element_resistance')?.type).toBe('dataList');
      expect(dt.fields.find((f) => f.id === 'status_resistance')?.type).toBe('dataList');
    });
  });

  describe('ジョブ', () => {
    const dt = defaultDataTypes.find((t) => t.id === JOB_TYPE_ID)!;

    it('定義されている', () => {
      expect(dt).toBeDefined();
      expect(dt.name).toBe('ジョブ');
    });

    it('成長率フィールドがnumber型', () => {
      expect(dt.fields.find((f) => f.id === 'hp_growth')?.type).toBe('number');
      expect(dt.fields.find((f) => f.id === 'atk_growth')?.type).toBe('number');
    });

    it('習得スキルがclassList型', () => {
      expect(dt.fields.find((f) => f.id === 'learn_skills')?.type).toBe('classList');
    });
  });

  describe('スキル', () => {
    const dt = defaultDataTypes.find((t) => t.id === SKILL_TYPE_ID)!;

    it('定義されている', () => {
      expect(dt).toBeDefined();
      expect(dt.name).toBe('スキル');
    });

    it('主要フィールドの型が正しい', () => {
      expect(dt.fields.find((f) => f.id === 'skill_type')?.type).toBe('select');
      expect(dt.fields.find((f) => f.id === 'mp_cost')?.type).toBe('number');
      expect(dt.fields.find((f) => f.id === 'element')?.type).toBe('dataSelect');
      expect(dt.fields.find((f) => f.id === 'se')?.type).toBe('audio');
    });
  });

  describe('アイテム', () => {
    const dt = defaultDataTypes.find((t) => t.id === ITEM_TYPE_ID)!;

    it('定義されている', () => {
      expect(dt).toBeDefined();
      expect(dt.name).toBe('アイテム');
    });

    it('主要フィールドの型が正しい', () => {
      expect(dt.fields.find((f) => f.id === 'item_type')?.type).toBe('select');
      expect(dt.fields.find((f) => f.id === 'price')?.type).toBe('number');
      expect(dt.fields.find((f) => f.id === 'status_bonus')?.type).toBe('classList');
      expect(dt.fields.find((f) => f.id === 'use_se')?.type).toBe('audio');
    });
  });

  describe('敵', () => {
    const dt = defaultDataTypes.find((t) => t.id === ENEMY_TYPE_ID)!;

    it('定義されている', () => {
      expect(dt).toBeDefined();
      expect(dt.name).toBe('敵');
    });

    it('主要フィールドの型が正しい', () => {
      expect(dt.fields.find((f) => f.id === 'hp')?.type).toBe('number');
      expect(dt.fields.find((f) => f.id === 'exp')?.type).toBe('number');
      expect(dt.fields.find((f) => f.id === 'drop_items')?.type).toBe('classList');
      expect(dt.fields.find((f) => f.id === 'action_patterns')?.type).toBe('classList');
    });
  });

  describe('敵グループ', () => {
    const dt = defaultDataTypes.find((t) => t.id === ENEMY_GROUP_TYPE_ID)!;

    it('定義されている', () => {
      expect(dt).toBeDefined();
      expect(dt.name).toBe('敵グループ');
    });

    it('主要フィールドの型が正しい', () => {
      expect(dt.fields.find((f) => f.id === 'members')?.type).toBe('classList');
      expect(dt.fields.find((f) => f.id === 'battle_bgm')?.type).toBe('audio');
      expect(dt.fields.find((f) => f.id === 'background')?.type).toBe('image');
    });
  });

  describe('異常状態', () => {
    const dt = defaultDataTypes.find((t) => t.id === STATUS_TYPE_ID)!;

    it('定義されている', () => {
      expect(dt).toBeDefined();
      expect(dt.name).toBe('異常状態');
    });

    it('主要フィールドの型が正しい', () => {
      expect(dt.fields.find((f) => f.id === 'effect_type')?.type).toBe('select');
      expect(dt.fields.find((f) => f.id === 'duration')?.type).toBe('number');
      expect(dt.fields.find((f) => f.id === 'cancel_condition')?.type).toBe('select');
    });
  });

  describe('属性', () => {
    const dt = defaultDataTypes.find((t) => t.id === ELEMENT_TYPE_ID)!;

    it('定義されている', () => {
      expect(dt).toBeDefined();
      expect(dt.name).toBe('属性');
    });

    it('主要フィールドの型が正しい', () => {
      expect(dt.fields.find((f) => f.id === 'icon')?.type).toBe('image');
      expect(dt.fields.find((f) => f.id === 'color')?.type).toBe('color');
    });
  });
});
