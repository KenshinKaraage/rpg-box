# Component Field Editor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** コンポーネントスクリプトの右パネルを双方向フィールドエディタに置き換え、パネル操作がコードに反映され、コード編集がパネルに反映されるようにする。

**Architecture:** コードの `export default { ... }` ブロックをパース(`parseComponentFields`)してフィールド一覧を表示し、パネル操作時は当該ブロックのみを置換(`replaceExportDefault`)してストアを更新する。Monaco はストアの `content` を `value` で受け取るため自動的に追従する。

**Tech Stack:** React, TypeScript, Zustand, shadcn/ui, `@monaco-editor/react`

---

## Context

- `src/lib/componentScriptUtils.ts` — `inferFieldType`, `generateScriptContent`, `componentClassToScript` が既に実装済み
- `src/lib/componentScriptUtils.test.ts` — 既存テスト（Task 1/2 で更新が必要）
- `src/types/fields/index.ts` — `getFieldType`, `getFieldTypeOptions`, `createFieldTypeInstance` が使用可能
- `src/types/script.ts` — `ComponentField = { name, fieldType, defaultValue, label }`
- `src/features/script-editor/index.ts` — コンポーネントの export 先
- `src/app/(editor)/script/components/page.tsx` — 右パネルを差し替えるページ

---

### Task 1: generateScriptContent を新フォーマットに変更 + replaceExportDefault を追加

**Files:**

- Modify: `src/lib/componentScriptUtils.ts`
- Modify: `src/lib/componentScriptUtils.test.ts`

コンテンツのフォーマットを `{ name: value }` から `{ name: { type, default, label } }` に変更する。
また、コード内の `export default { ... }` ブロックのみを置換するユーティリティを追加する。

**Step 1: `generateScriptContent` のテストを新フォーマットに更新（失敗することを確認）**

`src/lib/componentScriptUtils.test.ts` の `describe('generateScriptContent', ...)` を以下に書き換える:

```typescript
describe('generateScriptContent', () => {
  it('フィールドから export default コードを生成する（新フォーマット）', () => {
    const fields: ComponentField[] = [
      { name: 'count', fieldType: 'number', defaultValue: 0, label: 'カウント' },
      { name: 'label', fieldType: 'string', defaultValue: '', label: 'ラベル' },
    ];
    const code = generateScriptContent(fields);
    expect(code).toBe(
      'export default {\n' +
        '  count: { type: "number", default: 0, label: "カウント" },\n' +
        '  label: { type: "string", default: "", label: "ラベル" }\n' +
        '}'
    );
  });

  it('フィールドが空の場合は空オブジェクトを生成する', () => {
    expect(generateScriptContent([])).toBe('export default {}');
  });
});
```

また `describe('componentClassToScript', ...)` の `'content に export default コードが含まれる'` テストはそのままでOK（`export default` と `count` が含まれることのみ確認）。

**Step 2: テストが失敗することを確認**

```bash
npx jest --no-coverage componentScriptUtils
```

Expected: FAIL（`generateScriptContent` の出力が変わるため）

**Step 3: `replaceExportDefault` のテストを追加**

`src/lib/componentScriptUtils.test.ts` に追加:

```typescript
describe('replaceExportDefault', () => {
  it('export default ブロックを新しいフィールドで置換する', () => {
    const content = 'export default {\n  x: { type: "number", default: 0, label: "x" }\n}';
    const newFields: ComponentField[] = [
      { name: 'x', fieldType: 'number', defaultValue: 0, label: 'x' },
      { name: 'y', fieldType: 'number', defaultValue: 0, label: 'y' },
    ];
    const result = replaceExportDefault(content, newFields);
    expect(result).toContain('y: { type: "number"');
    expect(result).not.toContain('export default {\n  x:');
  });

  it('export default ブロック以外のコードを保持する', () => {
    const content =
      '// helper\nfunction helper() {}\nexport default {\n  x: { type: "number", default: 0, label: "x" }\n}';
    const newFields: ComponentField[] = [
      { name: 'z', fieldType: 'string', defaultValue: '', label: 'z' },
    ];
    const result = replaceExportDefault(content, newFields);
    expect(result).toContain('// helper');
    expect(result).toContain('function helper()');
    expect(result).toContain('z: { type: "string"');
  });

  it('export default がない場合は新しいコンテンツをそのまま返す', () => {
    const content = '';
    const newFields: ComponentField[] = [
      { name: 'x', fieldType: 'number', defaultValue: 0, label: 'x' },
    ];
    const result = replaceExportDefault(content, newFields);
    expect(result).toBe(generateScriptContent(newFields));
  });
});
```

**Step 4: テストが失敗することを確認**

```bash
npx jest --no-coverage componentScriptUtils
```

Expected: FAIL（`replaceExportDefault` が未定義のため）

**Step 5: `generateScriptContent` と `replaceExportDefault` を実装**

`src/lib/componentScriptUtils.ts` の `generateScriptContent` と `replaceExportDefault` を以下に書き換え・追加:

```typescript
/**
 * ComponentField 配列から export default の JS コードを生成する（リッチフォーマット）
 */
export function generateScriptContent(fields: ComponentField[]): string {
  if (fields.length === 0) return 'export default {}';
  const lines = fields.map(
    (f) =>
      `  ${f.name}: { type: ${JSON.stringify(f.fieldType)}, default: ${JSON.stringify(f.defaultValue)}, label: ${JSON.stringify(f.label)} }`
  );
  return `export default {\n${lines.join(',\n')}\n}`;
}

/**
 * コード内の export default { ... } ブロックのみを新しいフィールドで置換する
 * export default ブロック以外のコード（コメント、関数等）は保持される
 */
export function replaceExportDefault(content: string, fields: ComponentField[]): string {
  const newBlock = generateScriptContent(fields);
  const start = content.search(/export\s+default\s*\{/);
  if (start === -1) return newBlock;

  const braceStart = content.indexOf('{', start);
  let depth = 0;
  let end = -1;
  for (let i = braceStart; i < content.length; i++) {
    if (content[i] === '{') depth++;
    else if (content[i] === '}') {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end === -1) return newBlock;

  return content.slice(0, start) + newBlock + content.slice(end + 1);
}
```

**Step 6: テストが通ることを確認**

```bash
npx jest --no-coverage componentScriptUtils
```

Expected: PASS

**Step 7: commit**

```bash
git add src/lib/componentScriptUtils.ts src/lib/componentScriptUtils.test.ts
git commit -m "feat(lib): update generateScriptContent to rich format and add replaceExportDefault [T242]"
```

---

### Task 2: parseComponentFields を追加

**Files:**

- Modify: `src/lib/componentScriptUtils.ts`
- Modify: `src/lib/componentScriptUtils.test.ts`

コード文字列をパースして `ComponentField[]` を返す。パースエラーは `null` で返す。

**Step 1: テストを先に追加**

`src/lib/componentScriptUtils.test.ts` に `parseComponentFields` を import に追加し、以下のテストを追加:

```typescript
import {
  inferFieldType,
  generateScriptContent,
  componentClassToScript,
  replaceExportDefault,
  parseComponentFields,
} from './componentScriptUtils';
```

```typescript
describe('parseComponentFields', () => {
  it('新フォーマットのコードをパースしてフィールドを返す', () => {
    const content =
      'export default {\n' +
      '  x: { type: "number", default: 0, label: "X座標" },\n' +
      '  name: { type: "string", default: "", label: "名前" }\n' +
      '}';
    const fields = parseComponentFields(content);
    expect(fields).toHaveLength(2);
    expect(fields).toContainEqual({
      name: 'x',
      fieldType: 'number',
      defaultValue: 0,
      label: 'X座標',
    });
    expect(fields).toContainEqual({
      name: 'name',
      fieldType: 'string',
      defaultValue: '',
      label: '名前',
    });
  });

  it('export default がなければ空配列を返す', () => {
    expect(parseComponentFields('')).toEqual([]);
    expect(parseComponentFields('// comment')).toEqual([]);
  });

  it('空オブジェクトなら空配列を返す', () => {
    expect(parseComponentFields('export default {}')).toEqual([]);
  });

  it('シンタックスエラーがあれば null を返す', () => {
    expect(parseComponentFields('export default { x: { type: ')).toBeNull();
  });

  it('export default 以外のコードも正しくパースできる', () => {
    const content =
      '// helper\nexport default {\n  hp: { type: "number", default: 100, label: "HP" }\n}';
    const fields = parseComponentFields(content);
    expect(fields).toHaveLength(1);
    expect(fields![0]).toMatchObject({ name: 'hp', fieldType: 'number' });
  });
});
```

**Step 2: テストが失敗することを確認**

```bash
npx jest --no-coverage componentScriptUtils
```

Expected: FAIL（`parseComponentFields` が未定義のため）

**Step 3: parseComponentFields を実装**

`src/lib/componentScriptUtils.ts` に追加:

```typescript
/**
 * コンポーネントスクリプトのコード文字列から ComponentField[] をパースして返す
 *
 * @returns ComponentField[] — パース成功（0件の場合は空配列）
 *          null — シンタックスエラー等でパース不可
 */
export function parseComponentFields(content: string): ComponentField[] | null {
  // export default がなければ空（エラーではない）
  if (!/export\s+default\s*\{/.test(content)) return [];

  try {
    // export default { ... } ブロックを抽出
    const start = content.search(/export\s+default\s*\{/);
    const braceStart = content.indexOf('{', start);
    let depth = 0;
    let end = -1;
    for (let i = braceStart; i < content.length; i++) {
      if (content[i] === '{') depth++;
      else if (content[i] === '}') {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    if (end === -1) return null;

    const block = content.slice(braceStart, end + 1);
    // eslint-disable-next-line no-new-func
    const obj = new Function(`return (${block})`)() as Record<string, unknown>;

    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return [];

    return Object.entries(obj).map(([name, def]) => {
      const d = def as { type?: unknown; default?: unknown; label?: unknown };
      return {
        name,
        fieldType: typeof d?.type === 'string' ? d.type : 'string',
        defaultValue: d?.default ?? null,
        label: typeof d?.label === 'string' ? d.label : name,
      };
    });
  } catch {
    return null;
  }
}
```

**Step 4: テストが通ることを確認**

```bash
npx jest --no-coverage componentScriptUtils
```

Expected: PASS

**Step 5: commit**

```bash
git add src/lib/componentScriptUtils.ts src/lib/componentScriptUtils.test.ts
git commit -m "feat(lib): add parseComponentFields to componentScriptUtils [T242]"
```

---

### Task 3: ComponentFieldEditor コンポーネントを作成

**Files:**

- Create: `src/features/script-editor/components/ComponentFieldEditor.tsx`
- Create: `src/features/script-editor/components/ComponentFieldEditor.test.tsx`
- Modify: `src/features/script-editor/index.ts`

双方向フィールドエディタ。`content` prop からフィールドを導出し、フィールド編集時は `onContentChange` を呼び出す。

**Step 1: テストファイルを作成（失敗するテスト）**

`src/features/script-editor/components/ComponentFieldEditor.test.tsx`:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { ComponentFieldEditor } from './ComponentFieldEditor';

// FieldType レジストリを使うため fields/index を import
import '@/types/fields';

const makeContent = (fields: Array<{ name: string; type: string; defaultValue: unknown; label: string }>) => {
  if (fields.length === 0) return 'export default {}';
  const lines = fields.map(
    (f) => `  ${f.name}: { type: ${JSON.stringify(f.type)}, default: ${JSON.stringify(f.defaultValue)}, label: ${JSON.stringify(f.label)} }`
  );
  return `export default {\n${lines.join(',\n')}\n}`;
};

describe('ComponentFieldEditor', () => {
  it('content が null のときは「スクリプトを選択してください」を表示する', () => {
    render(<ComponentFieldEditor content={null} onContentChange={jest.fn()} />);
    expect(screen.getByText('スクリプトを選択してください')).toBeInTheDocument();
  });

  it('コードがパースできないときは「コードの解析に失敗しました」を表示する', () => {
    render(<ComponentFieldEditor content="export default { x: {" onContentChange={jest.fn()} />);
    expect(screen.getByText('コードの解析に失敗しました')).toBeInTheDocument();
  });

  it('フィールドがないときは「フィールドがありません」を表示する', () => {
    render(<ComponentFieldEditor content="export default {}" onContentChange={jest.fn()} />);
    expect(screen.getByText('フィールドがありません')).toBeInTheDocument();
  });

  it('パースしたフィールドのラベルと名前を表示する', () => {
    const content = makeContent([
      { name: 'hp', type: 'number', defaultValue: 100, label: 'HP' },
    ]);
    render(<ComponentFieldEditor content={content} onContentChange={jest.fn()} />);
    expect(screen.getByDisplayValue('HP')).toBeInTheDocument(); // label input
    expect(screen.getByDisplayValue('hp')).toBeInTheDocument(); // name input
  });

  it('「追加」ボタンを押すと onContentChange が新しいフィールド付きで呼ばれる', () => {
    const onContentChange = jest.fn();
    render(<ComponentFieldEditor content="export default {}" onContentChange={onContentChange} />);
    fireEvent.click(screen.getByRole('button', { name: '追加' }));
    expect(onContentChange).toHaveBeenCalledTimes(1);
    const newContent: string = onContentChange.mock.calls[0][0];
    expect(newContent).toContain('export default');
    expect(newContent).toContain('field1');
  });

  it('削除ボタンを押すと onContentChange がフィールドなしで呼ばれる', () => {
    const onContentChange = jest.fn();
    const content = makeContent([{ name: 'hp', type: 'number', defaultValue: 0, label: 'HP' }]);
    render(<ComponentFieldEditor content={content} onContentChange={onContentChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'hpを削除' }));
    expect(onContentChange).toHaveBeenCalledTimes(1);
    expect(onContentChange.mock.calls[0][0]).toBe('export default {}');
  });

  it('名前を変更すると onContentChange が呼ばれる', () => {
    const onContentChange = jest.fn();
    const content = makeContent([{ name: 'hp', type: 'number', defaultValue: 0, label: 'HP' }]);
    render(<ComponentFieldEditor content={content} onContentChange={onContentChange} />);
    const nameInput = screen.getByDisplayValue('hp');
    fireEvent.change(nameInput, { target: { value: 'health' } });
    expect(onContentChange).toHaveBeenCalled();
    expect(onContentChange.mock.calls[0][0]).toContain('health');
  });
});
```

**Step 2: テストが失敗することを確認**

```bash
npx jest --no-coverage ComponentFieldEditor
```

Expected: FAIL（ファイルが存在しないため）

**Step 3: ComponentFieldEditor を実装**

`src/features/script-editor/components/ComponentFieldEditor.tsx`:

```typescript
'use client';

import { useMemo } from 'react';
import { Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getFieldType, getFieldTypeOptions } from '@/types/fields';
import { parseComponentFields, replaceExportDefault } from '@/lib/componentScriptUtils';
import type { ComponentField } from '@/types/script';

interface ComponentFieldEditorProps {
  content: string | null;
  onContentChange: (newContent: string) => void;
}

export function ComponentFieldEditor({ content, onContentChange }: ComponentFieldEditorProps) {
  const fields = useMemo(
    () => (content !== null ? parseComponentFields(content) : null),
    [content]
  );

  if (content === null || fields === null) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        {content === null ? 'スクリプトを選択してください' : 'コードの解析に失敗しました'}
      </div>
    );
  }

  const handleAdd = () => {
    const newField: ComponentField = {
      name: `field${fields.length + 1}`,
      fieldType: 'string',
      defaultValue: '',
      label: `フィールド${fields.length + 1}`,
    };
    onContentChange(replaceExportDefault(content, [...fields, newField]));
  };

  const handleUpdate = (index: number, updates: Partial<ComponentField>) => {
    const newFields = fields.map((f, i) => (i === index ? { ...f, ...updates } : f));
    onContentChange(replaceExportDefault(content, newFields));
  };

  const handleDelete = (index: number) => {
    onContentChange(replaceExportDefault(content, fields.filter((_, i) => i !== index)));
  };

  const fieldTypeOptions = getFieldTypeOptions();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <span className="text-sm font-medium">フィールド</span>
        <Button size="sm" variant="outline" onClick={handleAdd}>
          <Plus className="mr-1 h-3 w-3" />
          追加
        </Button>
      </div>
      <div className="flex-1 overflow-auto p-3">
        {fields.length === 0 ? (
          <p className="text-sm text-muted-foreground">フィールドがありません</p>
        ) : (
          <ul className="space-y-3">
            {fields.map((field, index) => {
              const FieldClass = getFieldType(field.fieldType);
              const fieldInstance = FieldClass ? new FieldClass() : null;
              return (
                <li key={index} className="space-y-2 rounded border p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-muted-foreground">{field.name}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => handleDelete(index)}
                      aria-label={`${field.name}を削除`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">名前</Label>
                    <Input
                      value={field.name}
                      onChange={(e) => handleUpdate(index, { name: e.target.value })}
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">ラベル</Label>
                    <Input
                      value={field.label}
                      onChange={(e) => handleUpdate(index, { label: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">型</Label>
                    <Select
                      value={field.fieldType}
                      onValueChange={(v) => {
                        const NewClass = getFieldType(v);
                        const newDefault = NewClass ? new NewClass().getDefaultValue() : null;
                        handleUpdate(index, { fieldType: v, defaultValue: newDefault });
                      }}
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {fieldTypeOptions.map((opt) => (
                          <SelectItem key={opt.type} value={opt.type}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {fieldInstance ? (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">デフォルト値</Label>
                      {fieldInstance.renderEditor({
                        value: field.defaultValue,
                        onChange: (v) => handleUpdate(index, { defaultValue: v }),
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">未対応の型: {field.fieldType}</p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
```

**Step 4: index.ts に export を追加**

`src/features/script-editor/index.ts` に追加:

```typescript
export { ComponentFieldEditor } from './components/ComponentFieldEditor';
```

**Step 5: テストが通ることを確認**

```bash
npx jest --no-coverage ComponentFieldEditor
```

Expected: PASS

**Step 6: commit**

```bash
git add src/features/script-editor/components/ComponentFieldEditor.tsx \
        src/features/script-editor/components/ComponentFieldEditor.test.tsx \
        src/features/script-editor/index.ts
git commit -m "feat(script-editor): add ComponentFieldEditor with bidirectional field editing [T242]"
```

---

### Task 4: ComponentScriptPage の右パネルを ComponentFieldEditor に差し替え

**Files:**

- Modify: `src/app/(editor)/script/components/page.tsx`

右パネルの「設定」「テスト」タブを廃止し、`ComponentFieldEditor` を表示する。
パネルからの変更は `handleContentChange` を通じてストアに反映される。

**Step 1: page.tsx を更新**

`src/app/(editor)/script/components/page.tsx` を以下のように変更:

1. Import を更新:
   - 削除: `ScriptSettingsPanel`, `ScriptTestPanel`, `cn`, `useState`（`RightTab` 用）
   - 追加: `ComponentFieldEditor`

2. `RightTab` 型・`rightTab` state を削除

3. `right` prop を以下に変更:
   ```tsx
   right={
     <ComponentFieldEditor
       content={selectedScript?.content ?? null}
       onContentChange={(newContent) => {
         if (selectedScript) handleContentChange(selectedScript.id, newContent);
       }}
     />
   }
   ```

完成後の `ComponentScriptPage` は以下の形になる（該当箇所のみ）:

```typescript
'use client';

import { useEffect, useMemo, useRef } from 'react';

import { ThreeColumnLayout } from '@/components/common/ThreeColumnLayout';
import {
  ScriptList,
  ScriptEditor,
  ComponentFieldEditor,
} from '@/features/script-editor';
import type { ScriptEditorHandle, DataTypeInfo } from '@/features/script-editor';
import { generateReturnTemplate } from '@/features/script-editor/utils/returnTemplate';
import { useStore } from '@/stores';
import { generateId } from '@/lib/utils';
import { createScript } from '@/types/script';
import type { Script } from '@/types/script';

export default function ComponentScriptPage() {
  // ...（既存の state/selector/handler はそのまま）

  return (
    <ThreeColumnLayout
      left={/* ScriptList — 変更なし */}
      center={/* ScriptEditor — 変更なし */}
      right={
        <ComponentFieldEditor
          content={selectedScript?.content ?? null}
          onContentChange={(newContent) => {
            if (selectedScript) handleContentChange(selectedScript.id, newContent);
          }}
        />
      }
    />
  );
}
```

**Step 2: 全テストを実行して既存テストが壊れていないことを確認**

```bash
npx jest --no-coverage
```

Expected: 既存の失敗（AssetPickerModal, ImageFieldEditor の4件）以外は全 PASS

**Step 3: commit**

```bash
git add src/app/\(editor\)/script/components/page.tsx
git commit -m "feat(script): replace ComponentScriptPage right panel with ComponentFieldEditor [T242]"
```
