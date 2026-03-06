import type { EngineProjectData } from '../types';
import { ScriptRunner } from '../core/ScriptRunner';

import { GameContext } from './GameContext';

function createProjectData(overrides?: Partial<EngineProjectData>): EngineProjectData {
  return {
    scripts: [],
    variables: [
      { id: 'var-hp', name: 'hp', type: 'number', defaultValue: 100 },
      { id: 'var-name', name: 'player_name', type: 'string', defaultValue: 'Hero' },
    ],
    classes: [],
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
      const ctx = new GameContext(createProjectData(), new ScriptRunner([]));
      expect(ctx.variable.get('hp')).toBe(100);
      expect(ctx.variable.get('player_name')).toBe('Hero');
    });

    it('sets and gets variables', () => {
      const ctx = new GameContext(createProjectData(), new ScriptRunner([]));
      ctx.variable.set('hp', 50);
      expect(ctx.variable.get('hp')).toBe(50);
    });

    it('getAll returns all variables', () => {
      const ctx = new GameContext(createProjectData(), new ScriptRunner([]));
      const all = ctx.variable.getAll();
      expect(all).toEqual({ hp: 100, player_name: 'Hero' });
    });

    it('can override initial values', () => {
      const ctx = new GameContext(createProjectData(), new ScriptRunner([]), {
        variables: { hp: 999 },
      });
      expect(ctx.variable.get('hp')).toBe(999);
    });
  });

  describe('Data API', () => {
    it('bracket access returns array of entries with id included', () => {
      const ctx = new GameContext(createProjectData(), new ScriptRunner([]));
      const chars = ctx.data['character'] as Record<string, unknown>[];
      expect(chars).toHaveLength(2);
      expect(chars[0]).toEqual({ id: 'char-1', name: 'スライム', hp: 30 });
      expect(chars[1]).toEqual({ id: 'char-2', name: 'ドラゴン', hp: 500 });
    });

    it('entries are accessible by ID via bracket notation', () => {
      const ctx = new GameContext(createProjectData(), new ScriptRunner([]));
      const chars = ctx.data['character'] as Record<string, unknown>[] &
        Record<string, Record<string, unknown>>;
      expect(chars['char-1']).toEqual({ id: 'char-1', name: 'スライム', hp: 30 });
      expect(chars['char-2']).toEqual({ id: 'char-2', name: 'ドラゴン', hp: 500 });
    });

    it('returns undefined for missing typeId', () => {
      const ctx = new GameContext(createProjectData(), new ScriptRunner([]));
      expect(ctx.data['nonexistent']).toBeUndefined();
    });

    it('array methods work on entries', () => {
      const ctx = new GameContext(createProjectData(), new ScriptRunner([]));
      const chars = ctx.data['character'] as Record<string, unknown>[];
      const found = chars.filter((c) => c['name'] === 'ドラゴン');
      expect(found).toHaveLength(1);
      expect(found[0]!['hp']).toBe(500);
    });
  });

  describe('Runtime extensions', () => {
    it('pendingMapChange defaults to null', () => {
      const ctx = new GameContext(createProjectData(), new ScriptRunner([]));
      expect(ctx.pendingMapChange).toBeNull();
    });

    it('waitFrames is no-op without runtime callbacks', async () => {
      const ctx = new GameContext(createProjectData(), new ScriptRunner([]));
      await expect(ctx.waitFrames(10)).resolves.toBeUndefined();
    });

    it('waitFrames delegates to runtime callback', async () => {
      const ctx = new GameContext(createProjectData(), new ScriptRunner([]));
      const mockWaitFrames = jest.fn().mockResolvedValue(undefined);
      ctx.setRuntimeCallbacks({ waitFrames: mockWaitFrames });
      await ctx.waitFrames(30);
      expect(mockWaitFrames).toHaveBeenCalledWith(30);
    });
  });

  describe('ScriptAPI', () => {
    it('getVar/setVar delegates to Variable API', () => {
      const ctx = new GameContext(createProjectData(), new ScriptRunner([]));
      expect(ctx.scriptAPI.getVar('hp')).toBe(100);
      ctx.scriptAPI.setVar('hp', 50);
      expect(ctx.scriptAPI.getVar('hp')).toBe(50);
    });

    it('showMessage is a no-op stub that resolves', async () => {
      const ctx = new GameContext(createProjectData(), new ScriptRunner([]));
      await expect(ctx.scriptAPI.showMessage('hello')).resolves.toBeUndefined();
    });

    it('showChoice is a stub that returns 0', async () => {
      const ctx = new GameContext(createProjectData(), new ScriptRunner([]));
      const result = await ctx.scriptAPI.showChoice(['yes', 'no']);
      expect(result).toBe(0);
    });
  });
});
