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
export abstract class FieldType {
  abstract readonly type: string;

  id: string; // フィールドID（英数字+アンダースコア）
  name: string; // 表示名
  required: boolean = false;
  displayCondition?: {
    // 表示条件（選択肢フィールドのみ対象）
    fieldId: string;
    value: unknown;
  };

  abstract getDefaultValue(): unknown;
  abstract validate(value: unknown): ValidationResult;
  abstract serialize(value: unknown): unknown;
  abstract deserialize(data: unknown): unknown;

  // エディタ用（Reactコンポーネントを返す）
  abstract renderEditor(props: FieldEditorProps): React.ReactNode;
  // ゲーム実行時用（値の取得）
  abstract getValue(data: unknown): unknown;
}

// types/fields/index.ts - レジストリ
const fieldTypeRegistry = new Map<string, typeof FieldType>();

export function registerFieldType(type: string, cls: typeof FieldType) {
  fieldTypeRegistry.set(type, cls);
}

export function getFieldType(type: string): typeof FieldType | undefined {
  return fieldTypeRegistry.get(type);
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

// types/fields/FieldSetFieldType.ts
export class FieldSetFieldType extends FieldType {
  readonly type = 'fieldSet';
  fieldSetId: string; // 参照するフィールドセットID

  getDefaultValue() {
    return {};
  }
  // フィールドセットの各フィールドを展開して表示
  // ...
}

// 他: TextareaFieldType, BooleanFieldType, ColorFieldType,
//     FormulaFieldType, DataListFieldType, DataTableFieldType,
//     FieldSetListFieldType, ImageFieldType, AudioFieldType,
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

export interface FieldSet {
  id: string;
  name: string;
  fields: FieldType[];
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
  tiles?: string[][]; // tiles[y][x] = chipId
  objects?: MapObject[];
}

export interface MapObject {
  id: string;
  name: string;
  prefabId?: string; // プレハブからの場合
  components: Component[]; // 継承クラスのインスタンス配列
  overrides?: Record<string, unknown>; // プレハブからのオーバーライド
}

export interface Chipset {
  id: string;
  name: string;
  imageId: string; // チップセット画像
  tileWidth: number; // タイルサイズ（通常32）
  tileHeight: number;
  chips: ChipProperty[]; // 各チップのプロパティ
}

export interface ChipProperty {
  index: number; // チップセット内のインデックス
  passable: boolean; // 通行可能か
  footstepType?: string; // 足音タイプ
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
const actionRegistry = new Map<string, typeof EventAction>();

export function registerAction(type: string, cls: typeof EventAction) {
  actionRegistry.set(type, cls);
}
```

#### 組み込みアクション

```typescript
// types/actions/MessageAction.ts
export class MessageAction extends EventAction {
  readonly type = 'message';
  text: string = '';
  faceImageId?: string;
  faceName?: string;
  position: 'top' | 'center' | 'bottom' = 'bottom';

  async execute(context: EventContext) {
    await context.showMessage(this.text, {
      face: this.faceImageId,
      position: this.position,
    });
  }
  // ...
}

// types/actions/ChoiceAction.ts
export class ChoiceAction extends EventAction {
  readonly type = 'choice';
  choices: string[] = [];
  cancelIndex?: number; // キャンセル時の選択肢（-1で無効）

  async execute(context: EventContext): Promise<void> {
    const index = await context.showChoice(this.choices);
    context.setChoiceResult(index);
  }
  // ...
}

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
  // ...
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
  // ...
}

// types/actions/PlaySEAction.ts
export class PlaySEAction extends EventAction {
  readonly type = 'playSE';
  audioId: string;
  volume: number = 100;
  pitch: number = 100;

  async execute(context: EventContext) {
    context.sound.playSE(this.audioId, {
      volume: this.volume / 100,
      pitch: this.pitch / 100,
    });
  }
  // ...
}

// types/actions/WaitAction.ts
export class WaitAction extends EventAction {
  readonly type = 'wait';
  frames: number = 60;

  async execute(context: EventContext) {
    await context.wait(this.frames);
  }
  // ...
}

// types/actions/CallTemplateAction.ts
export class CallTemplateAction extends EventAction {
  readonly type = 'callTemplate';
  templateId: string;
  args: Record<string, unknown> = {};

  async execute(context: EventContext) {
    await context.callTemplate(this.templateId, this.args);
  }
  // ...
}

// 他: LoopAction, PlayBGMAction, StopBGMAction, FadeScreenAction,
//     CallScriptAction, ChangeMapAction, etc.
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
const uiComponentRegistry = new Map<string, typeof UIComponent>();

export function registerUIComponent(type: string, cls: typeof UIComponent) {
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
  onSelectActions: EventAction[]; // 選択時のアクション
  // ...
}
```

#### その他のコンポーネント

```typescript
// types/ui/components/ActionComponent.ts
export class ActionComponent extends UIComponent {
  readonly type = 'action';
  onClickActions: EventAction[];
  onHoverActions: EventAction[];
  onHoverExitActions: EventAction[];
  // ...
}

// types/ui/components/AnimationComponent.ts
export class AnimationComponent extends UIComponent {
  readonly type = 'animation';
  timelineId: string;
  autoPlay: boolean = false;
  loop: boolean = false;
  // ...
}

// types/ui/components/TemplateControllerComponent.ts
// テンプレートとして保存時に自動追加
export class TemplateControllerComponent extends UIComponent {
  readonly type = 'templateController';
  args: TemplateArg[]; // 公開引数
  onSpawnActions: EventAction[]; // 生成時アクション
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
  fieldSets: FieldSet[];
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
  fieldSets: FieldSet[];
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
