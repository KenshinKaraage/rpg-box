# ゲームエンジン スクリプト実行アーキテクチャ設計

## 概要

ゲームエンジンのスクリプト実行基盤を設計する。単体テスト・テストプレイ・エクスポートの全てで**同一のエンジンコード**を使用し、処理の分岐を最小限に抑える。

## 設計原則

1. **ゲームエンジンは1つのコードベース** — テスト/テストプレイ/エクスポートで同一コードが動く
2. **常に iframe 内で実行** — エディタ（React/Next.js）とは分離
3. **起動モードで初期化範囲を切り替え** — full（テストプレイ）/ script（単体テスト）
4. **上級者が拡張しても1箇所の変更で全環境に反映**

## アーキテクチャ

### ディレクトリ構成

```
src/engine/                       ← ゲームエンジン（React非依存）
├── core/
│   ├── GameEngine.ts             ← メインクラス（初期化・ゲームループ）
│   └── ScriptRunner.ts           ← スクリプト実行（Function + API注入）
├── api/
│   ├── ScriptAPI.ts              ← showMessage, showChoice, getVar, setVar
│   ├── DataAPI.ts                ← Data["character"][0].name
│   ├── VariableAPI.ts            ← Variable.get/set
│   ├── SoundAPI.ts               ← Sound.playBGM等
│   ├── CameraAPI.ts              ← Camera.zoom等
│   └── SaveAPI.ts                ← Save/Load
├── runtime/
│   └── GameContext.ts            ← 全APIをまとめたコンテキスト
└── ui/
    └── MessageRenderer.ts        ← メッセージボックス・選択肢のCanvas描画
```

### 実行環境

```
エディタ (React/Next.js)
│
├── ScriptTestPanel → iframe に postMessage でスクリプト+テスト設定を送信
├── TestPlayPage    → iframe に postMessage でプロジェクト全データを送信
│
└── iframe (game.html)
    └── GameEngine（テスト/テストプレイ/エクスポートで同一コード）
        ├── postMessage でデータ受信 / バンドルJSONから読込
        ├── start({ mode, config })
        ├── Canvas描画（WebGL）
        └── 結果/ログを postMessage でエディタに返す
```

### 起動モード

```typescript
interface EngineStartConfig {
  mode: 'full' | 'script';
  projectData: ProjectData; // エディタから渡されるプロジェクトデータ
}

interface FullModeConfig extends EngineStartConfig {
  mode: 'full';
  startSettings: {
    // テストプレイ開始設定パターン
    mapId: string;
    position: { x: number; y: number };
    variables?: Record<string, unknown>;
    // ...初期状態
  };
  debugOptions?: {
    showObjectVars: boolean;
    showCollision: boolean;
    showFPS: boolean;
  };
}

interface ScriptModeConfig extends EngineStartConfig {
  mode: 'script';
  scriptId: string;
  args: Record<string, unknown>; // スクリプト引数
  testSettings?: {
    // 単体テスト設定（オプション）
    mapId?: string; // マップ指定（未指定なら黒背景）
    objects?: ObjectPlacement[]; // オブジェクト配置（プレイヤー等）
    variables?: Record<string, unknown>;
  };
}
```

| 項目              | script モード（単体テスト） | full モード（テストプレイ） |
| ----------------- | --------------------------- | --------------------------- |
| Canvas            | あり                        | あり                        |
| マップ            | オプション（設定で指定）    | あり（開始設定に従う）      |
| オブジェクト      | オプション（設定で配置）    | あり（マップ定義に従う）    |
| UI (メッセージ等) | あり（簡易UI表示）          | あり                        |
| ゲームループ      | なし（スクリプト実行のみ）  | あり（60fps）               |
| 全API             | あり                        | あり                        |

### テスト設定パターン（保存/復元可能）

単体テストとテストプレイの両方で、設定をパターンとして保存・復元できる。

```typescript
interface TestPattern {
  id: string;
  name: string;
  type: 'script' | 'full';
  config: ScriptModeConfig | FullModeConfig;
}
```

## スクリプト実行フロー

### 共通フロー

```
GameEngine.start(config)
  ↓
ProjectData からデータ構築（Data, Variable, Sound等のAPIインスタンス生成）
  ↓
mode に応じた初期化
  ├── full: マップロード、オブジェクトスポーン、ゲームループ開始
  └── script: テスト設定に応じてマップ/オブジェクト配置（オプション）
  ↓
ScriptRunner.execute(script, gameContext)
  ↓
new Function('scriptAPI', 'Data', 'Variable', 'Sound', 'Camera', ...script.content)
  ↓
スクリプト内で await scriptAPI.showMessage("hello")
  ↓
MessageRenderer が Canvas 上にメッセージボックスを描画
  ↓
ユーザー操作を待って Promise を resolve
```

### ScriptRunner

```typescript
class ScriptRunner {
  async execute(script: Script, context: GameContext): Promise<unknown> {
    // 内部スクリプトを関数として注入
    const internalScripts = this.resolveInternalScripts(script.id);

    const fn = new Function(
      'scriptAPI',
      'Data',
      'Variable',
      'Sound',
      'Camera',
      'Save',
      ...internalScripts.map((s) => s.name),
      script.content
    );

    return await fn(
      context.scriptAPI,
      context.data,
      context.variable,
      context.sound,
      context.camera,
      context.save,
      ...internalScripts.map((s) => s.fn)
    );
  }
}
```

### 内部スクリプトの呼び出し

内部スクリプトは親スクリプトから**関数名で直接呼び出し可能**（import不要）。

```javascript
// 親スクリプト: battle_start
const damage = await _calculateDamage(attacker, defender);
await scriptAPI.showMessage(`${damage} のダメージ！`);

// 内部スクリプト: _calculateDamage（自動的に注入される）
// function _calculateDamage(attacker, defender) { return ... }
```

## デフォルトテンプレート

### イベントスクリプト

```javascript
// scriptAPI, Data, Variable, Sound, Camera が利用可能です
//
// 例:
//   await scriptAPI.showMessage("こんにちは！");
//   const choice = await scriptAPI.showChoice(["はい", "いいえ"]);
//   Variable.set("flag_1", true);
```

### コンポーネントスクリプト

```javascript
// show() - 表示時に呼ばれる
// hide() - 非表示時に呼ばれる
// set(data) - データ設定時に呼ばれる
//
// 例:
//   show() { this.element.visible = true; }
//   hide() { this.element.visible = false; }
//   set(data) { this.nameLabel.text = data.name; }
```

## エディタ ↔ iframe 通信プロトコル

```typescript
// エディタ → iframe
type EditorMessage =
  | { type: 'start'; config: FullModeConfig | ScriptModeConfig }
  | { type: 'stop' }
  | { type: 'pause' }
  | { type: 'resume' };

// iframe → エディタ
type EngineMessage =
  | { type: 'ready' }
  | { type: 'log'; level: 'info' | 'warn' | 'error'; message: string }
  | { type: 'script-result'; value: unknown }
  | { type: 'script-error'; error: string; stack?: string }
  | { type: 'state-update'; variables: Record<string, unknown> };
```

## エクスポート

エクスポート時は iframe 内の game.html + GameEngine コードをそのまま ZIP 化。
データは JSON ファイルとしてバンドル。テストプレイとエクスポートで**完全に同一のエンジンコード**が動く。

```
export/
├── index.html            ← game.html と同一構造
├── engine.js             ← GameEngine バンドル
├── data/
│   ├── project.json      ← プロジェクトデータ
│   └── assets/           ← 画像・音声ファイル
└── scripts/
    └── *.js              ← ユーザースクリプト
```
