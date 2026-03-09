# Phase 8: イベントシステム（エディタUI） Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** エンジン側で実装済みの EventAction 群に対応するエディタUI（テンプレート管理、ブロックエディタ、各アクションのプロパティ編集）を構築する。

**Architecture:** 既存の `src/engine/actions/` にある EventAction クラス群（toJSON/fromJSON）をそのまま活用し、エディタ側は `src/features/event-editor/` に配置。型定義は `src/types/event.ts`、ストアは `src/stores/eventSlice.ts`。アクションブロックエディタはレジストリパターンで動的に解決。

**Tech Stack:** React, TypeScript, Zustand (Immer), shadcn/ui, React Hook Form, Jest + RTL

**既存コード:**
- `src/engine/actions/EventAction.ts` — 基底クラス（type, execute, toJSON, fromJSON）
- `src/engine/actions/index.ts` — レジストリ（registerAction, getAction, getAllActions）
- `src/engine/actions/register.ts` — 全アクション登録
- `src/engine/values/types.ts` — ValueSource 型（literal, variable, data, random）

---

## Batch 1: 型定義 + Store (T117, T110)

### Task 1: GameEvent / EventTemplate 型定義 [T117]

**Files:**
- Create: `src/types/event.ts`

**実装:**

```typescript
// src/types/event.ts
import type { EventAction } from '@/engine/actions/EventAction';
import type { FieldType } from '@/types/fields/FieldType';

export interface TemplateArg {
  id: string;
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fieldType: FieldType<any>;
  required: boolean;
}

export interface EventTemplate {
  id: string;
  name: string;
  description?: string;
  args: TemplateArg[];
  actions: EventAction[];
}

export function createEventTemplate(id: string, name: string): EventTemplate {
  return { id, name, description: '', args: [], actions: [] };
}
```

注: `GameEvent` はオブジェクトに紐づくイベント（Phase 13 マップ編集で使用）。Phase 8 ではまだ不要なので `EventTemplate` のみ定義。必要になったら追加する。

**テスト:** `src/types/event.test.ts` — createEventTemplate のデフォルト値確認。

**検証:** `npx tsc --noEmit`

---

### Task 2: eventSlice [T110]

**Files:**
- Create: `src/stores/eventSlice.ts`
- Create: `src/stores/eventSlice.test.ts`
- Modify: `src/stores/index.ts` — スライス統合

**実装:**

```typescript
// src/stores/eventSlice.ts
import type { EventTemplate } from '@/types/event';

export interface EventSlice {
  eventTemplates: EventTemplate[];
  selectedTemplateId: string | null;

  addTemplate: (template: EventTemplate) => void;
  updateTemplate: (id: string, updates: Partial<EventTemplate>) => void;
  deleteTemplate: (id: string) => void;
  selectTemplate: (id: string | null) => void;
}
```

パターン: `dataSlice.ts` と同等。Immer で直接 mutate。

**テスト:** CRUD 操作の基本テスト（追加、更新、削除、選択）。

**検証:** `npx jest --testPathPattern=eventSlice`

---

## Batch 2: アクションブロック基盤 (T116, T115)

### Task 3: ActionBlockRegistry — ブロックエディタのレジストリ

**Files:**
- Create: `src/features/event-editor/registry/actionBlockRegistry.ts`
- Create: `src/features/event-editor/registry/actionBlockRegistry.test.ts`

**設計:**
エンジン側の `actionRegistry` に対応するエディタ側レジストリ。各アクションタイプに対してラベル、カテゴリ、ブロックコンポーネントを登録。

```typescript
export interface ActionBlockDefinition {
  type: string;
  label: string;
  category: 'logic' | 'basic' | 'script' | 'template';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  BlockComponent: React.ComponentType<ActionBlockProps>;
}

export interface ActionBlockProps {
  action: EventAction;
  onChange: (action: EventAction) => void;
  onDelete: () => void;
}

// レジストリ関数
export function registerActionBlock(def: ActionBlockDefinition): void;
export function getActionBlock(type: string): ActionBlockDefinition | undefined;
export function getAllActionBlocks(): ActionBlockDefinition[];
export function getActionBlocksByCategory(): Record<string, ActionBlockDefinition[]>;
```

**テスト:** 登録・取得・カテゴリ分類の検証。

---

### Task 4: ActionSelector モーダル [T116]

**Files:**
- Create: `src/features/event-editor/components/ActionSelector.tsx`
- Create: `src/features/event-editor/components/ActionSelector.test.tsx`

**設計:**
FieldTypeSelector と同パターン。`getActionBlocksByCategory()` から動的にカテゴリ別ボタングリッドを生成。検索フィルタ付き。

```typescript
interface ActionSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (type: string) => void;
}
```

- Modal (size="md")、タイトル「アクションを追加」
- カテゴリごとにセクション分け（ロジック / 基礎 / スクリプト / テンプレート）
- 検索 Input でラベル/タイプのフィルタ

**テスト:** モーダル表示、カテゴリ表示、選択時のコールバック。

---

### Task 5: ActionBlockEditor — ブロック一覧コンポーネント [T115]

**Files:**
- Create: `src/features/event-editor/components/ActionBlockEditor.tsx`
- Create: `src/features/event-editor/components/ActionBlockEditor.test.tsx`

**設計:**
アクション配列を受け取り、各アクションを対応するブロックコンポーネントで表示。追加・削除・並び替えをサポート。

```typescript
interface ActionBlockEditorProps {
  actions: EventAction[];
  onChange: (actions: EventAction[]) => void;
}
```

- 各アクションは `getActionBlock(action.type)` でブロックコンポーネントを解決
- 未登録タイプは「不明なアクション: {type}」表示
- 「アクションを追加」ボタン → ActionSelector モーダル
- 削除は各ブロック内の onDelete
- 並び替えは後回し（Phase 8 のスコープ外でも可、シンプルに上下ボタンで対応）

**テスト:** アクション一覧表示、追加、削除。

---

## Batch 3: テンプレートページUI (T112, T114, T113, T111)

### Task 6: EventTemplateList [T112]

**Files:**
- Create: `src/features/event-editor/components/EventTemplateList.tsx`
- Create: `src/features/event-editor/components/EventTemplateList.test.tsx`

**設計:** DataTypeList と同パターン。

```typescript
interface EventTemplateListProps {
  templates: EventTemplate[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}
```

- ヘッダー: 「テンプレート一覧」+ 追加ボタン
- リスト: テンプレート名、アクション数表示
- 右クリックコンテキストメニュー（複製・削除）

---

### Task 7: TemplateArgEditor [T114]

**Files:**
- Create: `src/features/event-editor/components/TemplateArgEditor.tsx`
- Create: `src/features/event-editor/components/TemplateArgEditor.test.tsx`

**設計:**

```typescript
interface TemplateArgEditorProps {
  args: TemplateArg[];
  onChange: (args: TemplateArg[]) => void;
}
```

- 引数一覧（ID、名前、型、必須フラグ）
- 追加ボタン → デフォルトで string 型の引数を追加
- 各行: 名前 Input、型 Select（FieldType レジストリから）、必須チェックボックス、削除ボタン

---

### Task 8: EventTemplateEditor [T113]

**Files:**
- Create: `src/features/event-editor/components/EventTemplateEditor.tsx`
- Create: `src/features/event-editor/components/EventTemplateEditor.test.tsx`

**設計:**

```typescript
interface EventTemplateEditorProps {
  template: EventTemplate | null;
  onUpdate: (id: string, updates: Partial<EventTemplate>) => void;
}
```

- テンプレート未選択時: 「テンプレートを選択してください」
- 選択時:
  - ID 表示（編集可能）
  - 名前 Input
  - 説明 Textarea
  - TemplateArgEditor（引数編集）
  - ActionBlockEditor（アクション編集）

---

### Task 9: EventTemplatePage [T111]

**Files:**
- Create: `src/app/(editor)/event/templates/page.tsx`

**設計:** DataPage と同パターン。ThreeColumnLayout。

- 左: EventTemplateList
- 中央: ActionBlockEditor（選択中テンプレートのアクション）
- 右: EventTemplateEditor（メタデータ + 引数）

ストアから状態・アクション取得、ハンドラ定義。

**検証:** `npx tsc --noEmit` + `npx jest --testPathPattern=event-editor`

---

## Batch 4: 基本アクションブロック (T120, T121, T122, T122a)

### Task 10: VariableOpActionBlock [T120]

**Files:**
- Create: `src/features/event-editor/components/blocks/VariableOpActionBlock.tsx`
- Create: `src/features/event-editor/components/blocks/VariableOpActionBlock.test.tsx`

**設計:**
VariableOpAction のエディタ。変数選択、演算子選択、値入力。

- 変数 Select（ストアの variables から取得）
- operation Select（set/add/subtract/multiply/divide）
- ValueSource エディタ（後述、初回はリテラル値 Input のみ）

ブロック表示: `「{変数名} を {値} に {操作}」` の要約テキスト。

---

### Task 11: ConditionalActionBlock [T121]

**Files:**
- Create: `src/features/event-editor/components/blocks/ConditionalActionBlock.tsx`
- Create: `src/features/event-editor/components/blocks/ConditionalActionBlock.test.tsx`

**設計:**
条件設定 + Then/Else 分岐のネスト表示。

- Condition: 変数 Select、演算子 Select（==, !=, >, <, >=, <=）、比較値 Input
- Then ブランチ: ActionBlockEditor（再帰）
- Else ブランチ: ActionBlockEditor（再帰）
- インデントで視覚的にネスト表現

---

### Task 12: LoopActionBlock [T122]

**Files:**
- Create: `src/features/event-editor/components/blocks/LoopActionBlock.tsx`
- Create: `src/features/event-editor/components/blocks/LoopActionBlock.test.tsx`

**設計:**
- ループ回数 Input（空 = 無限ループ）
- 子アクション: ActionBlockEditor（再帰）

---

### Task 13: WaitActionBlock [T122a]

**Files:**
- Create: `src/features/event-editor/components/blocks/WaitActionBlock.tsx`
- Create: `src/features/event-editor/components/blocks/WaitActionBlock.test.tsx`

**設計:**
最もシンプルなブロック。フレーム数 Input のみ。

---

## Batch 5: 残りのアクションブロック (T122b, T122e, T122g, T122i, T122j)

### Task 14: AudioActionBlock [T122b]

- operation 切替（PlayBGM / StopBGM / PlaySE）
- 音声アセット Select（ストアの assets から type='audio' をフィルタ）
- ボリューム、ピッチ、フェード設定

### Task 15: CameraActionBlock [T122e]

- operation 切替（zoom / pan / effect / reset）
- effect サブタイプ Select（shake / flash / fadeIn / fadeOut）
- スケール、座標、時間、色、強度設定

### Task 16: CallTemplateActionBlock [T122g]

- テンプレート Select（ストアの eventTemplates から）
- 選択したテンプレートの引数に応じた入力フォームを動的生成

### Task 17: MapActionBlock [T122i]

- operation 切替（changeMap / getChip）
- changeMap: マップ Select、座標入力、トランジション Select
- getChip: マップ/座標/レイヤー指定、結果変数 Select

### Task 18: ObjectActionBlock [T122j]

- operation 切替（move / rotate / autoWalk）
- 対象オブジェクト Select
- 各 operation に応じた設定（座標/速度、角度/時間、パターン）

---

## Batch 6: レジストリ登録 + 統合 + 検証

### Task 19: 全ブロックのレジストリ登録

**Files:**
- Create: `src/features/event-editor/registry/register.ts`

```typescript
import { registerActionBlock } from './actionBlockRegistry';
// 各ブロックをインポートして登録
registerActionBlock({
  type: 'variableOp',
  label: '変数操作',
  category: 'logic',
  BlockComponent: VariableOpActionBlock,
});
// ... 全アクションタイプ
```

### Task 20: barrel export + ナビゲーション統合

- `src/features/event-editor/index.ts` 作成
- ナビゲーションにイベントテンプレートページへのリンク追加

### Task 21: 全体検証

- `npx tsc --noEmit`
- `npx jest --testPathPattern="event-editor|eventSlice|event\\.test"` — 全テストパス
- dev サーバーでテンプレートページの動作確認

---

## 依存関係

```
T117 (型定義)
  ↓
T110 (eventSlice) ← T117
  ↓
T116 (ActionSelector) ← ActionBlockRegistry
T115 (ActionBlockEditor) ← ActionBlockRegistry, T116
  ↓
T112 (TemplateList)
T114 (ArgEditor)
T113 (TemplateEditor) ← T114, T115
T111 (TemplatePage) ← T112, T113
  ↓
T120-T122j (各ブロック) ← ActionBlockProps 定義済み後
  ↓
レジストリ登録 + 統合
```
