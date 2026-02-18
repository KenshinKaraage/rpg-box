# Phase 8: EventAction System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the EventAction runtime system: base class, 10 concrete actions, EventRunner, GameContext refactor, and GameEngine event mode.

**Architecture:** EventAction classes live in `src/engine/actions/` (runtime only, no React). They execute via `GameContext` (the single context). `EventRunner` orchestrates sequential execution with iteration limits. `GameEngine` gains an `event` mode that deserializes and runs actions.

**Tech Stack:** TypeScript, Jest

**Design Doc:** `docs/plans/2026-02-17-event-action-system-design.md`

---

### Task 1: Remove ScriptContext, refactor ScriptRunner and GameContext

ScriptRunner currently uses a `ScriptContext` interface. We need to remove it and have ScriptRunner accept `GameContext` directly. GameContext also needs a `scriptRunner` property.

**Files:**

- Modify: `src/engine/core/ScriptRunner.ts`
- Modify: `src/engine/runtime/GameContext.ts`
- Modify: `src/engine/core/GameEngine.ts`
- Modify: `src/engine/core/ScriptRunner.test.ts`
- Modify: `src/engine/runtime/GameContext.test.ts`
- Modify: `src/engine/core/GameEngine.test.ts`

**Step 1: Update ScriptRunner — remove ScriptContext interface, use GameContext**

In `src/engine/core/ScriptRunner.ts`:

- Delete the `ScriptContext` interface (lines 18-25)
- Import `GameContext` from `../runtime/GameContext`
- Replace all `ScriptContext` references with `GameContext` (lines 54, 74, 120, 157)

```typescript
// Before:
import type { Script, ScriptArg } from '@/types/script';

export interface ScriptContext {
  scriptAPI: unknown;
  data: unknown;
  variable: unknown;
  sound: unknown;
  camera: unknown;
  save: unknown;
}

// After:
import type { Script, ScriptArg } from '@/types/script';
import type { GameContext } from '../runtime/GameContext';
```

All method signatures change from `context: ScriptContext` to `context: GameContext`.

**Step 2: Update GameContext — remove `implements ScriptContext`, add `scriptRunner`**

In `src/engine/runtime/GameContext.ts`:

- Remove `import type { ScriptContext } from '../core/ScriptRunner'`
- Remove `implements ScriptContext` from class declaration
- Add `scriptRunner` property (type: `ScriptRunner` from `../core/ScriptRunner`)
- Update constructor: `constructor(projectData: EngineProjectData, scriptRunner: ScriptRunner, overrides?: ContextOverrides)`

```typescript
import { ScriptRunner } from '../core/ScriptRunner';
import type { EngineProjectData } from '../types';

export class GameContext {
  readonly scriptAPI: GameScriptAPI;
  readonly data: DataAPI;
  readonly variable: VariableAPI;
  readonly sound: SoundAPI;
  readonly camera: CameraAPI;
  readonly save: SaveAPI;
  readonly scriptRunner: ScriptRunner;

  constructor(
    projectData: EngineProjectData,
    scriptRunner: ScriptRunner,
    overrides?: ContextOverrides
  ) {
    this.variable = createVariableAPI(projectData, overrides);
    this.data = createDataAPI(projectData);
    this.scriptAPI = createScriptAPI(this.variable);
    this.sound = createSoundAPI();
    this.camera = createCameraAPI();
    this.save = createSaveAPI();
    this.scriptRunner = scriptRunner;
  }
}
```

**Step 3: Update GameEngine — create ScriptRunner before GameContext**

In `src/engine/core/GameEngine.ts`, in `executeScript()`:

```typescript
// Before:
const context = new GameContext(projectData, { variables: testSettings?.variables });
const runner = new ScriptRunner(projectData.scripts);

// After:
const runner = new ScriptRunner(projectData.scripts);
const context = new GameContext(projectData, runner, { variables: testSettings?.variables });
```

**Step 4: Update tests**

In `ScriptRunner.test.ts`: The `createMockContext()` function returns a plain object. Since ScriptRunner now expects `GameContext`, we need to cast it. The actual `GameContext` class has matching properties so the mock object still works — just update the type:

```typescript
import type { GameContext } from '../runtime/GameContext';

function createMockContext(): GameContext {
  return {
    scriptAPI: { ... },
    data: {},
    variable: { ... },
    sound: { ... },
    camera: { ... },
    save: { ... },
    scriptRunner: {} as any,  // Not used in script execution tests
  } as GameContext;
}
```

In `GameContext.test.ts`: Constructor now requires `ScriptRunner`. Create a minimal mock:

```typescript
import { ScriptRunner } from '../core/ScriptRunner';

// In createProjectData, no change needed.

// Before each test that calls `new GameContext(data)`:
// Change to: `new GameContext(data, new ScriptRunner([]))`
// Or with overrides: `new GameContext(data, new ScriptRunner([]), { variables: { hp: 999 } })`
```

In `GameEngine.test.ts`: No changes needed — GameEngine internally creates ScriptRunner and GameContext.

**Step 5: Run tests**

Run: `npx jest ScriptRunner.test GameContext.test GameEngine.test --no-coverage`
Expected: All pass

**Step 6: Commit**

```bash
git add src/engine/core/ScriptRunner.ts src/engine/runtime/GameContext.ts src/engine/core/GameEngine.ts src/engine/core/ScriptRunner.test.ts src/engine/runtime/GameContext.test.ts
git commit -m "refactor(engine): remove ScriptContext, use GameContext directly [T100]"
```

---

### Task 2: Move EventAction base class and registry to engine/actions/

Move the action base class and registry from `src/types/actions/` to `src/engine/actions/`, stripping UI methods (renderBlock, renderPropertyPanel) and renaming serialize/deserialize to toJSON/fromJSON.

**Files:**

- Create: `src/engine/actions/EventAction.ts`
- Create: `src/engine/actions/index.ts`
- Create: `src/engine/actions/EventAction.test.ts`
- Keep (do not delete yet): `src/types/actions/EventAction.ts` and `src/types/actions/index.ts` (will be deleted after all concrete actions are moved)

**Step 1: Write the test**

Create `src/engine/actions/EventAction.test.ts`:

```typescript
import type { GameContext } from '../runtime/GameContext';

import { EventAction } from './EventAction';
import {
  registerAction,
  getAction,
  getAllActions,
  getActionNames,
  clearActionRegistry,
} from './index';

// Concrete test action
class TestAction extends EventAction {
  readonly type = 'test';
  value = 0;

  async execute(
    _context: GameContext,
    _run: (actions: EventAction[]) => Promise<void>
  ): Promise<void> {
    this.value += 1;
  }

  toJSON(): Record<string, unknown> {
    return { value: this.value };
  }

  fromJSON(data: Record<string, unknown>): void {
    this.value = data.value as number;
  }
}

describe('EventAction base', () => {
  it('concrete action has type', () => {
    const action = new TestAction();
    expect(action.type).toBe('test');
  });

  it('execute runs action logic', async () => {
    const action = new TestAction();
    const mockRun = jest.fn();
    await action.execute({} as GameContext, mockRun);
    expect(action.value).toBe(1);
  });

  it('toJSON / fromJSON round-trips', () => {
    const action = new TestAction();
    action.value = 42;
    const json = action.toJSON();
    expect(json).toEqual({ value: 42 });

    const restored = new TestAction();
    restored.fromJSON(json);
    expect(restored.value).toBe(42);
  });
});

describe('actionRegistry', () => {
  beforeEach(() => clearActionRegistry());

  it('registers and retrieves an action', () => {
    registerAction('test', TestAction);
    const Cls = getAction('test');
    expect(Cls).toBe(TestAction);
  });

  it('returns undefined for unregistered type', () => {
    expect(getAction('nonexistent')).toBeUndefined();
  });

  it('getAllActions returns all entries', () => {
    registerAction('test', TestAction);
    const all = getAllActions();
    expect(all).toEqual([['test', TestAction]]);
  });

  it('getActionNames returns type strings', () => {
    registerAction('test', TestAction);
    expect(getActionNames()).toEqual(['test']);
  });

  it('clearActionRegistry removes all', () => {
    registerAction('test', TestAction);
    clearActionRegistry();
    expect(getAction('test')).toBeUndefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest src/engine/actions/EventAction.test.ts --no-coverage`
Expected: FAIL (files don't exist)

**Step 3: Create EventAction base class**

Create `src/engine/actions/EventAction.ts`:

```typescript
import type { GameContext } from '../runtime/GameContext';

/**
 * EventAction base class (runtime only, no UI methods)
 *
 * Each action type extends this class to implement execute(), toJSON(), fromJSON().
 * Editor UI for actions lives separately in src/features/event-editor/.
 */
export abstract class EventAction {
  abstract readonly type: string;

  /**
   * Execute the action.
   * @param context Game context (state & API access)
   * @param run Callback to execute child actions (for Conditional, Loop, etc.)
   */
  abstract execute(
    context: GameContext,
    run: (actions: EventAction[]) => Promise<void>
  ): Promise<void>;

  /** Serialize to JSON for saving */
  abstract toJSON(): Record<string, unknown>;

  /** Restore properties from JSON */
  abstract fromJSON(data: Record<string, unknown>): void;
}
```

**Step 4: Create registry**

Create `src/engine/actions/index.ts`:

```typescript
import { EventAction } from './EventAction';

export { EventAction };

type EventActionConstructor = new () => EventAction;

const actionRegistry = new Map<string, EventActionConstructor>();

export function registerAction(type: string, actionClass: EventActionConstructor): void {
  if (actionRegistry.has(type)) {
    console.warn(`EventAction "${type}" is already registered. Overwriting.`);
  }
  actionRegistry.set(type, actionClass);
}

export function getAction(type: string): EventActionConstructor | undefined {
  return actionRegistry.get(type);
}

export function getAllActions(): [string, EventActionConstructor][] {
  return Array.from(actionRegistry.entries());
}

export function getActionNames(): string[] {
  return Array.from(actionRegistry.keys());
}

export function clearActionRegistry(): void {
  actionRegistry.clear();
}
```

**Step 5: Run tests**

Run: `npx jest src/engine/actions/EventAction.test.ts --no-coverage`
Expected: All pass

**Step 6: Commit**

```bash
git add src/engine/actions/EventAction.ts src/engine/actions/index.ts src/engine/actions/EventAction.test.ts
git commit -m "feat(engine): add EventAction base class and registry in engine/actions [T101]"
```

---

### Task 3: Implement VariableOpAction

**Files:**

- Create: `src/engine/actions/VariableOpAction.ts`
- Create: `src/engine/actions/VariableOpAction.test.ts`

**Step 1: Write the test**

Create `src/engine/actions/VariableOpAction.test.ts`:

```typescript
import type { GameContext } from '../runtime/GameContext';

import { VariableOpAction } from './VariableOpAction';

function createMockContext(initialValue: unknown = 0): GameContext {
  let value = initialValue;
  return {
    variable: {
      get: jest.fn(() => value),
      set: jest.fn((_, v) => {
        value = v;
      }),
      getAll: jest.fn(() => ({})),
    },
  } as unknown as GameContext;
}

const noopRun = jest.fn();

describe('VariableOpAction', () => {
  it('has type "variableOp"', () => {
    expect(new VariableOpAction().type).toBe('variableOp');
  });

  it('set operation', async () => {
    const action = new VariableOpAction();
    action.variableId = 'hp';
    action.operation = 'set';
    action.value = 100;

    const ctx = createMockContext(50);
    await action.execute(ctx, noopRun);

    expect(ctx.variable.set).toHaveBeenCalledWith('hp', 100);
  });

  it('add operation', async () => {
    const action = new VariableOpAction();
    action.variableId = 'hp';
    action.operation = 'add';
    action.value = 10;

    const ctx = createMockContext(50);
    await action.execute(ctx, noopRun);

    expect(ctx.variable.set).toHaveBeenCalledWith('hp', 60);
  });

  it('subtract operation', async () => {
    const action = new VariableOpAction();
    action.variableId = 'hp';
    action.operation = 'subtract';
    action.value = 20;

    const ctx = createMockContext(50);
    await action.execute(ctx, noopRun);

    expect(ctx.variable.set).toHaveBeenCalledWith('hp', 30);
  });

  it('multiply operation', async () => {
    const action = new VariableOpAction();
    action.variableId = 'hp';
    action.operation = 'multiply';
    action.value = 3;

    const ctx = createMockContext(10);
    await action.execute(ctx, noopRun);

    expect(ctx.variable.set).toHaveBeenCalledWith('hp', 30);
  });

  it('divide operation', async () => {
    const action = new VariableOpAction();
    action.variableId = 'hp';
    action.operation = 'divide';
    action.value = 2;

    const ctx = createMockContext(100);
    await action.execute(ctx, noopRun);

    expect(ctx.variable.set).toHaveBeenCalledWith('hp', 50);
  });

  it('set operation with string value', async () => {
    const action = new VariableOpAction();
    action.variableId = 'name';
    action.operation = 'set';
    action.value = 'hero';

    const ctx = createMockContext('old');
    await action.execute(ctx, noopRun);

    expect(ctx.variable.set).toHaveBeenCalledWith('name', 'hero');
  });

  it('toJSON / fromJSON round-trips', () => {
    const action = new VariableOpAction();
    action.variableId = 'hp';
    action.operation = 'add';
    action.value = 10;

    const json = action.toJSON();
    expect(json).toEqual({ variableId: 'hp', operation: 'add', value: 10 });

    const restored = new VariableOpAction();
    restored.fromJSON(json);
    expect(restored.variableId).toBe('hp');
    expect(restored.operation).toBe('add');
    expect(restored.value).toBe(10);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest src/engine/actions/VariableOpAction.test.ts --no-coverage`
Expected: FAIL

**Step 3: Implement VariableOpAction**

Create `src/engine/actions/VariableOpAction.ts`:

```typescript
import type { GameContext } from '../runtime/GameContext';

import { EventAction } from './EventAction';

export class VariableOpAction extends EventAction {
  readonly type = 'variableOp';
  variableId = '';
  operation: 'set' | 'add' | 'subtract' | 'multiply' | 'divide' = 'set';
  value: number | string = 0;

  async execute(
    context: GameContext,
    _run: (actions: EventAction[]) => Promise<void>
  ): Promise<void> {
    if (this.operation === 'set') {
      context.variable.set(this.variableId, this.value);
      return;
    }

    const current = context.variable.get(this.variableId) as number;
    const operand = this.value as number;
    let result: number;

    switch (this.operation) {
      case 'add':
        result = current + operand;
        break;
      case 'subtract':
        result = current - operand;
        break;
      case 'multiply':
        result = current * operand;
        break;
      case 'divide':
        result = current / operand;
        break;
    }

    context.variable.set(this.variableId, result);
  }

  toJSON(): Record<string, unknown> {
    return {
      variableId: this.variableId,
      operation: this.operation,
      value: this.value,
    };
  }

  fromJSON(data: Record<string, unknown>): void {
    this.variableId = data.variableId as string;
    this.operation = data.operation as VariableOpAction['operation'];
    this.value = data.value as number | string;
  }
}
```

**Step 4: Run tests**

Run: `npx jest src/engine/actions/VariableOpAction.test.ts --no-coverage`
Expected: All pass

**Step 5: Commit**

```bash
git add src/engine/actions/VariableOpAction.ts src/engine/actions/VariableOpAction.test.ts
git commit -m "feat(engine): implement VariableOpAction [T102]"
```

---

### Task 4: Implement ConditionalAction

**Files:**

- Create: `src/engine/actions/ConditionalAction.ts`
- Create: `src/engine/actions/ConditionalAction.test.ts`

**Step 1: Write the test**

Create `src/engine/actions/ConditionalAction.test.ts`:

```typescript
import type { GameContext } from '../runtime/GameContext';

import { ConditionalAction } from './ConditionalAction';
import { EventAction } from './EventAction';

function createMockContext(vars: Record<string, unknown> = {}): GameContext {
  return {
    variable: {
      get: jest.fn((name: string) => vars[name]),
      set: jest.fn(),
      getAll: jest.fn(() => ({})),
    },
  } as unknown as GameContext;
}

describe('ConditionalAction', () => {
  it('has type "conditional"', () => {
    expect(new ConditionalAction().type).toBe('conditional');
  });

  it('runs thenActions when condition is true (==)', async () => {
    const action = new ConditionalAction();
    action.condition = { variableId: 'hp', operator: '==', value: 100 };

    const thenAction = {
      execute: jest.fn().mockResolvedValue(undefined),
    } as unknown as EventAction;
    action.thenActions = [thenAction];

    const ctx = createMockContext({ hp: 100 });
    const run = jest.fn();
    await action.execute(ctx, run);

    expect(run).toHaveBeenCalledWith([thenAction]);
  });

  it('runs elseActions when condition is false (==)', async () => {
    const action = new ConditionalAction();
    action.condition = { variableId: 'hp', operator: '==', value: 100 };

    const elseAction = {
      execute: jest.fn().mockResolvedValue(undefined),
    } as unknown as EventAction;
    action.thenActions = [];
    action.elseActions = [elseAction];

    const ctx = createMockContext({ hp: 50 });
    const run = jest.fn();
    await action.execute(ctx, run);

    expect(run).toHaveBeenCalledWith([elseAction]);
  });

  it('supports != operator', async () => {
    const action = new ConditionalAction();
    action.condition = { variableId: 'hp', operator: '!=', value: 0 };
    action.thenActions = [];

    const ctx = createMockContext({ hp: 50 });
    const run = jest.fn();
    await action.execute(ctx, run);

    expect(run).toHaveBeenCalledWith(action.thenActions);
  });

  it('supports > operator', async () => {
    const action = new ConditionalAction();
    action.condition = { variableId: 'hp', operator: '>', value: 10 };
    action.thenActions = [];

    const ctx = createMockContext({ hp: 50 });
    const run = jest.fn();
    await action.execute(ctx, run);

    expect(run).toHaveBeenCalledWith(action.thenActions);
  });

  it('supports < operator', async () => {
    const action = new ConditionalAction();
    action.condition = { variableId: 'hp', operator: '<', value: 10 };
    action.thenActions = [];
    action.elseActions = [];

    const ctx = createMockContext({ hp: 50 });
    const run = jest.fn();
    await action.execute(ctx, run);

    expect(run).toHaveBeenCalledWith(action.elseActions);
  });

  it('supports >= operator', async () => {
    const action = new ConditionalAction();
    action.condition = { variableId: 'hp', operator: '>=', value: 50 };
    action.thenActions = [];

    const ctx = createMockContext({ hp: 50 });
    const run = jest.fn();
    await action.execute(ctx, run);

    expect(run).toHaveBeenCalledWith(action.thenActions);
  });

  it('supports <= operator', async () => {
    const action = new ConditionalAction();
    action.condition = { variableId: 'hp', operator: '<=', value: 50 };
    action.thenActions = [];

    const ctx = createMockContext({ hp: 50 });
    const run = jest.fn();
    await action.execute(ctx, run);

    expect(run).toHaveBeenCalledWith(action.thenActions);
  });

  it('toJSON / fromJSON round-trips', () => {
    const action = new ConditionalAction();
    action.condition = { variableId: 'hp', operator: '>=', value: 50 };
    // thenActions/elseActions serialization is handled by EventRunner/GameEngine

    const json = action.toJSON();
    expect(json.condition).toEqual({ variableId: 'hp', operator: '>=', value: 50 });

    const restored = new ConditionalAction();
    restored.fromJSON(json);
    expect(restored.condition).toEqual({ variableId: 'hp', operator: '>=', value: 50 });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest src/engine/actions/ConditionalAction.test.ts --no-coverage`
Expected: FAIL

**Step 3: Implement ConditionalAction**

Create `src/engine/actions/ConditionalAction.ts`:

```typescript
import type { GameContext } from '../runtime/GameContext';

import { EventAction } from './EventAction';

export interface Condition {
  variableId: string;
  operator: '==' | '!=' | '>' | '<' | '>=' | '<=';
  value: unknown;
}

export class ConditionalAction extends EventAction {
  readonly type = 'conditional';
  condition: Condition = { variableId: '', operator: '==', value: 0 };
  thenActions: EventAction[] = [];
  elseActions: EventAction[] = [];

  async execute(
    context: GameContext,
    run: (actions: EventAction[]) => Promise<void>
  ): Promise<void> {
    const actual = context.variable.get(this.condition.variableId);
    const expected = this.condition.value;

    const result = this.evaluate(actual, expected);
    if (result) {
      await run(this.thenActions);
    } else {
      await run(this.elseActions);
    }
  }

  private evaluate(actual: unknown, expected: unknown): boolean {
    switch (this.condition.operator) {
      case '==':
        return actual === expected;
      case '!=':
        return actual !== expected;
      case '>':
        return (actual as number) > (expected as number);
      case '<':
        return (actual as number) < (expected as number);
      case '>=':
        return (actual as number) >= (expected as number);
      case '<=':
        return (actual as number) <= (expected as number);
    }
  }

  toJSON(): Record<string, unknown> {
    return {
      condition: this.condition,
      thenActions: this.thenActions.map((a) => ({ type: a.type, data: a.toJSON() })),
      elseActions: this.elseActions.map((a) => ({ type: a.type, data: a.toJSON() })),
    };
  }

  fromJSON(data: Record<string, unknown>): void {
    this.condition = data.condition as Condition;
    // thenActions/elseActions deserialization requires the registry — handled by the caller
  }
}
```

**Step 4: Run tests**

Run: `npx jest src/engine/actions/ConditionalAction.test.ts --no-coverage`
Expected: All pass

**Step 5: Commit**

```bash
git add src/engine/actions/ConditionalAction.ts src/engine/actions/ConditionalAction.test.ts
git commit -m "feat(engine): implement ConditionalAction [T103]"
```

---

### Task 5: Implement LoopAction

**Files:**

- Create: `src/engine/actions/LoopAction.ts`
- Create: `src/engine/actions/LoopAction.test.ts`

**Step 1: Write the test**

Create `src/engine/actions/LoopAction.test.ts`:

```typescript
import type { GameContext } from '../runtime/GameContext';

import { EventAction } from './EventAction';
import { LoopAction } from './LoopAction';

describe('LoopAction', () => {
  it('has type "loop"', () => {
    expect(new LoopAction().type).toBe('loop');
  });

  it('runs actions count times', async () => {
    const action = new LoopAction();
    action.count = 3;

    const run = jest.fn().mockResolvedValue(undefined);
    await action.execute({} as GameContext, run);

    expect(run).toHaveBeenCalledTimes(3);
  });

  it('runs 0 times when count is 0', async () => {
    const action = new LoopAction();
    action.count = 0;

    const run = jest.fn().mockResolvedValue(undefined);
    await action.execute({} as GameContext, run);

    expect(run).not.toHaveBeenCalled();
  });

  it('toJSON / fromJSON round-trips', () => {
    const action = new LoopAction();
    action.count = 5;

    const json = action.toJSON();
    expect(json).toEqual({ count: 5, actions: [] });

    const restored = new LoopAction();
    restored.fromJSON(json);
    expect(restored.count).toBe(5);
  });

  it('toJSON with undefined count', () => {
    const action = new LoopAction();
    action.count = undefined;

    const json = action.toJSON();
    expect(json.count).toBeUndefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest src/engine/actions/LoopAction.test.ts --no-coverage`
Expected: FAIL

**Step 3: Implement LoopAction**

Create `src/engine/actions/LoopAction.ts`:

```typescript
import type { GameContext } from '../runtime/GameContext';

import { EventAction } from './EventAction';

export class LoopAction extends EventAction {
  readonly type = 'loop';
  count?: number;
  actions: EventAction[] = [];

  async execute(
    _context: GameContext,
    run: (actions: EventAction[]) => Promise<void>
  ): Promise<void> {
    if (this.count !== undefined) {
      for (let i = 0; i < this.count; i++) {
        await run(this.actions);
      }
    } else {
      // Infinite loop — relies on EventRunner's iteration limit for protection
      for (;;) {
        await run(this.actions);
      }
    }
  }

  toJSON(): Record<string, unknown> {
    return {
      count: this.count,
      actions: this.actions.map((a) => ({ type: a.type, data: a.toJSON() })),
    };
  }

  fromJSON(data: Record<string, unknown>): void {
    this.count = data.count as number | undefined;
    // actions deserialization requires registry — handled by caller
  }
}
```

**Step 4: Run tests**

Run: `npx jest src/engine/actions/LoopAction.test.ts --no-coverage`
Expected: All pass

**Step 5: Commit**

```bash
git add src/engine/actions/LoopAction.ts src/engine/actions/LoopAction.test.ts
git commit -m "feat(engine): implement LoopAction [T104]"
```

---

### Task 6: Implement AudioAction and CameraAction

Both are small actions that delegate to context APIs.

**Files:**

- Create: `src/engine/actions/AudioAction.ts`
- Create: `src/engine/actions/AudioAction.test.ts`
- Create: `src/engine/actions/CameraAction.ts`
- Create: `src/engine/actions/CameraAction.test.ts`

**Step 1: Write AudioAction test**

Create `src/engine/actions/AudioAction.test.ts`:

```typescript
import type { GameContext } from '../runtime/GameContext';

import { AudioAction } from './AudioAction';

function createMockContext(): GameContext {
  return {
    sound: {
      play: jest.fn(),
      stop: jest.fn(),
      stopAll: jest.fn(),
    },
  } as unknown as GameContext;
}

const noopRun = jest.fn();

describe('AudioAction', () => {
  it('has type "audio"', () => {
    expect(new AudioAction().type).toBe('audio');
  });

  it('playBGM calls sound.play', async () => {
    const action = new AudioAction();
    action.operation = 'playBGM';
    action.audioId = 'bgm-1';

    const ctx = createMockContext();
    await action.execute(ctx, noopRun);

    expect(ctx.sound.play).toHaveBeenCalledWith('bgm-1');
  });

  it('stopBGM calls sound.stopAll', async () => {
    const action = new AudioAction();
    action.operation = 'stopBGM';

    const ctx = createMockContext();
    await action.execute(ctx, noopRun);

    expect(ctx.sound.stopAll).toHaveBeenCalled();
  });

  it('playSE calls sound.play', async () => {
    const action = new AudioAction();
    action.operation = 'playSE';
    action.audioId = 'se-hit';

    const ctx = createMockContext();
    await action.execute(ctx, noopRun);

    expect(ctx.sound.play).toHaveBeenCalledWith('se-hit');
  });

  it('toJSON / fromJSON round-trips', () => {
    const action = new AudioAction();
    action.operation = 'playBGM';
    action.audioId = 'bgm-1';

    const json = action.toJSON();
    const restored = new AudioAction();
    restored.fromJSON(json);

    expect(restored.operation).toBe('playBGM');
    expect(restored.audioId).toBe('bgm-1');
  });
});
```

**Step 2: Write CameraAction test**

Create `src/engine/actions/CameraAction.test.ts`:

```typescript
import type { GameContext } from '../runtime/GameContext';

import { CameraAction } from './CameraAction';

function createMockContext(): GameContext {
  return {
    camera: {
      moveTo: jest.fn(),
      shake: jest.fn(),
    },
  } as unknown as GameContext;
}

const noopRun = jest.fn();

describe('CameraAction', () => {
  it('has type "camera"', () => {
    expect(new CameraAction().type).toBe('camera');
  });

  it('pan calls camera.moveTo', async () => {
    const action = new CameraAction();
    action.operation = 'pan';
    action.x = 100;
    action.y = 200;

    const ctx = createMockContext();
    await action.execute(ctx, noopRun);

    expect(ctx.camera.moveTo).toHaveBeenCalledWith(100, 200);
  });

  it('effect shake calls camera.shake', async () => {
    const action = new CameraAction();
    action.operation = 'effect';
    action.effect = 'shake';
    action.intensity = 5;
    action.duration = 30;

    const ctx = createMockContext();
    await action.execute(ctx, noopRun);

    expect(ctx.camera.shake).toHaveBeenCalledWith(5, 30);
  });

  it('toJSON / fromJSON round-trips', () => {
    const action = new CameraAction();
    action.operation = 'pan';
    action.x = 10;
    action.y = 20;

    const json = action.toJSON();
    const restored = new CameraAction();
    restored.fromJSON(json);

    expect(restored.operation).toBe('pan');
    expect(restored.x).toBe(10);
    expect(restored.y).toBe(20);
  });
});
```

**Step 3: Run tests to verify they fail**

Run: `npx jest src/engine/actions/AudioAction.test.ts src/engine/actions/CameraAction.test.ts --no-coverage`
Expected: FAIL

**Step 4: Implement AudioAction**

Create `src/engine/actions/AudioAction.ts`:

```typescript
import type { GameContext } from '../runtime/GameContext';

import { EventAction } from './EventAction';

export class AudioAction extends EventAction {
  readonly type = 'audio';
  operation: 'playBGM' | 'stopBGM' | 'playSE' = 'playBGM';
  audioId?: string;
  volume?: number;
  fadeIn?: number;
  fadeOut?: number;
  pitch?: number;

  async execute(
    context: GameContext,
    _run: (actions: EventAction[]) => Promise<void>
  ): Promise<void> {
    switch (this.operation) {
      case 'playBGM':
      case 'playSE':
        if (this.audioId) {
          context.sound.play(this.audioId);
        }
        break;
      case 'stopBGM':
        context.sound.stopAll();
        break;
    }
  }

  toJSON(): Record<string, unknown> {
    return {
      operation: this.operation,
      audioId: this.audioId,
      volume: this.volume,
      fadeIn: this.fadeIn,
      fadeOut: this.fadeOut,
      pitch: this.pitch,
    };
  }

  fromJSON(data: Record<string, unknown>): void {
    this.operation = data.operation as AudioAction['operation'];
    this.audioId = data.audioId as string | undefined;
    this.volume = data.volume as number | undefined;
    this.fadeIn = data.fadeIn as number | undefined;
    this.fadeOut = data.fadeOut as number | undefined;
    this.pitch = data.pitch as number | undefined;
  }
}
```

**Step 5: Implement CameraAction**

Create `src/engine/actions/CameraAction.ts`:

```typescript
import type { GameContext } from '../runtime/GameContext';

import { EventAction } from './EventAction';

export class CameraAction extends EventAction {
  readonly type = 'camera';
  operation: 'zoom' | 'pan' | 'effect' | 'reset' = 'pan';
  scale?: number;
  x?: number;
  y?: number;
  duration?: number;
  effect?: 'shake' | 'flash' | 'fadeIn' | 'fadeOut';
  intensity?: number;
  color?: string;

  async execute(
    context: GameContext,
    _run: (actions: EventAction[]) => Promise<void>
  ): Promise<void> {
    switch (this.operation) {
      case 'pan':
        context.camera.moveTo(this.x ?? 0, this.y ?? 0);
        break;
      case 'effect':
        if (this.effect === 'shake') {
          context.camera.shake(this.intensity ?? 5, this.duration ?? 30);
        }
        break;
      case 'zoom':
      case 'reset':
        // Delegated to camera API stubs for now
        break;
    }
  }

  toJSON(): Record<string, unknown> {
    return {
      operation: this.operation,
      scale: this.scale,
      x: this.x,
      y: this.y,
      duration: this.duration,
      effect: this.effect,
      intensity: this.intensity,
      color: this.color,
    };
  }

  fromJSON(data: Record<string, unknown>): void {
    this.operation = data.operation as CameraAction['operation'];
    this.scale = data.scale as number | undefined;
    this.x = data.x as number | undefined;
    this.y = data.y as number | undefined;
    this.duration = data.duration as number | undefined;
    this.effect = data.effect as CameraAction['effect'];
    this.intensity = data.intensity as number | undefined;
    this.color = data.color as string | undefined;
  }
}
```

**Step 6: Run tests**

Run: `npx jest src/engine/actions/AudioAction.test.ts src/engine/actions/CameraAction.test.ts --no-coverage`
Expected: All pass

**Step 7: Commit**

```bash
git add src/engine/actions/AudioAction.ts src/engine/actions/AudioAction.test.ts src/engine/actions/CameraAction.ts src/engine/actions/CameraAction.test.ts
git commit -m "feat(engine): implement AudioAction and CameraAction [T105]"
```

---

### Task 7: Implement ScriptAction and CallTemplateAction

**Files:**

- Create: `src/engine/actions/ScriptAction.ts`
- Create: `src/engine/actions/ScriptAction.test.ts`
- Create: `src/engine/actions/CallTemplateAction.ts`
- Create: `src/engine/actions/CallTemplateAction.test.ts`

**Step 1: Write ScriptAction test**

Create `src/engine/actions/ScriptAction.test.ts`:

```typescript
import type { GameContext } from '../runtime/GameContext';

import { ScriptAction } from './ScriptAction';

describe('ScriptAction', () => {
  it('has type "script"', () => {
    expect(new ScriptAction().type).toBe('script');
  });

  it('execute calls scriptRunner.execute with the found script', async () => {
    const mockScript = { id: 'scr-1', name: 'test' };
    const action = new ScriptAction();
    action.scriptId = 'scr-1';
    action.args = { damage: 10 };

    const ctx = {
      scriptRunner: {
        scripts: [mockScript],
        execute: jest.fn().mockReturnValue(undefined),
      },
    } as unknown as GameContext;
    // ScriptRunner stores scripts privately, so we mock the whole object
    // ScriptAction needs to find the script — we'll have it stored on scriptRunner
    // Actually, ScriptRunner.execute takes a Script object. ScriptAction needs to find it.
    // The scripts array is on projectData, not directly accessible. We'll need a lookup mechanism.
    // Solution: ScriptAction calls context.scriptRunner.execute() with the script found by ID.
    // ScriptRunner has a private `scripts` field. We need a public method or pass scripts differently.

    // For now, let's have ScriptAction pass scriptId to a helper method on ScriptRunner.
    // We'll add executeById(scriptId, context, args) to ScriptRunner.

    await action.execute(ctx, jest.fn());

    expect(ctx.scriptRunner.execute).toHaveBeenCalled();
  });

  it('toJSON / fromJSON round-trips', () => {
    const action = new ScriptAction();
    action.scriptId = 'scr-1';
    action.args = { damage: 10 };

    const json = action.toJSON();
    expect(json).toEqual({ scriptId: 'scr-1', args: { damage: 10 } });

    const restored = new ScriptAction();
    restored.fromJSON(json);
    expect(restored.scriptId).toBe('scr-1');
    expect(restored.args).toEqual({ damage: 10 });
  });
});
```

Note: ScriptAction needs to find a script by ID. ScriptRunner stores scripts privately. We'll add a `executeById(id, context, args)` method to ScriptRunner for this purpose.

**Step 2: Write CallTemplateAction test**

Create `src/engine/actions/CallTemplateAction.test.ts`:

```typescript
import type { GameContext } from '../runtime/GameContext';

import { CallTemplateAction } from './CallTemplateAction';

describe('CallTemplateAction', () => {
  it('has type "callTemplate"', () => {
    expect(new CallTemplateAction().type).toBe('callTemplate');
  });

  it('execute is a no-op for now (template resolution is future work)', async () => {
    const action = new CallTemplateAction();
    action.templateId = 'tpl-1';
    action.args = { x: 10 };

    // CallTemplateAction will need access to template storage.
    // For Phase 8, execute is a no-op since template storage doesn't exist yet.
    const run = jest.fn();
    await action.execute({} as GameContext, run);

    // No run called since template resolution not yet implemented
    expect(run).not.toHaveBeenCalled();
  });

  it('toJSON / fromJSON round-trips', () => {
    const action = new CallTemplateAction();
    action.templateId = 'tpl-1';
    action.args = { x: 10, y: 20 };

    const json = action.toJSON();
    expect(json).toEqual({ templateId: 'tpl-1', args: { x: 10, y: 20 } });

    const restored = new CallTemplateAction();
    restored.fromJSON(json);
    expect(restored.templateId).toBe('tpl-1');
    expect(restored.args).toEqual({ x: 10, y: 20 });
  });
});
```

**Step 3: Run tests to verify they fail**

Run: `npx jest src/engine/actions/ScriptAction.test.ts src/engine/actions/CallTemplateAction.test.ts --no-coverage`
Expected: FAIL

**Step 4: Add executeById to ScriptRunner**

In `src/engine/core/ScriptRunner.ts`, add a public method:

```typescript
/**
 * Execute a script by its ID.
 * Used by ScriptAction to find and run scripts without needing direct script access.
 */
executeById(
  scriptId: string,
  context: GameContext,
  argValues?: Record<string, unknown>
): unknown {
  const script = this.scripts.find((s) => s.id === scriptId);
  if (!script) {
    throw new Error(`Script "${scriptId}" not found`);
  }
  return this.execute(script, context, argValues);
}
```

**Step 5: Implement ScriptAction**

Create `src/engine/actions/ScriptAction.ts`:

```typescript
import type { GameContext } from '../runtime/GameContext';

import { EventAction } from './EventAction';

export class ScriptAction extends EventAction {
  readonly type = 'script';
  scriptId = '';
  args: Record<string, unknown> = {};

  async execute(
    context: GameContext,
    _run: (actions: EventAction[]) => Promise<void>
  ): Promise<void> {
    await context.scriptRunner.executeById(this.scriptId, context, this.args);
  }

  toJSON(): Record<string, unknown> {
    return {
      scriptId: this.scriptId,
      args: this.args,
    };
  }

  fromJSON(data: Record<string, unknown>): void {
    this.scriptId = data.scriptId as string;
    this.args = (data.args as Record<string, unknown>) ?? {};
  }
}
```

**Step 6: Implement CallTemplateAction**

Create `src/engine/actions/CallTemplateAction.ts`:

```typescript
import type { GameContext } from '../runtime/GameContext';

import { EventAction } from './EventAction';

export class CallTemplateAction extends EventAction {
  readonly type = 'callTemplate';
  templateId = '';
  args: Record<string, unknown> = {};

  async execute(
    _context: GameContext,
    _run: (actions: EventAction[]) => Promise<void>
  ): Promise<void> {
    // Template resolution requires template storage — not yet implemented.
    // Will be implemented when event template feature is added.
  }

  toJSON(): Record<string, unknown> {
    return {
      templateId: this.templateId,
      args: this.args,
    };
  }

  fromJSON(data: Record<string, unknown>): void {
    this.templateId = data.templateId as string;
    this.args = (data.args as Record<string, unknown>) ?? {};
  }
}
```

**Step 7: Update ScriptAction test with proper mock**

```typescript
import type { GameContext } from '../runtime/GameContext';

import { ScriptAction } from './ScriptAction';

describe('ScriptAction', () => {
  it('has type "script"', () => {
    expect(new ScriptAction().type).toBe('script');
  });

  it('execute calls scriptRunner.executeById', async () => {
    const action = new ScriptAction();
    action.scriptId = 'scr-1';
    action.args = { damage: 10 };

    const ctx = {
      scriptRunner: {
        executeById: jest.fn().mockResolvedValue(undefined),
      },
    } as unknown as GameContext;

    await action.execute(ctx, jest.fn());

    expect(ctx.scriptRunner.executeById).toHaveBeenCalledWith('scr-1', ctx, { damage: 10 });
  });

  it('toJSON / fromJSON round-trips', () => {
    const action = new ScriptAction();
    action.scriptId = 'scr-1';
    action.args = { damage: 10 };

    const json = action.toJSON();
    expect(json).toEqual({ scriptId: 'scr-1', args: { damage: 10 } });

    const restored = new ScriptAction();
    restored.fromJSON(json);
    expect(restored.scriptId).toBe('scr-1');
    expect(restored.args).toEqual({ damage: 10 });
  });
});
```

**Step 8: Run tests**

Run: `npx jest src/engine/actions/ScriptAction.test.ts src/engine/actions/CallTemplateAction.test.ts --no-coverage`
Expected: All pass

**Step 9: Commit**

```bash
git add src/engine/actions/ScriptAction.ts src/engine/actions/ScriptAction.test.ts src/engine/actions/CallTemplateAction.ts src/engine/actions/CallTemplateAction.test.ts src/engine/core/ScriptRunner.ts
git commit -m "feat(engine): implement ScriptAction and CallTemplateAction [T106]"
```

---

### Task 8: Implement no-op stub actions (WaitAction, ObjectAction, MapAction)

**Files:**

- Create: `src/engine/actions/WaitAction.ts`
- Create: `src/engine/actions/ObjectAction.ts`
- Create: `src/engine/actions/MapAction.ts`
- Create: `src/engine/actions/stubActions.test.ts`

**Step 1: Write test for all three**

Create `src/engine/actions/stubActions.test.ts`:

```typescript
import type { GameContext } from '../runtime/GameContext';

import { WaitAction } from './WaitAction';
import { ObjectAction } from './ObjectAction';
import { MapAction } from './MapAction';

const noopRun = jest.fn();
const ctx = {} as GameContext;

describe('WaitAction', () => {
  it('has type "wait"', () => {
    expect(new WaitAction().type).toBe('wait');
  });

  it('execute is no-op', async () => {
    const action = new WaitAction();
    action.frames = 60;
    await action.execute(ctx, noopRun);
    // No error thrown = success
  });

  it('toJSON / fromJSON round-trips', () => {
    const action = new WaitAction();
    action.frames = 30;

    const json = action.toJSON();
    expect(json).toEqual({ frames: 30 });

    const restored = new WaitAction();
    restored.fromJSON(json);
    expect(restored.frames).toBe(30);
  });
});

describe('ObjectAction', () => {
  it('has type "object"', () => {
    expect(new ObjectAction().type).toBe('object');
  });

  it('execute is no-op', async () => {
    const action = new ObjectAction();
    action.operation = 'move';
    action.targetId = 'obj-1';
    await action.execute(ctx, noopRun);
  });

  it('toJSON / fromJSON round-trips', () => {
    const action = new ObjectAction();
    action.operation = 'move';
    action.targetId = 'obj-1';
    action.x = 10;
    action.y = 20;

    const json = action.toJSON();
    const restored = new ObjectAction();
    restored.fromJSON(json);

    expect(restored.operation).toBe('move');
    expect(restored.targetId).toBe('obj-1');
    expect(restored.x).toBe(10);
    expect(restored.y).toBe(20);
  });
});

describe('MapAction', () => {
  it('has type "map"', () => {
    expect(new MapAction().type).toBe('map');
  });

  it('execute is no-op', async () => {
    const action = new MapAction();
    action.operation = 'changeMap';
    action.targetMapId = 'map-2';
    await action.execute(ctx, noopRun);
  });

  it('toJSON / fromJSON round-trips', () => {
    const action = new MapAction();
    action.operation = 'changeMap';
    action.targetMapId = 'map-2';
    action.x = 5;
    action.y = 10;

    const json = action.toJSON();
    const restored = new MapAction();
    restored.fromJSON(json);

    expect(restored.operation).toBe('changeMap');
    expect(restored.targetMapId).toBe('map-2');
    expect(restored.x).toBe(5);
    expect(restored.y).toBe(10);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest src/engine/actions/stubActions.test.ts --no-coverage`
Expected: FAIL

**Step 3: Implement WaitAction**

Create `src/engine/actions/WaitAction.ts`:

```typescript
import type { GameContext } from '../runtime/GameContext';

import { EventAction } from './EventAction';

export class WaitAction extends EventAction {
  readonly type = 'wait';
  frames = 60;

  async execute(
    _context: GameContext,
    _run: (actions: EventAction[]) => Promise<void>
  ): Promise<void> {
    // No-op: game loop not yet implemented (Phase 18)
  }

  toJSON(): Record<string, unknown> {
    return { frames: this.frames };
  }

  fromJSON(data: Record<string, unknown>): void {
    this.frames = (data.frames as number) ?? 60;
  }
}
```

**Step 4: Implement ObjectAction**

Create `src/engine/actions/ObjectAction.ts`:

```typescript
import type { GameContext } from '../runtime/GameContext';

import { EventAction } from './EventAction';

export class ObjectAction extends EventAction {
  readonly type = 'object';
  operation: 'move' | 'rotate' | 'autoWalk' = 'move';
  targetId = '';
  x?: number;
  y?: number;
  speed?: number;
  angle?: number;
  duration?: number;
  enabled?: boolean;

  async execute(
    _context: GameContext,
    _run: (actions: EventAction[]) => Promise<void>
  ): Promise<void> {
    // No-op: map object system not yet implemented (Phase 10)
  }

  toJSON(): Record<string, unknown> {
    return {
      operation: this.operation,
      targetId: this.targetId,
      x: this.x,
      y: this.y,
      speed: this.speed,
      angle: this.angle,
      duration: this.duration,
      enabled: this.enabled,
    };
  }

  fromJSON(data: Record<string, unknown>): void {
    this.operation = data.operation as ObjectAction['operation'];
    this.targetId = data.targetId as string;
    this.x = data.x as number | undefined;
    this.y = data.y as number | undefined;
    this.speed = data.speed as number | undefined;
    this.angle = data.angle as number | undefined;
    this.duration = data.duration as number | undefined;
    this.enabled = data.enabled as boolean | undefined;
  }
}
```

**Step 5: Implement MapAction**

Create `src/engine/actions/MapAction.ts`:

```typescript
import type { GameContext } from '../runtime/GameContext';

import { EventAction } from './EventAction';

export class MapAction extends EventAction {
  readonly type = 'map';
  operation: 'changeMap' | 'getChip' = 'changeMap';
  targetMapId?: string;
  x?: number;
  y?: number;
  transition?: 'fade' | 'none';
  resultVariableId?: string;
  sourceMapId?: string;
  chipX?: number;
  chipY?: number;
  layer?: number;

  async execute(
    _context: GameContext,
    _run: (actions: EventAction[]) => Promise<void>
  ): Promise<void> {
    // No-op: map system not yet implemented (Phase 10)
  }

  toJSON(): Record<string, unknown> {
    return {
      operation: this.operation,
      targetMapId: this.targetMapId,
      x: this.x,
      y: this.y,
      transition: this.transition,
      resultVariableId: this.resultVariableId,
      sourceMapId: this.sourceMapId,
      chipX: this.chipX,
      chipY: this.chipY,
      layer: this.layer,
    };
  }

  fromJSON(data: Record<string, unknown>): void {
    this.operation = data.operation as MapAction['operation'];
    this.targetMapId = data.targetMapId as string | undefined;
    this.x = data.x as number | undefined;
    this.y = data.y as number | undefined;
    this.transition = data.transition as MapAction['transition'];
    this.resultVariableId = data.resultVariableId as string | undefined;
    this.sourceMapId = data.sourceMapId as string | undefined;
    this.chipX = data.chipX as number | undefined;
    this.chipY = data.chipY as number | undefined;
    this.layer = data.layer as number | undefined;
  }
}
```

**Step 6: Run tests**

Run: `npx jest src/engine/actions/stubActions.test.ts --no-coverage`
Expected: All pass

**Step 7: Commit**

```bash
git add src/engine/actions/WaitAction.ts src/engine/actions/ObjectAction.ts src/engine/actions/MapAction.ts src/engine/actions/stubActions.test.ts
git commit -m "feat(engine): implement no-op stub actions (Wait, Object, Map) [T107]"
```

---

### Task 9: Register all actions and export from index

**Files:**

- Modify: `src/engine/actions/index.ts`
- Create: `src/engine/actions/registration.test.ts`

**Step 1: Write test**

Create `src/engine/actions/registration.test.ts`:

```typescript
import { getAction, getActionNames } from './index';

// Import to trigger registration
import './register';

describe('Action registration', () => {
  it('all 10 action types are registered', () => {
    const names = getActionNames();
    expect(names).toContain('variableOp');
    expect(names).toContain('conditional');
    expect(names).toContain('loop');
    expect(names).toContain('audio');
    expect(names).toContain('camera');
    expect(names).toContain('script');
    expect(names).toContain('callTemplate');
    expect(names).toContain('wait');
    expect(names).toContain('object');
    expect(names).toContain('map');
    expect(names).toHaveLength(10);
  });

  it('each registered action can be instantiated', () => {
    for (const name of getActionNames()) {
      const ActionClass = getAction(name);
      expect(ActionClass).toBeDefined();
      const instance = new ActionClass!();
      expect(instance.type).toBe(name);
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest src/engine/actions/registration.test.ts --no-coverage`
Expected: FAIL

**Step 3: Create register file**

Create `src/engine/actions/register.ts`:

```typescript
import { registerAction } from './index';
import { VariableOpAction } from './VariableOpAction';
import { ConditionalAction } from './ConditionalAction';
import { LoopAction } from './LoopAction';
import { AudioAction } from './AudioAction';
import { CameraAction } from './CameraAction';
import { ScriptAction } from './ScriptAction';
import { CallTemplateAction } from './CallTemplateAction';
import { WaitAction } from './WaitAction';
import { ObjectAction } from './ObjectAction';
import { MapAction } from './MapAction';

registerAction('variableOp', VariableOpAction);
registerAction('conditional', ConditionalAction);
registerAction('loop', LoopAction);
registerAction('audio', AudioAction);
registerAction('camera', CameraAction);
registerAction('script', ScriptAction);
registerAction('callTemplate', CallTemplateAction);
registerAction('wait', WaitAction);
registerAction('object', ObjectAction);
registerAction('map', MapAction);
```

**Step 4: Run tests**

Run: `npx jest src/engine/actions/registration.test.ts --no-coverage`
Expected: All pass

**Step 5: Commit**

```bash
git add src/engine/actions/register.ts src/engine/actions/registration.test.ts
git commit -m "feat(engine): register all 10 action types [T108]"
```

---

### Task 10: Implement EventRunner

**Files:**

- Create: `src/engine/event/EventRunner.ts`
- Create: `src/engine/event/EventRunner.test.ts`

**Step 1: Write test**

Create `src/engine/event/EventRunner.test.ts`:

```typescript
import type { GameContext } from '../runtime/GameContext';
import { EventAction } from '../actions/EventAction';

import { EventRunner } from './EventRunner';

class MockAction extends EventAction {
  readonly type = 'mock';
  executedCount = 0;
  callback?: (ctx: GameContext) => void;

  async execute(
    context: GameContext,
    _run: (actions: EventAction[]) => Promise<void>
  ): Promise<void> {
    this.executedCount++;
    this.callback?.(context);
  }

  toJSON(): Record<string, unknown> {
    return {};
  }

  fromJSON(_data: Record<string, unknown>): void {}
}

class CounterAction extends EventAction {
  readonly type = 'counter';

  async execute(
    context: GameContext,
    _run: (actions: EventAction[]) => Promise<void>
  ): Promise<void> {
    const current = (context.variable.get('count') as number) ?? 0;
    context.variable.set('count', current + 1);
  }

  toJSON(): Record<string, unknown> {
    return {};
  }

  fromJSON(_data: Record<string, unknown>): void {}
}

function createMockContext(vars: Record<string, unknown> = {}): GameContext {
  const store = { ...vars };
  return {
    variable: {
      get: jest.fn((name: string) => store[name]),
      set: jest.fn((name: string, value: unknown) => {
        store[name] = value;
      }),
      getAll: jest.fn(() => ({ ...store })),
    },
  } as unknown as GameContext;
}

describe('EventRunner', () => {
  it('runs actions sequentially', async () => {
    const runner = new EventRunner();
    const a1 = new MockAction();
    const a2 = new MockAction();

    await runner.run([a1, a2], createMockContext());

    expect(a1.executedCount).toBe(1);
    expect(a2.executedCount).toBe(1);
  });

  it('runs no actions for empty array', async () => {
    const runner = new EventRunner();
    await runner.run([], createMockContext());
    // No error = success
  });

  it('throws when iteration limit exceeded', async () => {
    // Create an action that spawns infinite child actions
    class InfiniteAction extends EventAction {
      readonly type = 'infinite';
      childActions: EventAction[] = [];

      async execute(
        _context: GameContext,
        run: (actions: EventAction[]) => Promise<void>
      ): Promise<void> {
        // Recurse forever via child actions
        await run([this]);
      }

      toJSON(): Record<string, unknown> {
        return {};
      }
      fromJSON(_data: Record<string, unknown>): void {}
    }

    const runner = new EventRunner();
    const action = new InfiniteAction();

    await expect(runner.run([action], createMockContext())).rejects.toThrow(/イテレーション上限/);
  });

  it('passes context to each action', async () => {
    const runner = new EventRunner();
    const ctx = createMockContext({ hp: 100 });
    const action = new CounterAction();

    await runner.run([action, action, action], ctx);

    expect(ctx.variable.set).toHaveBeenCalledTimes(3);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest src/engine/event/EventRunner.test.ts --no-coverage`
Expected: FAIL

**Step 3: Implement EventRunner**

Create `src/engine/event/EventRunner.ts`:

```typescript
import type { GameContext } from '../runtime/GameContext';
import type { EventAction } from '../actions/EventAction';

const MAX_ITERATIONS = 100_000;

export class EventRunner {
  private iterationCount = 0;

  async run(actions: EventAction[], context: GameContext): Promise<void> {
    for (const action of actions) {
      this.iterationCount++;
      if (this.iterationCount > MAX_ITERATIONS) {
        throw new Error(`EventRunner: イテレーション上限 (${MAX_ITERATIONS}) を超えました`);
      }
      await action.execute(context, (children) => this.run(children, context));
    }
  }
}
```

**Step 4: Run tests**

Run: `npx jest src/engine/event/EventRunner.test.ts --no-coverage`
Expected: All pass

**Step 5: Commit**

```bash
git add src/engine/event/EventRunner.ts src/engine/event/EventRunner.test.ts
git commit -m "feat(engine): implement EventRunner with iteration limit [T109]"
```

---

### Task 11: Add event mode to GameEngine

**Files:**

- Modify: `src/engine/types.ts`
- Modify: `src/engine/core/GameEngine.ts`
- Modify: `src/engine/core/GameEngine.test.ts`

**Step 1: Add types**

In `src/engine/types.ts`:

Add `SerializedAction` and `EventModeConfig`:

```typescript
export interface SerializedAction {
  type: string;
  data: Record<string, unknown>;
}

export interface EventModeConfig extends EngineStartConfig {
  mode: 'event';
  actions: SerializedAction[];
  testSettings?: {
    variables?: Record<string, unknown>;
  };
}
```

Update `EngineStartConfig`:

```typescript
export interface EngineStartConfig {
  mode: 'full' | 'script' | 'event';
  projectData: EngineProjectData;
}
```

Update `EditorMessage`:

```typescript
export type EditorMessage =
  | { type: 'start'; config: FullModeConfig | ScriptModeConfig | EventModeConfig }
  | { type: 'stop' }
  | { type: 'pause' }
  | { type: 'resume' };
```

Add `EngineMessage` event-related types:

```typescript
export type EngineMessage =
  | { type: 'ready' }
  | { type: 'log'; level: 'info' | 'warn' | 'error'; message: string }
  | { type: 'script-result'; value: unknown }
  | { type: 'script-error'; error: string; errorType: ScriptErrorType; stack?: string }
  | { type: 'state-update'; variables: Record<string, unknown> }
  | { type: 'event-error'; error: string; stack?: string }
  | { type: 'event-complete' };
```

**Step 2: Write GameEngine event mode test**

Add to `src/engine/core/GameEngine.test.ts`:

```typescript
import type { EventModeConfig, SerializedAction } from '../types';
import '../actions/register'; // register all action types

// ... existing tests ...

describe('GameEngine event mode', () => {
  let engine: GameEngine;
  let sentMessages: EngineMessage[];

  beforeEach(() => {
    sentMessages = [];
    engine = new GameEngine((msg: EngineMessage) => {
      sentMessages.push(msg);
    });
  });

  function makeEventConfig(
    actions: SerializedAction[],
    vars?: Record<string, unknown>
  ): EventModeConfig {
    return {
      mode: 'event',
      projectData: {
        scripts: [],
        variables: vars
          ? Object.entries(vars).map(([name, value]) => ({
              id: `var-${name}`,
              name,
              type: typeof value === 'number' ? 'number' : 'string',
              defaultValue: value,
            }))
          : [],
        classes: [],
        dataTypes: [],
        dataEntries: {},
      },
      actions,
    };
  }

  it('executes event actions and sends event-complete', async () => {
    const config = makeEventConfig(
      [{ type: 'variableOp', data: { variableId: 'hp', operation: 'set', value: 50 } }],
      { hp: 100 }
    );

    await engine.handleMessage({ type: 'start', config });

    expect(sentMessages).toContainEqual({ type: 'event-complete' });
    const stateMsg = sentMessages.find((m) => m.type === 'state-update');
    expect(stateMsg).toBeDefined();
    if (stateMsg && stateMsg.type === 'state-update') {
      expect(stateMsg.variables['hp']).toBe(50);
    }
  });

  it('sends event-error for unknown action type', async () => {
    const config = makeEventConfig([{ type: 'nonexistent', data: {} }]);

    await engine.handleMessage({ type: 'start', config });

    const errorMsg = sentMessages.find((m) => m.type === 'event-error');
    expect(errorMsg).toBeDefined();
  });

  it('sends event-error when action execution throws', async () => {
    // VariableOp with missing variable — won't throw, but we can test with a bad setup
    // Use a script action referencing nonexistent script
    const config: EventModeConfig = {
      mode: 'event',
      projectData: {
        scripts: [],
        variables: [],
        classes: [],
        dataTypes: [],
        dataEntries: {},
      },
      actions: [{ type: 'script', data: { scriptId: 'nonexistent', args: {} } }],
    };

    await engine.handleMessage({ type: 'start', config });

    const errorMsg = sentMessages.find((m) => m.type === 'event-error');
    expect(errorMsg).toBeDefined();
  });
});
```

**Step 3: Run test to verify it fails**

Run: `npx jest src/engine/core/GameEngine.test.ts --no-coverage`
Expected: FAIL (new tests fail)

**Step 4: Implement event mode in GameEngine**

In `src/engine/core/GameEngine.ts`:

```typescript
import type {
  EditorMessage,
  EngineMessage,
  EventModeConfig,
  FullModeConfig,
  ScriptModeConfig,
} from '../types';
import { getAction } from '../actions/index';
import { EventRunner } from '../event/EventRunner';
import { GameContext } from '../runtime/GameContext';
import { validateScriptReturn } from '../validateReturn';

import { ScriptRunner } from './ScriptRunner';

// ... in handleStart:
private async handleStart(
  config: ScriptModeConfig | FullModeConfig | EventModeConfig
): Promise<void> {
  if (config.mode === 'script') {
    await this.executeScript(config);
  } else if (config.mode === 'event') {
    await this.executeEvent(config);
  }
}

private async executeEvent(config: EventModeConfig): Promise<void> {
  try {
    // 1. Deserialize actions
    const actions = config.actions.map((a) => {
      const ActionClass = getAction(a.type);
      if (!ActionClass) throw new Error(`Unknown action type: ${a.type}`);
      const action = new ActionClass();
      action.fromJSON(a.data);
      return action;
    });

    // 2. Build context
    const runner = new ScriptRunner(config.projectData.scripts);
    const context = new GameContext(config.projectData, runner, {
      variables: config.testSettings?.variables,
    });

    // 3. Run via EventRunner
    const eventRunner = new EventRunner();
    await eventRunner.run(actions, context);

    // 4. Return results
    this.sendMessage({ type: 'state-update', variables: context.variable.getAll() });
    this.sendMessage({ type: 'event-complete' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    this.sendMessage({ type: 'event-error', error: msg, stack });
  }
}
```

**Step 5: Run tests**

Run: `npx jest src/engine/core/GameEngine.test.ts --no-coverage`
Expected: All pass

**Step 6: Run all engine tests**

Run: `npx jest src/engine/ --no-coverage`
Expected: All pass

**Step 7: Commit**

```bash
git add src/engine/types.ts src/engine/core/GameEngine.ts src/engine/core/GameEngine.test.ts
git commit -m "feat(engine): add event mode to GameEngine [T110]"
```

---

### Task 12: Delete old types/actions/ and final cleanup

**Files:**

- Delete: `src/types/actions/EventAction.ts`
- Delete: `src/types/actions/index.ts`

**Step 1: Check for any remaining imports from types/actions**

Run: `grep -r "types/actions" src/`
Expected: No results (if any found, update those imports first)

**Step 2: Delete old files**

```bash
rm src/types/actions/EventAction.ts src/types/actions/index.ts
rmdir src/types/actions
```

**Step 3: Run all tests**

Run: `npx jest --no-coverage`
Expected: All pass

**Step 4: Commit**

```bash
git add -A
git commit -m "refactor(engine): remove old types/actions/ (moved to engine/actions/) [T111]"
```

---

### Summary

| Task | Description                                             | New Files | Modified Files                                        |
| ---- | ------------------------------------------------------- | --------- | ----------------------------------------------------- |
| 1    | Remove ScriptContext, refactor ScriptRunner/GameContext | -         | ScriptRunner.ts, GameContext.ts, GameEngine.ts, tests |
| 2    | EventAction base + registry in engine/actions/          | 3         | -                                                     |
| 3    | VariableOpAction                                        | 2         | -                                                     |
| 4    | ConditionalAction                                       | 2         | -                                                     |
| 5    | LoopAction                                              | 2         | -                                                     |
| 6    | AudioAction + CameraAction                              | 4         | -                                                     |
| 7    | ScriptAction + CallTemplateAction                       | 4         | ScriptRunner.ts                                       |
| 8    | WaitAction + ObjectAction + MapAction                   | 4         | -                                                     |
| 9    | Register all actions                                    | 2         | -                                                     |
| 10   | EventRunner                                             | 2         | -                                                     |
| 11   | Event mode in GameEngine                                | -         | types.ts, GameEngine.ts, GameEngine.test.ts           |
| 12   | Delete old types/actions/                               | -         | Delete 2 files                                        |
