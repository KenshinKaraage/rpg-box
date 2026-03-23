# スクリプト ↔ UI画面 連携設計

## 概要

スクリプトから画面設計で作ったUIを操作できるようにする。
画面設計はスクリプトのUI操作コードのビジュアル版であり、UIFunctionはブロックアクション列の実行に等しい。

### ゴール

```javascript
// ユーザーが書くイベントスクリプト "message"
async function main(text, face) {
  await UI["message"].show({ text, face });
  await Input.waitKey("confirm");

  if (currentEvent.nextAction?.scriptId !== "message") {
    await UI["message"].hide();
  }
}
```

このスクリプトが動くために必要な4つの実装を行う。

---

## 1. UI API — UIFunction をスクリプトから呼べるようにする

### 現状

- `UICanvasManager` が実装済み。`show()/hide()/setProperty()/getObject()` が動く
- `createProxies()` で UICanvasProxy を生成しているが、UIFunction 呼び出し機能がない
- スクリプトに `UI` が注入されていない（ScriptRunner の INJECTED_PARAM_NAMES に含まれない）

### 実装内容

#### 1-A. UICanvasManager に UIFunction 実行機能を追加

`UICanvasManager.ts` に以下を追加:

```typescript
/**
 * UIFunction のアクション列を実行する。
 * エディタの actionPreview.ts と同じロジックをランタイム用に実装。
 */
async executeFunction(
  canvasId: string,
  functionName: string,
  args: Record<string, unknown>
): Promise<void>
```

処理の流れ:
1. `canvasState.data.functions` から `functionName` に一致する UIFunction を探す
2. 見つからない場合は `console.warn` で警告して return（TypeError を投げない）
3. UIFunction の `actions: SerializedAction[]` をデシリアライズ
4. アクション内の引数プレースホルダーを解決（後述）
5. 各アクションを順番に実行:
   - `uiSetProperty` → canvas 内のオブジェクトの component data を直接変更（オブジェクトは **ID で検索**）
   - `uiSetVisibility` → オブジェクトの visible 状態を変更（後述）
   - `uiPlayAnimation` → アニメーション再生（後述）
   - `uiCallFunction` → 再帰的に executeFunction() を呼ぶ（depth 上限 10）
   - `uiNavigate` → 対象キャンバスの visible 切替

**エラーハンドリング**:
- 存在しないファンクション名 → `console.warn` + 無視
- 存在しないオブジェクトID → `console.warn` + スキップ
- depth 上限超過 → `console.error` + 中断

**オブジェクト検索**: アクションデータの `targetId` はオブジェクト ID。UICanvasManager に `findObjectById(canvasId, objectId)` ヘルパーを追加（既存の `findObject` は名前検索のため）。

#### UICanvasData の拡張

現在の `UICanvasData` に `functions` を追加:

```typescript
export interface UICanvasData {
  id: string;
  name: string;
  objects: EditorUIObject[];
  functions: EditorUIFunction[];  // ← 追加
}
```

`buildProjectData.ts` で `uiCanvases` を渡す際に `functions` も含める。

#### uiSetProperty のランタイム実行

`findObjectById()` で対象オブジェクトを取得し、component.data を直接変更。次の render() で反映。

#### uiSetVisibility のランタイム実行

`RectTransform` に `visible: boolean`（必須フィールド、デフォルト `true`）を追加する。

```typescript
setObjectVisibility(canvasId: string, objectId: string, visible: boolean): void {
  const obj = this.findObjectById(canvasId, objectId);
  if (!obj) return;
  obj.transform.visible = visible;
}
```

- `createDefaultRectTransform()` に `visible: true` を追加（新規オブジェクトは最初から持つ）
- UIRenderer で `transform.visible === false` のオブジェクトと**その子孫**を描画スキップ
- 古い保存データの読み込み時のみ `visible ?? true` でフォールバック
- エディタ側の actionPreview も scale=0 方式からこの visible フラグ方式に変更

#### uiPlayAnimation のランタイム実行

`UICanvasManager` に `playAnimation(canvasId, objectId, animationName, options?)` を追加:

```typescript
async playAnimation(
  canvasId: string,
  objectId: string,
  animationName: string,
  options?: { wait?: boolean }
): Promise<void>
```

処理:
1. オブジェクトの AnimationComponent から NamedAnimation を取得
2. NamedAnimation の `timeline` から `loopType` と `loopCount` を読む（コンポーネント側の設定が権威）
3. TweenTrack[] をフレームごとに補間し、オブジェクトの transform/component を更新
4. GameRuntime の update ループ内で `UICanvasManager.updateAnimations(deltaTime)` を毎フレーム呼ぶ
5. `wait: true` の場合:
   - ループなし（`loopType === 'none'`）→ アニメーション完了で resolve
   - ループあり → 即 resolve（無限待ちを防ぐ。ループアニメーションは待たない）

**注意**: `playAnimation` の `options` に `loop` は含めない。ループ設定は AnimationComponent の NamedAnimation 側で定義済みであり、ランタイムでの上書きは行わない。

#### UIFunction の引数解決

UIFunction は `args: TemplateArg[]` を持つ。スクリプトから渡された args オブジェクトの値を、アクション内の `{argName}` プレースホルダーに置換する。

```typescript
// 例: show({ text: "こんにちは", face: "alice" })
// UIFunction "show" の actions 内で:
//   SetPropertyAction: { targetId: "textLabel", property: "content", value: "{text}" }
// → value を "こんにちは" に解決
```

解決ロジック:
- **完全一致**: 文字列値が `{argName}` と完全一致 → args[argName] の値（型を保持。数値なら数値のまま）
- **部分埋め込み**: 文字列内に `{argName}` を含む（例: `"HP: {hp}/{maxHp}"`）→ 文字列として置換
- ネストされたオブジェクト内も再帰的に探索

#### 1-B. ScriptRunner / GameContext に UI を注入

**GameContext.ts**:
```typescript
// 新しいプロパティ
ui: Record<string, UICanvasRuntimeProxy>;

// コンストラクタで UICanvasManager.createProxies() の結果を受け取る
```

**ScriptRunner.ts**:
```typescript
// INJECTED_PARAM_NAMES に 'UI' を追加
const INJECTED_PARAM_NAMES = [
  'scriptAPI', 'Data', 'Variable', 'Sound', 'Camera', 'Save', 'Script', 'UI',
] as const;

// compileAndRun() で context.ui を渡す
```

#### 1-C. UICanvasRuntimeProxy — UIFunction を呼べるようにする

**方針**: TypeScript のインターフェース上、ビルトインメソッド（show/hide 等）と動的メソッド（UIFunction）の型が衝突する問題がある。そのため明示的な `call()` メソッドを追加し、動的メソッドは実装レベルでのみ提供する。

```typescript
export interface UICanvasRuntimeProxy {
  // ビルトイン（型安全）
  show(): void;
  hide(): void;
  isVisible(): boolean;
  getObject(name: string): UIObjectRuntimeProxy | null;
  setProperty(objectName: string, componentType: string, key: string, value: unknown): void;

  // UIFunction 呼び出し（明示的）
  call(functionName: string, args?: Record<string, unknown>): Promise<void>;
}
```

加えて、`createProxies()` の実装レベルで各 UIFunction 名をメソッドとして動的に追加する:

```typescript
for (const fn of canvas.functions) {
  // ビルトインメソッドと衝突する名前はスキップ（UIFunction 側が負ける）
  if (['show', 'hide', 'isVisible', 'getObject', 'setProperty', 'call'].includes(fn.name)) {
    continue;  // ビルトインが優先
  }
  (proxy as Record<string, unknown>)[fn.name] = async (args: Record<string, unknown> = {}) => {
    await this.executeFunction(canvas.id, fn.name, args);
  };
}
```

**使い方**:
```javascript
// UIFunction 名がビルトインと衝突しない場合（推奨）
await UI["message"].showText({ text: "こんにちは" });

// ビルトイン show() → キャンバスの表示/非表示を切り替え
UI["message"].show();

// UIFunction "show" を呼びたい場合（ビルトインと衝突）→ call() を使う
await UI["message"].call("show", { text: "こんにちは" });
```

**注意**: ユーザーが UIFunction に "show" や "hide" という名前をつけた場合、直接呼び出しはビルトインが優先される。`call()` を使えば常に UIFunction を呼べる。将来的にビルトインの show/hide を廃止して UIFunction に統一することも検討可能。

**存在しないキャンバス名**: `UI["nonexistent"]` は `undefined` を返す。スクリプト側でアクセスすると TypeError になるが、これは意図的（存在しない画面を参照するのはスクリプトのバグ）。

#### 1-D. UIObjectRuntimeProxy の拡張

```typescript
export interface UIObjectRuntimeProxy {
  readonly id: string;
  readonly name: string;

  // 既存
  setProperty(componentType: string, key: string, value: unknown): void;

  // 新規: transform 直接アクセス
  x: number;
  y: number;
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  visible: boolean;

  // 新規: 子オブジェクトアクセス
  getChild(name: string): UIObjectRuntimeProxy | null;
  getChildren(): UIObjectRuntimeProxy[];
}
```

**実装**: JavaScript の `Proxy`（言語機能）で get/set をインターセプトし、transform プロパティへの直接読み書きを実現。

**子オブジェクト検索**: `getChild(name)` は同じキャンバスの objects 配列から `parentId === this.id && name === name` でフィルタ。`getChildren()` は `parentId === this.id` の全オブジェクトを返す。

---

## 2. Input.waitKey API — キー入力待ち

### 現状

- `InputManager`（`src/engine/runtime/InputManager.ts`）が実装済み
- `pressed(button)` メソッドが存在するが `requestAnimationFrame` ベースでゲームループと非同期
- `isJustPressed(button)` でフレーム単位の押下判定は可能

### 実装内容

#### InputManager.pressed() をゲームループ同期に改修

既存の `pressed()` メソッドは `requestAnimationFrame` でポーリングしているが、これだとゲームループの `update()` と噛み合わない（`isJustPressed` の状態が rAF のタイミングでは既にクリアされている可能性がある）。

GameRuntime のフレーム待ち（`waitFrames`）と同じ仕組みを使うように改修:

```typescript
// InputManager.ts

// 待機中のキーリスナー
private waiters: Array<{ button: GameButton; resolve: () => void }> = [];

/**
 * 指定ボタンが押されるまで待つ。ゲームループ同期版。
 */
pressed(button: GameButton): Promise<void> {
  return new Promise<void>((resolve) => {
    this.waiters.push({ button, resolve });
  });
}

/**
 * GameRuntime.update() から毎フレーム呼ばれる。
 * isJustPressed なボタンに対応する waiter を resolve する。
 */
processWaiters(): void {
  this.waiters = this.waiters.filter((w) => {
    if (this.isJustPressed(w.button)) {
      w.resolve();
      return false;  // 除去
    }
    return true;  // 残す
  });
}
```

#### GameRuntime.update() に processWaiters 呼び出しを追加

```typescript
// GameRuntime.ts の update() 内、input.update() の直後
this.input.update();
this.input.processWaiters();  // ← 追加
```

#### ScriptRunner への注入

```typescript
// INJECTED_PARAM_NAMES に 'Input' を追加
const INJECTED_PARAM_NAMES = [
  'scriptAPI', 'Data', 'Variable', 'Sound', 'Camera', 'Save', 'Script', 'UI', 'Input',
] as const;
```

**GameContext.ts** に `input` プロパティを追加:
```typescript
// InputManager のラッパー（スクリプト向けに安全な API だけ公開）
input: {
  waitKey(button: GameButton): Promise<void>;
  isDown(button: GameButton): boolean;
  isJustPressed(button: GameButton): boolean;
}
```

`waitKey` は内部的に `inputManager.pressed(button)` を呼ぶ。

**スクリプト内での使い方**:
```javascript
await Input.waitKey("confirm");  // Enter/Space/Z が押されるまで待つ
await Input.waitKey("cancel");   // Escape/X が押されるまで待つ

if (Input.isDown("left")) { ... }  // 押されているか確認
```

---

## 3. currentEvent.nextAction — 次のアクション情報

### 現状

- EventRunner は `for...of` でアクション列を順次実行
- 現在のインデックスや次のアクション情報を公開していない

### 実装内容

#### EventRunner の変更

```typescript
// EventRunner.ts
async run(
  actions: EventAction[],
  context: GameContext,
  parentNextAction: EventAction | null = null  // ← 追加（デフォルト null）
): Promise<void> {
  for (let i = 0; i < actions.length; i++) {
    this.iterationCount++;
    if (this.iterationCount > MAX_ITERATIONS) {
      throw new Error('...');
    }
    if (this.iterationCount % 1000 === 0) {
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    }

    // 次のアクション: 同じブロック内に次があればそれ、なければ親の次
    const localNext = i + 1 < actions.length ? actions[i + 1] : parentNextAction;

    // context に次アクション情報をセット
    context.setNextAction(localNext ? {
      type: localNext.type,
      scriptId: localNext.type === 'script'
        ? (localNext as ScriptAction).scriptId
        : undefined,
    } : null);

    // 実行。子ブロック（Conditional/Loop）には localNext を伝播
    await actions[i].execute(context, (children) =>
      this.run(children, context, localNext)
    );
  }
}
```

**既存の呼び出し元への影響**: `parentNextAction` はデフォルト `null` なので、`GameRuntime.executeTriggeredEvent()` や `executeLocalActions()` の既存の `eventRunner.run(actions, context)` 呼び出しは変更不要。

**子ブロックへの伝播の意味**: Conditional/Loop の `execute()` は `run` コールバックに子アクション配列を渡す。この時 `localNext`（＝現在のアクションの次）が `parentNextAction` として伝播される。これにより子ブロック末尾のアクションでも「親ブロックの次のアクション」が `currentEvent.nextAction` に入る。

#### GameContext への currentEvent 追加

```typescript
// GameContext.ts
interface NextActionInfo {
  type: string;       // アクションの種類（'script', 'variableOp', 'conditional' 等）
  scriptId?: string;  // type === 'script' の場合のみ。呼び出すスクリプトのID
}

interface CurrentEventInfo {
  nextAction: NextActionInfo | null;
}

// GameContext に追加
private _currentEvent: CurrentEventInfo = { nextAction: null };

get currentEvent(): CurrentEventInfo {
  return this._currentEvent;
}

setNextAction(next: NextActionInfo | null): void {
  this._currentEvent = { nextAction: next };
}
```

#### ScriptRunner への注入

```typescript
// INJECTED_PARAM_NAMES の最終形
const INJECTED_PARAM_NAMES = [
  'scriptAPI', 'Data', 'Variable', 'Sound', 'Camera', 'Save', 'Script',
  'UI', 'Input', 'currentEvent',
] as const;
```

`currentEvent` は GameContext の getter を直接渡す（参照なのでスクリプト実行時点の最新値が読める）。

**スクリプト内で**:
```javascript
currentEvent.nextAction           // { type: "script", scriptId: "message" } or null
currentEvent.nextAction?.scriptId // "message" or undefined
currentEvent.nextAction?.type     // "script", "variableOp", etc.
```

#### ネスト時の動作例

```
EventRunner.run([
  ScriptAction("message"),        // i=0, next = ScriptAction("message")
  ScriptAction("message"),        // i=1, next = ConditionalAction
  ConditionalAction {             // i=2, parentNext = VariableOpAction
    thenActions: [
      ScriptAction("message"),    // i=0, next = ScriptAction("heal")
      ScriptAction("heal"),       // i=1, next = VariableOpAction (parentNext 伝播)
    ]
  },
  VariableOpAction,               // i=3, next = null
], context, null)
```

- Conditional/Loop 内の最後のアクションでも、親ブロックの次が見える
- 最終アクションでは `currentEvent.nextAction === null`

---

## 4. GameRuntime ↔ UICanvas 接続の補完

### 現状

- UICanvasManager のデータ変更は次の render() で即反映（接続済み）
- アニメーション再生のランタイムサポートがない

### 実装内容

#### UICanvasManager にアニメーション管理を追加

```typescript
// UICanvasManager.ts

// 実行中アニメーションのリスト
private runningAnimations: RuntimeAnimation[] = [];

interface RuntimeAnimation {
  canvasId: string;
  objectId: string;
  tracks: TweenTrack[];
  elapsed: number;
  duration: number;
  loopType: 'none' | 'loop' | 'pingpong';
  resolve: (() => void) | null;  // wait: true の場合の Promise resolver
}

/**
 * 毎フレーム呼ばれる。実行中アニメーションを進める。
 */
updateAnimations(deltaMs: number): void {
  this.runningAnimations = this.runningAnimations.filter((anim) => {
    anim.elapsed += deltaMs;
    // 各 track の補間値を計算し、オブジェクトの data を更新
    this.applyTweenTracks(anim);

    if (anim.elapsed >= anim.duration) {
      if (anim.loopType === 'none') {
        anim.resolve?.();
        return false;  // 完了、リストから除去
      }
      // loop or pingpong → 継続
      anim.elapsed = anim.elapsed % anim.duration;
      return true;
    }
    return true;
  });
}
```

#### GameRuntime.update() にアニメーション更新を追加

```typescript
// GameRuntime.ts の update() 内
this.uiCanvasManager.updateAnimations(deltaMs);
```

#### RectTransform に visible フラグ追加

```typescript
// UIComponent.ts の RectTransform
export interface RectTransform {
  // 既存フィールド...

  // 追加
  visible: boolean;  // true → 表示。false → 非表示
}

// createDefaultRectTransform() に追加
export function createDefaultRectTransform(): RectTransform {
  return {
    // ...既存フィールド
    visible: true,  // ← 追加
  };
}
```

- 新規オブジェクトは `createDefaultRectTransform()` により最初から `visible: true` を持つ
- 古い保存データの読み込み時のみ `visible ?? true` でフォールバック（デシリアライズ箇所で対応）
- UIRenderer で `visible === false` のオブジェクトとその子孫を描画スキップ
- エディタ側の actionPreview も scale=0 方式から visible フラグ方式に変更

---

## buildProjectData の変更

`UICanvasData` 型に `functions` を追加する（1-A 参照）。
`buildProjectData.ts` は `state.uiCanvases` をそのまま渡しており、`EditorUICanvas` は既に `functions` を持つため、型定義の変更のみで実装の変更は不要。

---

## INJECTED_PARAM_NAMES 最終形

```typescript
const INJECTED_PARAM_NAMES = [
  'scriptAPI',      // GameScriptAPI（getVar/setVar）
  'Data',           // DataAPI（データアクセス）
  'Variable',       // VariableAPI（変数読み書き）
  'Sound',          // SoundAPI（音声再生）
  'Camera',         // CameraAPI（カメラ操作）
  'Save',           // SaveAPI（セーブ/ロード）
  'Script',         // Script namespace（他スクリプト呼び出し）
  'UI',             // UICanvasRuntimeProxy の Record（UI操作）
  'Input',          // InputAPI（キー入力）
  'currentEvent',   // CurrentEventInfo（次アクション情報）
] as const;
```

---

## 影響範囲

| ファイル | 変更内容 |
|----------|----------|
| `src/engine/runtime/UICanvasManager.ts` | executeFunction, findObjectById, playAnimation, updateAnimations, setObjectVisibility, proxy 拡張（call + 動的メソッド） |
| `src/engine/runtime/GameContext.ts` | ui, input, currentEvent 追加 |
| `src/engine/core/ScriptRunner.ts` | INJECTED_PARAM_NAMES に UI, Input, currentEvent 追加 |
| `src/engine/event/EventRunner.ts` | for...of → for+index、parentNextAction 伝播 |
| `src/engine/runtime/InputManager.ts` | pressed() をゲームループ同期に改修、processWaiters() 追加 |
| `src/engine/runtime/GameRuntime.ts` | processWaiters 呼び出し、updateAnimations 呼び出し、UI proxy を GameContext に渡す |
| `src/types/ui/UIComponent.ts` | RectTransform に visible 追加 |
| `src/features/ui-editor/renderer/UIRenderer.ts` | visible フラグによる描画スキップ |
| `src/features/ui-editor/utils/actionPreview.ts` | scale=0 → visible フラグ方式に変更 |

---

## スコープ外（今回やらないこと）

- メッセージ画面の UICanvas デザインパターン
- NavigationProxy.select() の実装（メニュー選択系）
- RepeaterProxy.setData() の実装
- UITemplate の spawn/despawn
- ScriptAPI.showMessage 等のビルトインメッセージAPI（不要 — ユーザーがスクリプトで書く）
