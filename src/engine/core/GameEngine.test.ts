import '@/types/fields'; // register field types
import type { Script } from '@/types/script';

import type { ScriptModeConfig, EngineMessage } from '../types';

import { GameEngine } from './GameEngine';

describe('GameEngine', () => {
  let engine: GameEngine;
  let sentMessages: EngineMessage[];

  beforeEach(() => {
    sentMessages = [];
    engine = new GameEngine((msg: EngineMessage) => {
      sentMessages.push(msg);
    });
  });

  function makeScriptConfig(
    scripts: Script[],
    scriptId: string,
    args: Record<string, unknown> = {}
  ): ScriptModeConfig {
    return {
      mode: 'script',
      projectData: {
        scripts,
        variables: [],
        classes: [],
        dataTypes: [],
        dataEntries: {},
      },
      scriptId,
      args,
    };
  }

  it('sends ready message on construction', () => {
    expect(sentMessages).toContainEqual({ type: 'ready' });
  });

  it('executes script and sends result', async () => {
    const scripts: Script[] = [
      { id: 's1', name: 'test', type: 'event', content: 'return 42;', args: [], returns: [] },
    ];
    const config = makeScriptConfig(scripts, 's1');

    await engine.handleMessage({ type: 'start', config });

    expect(sentMessages).toContainEqual({ type: 'script-result', value: 42 });
  });

  it('sends script-error on execution failure', async () => {
    const scripts: Script[] = [
      {
        id: 's1',
        name: 'test',
        type: 'event',
        content: 'throw new Error("boom");',
        args: [],
        returns: [],
      },
    ];
    const config = makeScriptConfig(scripts, 's1');

    await engine.handleMessage({ type: 'start', config });

    const errorMsg = sentMessages.find((m) => m.type === 'script-error');
    expect(errorMsg).toBeDefined();
    if (errorMsg && errorMsg.type === 'script-error') {
      expect(errorMsg.error).toContain('boom');
    }
  });

  it('sends script-error when script not found', async () => {
    const config = makeScriptConfig([], 'missing');

    await engine.handleMessage({ type: 'start', config });

    const errorMsg = sentMessages.find((m) => m.type === 'script-error');
    expect(errorMsg).toBeDefined();
    if (errorMsg && errorMsg.type === 'script-error') {
      expect(errorMsg.error).toContain('not found');
    }
  });

  it('applies testSettings variables to context', async () => {
    const scripts: Script[] = [
      {
        id: 's1',
        name: 'test',
        type: 'event',
        content: 'return Variable.get("hp");',
        args: [],
        returns: [],
      },
    ];
    const config: ScriptModeConfig = {
      ...makeScriptConfig(scripts, 's1'),
      testSettings: {
        variables: { hp: 999 },
      },
    };

    await engine.handleMessage({ type: 'start', config });

    expect(sentMessages).toContainEqual({ type: 'script-result', value: 999 });
  });

  it('captures console.log and sends as log messages', async () => {
    const scripts: Script[] = [
      {
        id: 's1',
        name: 'test',
        type: 'event',
        content: 'console.log("debug info"); return 1;',
        args: [],
        returns: [],
      },
    ];
    const config = makeScriptConfig(scripts, 's1');

    await engine.handleMessage({ type: 'start', config });

    const logMsg = sentMessages.find(
      (m) => m.type === 'log' && m.level === 'info' && m.message === 'debug info'
    );
    expect(logMsg).toBeDefined();
  });

  it('sends state-update with final variable values', async () => {
    const scripts: Script[] = [
      {
        id: 's1',
        name: 'test',
        type: 'event',
        content: 'Variable.set("hp", 50); return 1;',
        args: [],
        returns: [],
      },
    ];
    const config: ScriptModeConfig = {
      mode: 'script',
      projectData: {
        scripts,
        variables: [{ id: 'var-hp', name: 'hp', type: 'number', defaultValue: 100 }],
        classes: [],
        dataTypes: [],
        dataEntries: {},
      },
      scriptId: 's1',
      args: {},
    };

    await engine.handleMessage({ type: 'start', config });

    const stateMsg = sentMessages.find((m) => m.type === 'state-update');
    expect(stateMsg).toBeDefined();
    if (stateMsg && stateMsg.type === 'state-update') {
      expect(stateMsg.variables).toEqual({ hp: 50 });
    }
  });

  it('ignores stop/pause/resume for now', async () => {
    await engine.handleMessage({ type: 'stop' });
    await engine.handleMessage({ type: 'pause' });
    await engine.handleMessage({ type: 'resume' });
    // Should not throw
  });

  it('sends return-type error when return value type mismatches', async () => {
    const scripts: Script[] = [
      {
        id: 's1',
        name: 'test',
        type: 'event',
        content: 'return "not a number";',
        args: [],
        returns: [{ id: 'damage', name: 'ダメージ', fieldType: 'number', isArray: false }],
      },
    ];
    const config = makeScriptConfig(scripts, 's1');

    await engine.handleMessage({ type: 'start', config });

    const typeError = sentMessages.find(
      (m) => m.type === 'script-error' && m.errorType === 'return-type'
    );
    expect(typeError).toBeDefined();
  });

  it('does not send return-type error when return value matches', async () => {
    const scripts: Script[] = [
      {
        id: 's1',
        name: 'test',
        type: 'event',
        content: 'return 42;',
        args: [],
        returns: [{ id: 'damage', name: 'ダメージ', fieldType: 'number', isArray: false }],
      },
    ];
    const config = makeScriptConfig(scripts, 's1');

    await engine.handleMessage({ type: 'start', config });

    const typeError = sentMessages.find(
      (m) => m.type === 'script-error' && m.errorType === 'return-type'
    );
    expect(typeError).toBeUndefined();
  });

  it('sends runtime errorType on execution failure', async () => {
    const scripts: Script[] = [
      {
        id: 's1',
        name: 'test',
        type: 'event',
        content: 'throw new Error("boom");',
        args: [],
        returns: [],
      },
    ];
    const config = makeScriptConfig(scripts, 's1');

    await engine.handleMessage({ type: 'start', config });

    const errorMsg = sentMessages.find(
      (m) => m.type === 'script-error' && m.errorType === 'runtime'
    );
    expect(errorMsg).toBeDefined();
  });
});
