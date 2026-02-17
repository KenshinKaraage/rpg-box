# Phase 8: EventAction System Design

## Goal

EventAction のランタイム基盤を実装する。各アクションの型定義・execute()・シリアライズと、アクション配列を順次実行する EventRunner、GameEngine への統合まで。エディタUI（ブロック編集）は後続フェーズで別途実装する。

## Architecture

### ロジックとUIの分離（案A）

EventAction 基底クラスからエディタUI メソッド（renderBlock / renderPropertyPanel）を削除し、ランタイム専用にする。将来のブロック編集UIは `src/features/event-editor/` に別レジストリ（actionUIRegistry）として実装する。

**理由:**

- ゲームエンジン（engine/）に React 依存が入らない
- ゲームエクスポート時にエディタUI コードがバンドルされない
- FieldType の renderEditor → standalone \*FieldEditor パターンと一貫性がある

### GameContext が唯一のコンテキスト

EventContext インターフェースを廃止。EventAction も ScriptRunner も GameContext を直接操作する。ScriptRunner の ScriptContext インターフェースも削除。

**GameContext の役割:** ゲーム状態とAPIへのアクセス（変数、データ、サウンド、カメラ等）
**EventRunner の役割:** アクション配列の実行制御

---

## Directory Structure

```
src/engine/
├── actions/                    ← types/actions/ から移動
│   ├── EventAction.ts          ← 基底クラス（execute, toJSON, fromJSON のみ）
│   ├── VariableOpAction.ts
│   ├── ConditionalAction.ts
│   ├── LoopAction.ts
│   ├── AudioAction.ts
│   ├── CameraAction.ts
│   ├── ScriptAction.ts
│   ├── CallTemplateAction.ts
│   ├── WaitAction.ts           ← execute() は no-op（Phase 18で実装）
│   ├── ObjectAction.ts         ← execute() は no-op（Phase 10で実装）
│   ├── MapAction.ts            ← execute() は no-op（Phase 10で実装）
│   └── index.ts                ← actionRegistry
├── event/
│   └── EventRunner.ts          ← run(actions, context) + イテレーション上限
├── core/
│   ├── GameEngine.ts           ← event モード追加
│   └── ScriptRunner.ts         ← ScriptContext 削除、GameContext 直接使用
├── runtime/
│   └── GameContext.ts           ← 唯一のコンテキスト、scriptRunner 保持
└── types.ts                     ← EventModeConfig 追加
```

**削除:**

- `src/types/actions/EventAction.ts` の EventContext, renderBlock(), renderPropertyPanel()
- `src/engine/core/ScriptRunner.ts` の ScriptContext インターフェース
- `src/types/actions/` ディレクトリ（engine/actions/ に移動）

---

## EventAction Base Class

```typescript
// src/engine/actions/EventAction.ts

export abstract class EventAction {
  abstract readonly type: string;

  /**
   * アクションを実行
   * @param context ゲームコンテキスト（状態・API アクセス）
   * @param run 子アクション実行コールバック（ConditionalAction, LoopAction 用）
   */
  abstract execute(
    context: GameContext,
    run: (actions: EventAction[]) => Promise<void>
  ): Promise<void>;

  /** JSON シリアライズ（保存用） */
  abstract toJSON(): Record<string, unknown>;

  /** JSON からプロパティ復元 */
  abstract fromJSON(data: Record<string, unknown>): void;
}
```

actionRegistry は現在と同じパターン（`Map<string, new () => EventAction>`）。

---

## Concrete Actions

### ロジック系

**VariableOpAction** (`type: 'variableOp'`)

```typescript
variableId: string;
operation: 'set' | 'add' | 'subtract' | 'multiply' | 'divide';
value: number | string;
```

execute: `context.variable.get(variableId)` → 演算 → `context.variable.set(variableId, result)`

**ConditionalAction** (`type: 'conditional'`)

```typescript
condition: {
  variableId: string
  operator: '==' | '!=' | '>' | '<' | '>=' | '<='
  value: unknown
}
thenActions: EventAction[]
elseActions: EventAction[]
```

execute: 条件評価 → `run(thenActions)` or `run(elseActions)`

**LoopAction** (`type: 'loop'`)

```typescript
count?: number  // undefined = 無限（breakで脱出）
actions: EventAction[]
```

execute: count 回（または無限に）`run(actions)` を呼ぶ。EventRunner のイテレーション上限で保護。

### 演出系

**WaitAction** (`type: 'wait'`) — **execute は no-op（Phase 18で実装）**

```typescript
frames: number = 60;
```

**AudioAction** (`type: 'audio'`)

```typescript
operation: 'playBGM' | 'stopBGM' | 'playSE'
audioId?: string
volume?: number
fadeIn?: number
fadeOut?: number
pitch?: number
```

execute: `context.sound` の対応メソッドを呼ぶ

**CameraAction** (`type: 'camera'`)

```typescript
operation: 'zoom' | 'pan' | 'effect' | 'reset'
scale?: number; x?: number; y?: number; duration?: number
effect?: 'shake' | 'flash' | 'fadeIn' | 'fadeOut'
intensity?: number; color?: string
```

execute: `context.camera` の対応メソッドを呼ぶ

### オブジェクト・マップ系

**ObjectAction** (`type: 'object'`) — **execute は no-op（Phase 10で実装）**

```typescript
operation: 'move' | 'rotate' | 'autoWalk'
targetId: string
x?: number; y?: number; speed?: number
angle?: number; duration?: number
enabled?: boolean; pattern?: AutoWalkPattern
```

**MapAction** (`type: 'map'`) — **execute は no-op（Phase 10で実装）**

```typescript
operation: 'changeMap' | 'getChip'
targetMapId?: string; x?: number; y?: number; transition?: 'fade' | 'none'
resultVariableId?: string; sourceMapId?: string; chipX?: number; chipY?: number; layer?: number
```

### 呼び出し系

**CallTemplateAction** (`type: 'callTemplate'`)

```typescript
templateId: string;
args: Record<string, unknown>;
```

execute: テンプレートの actions を取得 → `run(templateActions)` で実行。テンプレート解決は GameContext または EventRunner 経由。

**ScriptAction** (`type: 'script'`)

```typescript
scriptId: string;
args: Record<string, unknown>;
```

execute: `context.scriptRunner.execute(script, context, args)` で ScriptRunner に委譲

---

## EventRunner

```typescript
// src/engine/event/EventRunner.ts

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

---

## GameContext Changes

```typescript
export class GameContext {
  readonly scriptAPI: GameScriptAPI;
  readonly data: DataAPI;
  readonly variable: VariableAPI;
  readonly sound: SoundAPI;
  readonly camera: CameraAPI;
  readonly save: SaveAPI;
  readonly scriptRunner: ScriptRunner; // ← 追加

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

ScriptRunner の ScriptContext インターフェースを削除。ScriptRunner.execute() が GameContext を直接受け取る。

---

## GameEngine Changes

### EventModeConfig

```typescript
// types.ts に追加
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

### handleStart 拡張

```typescript
private async handleStart(config: ScriptModeConfig | FullModeConfig | EventModeConfig) {
  if (config.mode === 'script') {
    await this.executeScript(config);
  } else if (config.mode === 'event') {
    await this.executeEvent(config);
  }
}

private async executeEvent(config: EventModeConfig) {
  // 1. アクションを deserialize
  const actions = config.actions.map(a => {
    const ActionClass = getAction(a.type);
    if (!ActionClass) throw new Error(`Unknown action type: ${a.type}`);
    const action = new ActionClass();
    action.fromJSON(a.data);
    return action;
  });

  // 2. コンテキスト構築
  const runner = new ScriptRunner(config.projectData.scripts);
  const context = new GameContext(config.projectData, runner, {
    variables: config.testSettings?.variables,
  });

  // 3. EventRunner で実行
  const eventRunner = new EventRunner();
  await eventRunner.run(actions, context);

  // 4. 結果返却
  this.sendMessage({ type: 'state-update', variables: context.variable.getAll() });
}
```

---

## Phase 8 での execute() 実行可否

| アクション         | Phase 8 で実行可能 | 備考                      |
| ------------------ | ------------------ | ------------------------- |
| VariableOpAction   | はい               | variable API で完結       |
| ConditionalAction  | はい               | variable + run callback   |
| LoopAction         | はい               | run callback + 上限       |
| AudioAction        | はい               | sound API スタブ呼び出し  |
| CameraAction       | はい               | camera API スタブ呼び出し |
| ScriptAction       | はい               | scriptRunner 経由         |
| CallTemplateAction | はい               | テンプレート解決 + run    |
| WaitAction         | no-op              | ゲームループ未実装        |
| ObjectAction       | no-op              | マップオブジェクト未実装  |
| MapAction          | no-op              | マップシステム未実装      |

---

## Testing Strategy

- **各アクション単体テスト:** GameContext をモック/スタブで構築、execute() の動作確認
- **EventRunner テスト:** アクション配列の順次実行、条件分岐、ループ、イテレーション上限
- **GameEngine 統合テスト:** event モードでの deserialize → 実行 → state-update
- **シリアライズテスト:** toJSON → fromJSON のラウンドトリップ

---

## Future: Editor UI (別フェーズ)

```
src/features/event-editor/
├── components/blocks/
│   ├── VariableOpActionBlock.tsx
│   ├── ConditionalActionBlock.tsx
│   └── ...
├── registry.ts              ← actionUIRegistry
│   interface ActionUIEntry {
│     displayName: string;
│     category: string;
│     Block: ComponentType<{ action: EventAction }>;
│     PropertyPanel: ComponentType<{ action: EventAction; onChange: ... }>;
│   }
└── components/
    ├── ActionBlockEditor.tsx
    └── ActionSelector.tsx
```

actionUIRegistry は actionRegistry（実行用）とは別に管理。アクションタイプの type 文字列で紐付ける。
