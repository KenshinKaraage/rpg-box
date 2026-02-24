# Component Scripts: Built-in Components as Default Scripts Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Automatically convert existing `Component` TypeScript classes into `Script` objects (type: 'component') so that built-in components (Transform, Sprite, etc.) appear as pre-seeded component scripts.

**Architecture:** Each registered `Component` class is converted to a `Script` via `serialize()` (for default values) and value-type inference (for field types). No changes to existing Component classes needed. The `getDefaultComponentScripts()` function uses `getAllComponents()` to build the list, matching the `defaultClasses.ts` pattern.

**Tech Stack:** TypeScript, Jest, existing Component registry (`getAllComponents`), existing `Script` type in `src/types/script.ts`

---

### Task 1: Add `ComponentField` type and `fields` to `Script`

**Files:**

- Modify: `src/types/script.ts`

**Step 1: Write the failing test**

Add to `src/stores/scriptSlice.test.ts` inside `describe('scriptSlice')`:

```typescript
it('component スクリプトは fields を持つ', () => {
  const script = createScript('comp_001', 'Transform', 'component');
  expect(script.fields).toEqual([]);
});
```

**Step 2: Run test to verify it fails**

```bash
npx jest src/stores/scriptSlice.test.ts --testNamePattern="fields" -t "fields"
```

Expected: FAIL — `script.fields` is undefined

**Step 3: Add `ComponentField` interface and `fields` to `Script`**

In `src/types/script.ts`, add after the `ScriptReturn` interface:

```typescript
/**
 * コンポーネントスクリプトのフィールド定義
 * コンポーネントスクリプトの右パネルで設定するフィールドのスキーマ
 */
export interface ComponentField {
  /** フィールド名（JS識別子） */
  name: string;
  /** FieldType の type 名 ('number', 'string', 'boolean', 'array', 'object') */
  type: string;
  /** デフォルト値 */
  defaultValue: unknown;
  /** 表示名 */
  label: string;
}
```

Then add `fields: ComponentField[];` to the `Script` interface (after `returns`):

```typescript
/** フィールド定義（component スクリプト用） */
fields: ComponentField[];
```

Then update `createScript()` to initialize `fields`:

```typescript
export function createScript(id: string, name: string, type: ScriptType): Script {
  return {
    id,
    name,
    type,
    content: '',
    args: [],
    returns: [],
    fields: [], // ← 追加
    isAsync: false,
    description: '',
  };
}
```

**Step 4: Run test to verify it passes**

```bash
npx jest src/stores/scriptSlice.test.ts
```

Expected: all PASS

**Step 5: Commit**

```bash
git add src/types/script.ts src/stores/scriptSlice.test.ts
git commit -m "feat(script): add ComponentField type and fields to Script [T242]"
```

---

### Task 2: Create `componentScriptUtils.ts`

**Files:**

- Create: `src/lib/componentScriptUtils.ts`
- Create: `src/lib/componentScriptUtils.test.ts`

**Step 1: Write the failing tests**

Create `src/lib/componentScriptUtils.test.ts`:

```typescript
import {
  inferFieldType,
  generateScriptContent,
  componentClassToScript,
} from './componentScriptUtils';
import { Component } from '@/types/components/Component';
import type { ComponentField } from '@/types/script';

class SimpleComponent extends Component {
  readonly type = 'simple';
  readonly label = 'Simple';
  count = 0;
  name = '';
  active = true;

  serialize() {
    return { count: this.count, name: this.name, active: this.active };
  }
  deserialize(data: Record<string, unknown>) {
    this.count = (data.count as number) ?? 0;
    this.name = (data.name as string) ?? '';
    this.active = (data.active as boolean) ?? true;
  }
  clone() {
    const c = new SimpleComponent();
    c.count = this.count;
    c.name = this.name;
    c.active = this.active;
    return c;
  }
}

class ArrayComponent extends Component {
  readonly type = 'array';
  readonly label = 'Array';
  items: { x: number; y: number }[] = [];

  serialize() {
    return { items: this.items.map((i) => ({ x: i.x, y: i.y })) };
  }
  deserialize(data: Record<string, unknown>) {
    this.items = (data.items as { x: number; y: number }[]) ?? [];
  }
  clone() {
    const c = new ArrayComponent();
    c.items = [...this.items];
    return c;
  }
}

describe('inferFieldType', () => {
  it('数値 → number', () => expect(inferFieldType(0)).toBe('number'));
  it('文字列 → string', () => expect(inferFieldType('')).toBe('string'));
  it('真偽値 → boolean', () => expect(inferFieldType(false)).toBe('boolean'));
  it('配列 → array', () => expect(inferFieldType([])).toBe('array'));
  it('オブジェクト → object', () => expect(inferFieldType({})).toBe('object'));
  it('undefined → string', () => expect(inferFieldType(undefined)).toBe('string'));
  it('null → string', () => expect(inferFieldType(null)).toBe('string'));
});

describe('generateScriptContent', () => {
  it('フィールドから export default コードを生成する', () => {
    const fields: ComponentField[] = [
      { name: 'count', type: 'number', defaultValue: 0, label: 'Count' },
      { name: 'name', type: 'string', defaultValue: '', label: 'Name' },
    ];
    const code = generateScriptContent(fields);
    expect(code).toBe('export default {\n  count: 0,\n  name: ""\n}');
  });

  it('フィールドが空の場合は空オブジェクトを生成する', () => {
    expect(generateScriptContent([])).toBe('export default {}');
  });
});

describe('componentClassToScript', () => {
  it('Script に変換できる', () => {
    const script = componentClassToScript(SimpleComponent);
    expect(script.id).toBe('simple');
    expect(script.name).toBe('Simple');
    expect(script.type).toBe('component');
    expect(script.fields).toHaveLength(3);
  });

  it('serialize() からフィールドの型とデフォルト値を推論する', () => {
    const script = componentClassToScript(SimpleComponent);
    expect(script.fields).toContainEqual({
      name: 'count',
      type: 'number',
      defaultValue: 0,
      label: 'count',
    });
    expect(script.fields).toContainEqual({
      name: 'name',
      type: 'string',
      defaultValue: '',
      label: 'name',
    });
    expect(script.fields).toContainEqual({
      name: 'active',
      type: 'boolean',
      defaultValue: true,
      label: 'active',
    });
  });

  it('content に export default コードが含まれる', () => {
    const script = componentClassToScript(SimpleComponent);
    expect(script.content).toContain('export default');
    expect(script.content).toContain('count');
  });

  it('配列フィールドを array として推論する', () => {
    const script = componentClassToScript(ArrayComponent);
    expect(script.fields).toContainEqual(expect.objectContaining({ name: 'items', type: 'array' }));
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
npx jest src/lib/componentScriptUtils.test.ts
```

Expected: FAIL — module not found

**Step 3: Implement `componentScriptUtils.ts`**

Create `src/lib/componentScriptUtils.ts`:

```typescript
import type { Component } from '@/types/components/Component';
import type { ComponentField, Script } from '@/types/script';

type ComponentConstructor = new () => Component;

/**
 * JavaScript の値から FieldType の type 名を推論する
 */
export function inferFieldType(value: unknown): string {
  if (value === null || value === undefined) return 'string';
  if (Array.isArray(value)) return 'array';
  const t = typeof value;
  if (t === 'number' || t === 'string' || t === 'boolean' || t === 'object') return t;
  return 'string';
}

/**
 * ComponentField 配列から export default の JS コードを生成する
 */
export function generateScriptContent(fields: ComponentField[]): string {
  if (fields.length === 0) return 'export default {}';
  const lines = fields.map((f) => `  ${f.name}: ${JSON.stringify(f.defaultValue)}`);
  return `export default {\n${lines.join(',\n')}\n}`;
}

/**
 * Component クラスを Script (type: 'component') に変換する
 *
 * serialize() から デフォルト値を取得し、型を推論する。
 * Component クラスへの変更は不要。
 */
export function componentClassToScript(Cls: ComponentConstructor): Script {
  const instance = new Cls();
  const defaults = instance.serialize();

  const fields: ComponentField[] = Object.entries(defaults).map(([name, value]) => ({
    name,
    type: inferFieldType(value),
    defaultValue: value,
    label: name,
  }));

  return {
    id: instance.type,
    name: instance.label,
    type: 'component',
    content: generateScriptContent(fields),
    fields,
    args: [],
    returns: [],
    isAsync: false,
    description: '',
  };
}
```

**Step 4: Run tests to verify they pass**

```bash
npx jest src/lib/componentScriptUtils.test.ts
```

Expected: all PASS

**Step 5: Commit**

```bash
git add src/lib/componentScriptUtils.ts src/lib/componentScriptUtils.test.ts
git commit -m "feat(lib): add componentScriptUtils for Component→Script conversion [T242]"
```

---

### Task 3: Create `defaultComponentScripts.ts`

**Files:**

- Create: `src/lib/defaultComponentScripts.ts`
- Create: `src/lib/defaultComponentScripts.test.ts`

**Step 1: Write the failing tests**

Create `src/lib/defaultComponentScripts.test.ts`:

```typescript
import { getDefaultComponentScripts } from './defaultComponentScripts';

describe('getDefaultComponentScripts', () => {
  it('全ビルトインコンポーネントを含む', () => {
    const scripts = getDefaultComponentScripts();
    expect(scripts.length).toBeGreaterThanOrEqual(13);
  });

  it('transform スクリプトが含まれる', () => {
    const scripts = getDefaultComponentScripts();
    const transform = scripts.find((s) => s.id === 'transform');
    expect(transform).toBeDefined();
    expect(transform?.type).toBe('component');
    expect(transform?.fields.length).toBeGreaterThan(0);
  });

  it('sprite スクリプトが含まれる', () => {
    const scripts = getDefaultComponentScripts();
    expect(scripts.find((s) => s.id === 'sprite')).toBeDefined();
  });

  it('talkTrigger スクリプトが含まれる', () => {
    const scripts = getDefaultComponentScripts();
    expect(scripts.find((s) => s.id === 'talkTrigger')).toBeDefined();
  });

  it('各スクリプトは content に export default を含む', () => {
    const scripts = getDefaultComponentScripts();
    for (const script of scripts) {
      expect(script.content).toContain('export default');
    }
  });

  it('各スクリプトは重複なし（id がユニーク）', () => {
    const scripts = getDefaultComponentScripts();
    const ids = scripts.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
npx jest src/lib/defaultComponentScripts.test.ts
```

Expected: FAIL — module not found

**Step 3: Implement `defaultComponentScripts.ts`**

Create `src/lib/defaultComponentScripts.ts`:

```typescript
/**
 * デフォルトコンポーネントスクリプト
 *
 * 登録済みの全 Component クラスを Script (type: 'component') に変換して返す。
 * プロジェクト作成時にスクリプト一覧へシードするために使用する。
 */
import { getAllComponents } from '@/types/components';
import '@/types/components/register';
import { componentClassToScript } from './componentScriptUtils';
import type { Script } from '@/types/script';

/**
 * ビルトインコンポーネントスクリプト一覧を取得する
 *
 * getAllComponents() で登録済みの全コンポーネントを Script に変換する。
 * カスタムコンポーネントを registerComponent() で追加済みの場合も自動で含まれる。
 */
export function getDefaultComponentScripts(): Script[] {
  return getAllComponents().map(([, Cls]) => componentClassToScript(Cls));
}
```

**Step 4: Run tests to verify they pass**

```bash
npx jest src/lib/defaultComponentScripts.test.ts
```

Expected: all PASS

**Step 5: Commit**

```bash
git add src/lib/defaultComponentScripts.ts src/lib/defaultComponentScripts.test.ts
git commit -m "feat(lib): add getDefaultComponentScripts for project seeding [T242]"
```

---

### Task 4: Add `seedDefaultComponentScripts` to `scriptSlice`

プロジェクト初期化時（＝テスト時）にビルトインコンポーネントスクリプトの存在を保証するためのアクションを追加する。

**Files:**

- Modify: `src/stores/scriptSlice.ts`
- Modify: `src/stores/scriptSlice.test.ts`

**Step 1: Write the failing test**

`src/stores/scriptSlice.test.ts` の `describe('scriptSlice')` 内に追加：

```typescript
describe('seedDefaultComponentScripts', () => {
  it('ビルトインコンポーネントスクリプトを追加する', () => {
    const { result } = renderHook(() => useStore());

    act(() => {
      result.current.seedDefaultComponentScripts();
    });

    const componentScripts = result.current.scripts.filter((s) => s.type === 'component');
    expect(componentScripts.length).toBeGreaterThanOrEqual(13);
  });

  it('transform スクリプトが含まれる', () => {
    const { result } = renderHook(() => useStore());

    act(() => {
      result.current.seedDefaultComponentScripts();
    });

    expect(result.current.scripts.find((s) => s.id === 'transform')).toBeDefined();
  });

  it('2回呼んでも重複しない', () => {
    const { result } = renderHook(() => useStore());

    act(() => {
      result.current.seedDefaultComponentScripts();
      result.current.seedDefaultComponentScripts();
    });

    const ids = result.current.scripts.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
npx jest src/stores/scriptSlice.test.ts --testNamePattern="seedDefaultComponentScripts"
```

Expected: FAIL — `seedDefaultComponentScripts is not a function`

**Step 3: Add `seedDefaultComponentScripts` to `ScriptSlice` and implementation**

`src/stores/scriptSlice.ts` の `ScriptSlice` インターフェースに追加：

```typescript
/** ビルトインコンポーネントスクリプトをシードする（プロジェクト初期化時に呼ぶ） */
seedDefaultComponentScripts: () => void;
```

`createScriptSlice` の実装部分に追加（既存の `getInternalScripts` の後）：

```typescript
seedDefaultComponentScripts: () => {
  // import はファイル先頭に追加: import { getDefaultComponentScripts } from '@/lib/defaultComponentScripts';
  const defaults = getDefaultComponentScripts();
  set((state) => {
    for (const script of defaults) {
      if (!state.scripts.find((s) => s.id === script.id)) {
        state.scripts.push(script);
      }
    }
  });
},
```

ファイル先頭のインポートに追加：

```typescript
import { getDefaultComponentScripts } from '@/lib/defaultComponentScripts';
```

**Step 4: Run tests to verify they pass**

```bash
npx jest src/stores/scriptSlice.test.ts
```

Expected: all PASS

**Step 5: Commit**

```bash
git add src/stores/scriptSlice.ts src/stores/scriptSlice.test.ts
git commit -m "feat(store): add seedDefaultComponentScripts to scriptSlice [T242]"
```

---

### Task 5: 全テスト確認とコミット

**Step 1: 全テストを実行**

```bash
npx jest
```

Expected: all PASS (TypeScript 型エラーがある場合は `npx tsc --noEmit` で確認)

**Step 2: 型チェック**

```bash
npx tsc --noEmit
```

Expected: エラーなし

**Step 3: 最終コミット（必要な場合）**

型エラーや lint エラーの修正があればコミット：

```bash
git add -p
git commit -m "fix(types): resolve TypeScript errors from ComponentField and fields [T242]"
```

---

## 注意点

- `scriptSlice.ts` が `getDefaultComponentScripts()` をインポートすると、それが `register.ts` をインポートするため、Componentクラスが自動登録される（循環依存に注意）
- `register.ts` → `index.ts` のインポートは既存のまま。`scriptSlice.ts` → `defaultComponentScripts.ts` → `register.ts` の方向は新規だが循環しない
- `Script.fields` を追加したため、既存の `createScript()` を使うテストは `fields: []` がデフォルトで含まれるようになる（既存テストのスナップショットがあれば更新が必要）
