import type { Script } from '@/types/script';

import { ScriptRunner } from './ScriptRunner';

function createMockContext() {
  return {
    scriptAPI: {
      showMessage: jest.fn().mockResolvedValue(undefined),
      showChoice: jest.fn().mockResolvedValue(0),
      showNumberInput: jest.fn().mockResolvedValue(0),
      showTextInput: jest.fn().mockResolvedValue(''),
      getVar: jest.fn().mockReturnValue(null),
      setVar: jest.fn(),
    },
    data: {},
    variable: {
      get: jest.fn().mockReturnValue(null),
      set: jest.fn(),
      getAll: jest.fn().mockReturnValue({}),
    },
    sound: {
      playBGM: jest.fn(),
      stopBGM: jest.fn(),
      playSE: jest.fn(),
    },
    camera: {
      zoom: jest.fn(),
      pan: jest.fn(),
      shake: jest.fn(),
    },
    save: {
      save: jest.fn(),
      load: jest.fn(),
    },
  };
}

describe('ScriptRunner', () => {
  let runner: ScriptRunner;
  let allScripts: Script[];

  beforeEach(() => {
    allScripts = [];
    runner = new ScriptRunner(allScripts);
  });

  it('executes a simple script and returns the result', async () => {
    const script: Script = {
      id: 'script-1',
      name: 'test',
      type: 'event',
      content: 'return 42;',
      args: [],
    };
    allScripts.push(script);

    const context = createMockContext();
    const result = await runner.execute(script, context);
    expect(result).toBe(42);
  });

  it('injects scriptAPI and it is callable', async () => {
    const script: Script = {
      id: 'script-1',
      name: 'test',
      type: 'event',
      content: 'await scriptAPI.showMessage("hello"); return "done";',
      args: [],
    };
    allScripts.push(script);

    const context = createMockContext();
    const result = await runner.execute(script, context);
    expect(context.scriptAPI.showMessage).toHaveBeenCalledWith('hello');
    expect(result).toBe('done');
  });

  it('injects Variable API', async () => {
    const script: Script = {
      id: 'script-1',
      name: 'test',
      type: 'event',
      content: 'Variable.set("hp", 100); return Variable.get("hp");',
      args: [],
    };
    allScripts.push(script);

    const context = createMockContext();
    context.variable.get.mockReturnValue(100);
    const result = await runner.execute(script, context);
    expect(context.variable.set).toHaveBeenCalledWith('hp', 100);
    expect(result).toBe(100);
  });

  it('resolves and injects internal scripts as callable functions', async () => {
    const parent: Script = {
      id: 'parent-1',
      name: 'battle',
      type: 'event',
      content: 'return await _calcDamage(10, 3);',
      args: [],
    };
    const child: Script = {
      id: 'child-1',
      name: '_calcDamage',
      type: 'internal',
      content: 'return args[0] - args[1];',
      parentId: 'parent-1',
      args: [],
    };
    allScripts.push(parent, child);

    const context = createMockContext();
    const result = await runner.execute(parent, context);
    expect(result).toBe(7);
  });

  it('resolves nested internal scripts (grandchild)', async () => {
    const parent: Script = {
      id: 'p',
      name: 'main',
      type: 'event',
      content: 'return await _helper();',
      args: [],
    };
    const child: Script = {
      id: 'c',
      name: '_helper',
      type: 'internal',
      content: 'return await _subHelper();',
      parentId: 'p',
      args: [],
    };
    const grandchild: Script = {
      id: 'gc',
      name: '_subHelper',
      type: 'internal',
      content: 'return 99;',
      parentId: 'c',
      args: [],
    };
    allScripts.push(parent, child, grandchild);

    const context = createMockContext();
    const result = await runner.execute(parent, context);
    expect(result).toBe(99);
  });

  it('throws on syntax error', async () => {
    const script: Script = {
      id: 'bad',
      name: 'broken',
      type: 'event',
      content: 'return {{{;',
      args: [],
    };
    allScripts.push(script);

    const context = createMockContext();
    await expect(runner.execute(script, context)).rejects.toThrow();
  });

  it('throws on runtime error', async () => {
    const script: Script = {
      id: 'err',
      name: 'err',
      type: 'event',
      content: 'throw new Error("boom");',
      args: [],
    };
    allScripts.push(script);

    const context = createMockContext();
    await expect(runner.execute(script, context)).rejects.toThrow('boom');
  });
});
