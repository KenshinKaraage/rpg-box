# Game Engine Script Execution Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the script execution foundation that powers both unit tests (ScriptTestPanel) and test play, running inside an iframe with the same engine code.

**Architecture:** A React-independent engine (`src/engine/`) communicates with the editor via `postMessage`. `ScriptRunner` executes user scripts via `new Function()` with injected API objects (`scriptAPI`, `Data`, `Variable`, etc.). The editor embeds an iframe pointing to `game.html`, which loads the engine bundle. Two startup modes — `script` (unit test) and `full` (test play) — share the same engine code path.

**Tech Stack:** TypeScript (no React), `new Function()` for script execution, Canvas 2D for UI rendering, `postMessage` for iframe communication, Jest for testing.

**Scope:** This plan covers Tasks 0–4: engine types, ScriptRunner + GameContext, ScriptAPI stub, postMessage protocol, and updating ScriptTestPanel to use the iframe-based engine. Canvas rendering (map, sprites, WebGL) and full game loop are out of scope — those are Phase 18 tasks T210–T224.

---

### Task 0: Engine type definitions

Define the shared types that both the engine and editor use. These types form the contract for postMessage communication and engine initialization.

**Files:**

- Create: `src/engine/types.ts`
- Test: `src/engine/types.test.ts`

**Step 1: Write the failing test**

Create `src/engine/types.test.ts`:

```typescript
import type {
  EngineStartConfig,
  ScriptModeConfig,
  FullModeConfig,
  EditorMessage,
  EngineMessage,
  ObjectPlacement,
  TestPattern,
} from './types';

describe('Engine types', () => {
  it('ScriptModeConfig has required fields', () => {
    const config: ScriptModeConfig = {
      mode: 'script',
      projectData: {
        scripts: [],
        variables: [],
        dataTypes: [],
        dataEntries: {},
      },
      scriptId: 'script-1',
      args: { damage: 10 },
    };
    expect(config.mode).toBe('script');
    expect(config.scriptId).toBe('script-1');
  });

  it('FullModeConfig has required fields', () => {
    const config: FullModeConfig = {
      mode: 'full',
      projectData: {
        scripts: [],
        variables: [],
        dataTypes: [],
        dataEntries: {},
      },
      startSettings: {
        mapId: 'map-1',
        position: { x: 0, y: 0 },
      },
    };
    expect(config.mode).toBe('full');
    expect(config.startSettings.mapId).toBe('map-1');
  });

  it('EditorMessage discriminated union works', () => {
    const msg: EditorMessage = {
      type: 'start',
      config: {
        mode: 'script',
        projectData: { scripts: [], variables: [], dataTypes: [], dataEntries: {} },
        scriptId: 'test',
        args: {},
      },
    };
    expect(msg.type).toBe('start');
  });

  it('EngineMessage discriminated union works', () => {
    const ready: EngineMessage = { type: 'ready' };
    const log: EngineMessage = { type: 'log', level: 'info', message: 'hello' };
    const result: EngineMessage = { type: 'script-result', value: 42 };
    const error: EngineMessage = { type: 'script-error', error: 'fail' };
    expect(ready.type).toBe('ready');
    expect(log.type).toBe('log');
    expect(result.type).toBe('script-result');
    expect(error.type).toBe('script-error');
  });

  it('TestPattern stores config', () => {
    const pattern: TestPattern = {
      id: 'pat-1',
      name: 'Basic test',
      type: 'script',
      config: {
        mode: 'script',
        projectData: { scripts: [], variables: [], dataTypes: [], dataEntries: {} },
        scriptId: 'script-1',
        args: {},
      },
    };
    expect(pattern.type).toBe('script');
  });

  it('ObjectPlacement has position and prefabId', () => {
    const placement: ObjectPlacement = {
      prefabId: 'player',
      x: 5,
      y: 10,
    };
    expect(placement.prefabId).toBe('player');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest src/engine/types.test.ts --no-coverage`
Expected: FAIL — module `./types` not found

**Step 3: Write implementation**

Create `src/engine/types.ts`:

```typescript
/**
 * ゲームエンジン共通型定義
 *
 * エディタとiframe間のpostMessage通信、エンジン初期化設定の型を定義。
 * エディタ側（React）とエンジン側（React非依存）の両方で使用する。
 */

import type { Script } from '@/types/script';

// =============================================================================
// プロジェクトデータ（エンジンに渡す最小限のサブセット）
// =============================================================================

/**
 * エンジンが必要とするプロジェクトデータのサブセット
 * src/lib/storage/types.ts の ProjectData から必要なフィールドだけ抽出
 */
export interface EngineProjectData {
  scripts: Script[];
  variables: EngineVariable[];
  dataTypes: EngineDataType[];
  dataEntries: Record<string, EngineDataEntry[]>;
}

/** エンジン用の変数定義（storage/types.ts の Variable のサブセット） */
export interface EngineVariable {
  id: string;
  name: string;
  type: string;
  defaultValue?: unknown;
}

/** エンジン用のデータ型定義 */
export interface EngineDataType {
  id: string;
  name: string;
}

/** エンジン用のデータエントリ */
export interface EngineDataEntry {
  id: string;
  typeId: string;
  values: Record<string, unknown>;
}

// =============================================================================
// エンジン起動設定
// =============================================================================

/** オブジェクト配置設定（テスト設定用） */
export interface ObjectPlacement {
  prefabId: string;
  x: number;
  y: number;
  rotation?: number;
  variables?: Record<string, unknown>;
}

/** 起動設定の基底 */
export interface EngineStartConfig {
  mode: 'full' | 'script';
  projectData: EngineProjectData;
}

/** テストプレイモード設定 */
export interface FullModeConfig extends EngineStartConfig {
  mode: 'full';
  startSettings: {
    mapId: string;
    position: { x: number; y: number };
    variables?: Record<string, unknown>;
  };
  debugOptions?: {
    showObjectVars: boolean;
    showCollision: boolean;
    showFPS: boolean;
  };
}

/** スクリプト単体テストモード設定 */
export interface ScriptModeConfig extends EngineStartConfig {
  mode: 'script';
  scriptId: string;
  args: Record<string, unknown>;
  testSettings?: {
    mapId?: string;
    objects?: ObjectPlacement[];
    variables?: Record<string, unknown>;
  };
}

// =============================================================================
// テスト設定パターン
// =============================================================================

/** テスト設定パターン（保存/復元用） */
export interface TestPattern {
  id: string;
  name: string;
  type: 'script' | 'full';
  config: ScriptModeConfig | FullModeConfig;
}

// =============================================================================
// postMessage 通信プロトコル
// =============================================================================

/** エディタ → iframe メッセージ */
export type EditorMessage =
  | { type: 'start'; config: FullModeConfig | ScriptModeConfig }
  | { type: 'stop' }
  | { type: 'pause' }
  | { type: 'resume' };

/** iframe → エディタ メッセージ */
export type EngineMessage =
  | { type: 'ready' }
  | { type: 'log'; level: 'info' | 'warn' | 'error'; message: string }
  | { type: 'script-result'; value: unknown }
  | { type: 'script-error'; error: string; stack?: string }
  | { type: 'state-update'; variables: Record<string, unknown> };
```

**Step 4: Run test to verify it passes**

Run: `npx jest src/engine/types.test.ts --no-coverage`
Expected: PASS — all 6 tests

**Step 5: Commit**

```bash
git add src/engine/types.ts src/engine/types.test.ts
git commit -m "feat(engine): define engine types and postMessage protocol [T210]"
```

---

### Task 1: ScriptRunner — execute scripts with API injection

Build the core `ScriptRunner` class that executes user scripts via `new Function()`, injecting API objects and resolving internal (child) scripts as callable functions. This is the heart of script execution, shared by unit tests and test play.

**Files:**

- Create: `src/engine/core/ScriptRunner.ts`
- Test: `src/engine/core/ScriptRunner.test.ts`

**Reference:**

- `src/types/script.ts` — Script interface (id, name, type, content, parentId, args)
- `src/engine/types.ts` — EngineProjectData (Task 0)
- Design doc section "ScriptRunner" — `new Function()` with named API parameters

**Step 1: Write the failing tests**

Create `src/engine/core/ScriptRunner.test.ts`:

```typescript
import type { Script } from '@/types/script';

import { ScriptRunner } from './ScriptRunner';

// Minimal mock context — ScriptRunner only needs the API objects to inject
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
      content: 'return atk - def;',
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

  it('throws ScriptExecutionError on syntax error', async () => {
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

  it('throws ScriptExecutionError on runtime error', async () => {
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
```

**Step 2: Run test to verify it fails**

Run: `npx jest src/engine/core/ScriptRunner.test.ts --no-coverage`
Expected: FAIL — module `./ScriptRunner` not found

**Step 3: Write implementation**

Create `src/engine/core/ScriptRunner.ts`:

```typescript
/**
 * スクリプト実行エンジン
 *
 * ユーザースクリプトを new Function() で実行し、
 * scriptAPI, Data, Variable 等のAPIを注入する。
 * 内部スクリプトは親スコープに関数として自動注入される。
 */

import type { Script } from '@/types/script';

/** スクリプト実行時に注入するAPIコンテキスト */
export interface ScriptContext {
  scriptAPI: unknown;
  data: unknown;
  variable: unknown;
  sound: unknown;
  camera: unknown;
  save: unknown;
}

/** 内部スクリプトを解決した結果 */
interface ResolvedInternalScript {
  name: string;
  fn: (...args: unknown[]) => Promise<unknown>;
}

export class ScriptRunner {
  private scripts: Script[];

  constructor(scripts: Script[]) {
    this.scripts = scripts;
  }

  /**
   * スクリプトを実行
   * @param script 実行するスクリプト
   * @param context 注入するAPIコンテキスト
   * @returns スクリプトの戻り値
   */
  async execute(script: Script, context: ScriptContext): Promise<unknown> {
    const internalScripts = this.resolveInternalScripts(script.id, context);

    const paramNames = [
      'scriptAPI',
      'Data',
      'Variable',
      'Sound',
      'Camera',
      'Save',
      ...internalScripts.map((s) => s.name),
    ];

    const paramValues = [
      context.scriptAPI,
      context.data,
      context.variable,
      context.sound,
      context.camera,
      context.save,
      ...internalScripts.map((s) => s.fn),
    ];

    try {
      // Wrap in async IIFE to support top-level await
      const wrappedContent = `return (async () => { ${script.content} })();`;
      const fn = new Function(...paramNames, wrappedContent);
      return await fn(...paramValues);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(String(error));
    }
  }

  /**
   * スクリプトの内部スクリプト（子孫すべて）を再帰的に解決し、
   * 呼び出し可能な関数に変換する
   */
  private resolveInternalScripts(
    parentId: string,
    context: ScriptContext
  ): ResolvedInternalScript[] {
    const result: ResolvedInternalScript[] = [];
    const directChildren = this.scripts.filter((s) => s.parentId === parentId);

    for (const child of directChildren) {
      // Recursively resolve this child's internal scripts too
      const childInternals = this.resolveInternalScripts(child.id, context);

      const fn = this.buildInternalFunction(child, context, childInternals);
      result.push({ name: child.name, fn });

      // Also include grandchildren so parent can call them
      result.push(...childInternals);
    }

    return result;
  }

  /**
   * 内部スクリプトを呼び出し可能な関数に変換
   */
  private buildInternalFunction(
    script: Script,
    context: ScriptContext,
    childInternals: ResolvedInternalScript[]
  ): (...args: unknown[]) => Promise<unknown> {
    const paramNames = [
      'scriptAPI',
      'Data',
      'Variable',
      'Sound',
      'Camera',
      'Save',
      ...childInternals.map((s) => s.name),
    ];

    const wrappedContent = `return (async () => { ${script.content} })();`;
    const compiledFn = new Function(...paramNames, wrappedContent);

    return async (...args: unknown[]) => {
      // For internal scripts, args are passed as local variables
      // The content can reference them via arguments or parameter names
      // We re-wrap to include the args
      const argParamNames = [...paramNames];
      const argParamValues = [
        context.scriptAPI,
        context.data,
        context.variable,
        context.sound,
        context.camera,
        context.save,
        ...childInternals.map((s) => s.fn),
      ];

      // If the internal script uses parameters, we need to pass them
      // Build a function that accepts arbitrary args
      const fnWithArgs = new Function(
        ...paramNames,
        '...args',
        `return (async (...args) => { ${script.content} })(...args);`
      );

      return await fnWithArgs(...argParamValues, ...args);
    };
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npx jest src/engine/core/ScriptRunner.test.ts --no-coverage`
Expected: PASS — all 7 tests

**Step 5: Commit**

```bash
git add src/engine/core/ScriptRunner.ts src/engine/core/ScriptRunner.test.ts
git commit -m "feat(engine): implement ScriptRunner with API injection and internal script resolution [T210]"
```

---

### Task 2: GameContext — assemble all APIs into a single context

Build `GameContext` which creates and holds all the API instances (ScriptAPI, VariableAPI, DataAPI, etc.) from `EngineProjectData`. This is what gets passed to `ScriptRunner.execute()`.

**Files:**

- Create: `src/engine/runtime/GameContext.ts`
- Test: `src/engine/runtime/GameContext.test.ts`

**Reference:**

- `src/engine/types.ts` — EngineProjectData, EngineVariable, EngineDataEntry
- `src/engine/core/ScriptRunner.ts` — ScriptContext interface
- Design doc section "GameContext" — assembles all APIs

**Step 1: Write the failing tests**

Create `src/engine/runtime/GameContext.test.ts`:

```typescript
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
      const chars = ctx.data['character'];
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
```

**Step 2: Run test to verify it fails**

Run: `npx jest src/engine/runtime/GameContext.test.ts --no-coverage`
Expected: FAIL — module `./GameContext` not found

**Step 3: Write implementation**

Create `src/engine/runtime/GameContext.ts`:

```typescript
/**
 * ゲームコンテキスト
 *
 * EngineProjectData からすべてのAPIインスタンスを組み立て、
 * ScriptRunner に渡す統合コンテキストを構築する。
 */

import type { ScriptContext } from '../core/ScriptRunner';
import type { EngineProjectData, EngineDataEntry } from '../types';

/** 初期化時のオーバーライド設定 */
export interface ContextOverrides {
  variables?: Record<string, unknown>;
}

// =============================================================================
// Variable API
// =============================================================================

export interface VariableAPI {
  get(name: string): unknown;
  set(name: string, value: unknown): void;
  getAll(): Record<string, unknown>;
}

function createVariableAPI(
  data: EngineProjectData,
  overrides?: Record<string, unknown>
): VariableAPI {
  const store: Record<string, unknown> = {};

  // Initialize with defaults
  for (const v of data.variables) {
    store[v.name] = v.defaultValue ?? null;
  }

  // Apply overrides
  if (overrides) {
    for (const [key, value] of Object.entries(overrides)) {
      store[key] = value;
    }
  }

  return {
    get: (name: string) => store[name] ?? null,
    set: (name: string, value: unknown) => {
      store[name] = value;
    },
    getAll: () => ({ ...store }),
  };
}

// =============================================================================
// Data API
// =============================================================================

export interface DataAPI {
  get(typeId: string, dataId: string): Record<string, unknown> | null;
  find(typeId: string, criteria: Record<string, unknown>): Record<string, unknown>[];
  [typeId: string]: unknown;
}

function createDataAPI(data: EngineProjectData): DataAPI {
  // Build lookup: typeId -> dataId -> values
  const lookup: Record<string, Record<string, Record<string, unknown>>> = {};
  for (const [typeId, entries] of Object.entries(data.dataEntries)) {
    lookup[typeId] = {};
    for (const entry of entries) {
      lookup[typeId][entry.id] = entry.values;
    }
  }

  const api: DataAPI = {
    get(typeId: string, dataId: string): Record<string, unknown> | null {
      return lookup[typeId]?.[dataId] ?? null;
    },
    find(typeId: string, criteria: Record<string, unknown>): Record<string, unknown>[] {
      const entries = data.dataEntries[typeId] ?? [];
      return entries
        .filter((entry: EngineDataEntry) =>
          Object.entries(criteria).every(([key, value]) => entry.values[key] === value)
        )
        .map((entry: EngineDataEntry) => entry.values);
    },
  };

  // Add bracket access: Data["character"]["char-1"]
  for (const typeId of Object.keys(lookup)) {
    (api as Record<string, unknown>)[typeId] = lookup[typeId];
  }

  return api;
}

// =============================================================================
// Stub APIs (Sound, Camera, Save — real implementations in Phase 18)
// =============================================================================

export interface SoundAPIStub {
  playBGM(id: string, options?: { volume?: number; fadeIn?: number }): void;
  stopBGM(options?: { fadeOut?: number }): void;
  playSE(id: string, options?: { volume?: number; pitch?: number }): void;
}

function createSoundAPIStub(): SoundAPIStub {
  return {
    playBGM: () => {},
    stopBGM: () => {},
    playSE: () => {},
  };
}

export interface CameraAPIStub {
  zoom(scale: number, duration?: number): Promise<void>;
  pan(x: number, y: number, duration?: number): Promise<void>;
  shake(intensity: number, duration?: number): Promise<void>;
}

function createCameraAPIStub(): CameraAPIStub {
  return {
    zoom: async () => {},
    pan: async () => {},
    shake: async () => {},
  };
}

export interface SaveAPIStub {
  save(slotId: number): Promise<void>;
  load(slotId: number): Promise<void>;
}

function createSaveAPIStub(): SaveAPIStub {
  return {
    save: async () => {},
    load: async () => {},
  };
}

// =============================================================================
// ScriptAPI
// =============================================================================

export interface ScriptAPIImpl {
  showMessage(text: string, options?: Record<string, unknown>): Promise<void>;
  showChoice(choices: string[], options?: Record<string, unknown>): Promise<number>;
  showNumberInput(options?: Record<string, unknown>): Promise<number>;
  showTextInput(options?: Record<string, unknown>): Promise<string>;
  getVar(name: string): unknown;
  setVar(name: string, value: unknown): void;
}

function createScriptAPI(variableAPI: VariableAPI): ScriptAPIImpl {
  return {
    // Stubs — real Canvas UI rendering comes in Phase 18
    showMessage: async () => {},
    showChoice: async () => 0,
    showNumberInput: async () => 0,
    showTextInput: async () => '',
    getVar: (name: string) => variableAPI.get(name),
    setVar: (name: string, value: unknown) => variableAPI.set(name, value),
  };
}

// =============================================================================
// GameContext
// =============================================================================

export class GameContext implements ScriptContext {
  readonly scriptAPI: ScriptAPIImpl;
  readonly data: DataAPI;
  readonly variable: VariableAPI;
  readonly sound: SoundAPIStub;
  readonly camera: CameraAPIStub;
  readonly save: SaveAPIStub;

  constructor(projectData: EngineProjectData, overrides?: ContextOverrides) {
    this.variable = createVariableAPI(projectData, overrides?.variables);
    this.data = createDataAPI(projectData);
    this.scriptAPI = createScriptAPI(this.variable);
    this.sound = createSoundAPIStub();
    this.camera = createCameraAPIStub();
    this.save = createSaveAPIStub();
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npx jest src/engine/runtime/GameContext.test.ts --no-coverage`
Expected: PASS — all 10 tests

**Step 5: Commit**

```bash
git add src/engine/runtime/GameContext.ts src/engine/runtime/GameContext.test.ts
git commit -m "feat(engine): implement GameContext with Variable, Data, and stub APIs [T210]"
```

---

### Task 3: GameEngine — main class with postMessage protocol

Build the `GameEngine` class that receives `postMessage` events, initializes `GameContext` and `ScriptRunner`, executes scripts, and sends results back via `postMessage`. This is the class that `game.html` will instantiate.

**Files:**

- Create: `src/engine/core/GameEngine.ts`
- Test: `src/engine/core/GameEngine.test.ts`

**Reference:**

- `src/engine/types.ts` — EditorMessage, EngineMessage, ScriptModeConfig, FullModeConfig
- `src/engine/core/ScriptRunner.ts` — ScriptRunner class
- `src/engine/runtime/GameContext.ts` — GameContext class

**Step 1: Write the failing tests**

Create `src/engine/core/GameEngine.test.ts`:

```typescript
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
      { id: 's1', name: 'test', type: 'event', content: 'return 42;', args: [] },
    ];
    const config = makeScriptConfig(scripts, 's1');

    await engine.handleMessage({ type: 'start', config });

    expect(sentMessages).toContainEqual({ type: 'script-result', value: 42 });
  });

  it('sends script-error on execution failure', async () => {
    const scripts: Script[] = [
      { id: 's1', name: 'test', type: 'event', content: 'throw new Error("boom");', args: [] },
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
      { id: 's1', name: 'test', type: 'event', content: 'return Variable.get("hp");', args: [] },
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
      },
    ];
    const config = makeScriptConfig(scripts, 's1');

    await engine.handleMessage({ type: 'start', config });

    const logMsg = sentMessages.find(
      (m) => m.type === 'log' && m.level === 'info' && m.message === 'debug info'
    );
    expect(logMsg).toBeDefined();
  });

  it('ignores stop/pause/resume for now (no game loop yet)', async () => {
    // These should not throw
    await engine.handleMessage({ type: 'stop' });
    await engine.handleMessage({ type: 'pause' });
    await engine.handleMessage({ type: 'resume' });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest src/engine/core/GameEngine.test.ts --no-coverage`
Expected: FAIL — module `./GameEngine` not found

**Step 3: Write implementation**

Create `src/engine/core/GameEngine.ts`:

```typescript
/**
 * ゲームエンジン メインクラス
 *
 * postMessage でエディタからの指示を受け取り、
 * ScriptRunner + GameContext を使ってスクリプトを実行し、
 * 結果を postMessage で返す。
 */

import type { EditorMessage, EngineMessage, ScriptModeConfig } from '../types';
import { GameContext } from '../runtime/GameContext';

import { ScriptRunner } from './ScriptRunner';

/** メッセージ送信関数の型 */
export type MessageSender = (message: EngineMessage) => void;

export class GameEngine {
  private sendMessage: MessageSender;

  constructor(sendMessage: MessageSender) {
    this.sendMessage = sendMessage;
    this.sendMessage({ type: 'ready' });
  }

  /**
   * エディタからのメッセージを処理
   */
  async handleMessage(message: EditorMessage): Promise<void> {
    switch (message.type) {
      case 'start':
        await this.handleStart(message.config);
        break;
      case 'stop':
      case 'pause':
      case 'resume':
        // Game loop control — not implemented yet (Phase 18)
        break;
    }
  }

  private async handleStart(
    config: ScriptModeConfig | import('../types').FullModeConfig
  ): Promise<void> {
    if (config.mode === 'script') {
      await this.executeScript(config);
    }
    // full mode — game loop, not implemented yet
  }

  private async executeScript(config: ScriptModeConfig): Promise<void> {
    const { projectData, scriptId, testSettings } = config;

    const script = projectData.scripts.find((s) => s.id === scriptId);
    if (!script) {
      this.sendMessage({
        type: 'script-error',
        error: `Script "${scriptId}" not found`,
      });
      return;
    }

    const context = new GameContext(projectData, {
      variables: testSettings?.variables,
    });

    const runner = new ScriptRunner(projectData.scripts);

    // Capture console output
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
    const sendMsg = this.sendMessage;

    console.log = (...args: unknown[]) => {
      sendMsg({ type: 'log', level: 'info', message: args.map(String).join(' ') });
    };
    console.warn = (...args: unknown[]) => {
      sendMsg({ type: 'log', level: 'warn', message: args.map(String).join(' ') });
    };
    console.error = (...args: unknown[]) => {
      sendMsg({ type: 'log', level: 'error', message: args.map(String).join(' ') });
    };

    try {
      const result = await runner.execute(script, context);
      this.sendMessage({ type: 'script-result', value: result });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.sendMessage({ type: 'script-error', error: errorMessage, stack });
    } finally {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
    }

    // Send final variable state
    this.sendMessage({
      type: 'state-update',
      variables: context.variable.getAll(),
    });
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npx jest src/engine/core/GameEngine.test.ts --no-coverage`
Expected: PASS — all 7 tests

**Step 5: Commit**

```bash
git add src/engine/core/GameEngine.ts src/engine/core/GameEngine.test.ts
git commit -m "feat(engine): implement GameEngine with postMessage protocol [T210]"
```

---

### Task 4: Update ScriptTestPanel to use engine-based execution

Replace the current `ScriptTestPanel`'s inline `new Function()` execution with `GameEngine` direct invocation. This makes the test panel use the exact same code path as the iframe engine. (Actual iframe embedding comes later — for now we call `GameEngine` directly in the same process to keep the feedback loop fast.)

**Files:**

- Modify: `src/features/script-editor/components/ScriptTestPanel.tsx`
- Modify: `src/features/script-editor/components/ScriptTestPanel.test.tsx`

**Reference:**

- Current `ScriptTestPanel.tsx` — inline `new Function()` execution (to be replaced)
- `src/engine/core/GameEngine.ts` — GameEngine class
- `src/engine/types.ts` — ScriptModeConfig, EngineMessage
- `src/stores/scriptSlice.ts` — getScriptsByType, scripts array

**Step 1: Write updated tests**

Update `src/features/script-editor/components/ScriptTestPanel.test.tsx`:

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import type { Script } from '@/types/script';

import { ScriptTestPanel } from './ScriptTestPanel';

// Mock the useStore to provide scripts for internal script resolution
jest.mock('@/stores', () => ({
  useStore: jest.fn((selector) => {
    const state = {
      scripts: [
        {
          id: 'script-1',
          name: 'テストスクリプト',
          type: 'event' as const,
          content: 'return 42;',
          args: [],
        },
      ],
      variables: [],
    };
    return selector(state);
  }),
}));

const testScript: Script = {
  id: 'script-1',
  name: 'テストスクリプト',
  type: 'event',
  content: 'return 42;',
  args: [],
};

const scriptWithArgs: Script = {
  id: 'script-2',
  name: 'With args',
  type: 'event',
  content: 'return 1;',
  args: [
    { id: 'arg-1', name: 'damage', fieldType: 'number', required: true },
    { id: 'arg-2', name: 'name', fieldType: 'string', required: false },
  ],
};

describe('ScriptTestPanel', () => {
  it('shows empty state when no script', () => {
    render(<ScriptTestPanel script={null} />);
    expect(screen.getByText('スクリプトを選択してください')).toBeInTheDocument();
  });

  it('shows execute button when script selected', () => {
    render(<ScriptTestPanel script={testScript} />);
    expect(screen.getByRole('button', { name: /実行/ })).toBeInTheDocument();
  });

  it('shows header text', () => {
    render(<ScriptTestPanel script={testScript} />);
    expect(screen.getByText('テスト')).toBeInTheDocument();
  });

  it('shows argument inputs for scripts with args', () => {
    render(<ScriptTestPanel script={scriptWithArgs} />);
    expect(screen.getByLabelText('damage')).toBeInTheDocument();
    expect(screen.getByLabelText('name')).toBeInTheDocument();
  });

  it('executes script and shows result', async () => {
    render(<ScriptTestPanel script={testScript} />);
    fireEvent.click(screen.getByRole('button', { name: /実行/ }));

    await waitFor(() => {
      expect(screen.getByTestId('test-result')).toHaveTextContent('42');
    });
  });

  it('shows error for broken script', async () => {
    const broken: Script = {
      id: 'script-1',
      name: 'broken',
      type: 'event',
      content: 'throw new Error("test error");',
      args: [],
    };
    render(<ScriptTestPanel script={broken} />);
    fireEvent.click(screen.getByRole('button', { name: /実行/ }));

    await waitFor(() => {
      expect(screen.getByTestId('test-result')).toHaveTextContent('test error');
    });
  });

  it('captures console.log output', async () => {
    const logScript: Script = {
      id: 'script-1',
      name: 'logger',
      type: 'event',
      content: 'console.log("hello world"); return 1;',
      args: [],
    };
    render(<ScriptTestPanel script={logScript} />);
    fireEvent.click(screen.getByRole('button', { name: /実行/ }));

    await waitFor(() => {
      expect(screen.getByTestId('console-output')).toHaveTextContent('hello world');
    });
  });

  it('resets state when script changes', () => {
    const { rerender } = render(<ScriptTestPanel script={testScript} />);
    // After changing script, result should be cleared
    rerender(<ScriptTestPanel script={scriptWithArgs} />);
    expect(screen.queryByTestId('test-result')).not.toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify current tests still reference old behavior**

Run: `npx jest src/features/script-editor/components/ScriptTestPanel.test.tsx --no-coverage`
Expected: Some tests may fail due to mock changes

**Step 3: Update implementation**

Rewrite `src/features/script-editor/components/ScriptTestPanel.tsx` to use GameEngine:

```typescript
'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStore } from '@/stores';
import type { Script } from '@/types/script';
import { GameEngine } from '@/engine/core/GameEngine';
import type { EngineMessage, ScriptModeConfig } from '@/engine/types';

interface ScriptTestPanelProps {
  script: Script | null;
}

export function ScriptTestPanel({ script }: ScriptTestPanelProps) {
  const scripts = useStore((s) => s.scripts);
  const variables = useStore((s) => s.variables);
  const [argValues, setArgValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState<string | null>(null);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [isError, setIsError] = useState(false);

  // Reset state when script changes
  const [prevScriptId, setPrevScriptId] = useState<string | null>(null);
  if (script && script.id !== prevScriptId) {
    setPrevScriptId(script.id);
    setArgValues({});
    setResult(null);
    setConsoleOutput([]);
    setIsError(false);
  }
  if (!script && prevScriptId !== null) {
    setPrevScriptId(null);
  }

  if (!script) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        スクリプトを選択してください
      </div>
    );
  }

  const handleExecute = async () => {
    const logs: string[] = [];
    let finalResult: string | null = null;
    let hasError = false;

    // Build args
    const args: Record<string, unknown> = {};
    for (const arg of script.args) {
      const raw = argValues[arg.id] ?? '';
      if (arg.fieldType === 'number') args[arg.name] = Number(raw) || 0;
      else if (arg.fieldType === 'boolean') args[arg.name] = raw === 'true';
      else args[arg.name] = raw;
    }

    // Build engine config
    const config: ScriptModeConfig = {
      mode: 'script',
      projectData: {
        scripts,
        variables: variables.map((v) => ({
          id: v.id,
          name: v.name,
          type: v.type,
          defaultValue: v.defaultValue,
        })),
        dataTypes: [],
        dataEntries: {},
      },
      scriptId: script.id,
      args,
    };

    // Create engine with message handler
    const engine = new GameEngine((msg: EngineMessage) => {
      switch (msg.type) {
        case 'log':
          logs.push(msg.message);
          break;
        case 'script-result':
          finalResult = msg.value !== undefined ? JSON.stringify(msg.value) : 'undefined';
          break;
        case 'script-error':
          finalResult = msg.error;
          hasError = true;
          break;
      }
    });

    await engine.handleMessage({ type: 'start', config });

    setResult(finalResult);
    setIsError(hasError);
    setConsoleOutput(logs);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-header items-center border-b px-4 font-semibold">テスト</div>
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-4">
          {/* Arguments */}
          {script.args.length > 0 && (
            <div className="space-y-2">
              <Label>引数</Label>
              {script.args.map((arg) => (
                <div key={arg.id} className="space-y-1">
                  <Label htmlFor={`test-arg-${arg.id}`} className="text-xs">
                    {arg.name}
                  </Label>
                  <Input
                    id={`test-arg-${arg.id}`}
                    value={argValues[arg.id] ?? ''}
                    onChange={(e) =>
                      setArgValues((prev) => ({ ...prev, [arg.id]: e.target.value }))
                    }
                    placeholder={arg.fieldType}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Execute button */}
          <Button onClick={handleExecute} size="sm">
            <Play className="mr-1 h-4 w-4" />
            実行
          </Button>

          {/* Result */}
          {result !== null && (
            <div className="space-y-1">
              <Label>結果</Label>
              <pre
                className={`rounded border p-2 text-xs ${isError ? 'border-destructive text-destructive' : ''}`}
                data-testid="test-result"
              >
                {result}
              </pre>
            </div>
          )}

          {/* Console output */}
          {consoleOutput.length > 0 && (
            <div className="space-y-1">
              <Label>コンソール</Label>
              <pre className="rounded border bg-muted p-2 text-xs" data-testid="console-output">
                {consoleOutput.map((line, i) => (
                  <div key={i}>&gt; {line}</div>
                ))}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `npx jest src/features/script-editor/components/ScriptTestPanel.test.tsx --no-coverage`
Expected: PASS — all 8 tests

**Step 5: Commit**

```bash
git add src/features/script-editor/components/ScriptTestPanel.tsx src/features/script-editor/components/ScriptTestPanel.test.tsx
git commit -m "refactor(script): use GameEngine for ScriptTestPanel execution [T129][T210]"
```

---

## Summary

| Task | What it builds                                                 | Key files                                                   |
| ---- | -------------------------------------------------------------- | ----------------------------------------------------------- |
| 0    | Engine types + postMessage protocol                            | `src/engine/types.ts`                                       |
| 1    | ScriptRunner (new Function + API injection + internal scripts) | `src/engine/core/ScriptRunner.ts`                           |
| 2    | GameContext (Variable, Data, ScriptAPI stubs)                  | `src/engine/runtime/GameContext.ts`                         |
| 3    | GameEngine (message handler, orchestration)                    | `src/engine/core/GameEngine.ts`                             |
| 4    | ScriptTestPanel uses GameEngine instead of inline execution    | `src/features/script-editor/components/ScriptTestPanel.tsx` |

**Not in scope (future):**

- `game.html` + iframe embedding (after basic rendering exists)
- Canvas/WebGL rendering (Phase 18: T212–T214)
- Full game loop (Phase 18: T210 game loop part)
- Real ScriptAPI implementations (Canvas-based message box, choice dialog)
- Sound, Camera, Save real implementations
- Test play page (Phase 19: T225)
