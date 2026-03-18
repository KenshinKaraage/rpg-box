# Test Play v1 — マップ歩行 + イベント実行

## 目標

エディタで作ったマップ上をプレイヤーが歩き回れる状態にする。トリガーイベントとスクリプト実行も動く。

## 既存インフラ

以下は実装済み。今回のスコープは「繋げて動かす + 不整合の修正」。

| レイヤー | ファイル | 状態 |
|---------|---------|------|
| UI: ▶ボタン | `Header.tsx` → `useTestPlay` | 接続済み |
| UI: オーバーレイ | `TestPlayOverlay.tsx` | 実装済み（F12で終了） |
| データ変換 | `buildProjectData.ts` | Zustand → ProjectData スナップショット済み |
| ランタイム | `GameRuntime.ts` | ゲームループ、マップロード、イベント実行 |
| ワールド | `GameWorld.ts` | オブジェクト管理、移動、衝突判定 |
| 入力 | `InputManager.ts` | キーボード → ゲームボタン |
| トリガー | `TriggerSystem.ts` | Talk/Touch/Step/Auto/Input 検出 |
| カメラ | `Camera.ts` | Controller追従 |
| タイル描画 | `MapRenderer.ts` → `TileRenderer.ts` | WebGL タイルレンダリング |
| スプライト描画 | `SpriteRenderer.ts` | Y-sort スプライトレンダリング |
| イベント実行 | `EventRunner.ts` | アクション逐次実行 |
| スクリプト実行 | `ScriptRunner.ts` | ユーザーJS実行 + API注入 |

## 変更点

### 1. `startPosition` 廃止

**理由:** プレイヤーはマップ上に ControllerComponent を持つ MapObject として配置される。Transform の x, y がそのまま開始位置。別途 startPosition を持つ必要がない。

**変更箇所:**

- `src/types/gameSettings.ts` — `startPosition` プロパティと `Position` 型削除
- `src/stores/gameSettingsSlice.ts` — デフォルト値から `startPosition` 削除
- `src/stores/gameSettingsSlice.test.ts` — `startPosition` テスト削除
- `src/engine/runtime/GameRuntime.ts` の `start()` — `startPosition` による位置上書きロジック（L113-118）削除
- `src/lib/storage/types.ts` — `GameSettings` の `startPosition` 削除
- `src/features/game-settings/components/GameInfoForm.tsx` — `startPosition` UI削除
- `src/types/gameSettings.test.ts` — `startPosition` テスト削除
- `src/hooks/useStorage.test.ts` — `startPosition` 参照削除
- `src/lib/storage/localStorage.test.ts` — `startPosition` 参照削除
- `src/lib/storage/indexedDB.test.ts` — `startPosition` 参照削除
- `src/lib/storage/types.test.ts` — `startPosition` 参照削除

### 2. Touch/Step トリガーの修正

**問題:** `GameRuntime.update()` (L211-217) で `TriggerSystem.notifyMoveCompleted()` が呼ばれていない。コメントのみで実装が空。Touch/Step トリガーが発火しない。

**修正:** `GameWorld.update()` が移動完了を検知した際に、完了したオブジェクトのリストを返す（または GameWorld にコールバックを追加）。`GameRuntime.update()` でそのリストを `TriggerSystem.notifyMoveCompleted()` に渡す。

### 3. GameContext のイベント間永続化

**問題:** `executeTriggeredEvent()` でイベント毎に新しい `GameContext` を生成している（L290）。イベントAで変数を変更してもイベントBでは初期値に戻る。

**修正:** `GameRuntime.start()` で一度だけ `GameContext` を生成し、`this.context` として保持。`executeTriggeredEvent()` ではこの共有コンテキストを使い回す。`ScriptRunner` も同様に1回だけ生成。

### 4. Escape キーの競合回避

**問題:** `InputManager` が Escape を `cancel` ボタンにマッピングしている。TestPlayOverlay に Escape リスナーを追加すると、ゲーム内キャンセルとオーバーレイ終了が同時に発火する。

**対応:** テストプレイ終了キーは F12 のまま維持する（現状通り）。Escape はゲーム内操作（メニューを閉じる等）に使う。

### 5. プレイヤー不在時の警告

**問題:** 開始マップに ControllerComponent を持つオブジェクトがない場合、`activeController` が null のまま無言で続行する。ユーザーには黒画面が見えるだけ。

**修正:** `GameRuntime.start()` で `loadMap` 後に `activeController` が null の場合、コンソールに警告を出す。将来的にはオーバーレイ上にエラーメッセージを表示する。

### 6. キャンバスリサイズの問題

**問題:** `GameRuntime.render()` で `twgl.resizeCanvasToDisplaySize(canvas)` を呼んでおり、CSS表示サイズに合わせてキャンバスの内部解像度が上書きされる。`gameSettings.resolution` の設定が無視される。

**修正:** `render()` から `twgl.resizeCanvasToDisplaySize()` を削除。キャンバスサイズは `TestPlayOverlay` で設定した `resolution.width × resolution.height` を固定で使う。CSSでのスケーリングは `object-fit: contain` + 固定アスペクト比で対応。

## データフロー

```
▶ ボタン押下
  ↓
useTestPlay.startTestPlay()
  ├─ buildProjectData() — Zustand ストア → ProjectData スナップショット
  ├─ startMapId チェック（なければ警告して中止）
  └─ isPlaying = true
  ↓
TestPlayOverlay マウント
  ├─ canvas 作成 (resolution.width × resolution.height)
  ├─ new GameRuntime(canvas, projectData)
  └─ runtime.start()
      ├─ InputManager.attach(canvas)
      ├─ UICanvasManager.load(uiCanvases)
      ├─ GameContext 生成（永続、イベント間で共有）
      ├─ loadMap(startMapId)
      │   ├─ GameWorld.loadMap(map, chipsets, prefabs)
      │   │   ├─ 各 object layer の MapObject をイテレート
      │   │   ├─ resolveObject() — prefab コンポーネントをマージ
      │   │   ├─ createRuntimeObject() — Transform から gridX/Y 初期化
      │   │   └─ ControllerComponent 持ちを activeController に設定
      │   ├─ activeController == null → 警告ログ
      │   ├─ MapRenderer.loadTextures() — チップセット画像プリロード
      │   └─ SpriteRenderer.loadTexture() — スプライト画像プリロード
      └─ GameLoop.start()
          └─ 毎フレーム:
              ├─ InputManager.update()
              ├─ GameWorld.update() — 移動 + 衝突判定 → 移動完了リスト返却
              ├─ TriggerSystem.notifyMoveCompleted() — 移動完了通知
              ├─ TriggerSystem.update() — イベント検出
              ├─ Camera.follow(activeController)
              └─ render() — タイル → スプライト → UI
```

## プレイヤー認識ルール

- `GameWorld.loadMap()` がオブジェクト層の全オブジェクトを走査
- 最初に見つかった ControllerComponent 持ちのオブジェクトが `activeController`（プレイヤー）
- Transform の x, y がプレイヤーのグリッド初期位置
- カメラはこのオブジェクトを追従

## スコープ外

- デバッグUI（変数表示、当たり判定可視化、FPS）— 後続タスク
- 開始設定パターン / 変数設定パターン — 後続タスク
- showMessage / showChoice 等のUIダイアログ実装 — スタブのまま
- AudioSystem / SaveSystem — スタブのまま
- マップ遷移（MapAction.changeMap）— 後続で対応
