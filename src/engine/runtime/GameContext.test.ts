import type { EngineProjectData } from '../types';

import { GameContext } from './GameContext';

function createProjectData(overrides?: Partial<EngineProjectData>): EngineProjectData {
  return {
    scripts: [],
    variables: [
      { id: 'var-hp', name: 'hp', type: 'number', defaultValue: 100 },
      { id: 'var-name', name: 'player_name', type: 'string', defaultValue: 'Hero' },
    ],
    dataTypes: [{ id: 'character', name: 'キャラクター' }],
    dataEntries: {
      character: [
        { id: 'char-1', typeId: 'character', values: { name: 'スライム', hp: 30 } },
        { id: 'char-2', typeId: 'character', values: { name: 'ドラゴン', hp: 500 } },
      ],
    },
    ...overrides,
  };
}

describe('GameContext', () => {
  it('creates context from project data', () => {
    const data = createProjectData();
    const ctx = new GameContext(data);
    expect(ctx.scriptAPI).toBeDefined();
    expect(ctx.variable).toBeDefined();
    expect(ctx.data).toBeDefined();
    expect(ctx.sound).toBeDefined();
    expect(ctx.camera).toBeDefined();
    expect(ctx.save).toBeDefined();
  });

  describe('Variable API', () => {
    it('initializes variables with default values', () => {
      const ctx = new GameContext(createProjectData());
      expect(ctx.variable.get('hp')).toBe(100);
      expect(ctx.variable.get('player_name')).toBe('Hero');
    });

    it('sets and gets variables', () => {
      const ctx = new GameContext(createProjectData());
      ctx.variable.set('hp', 50);
      expect(ctx.variable.get('hp')).toBe(50);
    });

    it('getAll returns all variables', () => {
      const ctx = new GameContext(createProjectData());
      const all = ctx.variable.getAll();
      expect(all).toEqual({ hp: 100, player_name: 'Hero' });
    });

    it('can override initial values', () => {
      const ctx = new GameContext(createProjectData(), {
        variables: { hp: 999 },
      });
      expect(ctx.variable.get('hp')).toBe(999);
    });
  });

  describe('Data API', () => {
    it('get returns entry by typeId and dataId', () => {
      const ctx = new GameContext(createProjectData());
      const entry = ctx.data.get('character', 'char-1');
      expect(entry).toEqual({ name: 'スライム', hp: 30 });
    });

    it('get returns null for missing entry', () => {
      const ctx = new GameContext(createProjectData());
      expect(ctx.data.get('character', 'missing')).toBeNull();
    });

    it('find returns entries matching criteria', () => {
      const ctx = new GameContext(createProjectData());
      const found = ctx.data.find('character', { name: 'ドラゴン' });
      expect(found).toHaveLength(1);
      expect(found[0]).toEqual({ name: 'ドラゴン', hp: 500 });
    });

    it('bracket access returns entries by typeId', () => {
      const ctx = new GameContext(createProjectData());
      const chars = ctx.data['character'] as Record<string, Record<string, unknown>>;
      expect(chars).toBeDefined();
      expect(chars['char-1']).toEqual({ name: 'スライム', hp: 30 });
    });
  });

  describe('ScriptAPI', () => {
    it('getVar/setVar delegates to Variable API', () => {
      const ctx = new GameContext(createProjectData());
      expect(ctx.scriptAPI.getVar('hp')).toBe(100);
      ctx.scriptAPI.setVar('hp', 50);
      expect(ctx.scriptAPI.getVar('hp')).toBe(50);
    });

    it('showMessage is a no-op stub that resolves', async () => {
      const ctx = new GameContext(createProjectData());
      await expect(ctx.scriptAPI.showMessage('hello')).resolves.toBeUndefined();
    });

    it('showChoice is a stub that returns 0', async () => {
      const ctx = new GameContext(createProjectData());
      const result = await ctx.scriptAPI.showChoice(['yes', 'no']);
      expect(result).toBe(0);
    });
  });
});
