import type { Script } from '@/types/script';

import type { GameContext } from '../runtime/GameContext';

import { ScriptRunner } from './ScriptRunner';

function createMockContext(): GameContext {
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
    scriptRunner: {} as never,
    ui: {},
    input: {
      waitKey: jest.fn().mockResolvedValue(undefined),
      isDown: jest.fn().mockReturnValue(false),
      isJustPressed: jest.fn().mockReturnValue(false),
    },
    currentEvent: { nextAction: null },
  } as unknown as GameContext;
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
      returns: [],
      fields: [],
      isAsync: false,
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
      returns: [],
      fields: [],
      isAsync: true,
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
      returns: [],
      fields: [],
      isAsync: false,
    };
    allScripts.push(script);

    const context = createMockContext();
    (context.variable.get as jest.Mock).mockReturnValue(100);
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
      returns: [],
      fields: [],
      isAsync: true,
    };
    const child: Script = {
      id: 'child-1',
      name: '_calcDamage',
      callId: '_calcDamage',
      type: 'internal',
      content: 'return args[0] - args[1];',
      parentId: 'parent-1',
      args: [],
      returns: [],
      fields: [],
      isAsync: false,
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
      returns: [],
      fields: [],
      isAsync: true,
    };
    const child: Script = {
      id: 'c',
      name: '_helper',
      callId: '_helper',
      type: 'internal',
      content: 'return await _subHelper();',
      parentId: 'p',
      args: [],
      returns: [],
      fields: [],
      isAsync: true,
    };
    const grandchild: Script = {
      id: 'gc',
      name: '_subHelper',
      callId: '_subHelper',
      type: 'internal',
      content: 'return 99;',
      parentId: 'c',
      args: [],
      returns: [],
      fields: [],
      isAsync: false,
    };
    allScripts.push(parent, child, grandchild);

    const context = createMockContext();
    const result = await runner.execute(parent, context);
    expect(result).toBe(99);
  });

  it('throws on syntax error', () => {
    const script: Script = {
      id: 'bad',
      name: 'broken',
      type: 'event',
      content: 'return {{{;',
      args: [],
      returns: [],
      fields: [],
      isAsync: false,
    };
    allScripts.push(script);

    const context = createMockContext();
    expect(() => runner.execute(script, context)).toThrow();
  });

  it('throws on runtime error', async () => {
    const script: Script = {
      id: 'err',
      name: 'err',
      type: 'event',
      content: 'throw new Error("boom");',
      args: [],
      returns: [],
      fields: [],
      isAsync: false,
    };
    allScripts.push(script);

    const context = createMockContext();
    await expect(runner.execute(script, context)).rejects.toThrow('boom');
  });

  it('injects script args as named variables', async () => {
    const script: Script = {
      id: 's1',
      name: 'ダメージ計算',
      type: 'event',
      content: 'return damage * multiplier;',
      args: [
        { id: 'damage', name: 'ダメージ量', fieldType: 'number', required: true },
        { id: 'multiplier', name: '倍率', fieldType: 'number', required: true },
      ],
      returns: [],
      fields: [],
      isAsync: false,
    };
    allScripts.push(script);

    const context = createMockContext();
    const result = await runner.execute(script, context, { damage: 10, multiplier: 3 });
    expect(result).toBe(30);
  });

  it('calls other scripts via Script namespace', async () => {
    const calcScript: Script = {
      id: 'calc',
      name: '計算スクリプト',
      callId: 'calc_damage',
      type: 'event',
      content: 'return atk - def;',
      args: [
        { id: 'atk', name: '攻撃力', fieldType: 'number', required: true },
        { id: 'def', name: '防御力', fieldType: 'number', required: true },
      ],
      returns: [],
      fields: [],
      isAsync: false,
    };
    const mainScript: Script = {
      id: 'main',
      name: 'メイン',
      type: 'event',
      content: 'const dmg = await Script.calc_damage({ atk: 50, def: 20 }); return dmg;',
      args: [],
      returns: [],
      fields: [],
      isAsync: true,
    };
    allScripts.push(calcScript, mainScript);

    const context = createMockContext();
    const result = await runner.execute(mainScript, context);
    expect(result).toBe(30);
  });

  it('Script namespace includes internal scripts with callId', async () => {
    const internalScript: Script = {
      id: 'int',
      name: '_helper',
      callId: 'my_helper',
      type: 'internal',
      content: 'return 1;',
      parentId: 'main',
      args: [],
      returns: [],
      fields: [],
      isAsync: false,
    };
    const mainScript: Script = {
      id: 'main',
      name: 'メイン',
      type: 'event',
      content: 'return typeof Script.my_helper;',
      args: [],
      returns: [],
      fields: [],
      isAsync: false,
    };
    allScripts.push(internalScript, mainScript);

    const context = createMockContext();
    const result = await runner.execute(mainScript, context);
    expect(result).toBe('function');
  });

  it('calls other scripts via Script namespace with positional args', async () => {
    const calcScript: Script = {
      id: 'calc',
      name: '計算スクリプト',
      callId: 'calc_damage',
      type: 'event',
      content: 'return atk - def;',
      args: [
        { id: 'atk', name: '攻撃力', fieldType: 'number', required: true },
        { id: 'def', name: '防御力', fieldType: 'number', required: true },
      ],
      returns: [],
      fields: [],
      isAsync: false,
    };
    const mainScript: Script = {
      id: 'main',
      name: 'メイン',
      type: 'event',
      content: 'const dmg = await Script.calc_damage(50, 20); return dmg;',
      args: [],
      returns: [],
      fields: [],
      isAsync: true,
    };
    allScripts.push(calcScript, mainScript);

    const context = createMockContext();
    const result = await runner.execute(mainScript, context);
    expect(result).toBe(30);
  });

  it('calls single-arg script with positional arg (not treated as object)', async () => {
    const script: Script = {
      id: 'greet',
      name: '挨拶',
      callId: 'greet',
      type: 'event',
      content: 'return "Hello " + name;',
      args: [{ id: 'name', name: '名前', fieldType: 'string', required: true }],
      returns: [],
      fields: [],
      isAsync: false,
    };
    const mainScript: Script = {
      id: 'main',
      name: 'メイン',
      type: 'event',
      content: 'return await Script.greet("World");',
      args: [],
      returns: [],
      fields: [],
      isAsync: true,
    };
    allScripts.push(script, mainScript);

    const context = createMockContext();
    const result = await runner.execute(mainScript, context);
    expect(result).toBe('Hello World');
  });

  it('scripts without callId are not in Script namespace', async () => {
    const noCallId: Script = {
      id: 'no-call',
      name: 'No CallId',
      type: 'event',
      content: 'return 1;',
      args: [],
      returns: [],
      fields: [],
      isAsync: false,
    };
    const mainScript: Script = {
      id: 'main',
      name: 'メイン',
      type: 'event',
      content: 'return Object.keys(Script).length;',
      args: [],
      returns: [],
      fields: [],
      isAsync: false,
    };
    allScripts.push(noCallId, mainScript);

    const context = createMockContext();
    const result = await runner.execute(mainScript, context);
    expect(result).toBe(0);
  });
});
