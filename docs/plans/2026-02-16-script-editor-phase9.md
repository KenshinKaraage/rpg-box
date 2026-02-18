# Script Editor (Phase 9) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the script editor pages and components for Phase 9 (T123-fix, T126, T128, T124, T125, T130).

**Architecture:** ThreeColumnLayout with ScriptList (left), ScriptEditor/Monaco (center), ScriptSettingsPanel (right). Two pages share the same layout but filter by script type (event/component). Feature module at `src/features/script-editor/`. Internal scripts support recursive nesting via `parentId` (any depth).

**Tech Stack:** Next.js App Router, Zustand, Monaco Editor (@monaco-editor/react), shadcn/ui, Jest + RTL

**Already Complete:**

- T131: Script types (`src/types/script.ts`)
- T123: scriptSlice (`src/stores/scriptSlice.ts`) — needs recursive delete fix
- T127: ScriptEditor Monaco wrapper (`src/features/script-editor/components/ScriptEditor.tsx`)

---

### Task 0: Fix deleteScript for recursive descendant deletion [T123-fix]

**Files:**

- Modify: `src/stores/scriptSlice.ts:58-65`
- Modify: `src/stores/scriptSlice.test.ts`

**Step 1: Write the failing test**

Add to `src/stores/scriptSlice.test.ts` inside the `deleteScript` describe block:

```typescript
it('ネストされた内部スクリプトも再帰的に削除される', () => {
  const { result } = renderHook(() => useStore());

  const parent = createScript('parent', '親スクリプト', 'event');
  const child: Script = {
    ...createScript('child1', '子スクリプト', 'internal'),
    parentId: 'parent',
  };
  const grandchild: Script = {
    ...createScript('grandchild1', '孫スクリプト', 'internal'),
    parentId: 'child1',
  };
  const otherScript = createScript('other', '別スクリプト', 'event');

  act(() => {
    result.current.addScript(parent);
    result.current.addScript(child);
    result.current.addScript(grandchild);
    result.current.addScript(otherScript);
  });

  expect(result.current.scripts).toHaveLength(4);

  act(() => {
    result.current.deleteScript('parent');
  });

  expect(result.current.scripts).toHaveLength(1);
  expect(result.current.scripts[0]?.id).toBe('other');
});

it('中間の内部スクリプトを削除するとその子孫も削除される', () => {
  const { result } = renderHook(() => useStore());

  const parent = createScript('parent', '親スクリプト', 'event');
  const child: Script = {
    ...createScript('child1', '子スクリプト', 'internal'),
    parentId: 'parent',
  };
  const grandchild: Script = {
    ...createScript('grandchild1', '孫スクリプト', 'internal'),
    parentId: 'child1',
  };

  act(() => {
    result.current.addScript(parent);
    result.current.addScript(child);
    result.current.addScript(grandchild);
  });

  act(() => {
    result.current.deleteScript('child1');
  });

  // parent remains, child1 and grandchild1 deleted
  expect(result.current.scripts).toHaveLength(1);
  expect(result.current.scripts[0]?.id).toBe('parent');
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest src/stores/scriptSlice.test.ts --no-coverage`
Expected: FAIL — grandchild not deleted (current code only deletes direct children)

**Step 3: Fix deleteScript to use recursive collection**

Replace the `deleteScript` action in `src/stores/scriptSlice.ts`:

```typescript
deleteScript: (id: string) =>
  set((state) => {
    // Collect all descendant IDs recursively
    const idsToDelete = new Set<string>();
    const collectDescendants = (parentId: string) => {
      idsToDelete.add(parentId);
      for (const s of state.scripts) {
        if (s.parentId === parentId && !idsToDelete.has(s.id)) {
          collectDescendants(s.id);
        }
      }
    };
    collectDescendants(id);

    state.scripts = state.scripts.filter((s) => !idsToDelete.has(s.id));
    if (state.selectedScriptId && idsToDelete.has(state.selectedScriptId)) {
      state.selectedScriptId = null;
    }
  }),
```

**Step 4: Run tests to verify all pass**

Run: `npx jest src/stores/scriptSlice.test.ts --no-coverage`
Expected: ALL PASS

**Step 5: Commit**

```
fix(script): recursive descendant deletion in deleteScript [T123]
```

---

### Task 1: Create ScriptList component [T126]

**Files:**

- Create: `src/features/script-editor/components/ScriptList.tsx`
- Create: `src/features/script-editor/components/ScriptList.test.tsx`

**Step 1: Write the test**

```tsx
// ScriptList.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ScriptList } from './ScriptList';
import type { Script } from '@/types/script';
import { createScript } from '@/types/script';

const mockScripts: Script[] = [
  createScript('s1', 'バトル開始', 'event'),
  createScript('s2', 'ショップ', 'event'),
];

const mockInternalScripts: Script[] = [
  { ...createScript('i1', '_damage', 'internal'), parentId: 's1' },
  { ...createScript('i2', '_effect', 'internal'), parentId: 's1' },
];

// Nested: i1 has a grandchild
const mockNestedInternals: Script[] = [
  ...mockInternalScripts,
  { ...createScript('g1', '_calcHit', 'internal'), parentId: 'i1' },
];

describe('ScriptList', () => {
  const defaultProps = {
    scripts: mockScripts,
    internalScriptsMap: {
      s1: mockInternalScripts,
      s2: [],
    } as Record<string, Script[]>,
    selectedId: null as string | null,
    onSelect: jest.fn(),
    onAdd: jest.fn(),
    onDelete: jest.fn(),
    onAddInternal: jest.fn(),
    title: 'イベントスクリプト',
  };

  it('renders script list with title', () => {
    render(<ScriptList {...defaultProps} />);
    expect(screen.getByText('イベントスクリプト')).toBeInTheDocument();
    expect(screen.getByText('バトル開始')).toBeInTheDocument();
    expect(screen.getByText('ショップ')).toBeInTheDocument();
  });

  it('shows internal scripts under parent when expanded', () => {
    render(<ScriptList {...defaultProps} />);
    // Internal scripts should be visible (parent expanded by default or after click)
    expect(screen.getByText('_damage')).toBeInTheDocument();
    expect(screen.getByText('_effect')).toBeInTheDocument();
  });

  it('shows recursively nested internal scripts', () => {
    const nestedMap: Record<string, Script[]> = {
      s1: [mockInternalScripts[0]!],
      s2: [],
      i1: [{ ...createScript('g1', '_calcHit', 'internal'), parentId: 'i1' }],
    };
    render(<ScriptList {...defaultProps} internalScriptsMap={nestedMap} />);
    expect(screen.getByText('_damage')).toBeInTheDocument();
    expect(screen.getByText('_calcHit')).toBeInTheDocument();
  });

  it('calls onSelect when clicking a script', () => {
    const onSelect = jest.fn();
    render(<ScriptList {...defaultProps} onSelect={onSelect} />);
    fireEvent.click(screen.getByText('バトル開始'));
    expect(onSelect).toHaveBeenCalledWith('s1');
  });

  it('calls onSelect when clicking an internal script', () => {
    const onSelect = jest.fn();
    render(<ScriptList {...defaultProps} onSelect={onSelect} />);
    fireEvent.click(screen.getByText('_damage'));
    expect(onSelect).toHaveBeenCalledWith('i1');
  });

  it('highlights selected script', () => {
    render(<ScriptList {...defaultProps} selectedId="s1" />);
    const item = screen.getByTestId('script-item-s1');
    expect(item).toHaveClass('bg-accent');
  });

  it('calls onAdd when clicking add button', () => {
    const onAdd = jest.fn();
    render(<ScriptList {...defaultProps} onAdd={onAdd} />);
    fireEvent.click(screen.getByRole('button', { name: /追加/ }));
    expect(onAdd).toHaveBeenCalled();
  });

  it('renders empty state when no scripts', () => {
    render(<ScriptList {...defaultProps} scripts={[]} internalScriptsMap={{}} />);
    expect(screen.getByText(/スクリプトがありません/)).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest src/features/script-editor/components/ScriptList.test.tsx --no-coverage`
Expected: FAIL — module not found

**Step 3: Implement ScriptList**

```tsx
// ScriptList.tsx
'use client';

import { Plus, ChevronRight, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { cn } from '@/lib/utils';
import type { Script } from '@/types/script';

interface ScriptListProps {
  scripts: Script[];
  internalScriptsMap: Record<string, Script[]>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onAddInternal: (parentId: string) => void;
  title: string;
}

function ScriptTreeItem({
  script,
  internalScriptsMap,
  selectedId,
  onSelect,
  onDelete,
  onAddInternal,
  depth,
}: {
  script: Script;
  internalScriptsMap: Record<string, Script[]>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onAddInternal: (parentId: string) => void;
  depth: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const children = internalScriptsMap[script.id] ?? [];
  const hasChildren = children.length > 0;

  return (
    <li>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className={cn(
              'flex cursor-pointer items-center gap-1 px-3 py-1.5 hover:bg-accent',
              selectedId === script.id && 'bg-accent'
            )}
            style={{ paddingLeft: `${depth * 16 + 12}px` }}
            onClick={() => onSelect(script.id)}
            data-testid={`script-item-${script.id}`}
          >
            {hasChildren ? (
              <button
                className="shrink-0 p-0.5"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(!expanded);
                }}
              >
                {expanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </button>
            ) : (
              <span className="w-4 shrink-0" />
            )}
            <span className="truncate text-sm">{script.name}</span>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => onAddInternal(script.id)}>
            内部スクリプト追加
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onDelete(script.id)} className="text-destructive">
            削除
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      {hasChildren && expanded && (
        <ul>
          {children.map((child) => (
            <ScriptTreeItem
              key={child.id}
              script={child}
              internalScriptsMap={internalScriptsMap}
              selectedId={selectedId}
              onSelect={onSelect}
              onDelete={onDelete}
              onAddInternal={onAddInternal}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function ScriptList({
  scripts,
  internalScriptsMap,
  selectedId,
  onSelect,
  onAdd,
  onDelete,
  onAddInternal,
  title,
}: ScriptListProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b p-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        <Button size="sm" variant="outline" onClick={onAdd}>
          <Plus className="mr-1 h-4 w-4" />
          追加
        </Button>
      </div>
      <div className="flex-1 overflow-auto">
        {scripts.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            スクリプトがありません
          </div>
        ) : (
          <ul data-testid="script-list">
            {scripts.map((script) => (
              <ScriptTreeItem
                key={script.id}
                script={script}
                internalScriptsMap={internalScriptsMap}
                selectedId={selectedId}
                onSelect={onSelect}
                onDelete={onDelete}
                onAddInternal={onAddInternal}
                depth={0}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
```

**Step 4: Run tests to verify pass**

Run: `npx jest src/features/script-editor/components/ScriptList.test.tsx --no-coverage`
Expected: ALL PASS

**Step 5: Commit**

```
feat(script): implement ScriptList with recursive tree [T126]
```

---

### Task 2: Create ScriptSettingsPanel [T128]

**Files:**

- Create: `src/features/script-editor/components/ScriptSettingsPanel.tsx`
- Create: `src/features/script-editor/components/ScriptSettingsPanel.test.tsx`

**Step 1: Write the test**

```tsx
// ScriptSettingsPanel.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ScriptSettingsPanel } from './ScriptSettingsPanel';
import type { Script } from '@/types/script';
import { createScript } from '@/types/script';

const testScript: Script = {
  ...createScript('s1', 'バトル開始', 'event'),
  description: '戦闘を開始するスクリプト',
  args: [{ id: 'arg1', name: 'enemyId', fieldType: 'string', required: true }],
};

describe('ScriptSettingsPanel', () => {
  const defaultProps = {
    script: testScript,
    onUpdate: jest.fn(),
  };

  it('shows empty state when no script selected', () => {
    render(<ScriptSettingsPanel script={null} onUpdate={jest.fn()} />);
    expect(screen.getByText('スクリプトを選択してください')).toBeInTheDocument();
  });

  it('shows script name input', () => {
    render(<ScriptSettingsPanel {...defaultProps} />);
    const input = screen.getByLabelText('名前');
    expect(input).toHaveValue('バトル開始');
  });

  it('calls onUpdate when name changes', () => {
    const onUpdate = jest.fn();
    render(<ScriptSettingsPanel {...defaultProps} onUpdate={onUpdate} />);
    const input = screen.getByLabelText('名前');
    fireEvent.change(input, { target: { value: '新しい名前' } });
    fireEvent.blur(input);
    expect(onUpdate).toHaveBeenCalledWith('s1', { name: '新しい名前' });
  });

  it('shows description textarea', () => {
    render(<ScriptSettingsPanel {...defaultProps} />);
    const textarea = screen.getByLabelText('説明');
    expect(textarea).toHaveValue('戦闘を開始するスクリプト');
  });

  it('calls onUpdate when description changes', () => {
    const onUpdate = jest.fn();
    render(<ScriptSettingsPanel {...defaultProps} onUpdate={onUpdate} />);
    const textarea = screen.getByLabelText('説明');
    fireEvent.change(textarea, { target: { value: '新しい説明' } });
    fireEvent.blur(textarea);
    expect(onUpdate).toHaveBeenCalledWith('s1', { description: '新しい説明' });
  });

  it('shows existing arguments', () => {
    render(<ScriptSettingsPanel {...defaultProps} />);
    expect(screen.getByText('enemyId')).toBeInTheDocument();
  });

  it('does not show args section for internal scripts', () => {
    const internalScript: Script = {
      ...createScript('i1', '_helper', 'internal'),
      parentId: 's1',
    };
    render(<ScriptSettingsPanel script={internalScript} onUpdate={jest.fn()} />);
    expect(screen.queryByText('引数')).not.toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest src/features/script-editor/components/ScriptSettingsPanel.test.tsx --no-coverage`
Expected: FAIL — module not found

**Step 3: Implement ScriptSettingsPanel**

```tsx
// ScriptSettingsPanel.tsx
'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import type { Script, ScriptArg } from '@/types/script';

const FIELD_TYPES = [
  { value: 'string', label: '文字列' },
  { value: 'number', label: '数値' },
  { value: 'boolean', label: '真偽値' },
];

interface ScriptSettingsPanelProps {
  script: Script | null;
  onUpdate: (id: string, updates: Partial<Script>) => void;
}

export function ScriptSettingsPanel({ script, onUpdate }: ScriptSettingsPanelProps) {
  const [localName, setLocalName] = useState('');
  const [localDesc, setLocalDesc] = useState('');

  // Sync local state when script changes
  const [prevScriptId, setPrevScriptId] = useState<string | null>(null);
  if (script && script.id !== prevScriptId) {
    setPrevScriptId(script.id);
    setLocalName(script.name);
    setLocalDesc(script.description ?? '');
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

  const isInternal = script.type === 'internal';

  const handleNameBlur = () => {
    if (localName !== script.name) {
      onUpdate(script.id, { name: localName });
    }
  };

  const handleDescBlur = () => {
    if (localDesc !== (script.description ?? '')) {
      onUpdate(script.id, { description: localDesc });
    }
  };

  const handleAddArg = () => {
    const newArg: ScriptArg = {
      id: `arg_${Date.now()}`,
      name: '新しい引数',
      fieldType: 'string',
      required: false,
    };
    onUpdate(script.id, { args: [...script.args, newArg] });
  };

  const handleUpdateArg = (argId: string, updates: Partial<ScriptArg>) => {
    const newArgs = script.args.map((arg) => (arg.id === argId ? { ...arg, ...updates } : arg));
    onUpdate(script.id, { args: newArgs });
  };

  const handleDeleteArg = (argId: string) => {
    onUpdate(script.id, { args: script.args.filter((a) => a.id !== argId) });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-header items-center border-b px-4 font-semibold">設定</div>
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="script-name">名前</Label>
            <Input
              id="script-name"
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              onBlur={handleNameBlur}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="script-desc">説明</Label>
            <Textarea
              id="script-desc"
              value={localDesc}
              onChange={(e) => setLocalDesc(e.target.value)}
              onBlur={handleDescBlur}
              rows={3}
            />
          </div>

          {/* Arguments (event/component only) */}
          {!isInternal && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>引数</Label>
                <Button size="sm" variant="outline" onClick={handleAddArg}>
                  <Plus className="mr-1 h-3 w-3" />
                  追加
                </Button>
              </div>
              {script.args.length === 0 ? (
                <p className="text-sm text-muted-foreground">引数がありません</p>
              ) : (
                <ul className="space-y-3">
                  {script.args.map((arg) => (
                    <li key={arg.id} className="rounded border p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{arg.name}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => handleDeleteArg(arg.id)}
                          aria-label={`${arg.name}を削除`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <Input
                        value={arg.name}
                        onChange={(e) => handleUpdateArg(arg.id, { name: e.target.value })}
                        placeholder="引数名"
                      />
                      <Select
                        value={arg.fieldType}
                        onValueChange={(v) => handleUpdateArg(arg.id, { fieldType: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FIELD_TYPES.map((ft) => (
                            <SelectItem key={ft.value} value={ft.value}>
                              {ft.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`required-${arg.id}`}
                          checked={arg.required}
                          onCheckedChange={(checked) =>
                            handleUpdateArg(arg.id, { required: checked === true })
                          }
                        />
                        <Label htmlFor={`required-${arg.id}`} className="text-sm">
                          必須
                        </Label>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Step 4: Run tests to verify pass**

Run: `npx jest src/features/script-editor/components/ScriptSettingsPanel.test.tsx --no-coverage`
Expected: ALL PASS

**Step 5: Commit**

```
feat(script): implement ScriptSettingsPanel [T128]
```

---

### Task 3: Create feature index and script pages [T124][T125]

**Files:**

- Create: `src/features/script-editor/index.ts`
- Create: `src/app/(editor)/script/events/page.tsx`
- Create: `src/app/(editor)/script/components/page.tsx`

**Step 1: Create feature index**

```typescript
// src/features/script-editor/index.ts
export { ScriptList } from './components/ScriptList';
export { ScriptEditor } from './components/ScriptEditor';
export { ScriptSettingsPanel } from './components/ScriptSettingsPanel';
```

**Step 2: Implement EventScriptPage**

```tsx
// src/app/(editor)/script/events/page.tsx
'use client';

import { useMemo } from 'react';
import { ThreeColumnLayout } from '@/components/common/ThreeColumnLayout';
import { ScriptList, ScriptEditor, ScriptSettingsPanel } from '@/features/script-editor';
import { useStore } from '@/stores';
import { createScript } from '@/types/script';
import { generateId } from '@/lib/utils';
import type { Script } from '@/types/script';

const EMPTY_SCRIPTS: Script[] = [];

export default function EventScriptPage() {
  const scripts = useStore((state) => state.scripts);
  const selectedScriptId = useStore((state) => state.selectedScriptId);
  const addScript = useStore((state) => state.addScript);
  const updateScript = useStore((state) => state.updateScript);
  const deleteScript = useStore((state) => state.deleteScript);
  const selectScript = useStore((state) => state.selectScript);

  // Top-level event scripts
  const eventScripts = useMemo(
    () => scripts.filter((s) => s.type === 'event' && !s.parentId),
    [scripts]
  );

  // Internal scripts map: parentId -> children (direct only)
  const internalScriptsMap = useMemo(() => {
    const map: Record<string, Script[]> = {};
    for (const s of scripts) {
      if (s.parentId) {
        if (!map[s.parentId]) map[s.parentId] = [];
        map[s.parentId].push(s);
      }
    }
    return map;
  }, [scripts]);

  // Selected script
  const selectedScript = useMemo(
    () => (selectedScriptId ? (scripts.find((s) => s.id === selectedScriptId) ?? null) : null),
    [scripts, selectedScriptId]
  );

  const handleAdd = () => {
    const id = generateId(
      'script',
      scripts.map((s) => s.id)
    );
    const script = createScript(id, '新しいスクリプト', 'event');
    addScript(script);
    selectScript(id);
  };

  const handleAddInternal = (parentId: string) => {
    const id = generateId(
      'script',
      scripts.map((s) => s.id)
    );
    const script: Script = {
      ...createScript(id, '_helper', 'internal'),
      parentId,
    };
    addScript(script);
    selectScript(id);
  };

  const handleContentChange = (id: string, content: string) => {
    updateScript(id, { content });
  };

  return (
    <ThreeColumnLayout
      left={
        <ScriptList
          scripts={eventScripts}
          internalScriptsMap={internalScriptsMap}
          selectedId={selectedScriptId}
          onSelect={selectScript}
          onAdd={handleAdd}
          onDelete={deleteScript}
          onAddInternal={handleAddInternal}
          title="イベントスクリプト"
        />
      }
      center={<ScriptEditor script={selectedScript} onContentChange={handleContentChange} />}
      right={<ScriptSettingsPanel script={selectedScript} onUpdate={updateScript} />}
    />
  );
}
```

**Step 3: Implement ComponentScriptPage**

Same pattern as EventScriptPage but with `type === 'component'` filter and title `コンポーネントスクリプト`.

```tsx
// src/app/(editor)/script/components/page.tsx
// Same structure as EventScriptPage with:
// - filter: s.type === 'component'
// - createScript(id, '新しいスクリプト', 'component')
// - title: 'コンポーネントスクリプト'
```

**Step 4: Verify manually, commit**

```
feat(script): implement EventScript and ComponentScript pages [T124][T125]
```

---

### Task 4: Mark T130 InternalScriptList as covered [T130]

Internal scripts are already displayed hierarchically within ScriptList (Task 1) using the recursive `ScriptTreeItem` component. The add/delete for internal scripts is handled through the context menu and page-level handlers. T130 is covered by T126.

Update `docs/tasks.md` to mark T130 as covered by T126.

**Step 1: Commit**

```
docs: mark T130 as covered by T126 (ScriptList handles internal scripts) [T130]
```

---

## Execution Order

1. **Task 0** (deleteScript recursive fix) — no deps
2. **Task 1** (ScriptList) — no deps
3. **Task 2** (ScriptSettingsPanel) — no deps
4. **Task 3** (Pages) — depends on Tasks 1-2
5. **Task 4** (T130 docs) — after Task 1
