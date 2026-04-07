# RPG Box 技術設計書

## 1. プロジェクト概要

RPG Boxは、プログラミング知識がなくても短編RPGを作成できるブラウザベースのゲームエディタです。

### 目標

- **MVP**: 短編RPGが作れるレベルのエディタ
- **Phase 2**: クラウド同期、コミュニティ機能

### 主要機能

- データ設計（キャラクター、アイテム、スキル等）
- マップエディタ（タイル配置、オブジェクト、イベント）
- UI設計（メニュー、バトル画面等）
- スクリプトエディタ（JavaScript）
- テストプレイ（WebGL）

### 開発アプローチ：仕様駆動開発

本プロジェクトでは仕様駆動開発を採用します。

```
requirements.md（要件定義）
       ↓
ui-flow-design.md（UI/UXフロー）
       ↓
design.md（技術設計書）← 本ドキュメント
       ↓
実装
```

**設計書の詳細度:**

- **型定義**: 継承クラスの基底クラスと主要な具象クラスを定義
- **ディレクトリ構造**: features/以下のフォルダ構成まで
- **個別ファイル**: 実装時に決定（設計書では定義しない）

**拡張性の担保:**

- 主要な型（FieldType, Component, EventAction, UIElement）は継承クラスで定義
- レジストリパターンでカスタムタイプの登録を可能に
- OSS貢献者が新しいタイプを追加しやすい設計

---

## 2. 技術スタック

### フロントエンド

| カテゴリ       | 技術                    | 用途                         |
| -------------- | ----------------------- | ---------------------------- |
| フレームワーク | Next.js (App Router)    | SSR/SSG、ルーティング        |
| 言語           | TypeScript              | 型安全性                     |
| スタイリング   | Tailwind CSS            | ユーティリティファースト     |
| UIライブラリ   | shadcn/ui               | アクセシブルなコンポーネント |
| 状態管理       | Zustand + immer         | シンプルな状態管理           |
| フォーム       | React Hook Form + Zod   | バリデーション               |
| D&D            | dnd-kit                 | ドラッグ&ドロップ            |
| エディタ       | Monaco Editor           | コード編集                   |
| 仮想化         | @tanstack/react-virtual | 大量リスト表示               |

### ストレージ

| 領域     | 技術         | 用途               | タイミング      |
| -------- | ------------ | ------------------ | --------------- |
| 一時保存 | LocalStorage | クラッシュ復旧     | 500msデバウンス |
| 正式保存 | IndexedDB    | プロジェクトデータ | Ctrl+S          |
| クラウド | Supabase     | 同期（Phase 2）    | 正式保存後      |

### ゲームエンジン

| カテゴリ     | 技術                          |
| ------------ | ----------------------------- |
| レンダリング | WebGL / Canvas                |
| スクリプト   | JavaScript（async/await対応） |
| 出力形式     | HTML/WebGL                    |

---

## 3. ディレクトリ構造

```
src/
├── app/                    # Next.js App Router
│   ├── (editor)/          # エディタページ群
│   │   ├── data/          # データ設定
│   │   ├── map/           # マップ編集
│   │   ├── script/        # スクリプト
│   │   ├── ui/            # UI設計
│   │   └── settings/      # ゲーム設定
│   ├── api/               # API Routes
│   └── layout.tsx
│
├── components/
│   ├── ui/                # shadcn/ui
│   └── common/            # 共通コンポーネント
│       ├── Header.tsx
│       ├── ThreeColumnLayout.tsx
│       └── PropertyPanel.tsx
│
├── features/              # 機能別モジュール
│   ├── data-editor/       # データ設定
│   ├── map-editor/        # マップ編集
│   ├── event-editor/      # イベント編集
│   ├── ui-designer/       # UI設計
│   ├── script-editor/     # スクリプト
│   ├── asset-manager/     # アセット管理
│   ├── game-settings/     # ゲーム設定
│   └── test-play/         # テストプレイ
│
├── stores/                # Zustand ストア
│   ├── index.ts
│   ├── dataSlice.ts
│   ├── mapSlice.ts
│   ├── eventSlice.ts
│   ├── uiSlice.ts
│   ├── scriptSlice.ts
│   └── assetSlice.ts
│
├── types/                 # 型定義
│   ├── data.ts
│   ├── map.ts
│   ├── event.ts
│   ├── ui.ts
│   └── script.ts
│
├── hooks/                 # 共通フック
│   ├── useUndo.ts
│   ├── useKeyboardShortcut.ts
│   ├── useAutoSave.ts
│   └── useStorage.ts
│
├── lib/                   # ユーティリティ
│   ├── storage.ts         # IndexedDB/LocalStorage
│   ├── validation.ts
│   └── constants.ts
│
├── engine/                # ゲームエンジン
│   ├── core/              # コアシステム
│   ├── api/               # スクリプトAPI
│   └── runtime/           # 実行環境
│
└── styles/
    └── globals.css
```

---

## 4. 型定義（継承クラスパターン）

拡張性を重視し、主要な型は継承クラスで定義します。OSS貢献者がカスタムタイプを追加しやすい設計です。

### 4.1 フィールドタイプ

```typescript
// types/fields/FieldType.ts
export abstract class FieldType<T = unknown> {
  abstract readonly type: string;

  // 引数なしコンストラクタパターン: プロパティはデフォルト値を持ち、
  // インスタンス化後に設定する
  id: string = '';
  name: string = '';
  required: boolean = false;
  displayCondition?: {
    // 表示条件（選択肢フィールドの値に基づく）
    fieldId: string;
    value: unknown;
  };

  // ── 条件付きフィールド表示 ──
  // SelectFieldType に visibilityMap を持たせる:
  //   visibilityMap?: { [optionValue: string]: string[] }
  //   例: { "consumable": ["hp_recovery"], "equipment": ["equip_slot"] }
  // 選択肢フィールドの設定画面から一括管理し、
  // 保存時に各フィールドの displayCondition に変換する。

  abstract getDefaultValue(): T;
  abstract validate(value: T): ValidationResult;
  abstract serialize(value: T): unknown;
  abstract deserialize(data: unknown): T;

  // エディタ用（Reactコンポーネントを返す）
  abstract renderEditor(props: FieldEditorProps<T>): React.ReactNode;
  // ゲーム実行時用（値の取得）
  abstract getValue(data: unknown): T;
}

// types/fields/index.ts - レジストリ
// 異なる型パラメータを持つサブクラスを格納するため any を使用
type FieldTypeConstructor = new () => FieldType<any>;
const fieldTypeRegistry = new Map<string, FieldTypeConstructor>();

export function registerFieldType(type: string, cls: FieldTypeConstructor) {
  fieldTypeRegistry.set(type, cls);
}

export function getFieldType(type: string): FieldTypeConstructor | undefined {
  return fieldTypeRegistry.get(type);
}

// 使用例
const NumberField = getFieldType('number');
if (NumberField) {
  const field = new NumberField();
  field.id = 'hp';
  field.name = 'HP';
  field.required = true;
}
```

#### 組み込みフィールドタイプ

```typescript
// types/fields/NumberFieldType.ts
export class NumberFieldType extends FieldType {
  readonly type = 'number';
  min?: number;
  max?: number;
  step?: number = 1;

  getDefaultValue() {
    return 0;
  }
  // ...
}

// types/fields/StringFieldType.ts
export class StringFieldType extends FieldType {
  readonly type = 'string';
  maxLength?: number;
  placeholder?: string;

  getDefaultValue() {
    return '';
  }
  // ...
}

// types/fields/SelectFieldType.ts
export class SelectFieldType extends FieldType {
  readonly type = 'select';
  options: { value: string; label: string }[] = [];

  getDefaultValue() {
    return this.options[0]?.value ?? '';
  }
  // ...
}

// types/fields/DataSelectFieldType.ts
export class DataSelectFieldType extends FieldType {
  readonly type = 'dataSelect';
  referenceTypeId: string; // 参照先データタイプID

  getDefaultValue() {
    return null;
  }
  // ...
}

// types/fields/ClassFieldType.ts
export class ClassFieldType extends FieldType {
  readonly type = 'class';
  classId: string; // 参照するクラスID

  getDefaultValue() {
    return {};
  }
  // クラスの各フィールドを展開して表示
  // ...
}

// 他: TextareaFieldType, BooleanFieldType, ColorFieldType,
//     FormulaFieldType, DataListFieldType, DataTableFieldType,
//     ClassListFieldType, ImageFieldType, AudioFieldType,
//     EffectFieldType, ScriptFieldType
```

### 4.2 データ構造

```typescript
// types/data.ts
export interface DataType {
  id: string; // データタイプID
  name: string;
  fields: FieldType[]; // 継承クラスのインスタンス配列
}

export interface DataEntry {
  id: string; // データID（ユーザー定義）
  typeId: string;
  values: Record<string, unknown>;
}

export interface CustomClass {
  id: string;
  name: string;
  fields: FieldType[];
}

export interface Variable {
  id: string;
  name: string;
  fieldType: FieldType; // 変数の型もFieldTypeで統一
  isArray: boolean;
  initialValue: unknown;
}
```

### 4.3 コンポーネント（マップオブジェクト用）

```typescript
// types/components/Component.ts
export abstract class Component {
  abstract readonly type: string;

  abstract serialize(): unknown;
  abstract deserialize(data: unknown): void;
  abstract clone(): Component;

  // エディタ用
  abstract renderPropertyPanel(): React.ReactNode;
}

// types/components/index.ts - レジストリ
// 引数なしコンストラクタを持つクラスのみ登録可能（型安全）
type ComponentConstructor = new () => Component;
const componentRegistry = new Map<string, ComponentConstructor>();

export function registerComponent(type: string, cls: ComponentConstructor) {
  componentRegistry.set(type, cls);
}
```

#### 組み込みコンポーネント

```typescript
// types/components/TransformComponent.ts
export class TransformComponent extends Component {
  readonly type = 'transform';
  x: number = 0;
  y: number = 0;
  rotation: number = 0;
  scaleX: number = 1;
  scaleY: number = 1;
  // ...
}

// types/components/SpriteComponent.ts
export class SpriteComponent extends Component {
  readonly type = 'sprite';
  imageId?: string;
  animationId?: string;
  // ...
}

// types/components/ColliderComponent.ts
export class ColliderComponent extends Component {
  readonly type = 'collider';
  width: number = 1; // グリッド単位
  height: number = 1;
  passable: boolean = false;
  // ...
}
```

#### トリガーコンポーネント（タイプ別）

```typescript
// types/components/triggers/TalkTriggerComponent.ts
export class TalkTriggerComponent extends Component {
  readonly type = 'talkTrigger';
  eventId: string;
  direction?: 'front' | 'any'; // 話しかける方向
  // ...
}

// types/components/triggers/TouchTriggerComponent.ts
export class TouchTriggerComponent extends Component {
  readonly type = 'touchTrigger';
  eventId: string;
  // ...
}

// types/components/triggers/StepTriggerComponent.ts
export class StepTriggerComponent extends Component {
  readonly type = 'stepTrigger';
  eventId: string;
  // ...
}

// types/components/triggers/AutoTriggerComponent.ts
export class AutoTriggerComponent extends Component {
  readonly type = 'autoTrigger';
  eventId: string;
  runOnce: boolean = true;
  // ...
}

// 複数のトリガーを同時に持つ場合は、複数のコンポーネントを追加
```

### 4.4 マップ構造

```typescript
// types/map.ts
export interface GameMap {
  id: string;
  name: string;
  width: number; // 20-999
  height: number; // 15-999
  layers: MapLayer[];
  bgmId?: string;
  backgroundImageId?: string;
}

export interface MapLayer {
  id: string;
  name: string;
  type: 'tile' | 'object';
  visible?: boolean; // エディタでの表示/非表示（省略時 = 表示）
  chipsetIds: string[]; // このレイヤーで使用するチップセットIDの配列
  tiles?: string[][]; // tiles[y][x] = "chipsetId:chipIndex" 形式
  objects?: MapObject[];
}

export interface MapObject {
  id: string;
  name: string;
  prefabId?: string; // プレハブからの場合
  components: Component[]; // 継承クラスのインスタンス配列
  overrides?: Record<string, unknown>; // プレハブからのオーバーライド
}

// Chipset はプロジェクト全体で管理するグローバルリソース。
// 各 MapLayer が chipsetIds[] で複数のチップセットを参照できる。
export interface Chipset {
  id: string;
  name: string;
  imageId: string; // チップセット画像のアセットID
  tileWidth: number; // タイルサイズ（通常32）
  tileHeight: number;
  fields: FieldType<any>[]; // チップが持つプロパティのスキーマ定義（例: 通行設定, 足音）
  chips: ChipProperty[]; // 各チップのプロパティ値（未設定チップは fields のデフォルト値を使用）
}

// チップのプロパティ値。FieldType ベースで任意のフィールドを追加可能。
// デフォルト値を持つチップはストアに保存しなくてよい（スパース保存）。
export interface ChipProperty {
  index: number; // チップセット内の0始まりインデックス
  values: Record<string, unknown>; // fieldId → 値
}

export interface Prefab {
  id: string;
  name: string;
  components: Component[]; // デフォルトコンポーネント
}

export interface GameSettings {
  title: string;
  version: string;
  author: string;
  description: string;
  resolution: { width: number; height: number };
  startMapId: string;
  startPosition: { x: number; y: number };
  defaultBGM?: string;
}

export interface UITemplate {
  id: string;
  name: string;
  rootObject: UIObject; // テンプレートのルートオブジェクト
  // args と onSpawnActions は rootObject の TemplateControllerComponent に含まれる
}
```

### 4.5 イベントアクション

#### EventContext（実行コンテキスト）

EventActionが実行時にアクセスできるゲーム状態とAPI。

```typescript
// types/actions/EventAction.ts

export interface EventContext {
  // 変数アクセス
  getVariable(variableId: string): unknown;
  setVariable(variableId: string, value: unknown): void;

  // マップ
  currentMapId: string;
  getMapChip(mapId: string, x: number, y: number, layer?: number): number;
  changeMap(mapId: string, x: number, y: number, transition?: 'fade' | 'none'): Promise<void>;

  // オブジェクト
  getObject(objectId: string): GameObjectRef | undefined;

  // カメラ制御
  camera: CameraController;

  // オーディオ制御
  audio: AudioController;

  // 待機
  wait(frames: number): Promise<void>;

  // テンプレート呼び出し
  callTemplate(templateId: string, args: Record<string, unknown>): Promise<void>;

  // スクリプト専用API（ScriptActionから使用）
  scriptAPI: ScriptAPI;
}

// ゲームオブジェクトへの参照
export interface GameObjectRef {
  id: string;
  x: number;
  y: number;
  rotation: number;
  moveTo(x: number, y: number, speed?: number): Promise<void>;
  rotateTo(angle: number, duration?: number): Promise<void>;
  setAutoWalk(enabled: boolean, pattern?: AutoWalkPattern): void;
}

export interface AutoWalkPattern {
  type: 'random' | 'route' | 'follow';
  route?: { x: number; y: number }[];
  targetId?: string;
  speed?: number;
}

// カメラ制御
export interface CameraController {
  zoom(scale: number, duration?: number): Promise<void>;
  pan(x: number, y: number, duration?: number): Promise<void>;
  applyEffect(
    effect: 'shake' | 'flash' | 'fadeIn' | 'fadeOut',
    options?: {
      intensity?: number;
      duration?: number;
      color?: string;
    }
  ): Promise<void>;
  reset(duration?: number): Promise<void>;
}

// オーディオ制御
export interface AudioController {
  playBGM(audioId: string, options?: { volume?: number; fadeIn?: number }): void;
  stopBGM(options?: { fadeOut?: number }): void;
  playSE(audioId: string, options?: { volume?: number; pitch?: number }): void;
}
```

#### ScriptAPI（スクリプト専用）

ScriptAction内のJavaScriptから呼び出すUI系機能。メッセージ表示や選択肢表示はEventActionではなく、スクリプトから呼び出す関数として提供。

```typescript
export interface ScriptAPI {
  // メッセージ・選択肢
  showMessage(
    text: string,
    options?: {
      face?: string;
      faceName?: string;
      position?: 'top' | 'center' | 'bottom';
    }
  ): Promise<void>;
  showChoice(
    choices: string[],
    options?: {
      cancelIndex?: number;
      defaultIndex?: number;
    }
  ): Promise<number>;

  // 入力
  showNumberInput(options?: { min?: number; max?: number; default?: number }): Promise<number>;
  showTextInput(options?: { maxLength?: number; default?: string }): Promise<string>;

  // 変数の簡易アクセス
  getVar(variableId: string): unknown;
  setVar(variableId: string, value: unknown): void;

  // UI連携 — UI[canvasName] でキャンバスにアクセス
  UI: Record<string, UICanvasProxy>;
}

/**
 * UIキャンバスへのプロキシ
 *
 * UIFunction で定義した関数が自動的にメソッドとして生える:
 *   UI["menu"].show()        // UIFunction "show" を実行
 *   UI["menu"].hide({ fade: true })  // 引数付き
 *
 * UIFunction と同等の操作をスクリプトから直接行うことも可能。
 */
interface UICanvasProxy {
  // --- UIFunction 自動生成メソッド ---
  // UIFunction "show" が定義されていれば UI["menu"].show(args?) が使える
  // (実際の型は動的に生成される)
  [functionName: string]: (args?: Record<string, unknown>) => Promise<void>;

  // --- オブジェクトアクセス ---
  getObject(name: string): UIObjectProxy | null;

  // --- テンプレート ---
  spawn(templateId: string, args?: Record<string, unknown>): Promise<UIObjectProxy>;
  despawn(objectId: string): Promise<void>;
}

/**
 * UIオブジェクトへのプロキシ
 *
 * スクリプトから直接オブジェクトのプロパティを操作できる。
 * UIFunction のアクションブロックでできることと同等。
 */
interface UIObjectProxy {
  readonly id: string;
  readonly name: string;

  // --- Transform ---
  x: number;
  y: number;
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  visible: boolean;

  // --- コンポーネントプロパティ ---
  get(component: string, property: string): unknown;
  set(component: string, property: string, value: unknown): void;

  // --- コンポーネント固有操作 ---
  getComponent(type: string): UIComponentProxy;

  // --- 子オブジェクト ---
  getChild(name: string): UIObjectProxy | null;
  getChildren(): UIObjectProxy[];
}

/**
 * UIコンポーネントへのプロキシ（基底）
 *
 * コンポーネント固有の操作はサブタイプで提供:
 *   getComponent("navigation") → UINavigationProxy
 *   getComponent("animation")  → UIAnimationProxy
 *   getComponent("repeater")   → UIRepeaterProxy
 */
interface UIComponentProxy {
  readonly type: string;
  get(property: string): unknown;
  set(property: string, value: unknown): void;
}

interface UINavigationProxy extends UIComponentProxy {
  /** ユーザー選択を待ち、選択された NavigationItem の itemId を返す */
  select(): Promise<string>;
  /** プログラムでフォーカスを移動 */
  focus(index: number): void;
}

interface UIAnimationProxy extends UIComponentProxy {
  play(name: string, options?: { loop?: boolean; wait?: boolean }): Promise<void>;
  stop(): void;
}

interface UIRepeaterProxy extends UIComponentProxy {
  /** 配列データをセットし、テンプレートインスタンスを生成/更新 */
  setData(items: Record<string, unknown>[]): void;
  getItems(): UIObjectProxy[];
}
```

#### EventAction基底クラス

```typescript
// types/actions/EventAction.ts
export abstract class EventAction {
  abstract readonly type: string;

  abstract execute(context: EventContext): Promise<void>;
  abstract serialize(): unknown;
  abstract deserialize(data: unknown): void;

  // エディタ用
  abstract renderBlock(): React.ReactNode;
  abstract renderPropertyPanel(): React.ReactNode;
}

// types/actions/index.ts - レジストリ
// 引数なしコンストラクタを持つクラスのみ登録可能（型安全）
type EventActionConstructor = new () => EventAction;
const actionRegistry = new Map<string, EventActionConstructor>();

export function registerAction(type: string, cls: EventActionConstructor) {
  actionRegistry.set(type, cls);
}

// 使用例（読み込み時）
const ActionClass = getAction(savedData.type); // 'object' → ObjectAction
if (ActionClass) {
  const action = new ActionClass();
  action.deserialize(savedData.data); // プロパティ復元
}
```

#### 組み込みアクション

各アクションは`operation`プロパティで動作を切り替える設計。

```typescript
// types/actions/VariableOpAction.ts
export class VariableOpAction extends EventAction {
  readonly type = 'variableOp';
  variableId: string;
  operation: 'set' | 'add' | 'subtract' | 'multiply' | 'divide' = 'set';
  value: number | string; // または式

  async execute(context: EventContext) {
    const current = context.getVariable(this.variableId);
    const result = this.calculate(current, this.value);
    context.setVariable(this.variableId, result);
  }
}

// types/actions/ObjectAction.ts
export class ObjectAction extends EventAction {
  readonly type = 'object';
  operation: 'move' | 'rotate' | 'autoWalk' = 'move';
  targetId: string;
  // move用
  x?: number;
  y?: number;
  speed?: number;
  // rotate用
  angle?: number;
  duration?: number;
  // autoWalk用
  enabled?: boolean;
  pattern?: AutoWalkPattern;

  async execute(context: EventContext) {
    const obj = context.getObject(this.targetId);
    if (!obj) return;
    switch (this.operation) {
      case 'move':
        await obj.moveTo(this.x!, this.y!, this.speed);
        break;
      case 'rotate':
        await obj.rotateTo(this.angle!, this.duration);
        break;
      case 'autoWalk':
        obj.setAutoWalk(this.enabled!, this.pattern);
        break;
    }
  }
}

// types/actions/CameraAction.ts
export class CameraAction extends EventAction {
  readonly type = 'camera';
  operation: 'zoom' | 'pan' | 'effect' | 'reset' = 'zoom';
  // zoom/pan用
  scale?: number;
  x?: number;
  y?: number;
  duration?: number;
  // effect用
  effect?: 'shake' | 'flash' | 'fadeIn' | 'fadeOut';
  intensity?: number;
  color?: string;

  async execute(context: EventContext) {
    switch (this.operation) {
      case 'zoom':
        await context.camera.zoom(this.scale!, this.duration);
        break;
      case 'pan':
        await context.camera.pan(this.x!, this.y!, this.duration);
        break;
      case 'effect':
        await context.camera.applyEffect(this.effect!, {
          intensity: this.intensity,
          duration: this.duration,
          color: this.color,
        });
        break;
      case 'reset':
        await context.camera.reset(this.duration);
        break;
    }
  }
}

// types/actions/AudioAction.ts
export class AudioAction extends EventAction {
  readonly type = 'audio';
  operation: 'playBGM' | 'stopBGM' | 'playSE' = 'playSE';
  audioId?: string;
  volume?: number;
  pitch?: number;
  fadeIn?: number;
  fadeOut?: number;

  async execute(context: EventContext) {
    switch (this.operation) {
      case 'playBGM':
        context.audio.playBGM(this.audioId!, { volume: this.volume, fadeIn: this.fadeIn });
        break;
      case 'stopBGM':
        context.audio.stopBGM({ fadeOut: this.fadeOut });
        break;
      case 'playSE':
        context.audio.playSE(this.audioId!, { volume: this.volume, pitch: this.pitch });
        break;
    }
  }
}

// types/actions/MapAction.ts
export class MapAction extends EventAction {
  readonly type = 'map';
  operation: 'getChip' | 'changeMap' = 'changeMap';
  // getChip用
  resultVariableId?: string;
  sourceMapId?: string;
  chipX?: number;
  chipY?: number;
  layer?: number;
  // changeMap用
  targetMapId?: string;
  x?: number;
  y?: number;
  transition?: 'fade' | 'none';

  async execute(context: EventContext) {
    switch (this.operation) {
      case 'getChip':
        const chip = context.getMapChip(this.sourceMapId!, this.chipX!, this.chipY!, this.layer);
        context.setVariable(this.resultVariableId!, chip);
        break;
      case 'changeMap':
        await context.changeMap(this.targetMapId!, this.x!, this.y!, this.transition);
        break;
    }
  }
}

// types/actions/WaitAction.ts
export class WaitAction extends EventAction {
  readonly type = 'wait';
  frames: number = 60;

  async execute(context: EventContext) {
    await context.wait(this.frames);
  }
}

// types/actions/LoopAction.ts
export class LoopAction extends EventAction {
  readonly type = 'loop';
  count?: number; // undefinedで無限ループ
  actions: EventAction[] = [];

  async execute(context: EventContext) {
    const iterations = this.count ?? Infinity;
    for (let i = 0; i < iterations; i++) {
      for (const action of this.actions) {
        await action.execute(context);
      }
    }
  }
}

// types/actions/ConditionalAction.ts
export class ConditionalAction extends EventAction {
  readonly type = 'conditional';
  condition: Condition;
  thenActions: EventAction[] = [];
  elseActions: EventAction[] = [];

  async execute(context: EventContext) {
    if (this.evaluateCondition(context)) {
      for (const action of this.thenActions) {
        await action.execute(context);
      }
    } else {
      for (const action of this.elseActions) {
        await action.execute(context);
      }
    }
  }
}

// types/actions/CallTemplateAction.ts
export class CallTemplateAction extends EventAction {
  readonly type = 'callTemplate';
  templateId: string;
  args: Record<string, unknown> = {};

  async execute(context: EventContext) {
    await context.callTemplate(this.templateId, this.args);
  }
}

// types/actions/ScriptAction.ts
// JavaScript実行。showMessage, showChoice等はscriptAPI経由で呼び出す
export class ScriptAction extends EventAction {
  readonly type = 'script';
  code: string = '';

  async execute(context: EventContext) {
    const fn = new Function('api', 'context', this.code);
    await fn(context.scriptAPI, context);
  }
}
```

### 4.6 イベント・テンプレート構造

```typescript
// types/event.ts
export interface GameEvent {
  id: string;
  name: string;
  actions: EventAction[]; // 継承クラスのインスタンス配列
}

export interface EventTemplate {
  id: string;
  name: string;
  args: TemplateArg[];
  actions: EventAction[];
}

export interface TemplateArg {
  id: string; // 引数ID（テンプレート内で {id} として参照）
  name: string; // 表示名
  fieldType: FieldType; // 引数の型（継承クラス）
  required: boolean;
}
```

### 4.7 UIオブジェクト・コンポーネント

マップオブジェクトと同じ設計パターンを採用。UIオブジェクトに複数のUIコンポーネントをアタッチする。

```typescript
// types/ui/UIObject.ts
export interface UIObject {
  id: string;
  name: string;
  parentId?: string; // 親オブジェクトID（階層構造）
  transform: RectTransform; // 必須
  components: UIComponent[]; // 継承クラスのインスタンス配列
}

export interface RectTransform {
  x: number;
  y: number;
  width: number;
  height: number;
  anchorX: 'left' | 'center' | 'right';
  anchorY: 'top' | 'center' | 'bottom';
  pivotX: number; // 0-1
  pivotY: number; // 0-1
  rotation: number;
  scaleX: number;
  scaleY: number;
}

// types/ui/UIComponent.ts
export abstract class UIComponent {
  abstract readonly type: string;

  abstract serialize(): unknown;
  abstract deserialize(data: unknown): void;
  abstract clone(): UIComponent;

  // エディタ用
  abstract renderPropertyPanel(): React.ReactNode;
}

// types/ui/index.ts - レジストリ
// 引数なしコンストラクタを持つクラスのみ登録可能（型安全）
type UIComponentConstructor = new () => UIComponent;
const uiComponentRegistry = new Map<string, UIComponentConstructor>();

export function registerUIComponent(type: string, cls: UIComponentConstructor) {
  uiComponentRegistry.set(type, cls);
}
```

#### Visualコンポーネント（1オブジェクトに1つ）

```typescript
// types/ui/components/ImageComponent.ts
export class ImageComponent extends UIComponent {
  readonly type = 'image';
  imageId?: string;
  tint?: string;
  opacity: number = 1;
  sliceMode?: 'none' | 'nine-slice'; // 9スライス対応
  // ...
}

// types/ui/components/TextComponent.ts
export class TextComponent extends UIComponent {
  readonly type = 'text';
  content: string = '';
  fontSize: number = 16;
  fontId?: string;
  color: string = '#000000';
  align: 'left' | 'center' | 'right' = 'left';
  verticalAlign: 'top' | 'middle' | 'bottom' = 'top';
  lineHeight: number = 1.2;
  // ...
}

// types/ui/components/ShapeComponent.ts
export class ShapeComponent extends UIComponent {
  readonly type = 'shape';
  shapeType: 'rectangle' | 'ellipse' | 'polygon' = 'rectangle';
  fillColor?: string;
  strokeColor?: string;
  strokeWidth: number = 1;
  cornerRadius: number = 0;
  // ...
}

// types/ui/components/EffectComponent.ts
export class EffectComponent extends UIComponent {
  readonly type = 'effect';
  effectId: string;
  // ...
}
```

#### Maskコンポーネント

```typescript
// types/ui/components/FillMaskComponent.ts
// このコンポーネントを持つオブジェクト自体がマスクされる
export class FillMaskComponent extends UIComponent {
  readonly type = 'fillMask';
  direction: 'horizontal' | 'vertical' = 'horizontal';
  fillAmount: number = 1; // 0-1
  reverse: boolean = false; // 逆方向から埋める
  // ...
}

// types/ui/components/ImageMaskComponent.ts
export class ImageMaskComponent extends UIComponent {
  readonly type = 'imageMask';
  maskImageId: string; // マスク形状を定義する画像
  // ...
}

// types/ui/components/ColorMaskComponent.ts
export class ColorMaskComponent extends UIComponent {
  readonly type = 'colorMask';
  color: string = '#ffffff';
  blendMode: 'multiply' | 'add' | 'overlay' = 'multiply';
  opacity: number = 1;
  // ...
}
```

#### Layoutコンポーネント

```typescript
// types/ui/components/HorizontalLayoutComponent.ts
export class HorizontalLayoutComponent extends UIComponent {
  readonly type = 'horizontalLayout';
  spacing: number = 0;
  alignment: 'start' | 'center' | 'end' = 'start';
  reverseOrder: boolean = false;
  // ...
}

// types/ui/components/VerticalLayoutComponent.ts
export class VerticalLayoutComponent extends UIComponent {
  readonly type = 'verticalLayout';
  spacing: number = 0;
  alignment: 'start' | 'center' | 'end' = 'start';
  reverseOrder: boolean = false;
  // ...
}

// types/ui/components/GridLayoutComponent.ts
export class GridLayoutComponent extends UIComponent {
  readonly type = 'gridLayout';
  columns: number = 2;
  spacingX: number = 0;
  spacingY: number = 0;
  cellWidth?: number; // 未指定で自動計算
  cellHeight?: number;
  // ...
}
```

#### Navigationコンポーネント

```typescript
// types/ui/components/NavigationComponent.ts
export class NavigationComponent extends UIComponent {
  readonly type = 'navigation';
  direction: 'horizontal' | 'vertical' | 'grid' = 'vertical';
  wrap: boolean = false; // 端で折り返すか
  initialIndex: number = 0;
  columns?: number; // gridの場合
  // ...
}

// types/ui/components/NavigationItemComponent.ts
export class NavigationItemComponent extends UIComponent {
  readonly type = 'navigationItem';
  itemId: string; // スクリプトに返すID（await select() の戻り値）
  // ...
}
```

#### その他のコンポーネント

```typescript
// types/ui/components/AnimationComponent.ts
export class AnimationComponent extends UIComponent {
  readonly type = 'animation';
  animations: NamedAnimation[]; // 名前付きアニメーション（複数管理）
  // ...
}

// types/ui/components/TemplateControllerComponent.ts
// テンプレートとして保存時に自動追加
export class TemplateControllerComponent extends UIComponent {
  readonly type = 'templateController';
  args: TemplateArg[]; // 公開引数
  onSpawnActions: EventAction[]; // 生成時アクション（1回のみ）
  onApplyActions: EventAction[]; // データ適用時アクション（引数更新のたびに実行）
  // ...
}

// types/ui/components/RepeaterComponent.ts
// 配列データから子オブジェクトを動的生成
export class RepeaterComponent extends UIComponent {
  readonly type = 'repeater';
  templateId: string; // 繰り返し生成するテンプレートID
  // 配列データはスクリプトから供給される
  // 各要素のデータは TemplateControllerComponent の onApply を通じて反映
  // ...
}
```

### 4.8 UIキャンバス・ファンクション

```typescript
// types/ui.ts
export interface UICanvas {
  id: string;
  name: string;
  objects: UIObject[]; // ルートオブジェクト（階層構造はparentIdで表現）
  functions: UIFunction[];
}

export interface UIFunction {
  id: string;
  name: string; // 例: "show", "hide", "set"
  args: TemplateArg[];
  actions: EventAction[];
}
```

#### UI/Script 分離方針

UIキャンバスはあくまで**表示層**であり、ゲームロジックはスクリプト側が担う。

| 責務               | UI (キャンバス)                    | Script |
| ------------------ | ---------------------------------- | ------ |
| 表示・レイアウト   | ○                                  | ×      |
| アニメーション再生 | ○                                  | ×      |
| ユーザー入力の報告 | ○ (NavigationComponent → select()) | ×      |
| ゲームロジック     | ×                                  | ○      |
| データ管理         | ×                                  | ○      |
| フロー制御         | ×                                  | ○      |

- **NavigationComponent**: スクリプトから `await ui.select(canvasId)` で呼び出し、ユーザーが選択した NavigationItem の `itemId` を返す
- **UIFunction**: スクリプトから `await ui.call(canvasId, funcName, args)` で呼び出す「ビジュアル操作マクロ」。複数オブジェクトのプロパティ変更やアニメーション再生を一括実行する
- **TemplateController.onSpawn**: テンプレートインスタンス生成時に1回実行。引数（`{{argName}}`）によるプロパティ設定とアニメーション再生
- **TemplateController.onApply**: データ更新時に毎回実行。引数の変化をUIに反映する
- **RepeaterComponent**: 配列データから TemplateController のインスタンスを動的生成。各要素のデータは onApply を通じて反映

#### ActionComponent 廃止について

従来の ActionComponent（onClick/onHover/onHoverExit）は以下に統合：

- **クリック/キー入力** → NavigationComponent + NavigationItemComponent
- **テンプレート生成時処理** → TemplateControllerComponent.onSpawn
- **ビジュアル操作** → UIFunction

### 4.9 アセット

```typescript
// types/asset.ts
export interface AssetReference {
  id: string;
  name: string;
  type: 'image' | 'audio' | 'font';
  folderId?: string;
  data: Blob | string; // Blob（ローカル）またはURL（クラウド）
  metadata: {
    width?: number; // 画像の場合
    height?: number;
    duration?: number; // 音声の場合
    fileSize: number;
  };
}

export interface AssetFolder {
  id: string;
  name: string;
  parentId?: string; // ルートはundefined
}
```

---

## 5. 状態管理設計

### Zustand ストア構成

```typescript
// stores/index.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createDataSlice, DataSlice } from './dataSlice';
import { createMapSlice, MapSlice } from './mapSlice';
import { createPrefabSlice, PrefabSlice } from './prefabSlice';
import { createEventSlice, EventSlice } from './eventSlice';
import { createUISlice, UISlice } from './uiSlice';
import { createScriptSlice, ScriptSlice } from './scriptSlice';
import { createAssetSlice, AssetSlice } from './assetSlice';
import { createGameSettingsSlice, GameSettingsSlice } from './gameSettingsSlice';
import { createEditorSlice, EditorSlice } from './editorSlice';

type StoreState = DataSlice &
  MapSlice &
  PrefabSlice &
  EventSlice &
  UISlice &
  ScriptSlice &
  AssetSlice &
  GameSettingsSlice &
  EditorSlice;

export const useStore = create<StoreState>()(
  immer((...args) => ({
    ...createDataSlice(...args),
    ...createMapSlice(...args),
    ...createPrefabSlice(...args),
    ...createEventSlice(...args),
    ...createUISlice(...args),
    ...createScriptSlice(...args),
    ...createAssetSlice(...args),
    ...createGameSettingsSlice(...args),
    ...createEditorSlice(...args),
  }))
);
```

### スライス詳細

```typescript
// stores/dataSlice.ts
export interface DataSlice {
  // 状態
  dataTypes: DataType[];
  dataEntries: Record<string, DataEntry[]>; // typeId -> entries
  classes: CustomClass[];
  variables: Variable[];
  selectedDataTypeId: string | null;
  selectedDataId: string | null;

  // アクション
  addDataType: (dataType: DataType) => void;
  updateDataType: (id: string, updates: Partial<DataType>) => void;
  deleteDataType: (id: string) => void;
  addDataEntry: (typeId: string, entry: DataEntry) => void;
  updateDataEntry: (typeId: string, id: string, values: Record<string, unknown>) => void;
  deleteDataEntry: (typeId: string, id: string) => void;
  updateDataId: (typeId: string, oldId: string, newId: string) => void; // ID変更時の参照同期
  selectData: (typeId: string | null, dataId: string | null) => void;
}

// stores/mapSlice.ts
export interface MapSlice {
  // 状態
  maps: GameMap[];
  chipsets: Chipset[];
  selectedMapId: string | null;
  selectedLayerId: string | null;
  selectedObjectId: string | null;
  currentTool: 'select' | 'pen' | 'eraser' | 'fill' | 'rect';
  selectedChipId: string | null;
  viewport: { x: number; y: number; zoom: number };

  // アクション
  selectMap: (id: string | null) => void;
  selectLayer: (id: string | null) => void;
  setTile: (mapId: string, layerId: string, x: number, y: number, chipId: string) => void;
  fillTiles: (
    mapId: string,
    layerId: string,
    startX: number,
    startY: number,
    chipId: string
  ) => void;
  addObject: (mapId: string, object: MapObject) => void;
  updateObject: (mapId: string, objectId: string, updates: Partial<MapObject>) => void;
  setViewport: (viewport: Partial<{ x: number; y: number; zoom: number }>) => void;
  // チップセット
  addChipset: (chipset: Chipset) => void;
  updateChipset: (id: string, updates: Partial<Chipset>) => void;
  deleteChipset: (id: string) => void;
}

// stores/prefabSlice.ts
export interface PrefabSlice {
  // 状態
  prefabs: Prefab[];
  selectedPrefabId: string | null;

  // アクション
  addPrefab: (prefab: Prefab) => void;
  updatePrefab: (id: string, updates: Partial<Prefab>) => void;
  deletePrefab: (id: string) => void;
  selectPrefab: (id: string | null) => void;
}

// stores/gameSettingsSlice.ts
export interface GameSettingsSlice {
  // 状態
  gameSettings: GameSettings;

  // アクション
  updateGameSettings: (updates: Partial<GameSettings>) => void;
}

// stores/eventSlice.ts
export interface EventSlice {
  // 状態
  events: GameEvent[];
  eventTemplates: EventTemplate[];
  selectedEventId: string | null;
  selectedTemplateId: string | null;

  // アクション
  addEvent: (event: GameEvent) => void;
  updateEvent: (id: string, updates: Partial<GameEvent>) => void;
  deleteEvent: (id: string) => void;
  addEventTemplate: (template: EventTemplate) => void;
  updateEventTemplate: (id: string, updates: Partial<EventTemplate>) => void;
  deleteEventTemplate: (id: string) => void;
}

// stores/uiSlice.ts
export interface UISlice {
  // 状態
  uiCanvases: UICanvas[];
  objectUIs: UICanvas[];
  uiTemplates: UITemplate[];
  selectedCanvasId: string | null;
  selectedObjectId: string | null;

  // アクション
  addCanvas: (canvas: UICanvas) => void;
  updateCanvas: (id: string, updates: Partial<UICanvas>) => void;
  deleteCanvas: (id: string) => void;
  addObject: (canvasId: string, object: UIObject) => void;
  updateObject: (canvasId: string, objectId: string, updates: Partial<UIObject>) => void;
  deleteObject: (canvasId: string, objectId: string) => void;
  addComponent: (canvasId: string, objectId: string, component: UIComponent) => void;
  updateComponent: (
    canvasId: string,
    objectId: string,
    componentType: string,
    updates: Partial<UIComponent>
  ) => void;
  removeComponent: (canvasId: string, objectId: string, componentType: string) => void;
  addUITemplate: (template: UITemplate) => void;
  updateUITemplate: (id: string, updates: Partial<UITemplate>) => void;
  deleteUITemplate: (id: string) => void;
}

// stores/scriptSlice.ts
export interface ScriptSlice {
  // 状態
  scripts: Script[];
  selectedScriptId: string | null;

  // アクション
  addScript: (script: Script) => void;
  updateScript: (id: string, updates: Partial<Script>) => void;
  deleteScript: (id: string) => void;
  selectScript: (id: string | null) => void;
}

// stores/assetSlice.ts
export interface AssetSlice {
  // 状態
  assets: AssetReference[];
  assetFolders: AssetFolder[];
  selectedAssetId: string | null;
  selectedFolderId: string | null;

  // アクション
  addAsset: (asset: AssetReference) => void;
  updateAsset: (id: string, updates: Partial<AssetReference>) => void;
  deleteAsset: (id: string) => void;
  addFolder: (folder: AssetFolder) => void;
  updateFolder: (id: string, updates: Partial<AssetFolder>) => void;
  deleteFolder: (id: string) => void;
}

// stores/editorSlice.ts
export interface EditorSlice {
  currentPage: string;
  unsavedChanges: boolean;
  undoStacks: Record<string, unknown[]>; // ページごとのUndo履歴
  redoStacks: Record<string, unknown[]>;

  setCurrentPage: (page: string) => void;
  markUnsaved: () => void;
  markSaved: () => void;
  undo: () => void;
  redo: () => void;
  pushUndoState: (page: string, state: unknown) => void;
}
```

### セレクタパターン

```typescript
// 必要な状態のみ購読（再レンダリング最小化）
const selectedMapId = useStore((state) => state.selectedMapId);
const selectMap = useStore((state) => state.selectMap);

// 複数の値を取得する場合はshallowを使用
import { shallow } from 'zustand/shallow';
const { maps, selectedMapId } = useStore(
  (state) => ({ maps: state.maps, selectedMapId: state.selectedMapId }),
  shallow
);
```

---

## 6. ストレージ設計

### IndexedDB スキーマ

```typescript
// lib/storage.ts
interface RPGBoxDB {
  projects: {
    key: string; // projectId
    value: {
      id: string;
      name: string;
      createdAt: Date;
      updatedAt: Date;
      data: ProjectData;
    };
  };
  undoHistory: {
    key: [string, string]; // [projectId, pageId]
    value: {
      states: unknown[];
      currentIndex: number;
    };
  };
  gameSaves: {
    key: [string, number]; // [projectId, slotId]
    value: {
      slotId: number;
      savedAt: Date;
      playtime: number;
      variables: Record<string, unknown>;
      partyState: unknown;
      currentMapId: string;
      position: { x: number; y: number };
      customMeta?: Record<string, unknown>;
    };
  };
}

interface ProjectData {
  // データ設定
  dataTypes: DataType[];
  dataEntries: Record<string, DataEntry[]>;
  classes: CustomClass[];
  variables: Variable[];
  // マップ
  maps: GameMap[];
  chipsets: Chipset[];
  prefabs: Prefab[];
  // イベント
  events: GameEvent[];
  eventTemplates: EventTemplate[];
  // UI
  uiCanvases: UICanvas[];
  objectUIs: UICanvas[];
  uiTemplates: UITemplate[];
  // スクリプト・アセット
  scripts: Script[];
  assets: AssetReference[];
  // 設定
  gameSettings: GameSettings;
}
```

### 自動保存フロー

```typescript
// hooks/useAutoSave.ts
export function useAutoSave() {
  const state = useStore();

  useEffect(() => {
    const saveToLocalStorage = debounce(() => {
      localStorage.setItem(
        'rpg-box-temp',
        JSON.stringify({
          timestamp: Date.now(),
          data: getSerializableState(state),
        })
      );
    }, 500);

    // 状態変更を監視
    const unsubscribe = useStore.subscribe(saveToLocalStorage);
    return () => unsubscribe();
  }, []);
}
```

---

## 7. 機能モジュール設計

### データエディタ

```
features/data-editor/
├── components/
│   ├── DataTypeList.tsx       # 左カラム: データタイプ一覧
│   ├── DataEntryList.tsx      # 中カラム: データ一覧（仮想化）
│   ├── FormBuilder.tsx        # 右カラム: フォームビルダー
│   ├── FieldEditor.tsx        # フィールド編集
│   ├── FieldTypeSelector.tsx  # フィールドタイプ選択モーダル
│   └── fields/                # フィールドタイプ別コンポーネント
│       ├── NumberField.tsx
│       ├── StringField.tsx
│       ├── SelectField.tsx
│       ├── DataSelectField.tsx
│       └── ...
├── hooks/
│   ├── useDataEditor.ts
│   └── useFieldValidation.ts
└── index.ts
```

### マップエディタ

```
features/map-editor/
├── components/
│   ├── MapCanvas.tsx          # Canvas描画（OffscreenCanvas検討）
│   ├── ChipPalette.tsx        # チップパレット
│   ├── LayerTabs.tsx          # レイヤー切り替え
│   ├── ObjectList.tsx         # オブジェクト一覧
│   ├── PropertyPanel.tsx      # プロパティ編集
│   ├── Toolbar.tsx            # ツールバー
│   └── EventEditorModal.tsx   # イベント編集モーダル
├── hooks/
│   ├── useMapCanvas.ts        # Canvas操作
│   ├── useTilePainting.ts     # タイル配置ロジック
│   └── useObjectPlacement.ts  # オブジェクト配置
├── utils/
│   ├── tileUtils.ts           # 塗りつぶしアルゴリズム等
│   └── visibilityCalc.ts      # 可視タイル計算
└── index.ts
```

### UI設計

```
features/ui-designer/
├── components/
│   ├── UICanvas.tsx           # UIキャンバス
│   ├── ElementPalette.tsx     # エレメント一覧
│   ├── ObjectHierarchy.tsx    # オブジェクト階層（仮想化）
│   ├── FunctionEditor.tsx     # ファンクション編集
│   ├── TimelineEditor.tsx     # タイムライン
│   └── PropertyPanel.tsx
├── hooks/
│   ├── useUICanvas.ts
│   └── useFunctionTest.ts
└── index.ts
```

---

## 8. ゲームエンジンAPI

### グローバル名前空間

```typescript
// engine/api/index.ts

// データアクセス
declare const Data: {
  [typeId: string]: {
    [dataId: string]: Record<string, unknown>;
  };
  get(typeId: string, dataId: string): Record<string, unknown> | null;
  find(typeId: string, criteria: Record<string, unknown>): Record<string, unknown>[];
};

// 変数
declare const Variable: {
  get(name: string): unknown;
  set(name: string, value: unknown): void;
  getAll(): Record<string, unknown>;
};

// サウンド
declare const Sound: {
  playBGM(id: string): SoundController;
  stopBGM(): void;
  playSE(id: string): void;
  playVoice(id: string): void;
  setVolume(type: 'bgm' | 'se' | 'voice', volume: number): void;
  bgm(): SoundController;
  crossFade(fromId: string, toId: string, duration: number): Promise<void>;
};

interface SoundController {
  fadeIn(duration: number): Promise<void>;
  fadeOut(duration: number): Promise<void>;
  fadeTo(volume: number, duration: number): Promise<void>;
}

// カメラ
declare const Camera: {
  setZoom(scale: number): void;
  setPosition(pos: { x: number; y: number }): void;
  follow(object: GameObject): void;
  zoom(scale: number, duration: number): Promise<void>;
  pan(pos: { x: number; y: number }, duration: number): Promise<void>;
  shake(intensity: number, duration: number): Promise<void>;
};

// マップ
declare const Map: {
  current(): GameMapRuntime;
  loadMap(mapId: string): Promise<void>;
};

// UI
declare const UI: {
  Canvas: {
    [screenId: string]: UICanvasRuntime;
  };
};

// セーブ/ロード
declare function Save(slotId: number, options?: SaveOptions): Promise<void>;
declare function Load(slotId: number): Promise<void>;
declare namespace Save {
  function getSlots(): SaveSlot[];
  function getMeta(slotId: number): SaveMeta | null;
  function setMeta(slotId: number, meta: Record<string, unknown>): void;
}

// イベント
declare namespace Event {
  function wait(frames: number): Promise<void>;
  function message(text: string, options?: MessageOptions): Promise<void>;
  function choice(choices: string[]): Promise<number>;
}
```

---

## 9. パフォーマンス設計

### 仮想化が必要な箇所

| ページ       | コンポーネント  | 最大件数         | ライブラリ              |
| ------------ | --------------- | ---------------- | ----------------------- |
| データ設定   | DataEntryList   | 1000件/タイプ    | @tanstack/react-virtual |
| アセット管理 | AssetGrid       | 多数             | @tanstack/react-virtual |
| UI設計       | ObjectHierarchy | 1000オブジェクト | @tanstack/react-virtual |

### useMemoが必要な箇所

```typescript
// データフィルタリング
const filteredData = useMemo(() => data.filter((item) => item.name.includes(query)), [data, query]);

// マップ可視タイル計算
const visibleTiles = useMemo(() => calculateVisibleTiles(map, viewport), [map, viewport]);

// オブジェクト階層構築
const objectTree = useMemo(() => buildHierarchy(objects), [objects]);
```

### Web Worker検討箇所

- マップキャンバス描画（OffscreenCanvas）
- 大量データのインポート/エクスポート
- ゲームエンジン実行（テストプレイ）

---

## 10. データ整合性

### ID変更時の参照同期

```typescript
// データID変更時
function updateDataId(typeId: string, oldId: string, newId: string) {
  // 1. 該当データのID更新
  // 2. 参照しているフィールドを検索
  //    - DataSelect: referenceTypeId === typeId && value === oldId
  //    - DataList: referenceTypeId === typeId && values.includes(oldId)
  //    - DataTable: referenceTypeId === typeId && entries[].id === oldId
  // 3. 参照を新しいIDに更新
  // 4. 更新箇所を通知
}
```

### データ削除時の処理

```typescript
// データ削除時
function deleteDataEntry(typeId: string, id: string) {
  // 1. 参照箇所を検索
  // 2. 警告ダイアログ表示（参照箇所一覧）
  // 3. 確認後、参照をnullに設定
  // 4. データ削除
  // 5. 影響箇所をエラー表示
}
```

---

## 11. エラーハンドリング

### バリデーション

| 種類             | タイミング    | 表示方法             |
| ---------------- | ------------- | -------------------- |
| ID重複           | リアルタイム  | フィールド下に赤文字 |
| 必須フィールド空 | 保存時        | フィールド下に赤文字 |
| 参照切れ         | 保存時/読込時 | 該当フィールドに警告 |
| アセット読込失敗 | 読込時        | No Image表示         |

### トースト通知

```typescript
type ToastType = 'success' | 'warning' | 'error';

// 成功: 緑、3秒で自動消去
// 警告: 黄、手動消去
// エラー: 赤、手動消去 + コンソール出力
```

---

## 12. 今後の拡張ポイント

### Phase 2（クラウド）

- Supabase認証（Google/Discord）
- プロジェクトのクラウド保存
- ゲーム公開・共有機能
- コミュニティ（評価、コメント）

### 将来対応

- カスタムシェーダー（GLSL）
- ビジュアルスクリプティング
- プラグインシステム
- マルチプレイヤーAPI
