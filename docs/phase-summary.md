# RPG Box 開発フェーズ概要

各フェーズで実装する機能の概要を説明します。

---

## Phase 0: プロジェクトセットアップ

プロジェクトの基盤を構築します。

- **Next.js プロジェクト初期化**: App Router、TypeScript、Tailwind CSS
- **開発ツール設定**: ESLint、Prettier、Jest、Husky
- **UIライブラリ導入**: shadcn/ui コンポーネント
- **状態管理設定**: Zustand + immer ミドルウェア
- **ディレクトリ構造**: features/ ベースのモジュール構成
- **ハンバーガーメニュー**: ナビゲーション基盤
- **保存状態表示**: 未保存変更の警告

---

## Phase 1: 型定義・基盤

システム全体で使用する基盤を構築します。

- **基底クラス定義**: FieldType、Component、Action の抽象クラス
- **レジストリ**: FieldTypeRegistry、ComponentRegistry、ActionRegistry
- **ストレージ**: IndexedDB ラッパー、シリアライズ/デシリアライズ
- **共通フック**: useUndo、useAutoSave、useKeyboardShortcut
- **バリデーション・検索システム**: 入力検証、全文検索
- **クリップボード**: コピー/ペースト機能
- **共通コンポーネント**: TreeView、DragDropList など

---

## Phase 2: 基本フィールドタイプ

フィールドシステムの基本型を実装します。

- **P0 フィールドタイプ（必須）**:
  - StringFieldType: 文字列
  - NumberFieldType: 数値（min, max, step）
  - BooleanFieldType: 真偽値
  - EnumFieldType: 列挙（選択肢）
  - ColorFieldType: 色
  - VectorFieldType: 2D/3D ベクトル
- **P2 フィールドタイプ（高度）**:
  - RangeFieldType: 範囲（min〜max）
  - ExpressionFieldType: 式（計算式、変数参照）
- **フィールドエディタ**: 各フィールド型に対応する UI コンポーネント
- **条件付きフィールド表示**: 他のフィールド値による表示制御

---

## Phase 3: ゲーム設定（小）

ゲーム全体の基本設定を管理します。

- **US1: ゲーム情報ページ**:
  - タイトル、作者、バージョン、説明
  - 解像度設定（16:9、4:3 など）
  - 開始マップ、開始位置
  - デフォルト BGM/SE 音量
  - セーブスロット数

---

## Phase 4: 変数・クラス・フィールドセット（小〜中）

データ定義システムを実装します。

- **US2: 変数ページ**:
  - グローバル変数の定義
  - 変数タイプ（数値、文字列、真偽値など）
  - 初期値設定
  - カテゴリ分類
- **US3: クラスページ**:
  - ユーザー定義クラス（CustomClass）の作成
  - フィールド追加・編集
  - 継承サポート
- **US4: フィールドセットページ**:
  - 再利用可能なフィールドグループ
  - クラス間での共有

---

## Phase 5: P1 フィールドタイプ（データ参照系）

他のデータを参照するフィールド型を実装します。

- **データ参照フィールド**:
  - VariableRefFieldType: 変数参照
  - ClassRefFieldType: クラス参照
  - FieldSetRefFieldType: フィールドセット参照
  - RecordRefFieldType: データレコード参照
- **データ参照エディタ**:
  - 検索可能なドロップダウン
  - ツリービュー選択
  - インライン作成

---

## Phase 6: アセット管理（中）

画像、音声などのアセットを管理します。

- **アセットフィールドタイプ**:
  - ImageFieldType: 画像参照
  - AudioFieldType: 音声参照
  - FontFieldType: フォント参照
- **US5: 画像アセットページ**:
  - インポート（PNG、JPG、WebP）
  - プレビュー、サムネイル生成
  - メタデータ編集
- **アセットフォルダ管理**:
  - フォルダ構造
  - ドラッグ&ドロップ移動
- **US6: 音声アセットページ**:
  - インポート（MP3、OGG、WAV）
  - 再生プレビュー
  - BGM/SE 分類
- **US7: フォントアセットページ**:
  - カスタムフォント登録
  - プレビュー

---

## Phase 7: データ設定（中〜大）

ゲームデータのテーブル管理を実装します。

- **US8: データ設定ページ**:
  - データタイプ（テーブル）の作成
  - フィールド定義
  - レコード追加・編集・削除
  - インポート/エクスポート（CSV、JSON）
- **デフォルトデータタイプ**:
  - アイテム
  - スキル
  - 敵キャラクター
  - などのプリセット

---

## Phase 8: イベントシステム（中〜大）

ゲーム内イベントのアクションシステムを実装します。

- **基本アクション実装**:
  - ShowMessage: メッセージ表示
  - ShowChoice: 選択肢表示
  - SetVariable: 変数操作
  - Condition: 条件分岐
  - Loop: ループ処理
  - Wait: 待機
  - PlayBGM/SE: 音声再生
  - MoveObject: オブジェクト移動
  - Teleport: マップ移動
- **US9: イベントテンプレートページ**:
  - 再利用可能なイベントテンプレート
  - カテゴリ分類
- **アクションブロックエディタ**:
  - ビジュアルエディタ
  - ドラッグ&ドロップ
  - コピー/ペースト

---

## Phase 9: スクリプトエディタ（大）

TypeScript/JavaScript でロジックを記述するエディタです。

- **US10: スクリプトページ**:
  - Monaco Editor 統合
  - シンタックスハイライト
  - TypeScript 型チェック
  - ゲーム API 自動補完
  - エラー表示
  - スニペット
  - 複数ファイル管理

---

## Phase 10: マップ基盤（大）

マップシステムの基盤を構築します。

- **コンポーネント定義**:
  - TransformComponent: 位置、回転、スケール
  - SpriteComponent: 画像表示
  - AnimatorComponent: アニメーション制御
  - ColliderComponent: 衝突判定
  - MovementComponent: 移動制御
- **トリガーコンポーネント**:
  - OnInteract: 話しかけ時
  - OnTouch: 接触時
  - OnEnter/OnExit: エリア進入/退出
  - OnAutorun: 自動実行
  - OnParallel: 並列実行
- **マップ型定義**:
  - Map、Layer、Tile、Chipset
  - MapObject、Component 構成

---

## Phase 11: マップデータページ（中）

マップの一覧と基本設定を管理します。

- **US11: マップデータページ**:
  - マップ一覧表示
  - 新規マップ作成
  - マップ設定（名前、サイズ、BGM）
  - チップセット選択
  - マップのコピー/削除

---

## Phase 12: オブジェクトプレハブ（中）

再利用可能なオブジェクトテンプレートを管理します。

- **US12: プレハブページ**:
  - プレハブ作成・編集
  - コンポーネント追加・削除
  - プロパティ編集
  - カテゴリ分類
  - プレハブのインスタンス化

---

## Phase 13: マップ編集ページ（大）

マップを視覚的に編集するエディタです。

- **US13: マップ編集ページ**:
  - マップキャンバス（タイル配置）
  - タイルパレット
  - レイヤー管理
  - オブジェクト配置
  - ズーム/パン
- **マップ編集フック**:
  - useMapEditor: エディタ状態管理
  - useTilePaint: タイル描画
  - useObjectPlace: オブジェクト配置
- **マップユーティリティ**:
  - 塗りつぶし（フラッドフィル）
  - 可視タイル計算（カリング）
- **キーボードショートカット**:
  - B: ペン、E: 消しゴム、G: 塗りつぶし
  - 1-9: レイヤー切り替え
  - Ctrl+C/V: コピー/ペースト
- **イベント編集モーダル**:
  - オブジェクトダブルクリックでイベント編集

---

## Phase 14: UI Foundation（UIComponent 定義）

ゲーム内 UI システムの基盤を構築します。

- **UIComponent ベース**:
  - UIComponent 抽象クラス
  - UIObject インターフェース
  - UIComponentRegistry
- **Visual コンポーネント**:
  - ImageComponent: 画像表示
  - TextComponent: テキスト表示（変数埋め込み対応）
  - NineSliceComponent: 9スライス画像
- **Mask コンポーネント**:
  - FillMaskComponent: 塗りつぶしマスク（オブジェクト自体をマスク）
  - ScrollMaskComponent: スクロールマスク
  - ShapeMaskComponent: 形状マスク
- **Layout コンポーネント**:
  - LayoutGroupComponent: 水平/垂直配置
  - GridLayoutComponent: グリッド配置
- **Navigation コンポーネント**:
  - SelectableComponent: キーボード/ゲームパッドナビゲーション
- **Action コンポーネント**:
  - ButtonComponent: ボタン
  - InputFieldComponent: テキスト入力
- **Animation コンポーネント**:
  - TweenComponent: アニメーション
- **Template コンポーネント**:
  - TemplateControllerComponent: UI テンプレート展開

---

## Phase 15: Screen Design（スクリーン設計）

ゲーム内画面（メニュー、ダイアログなど）を設計するエディタです。

- **UI キャンバス**:
  - 解像度プレビュー
  - グリッドスナップ
  - ズーム/パン
- **UI オブジェクトツリー**:
  - 階層表示
  - ドラッグ&ドロップで親子変更
- **UI プロパティパネル**:
  - Transform 編集
  - コンポーネント一覧・編集
  - コンポーネント追加/削除
- **UI コンポーネントパレット**:
  - 追加可能なコンポーネント一覧
- **アンカープリセット**:
  - 9ポイント、ストレッチ
- **UI テンプレート**:
  - 保存・インスタンス化

---

## Phase 16: Object UI（オブジェクト管理 UI）

ゲームオブジェクトを管理する UI です。

- **オブジェクトパネル**:
  - オブジェクト一覧
  - 検索・フィルター
- **オブジェクトプロパティパネル**:
  - 基本プロパティ編集
  - コンポーネント一覧
- **コンポーネントエディタ**:
  - タイプ別 PropertyPanel
- **プレハブシステム**:
  - プレハブ作成
  - インスタンス化
  - プレハブブラウザ

---

## Phase 17: Timeline（タイムライン）

アニメーションを時間軸で編集するエディタです。

- **タイムラインエディタ**:
  - トラック表示
  - キーフレーム表示
  - スクロール/ズーム
- **キーフレーム編集**:
  - 追加・削除・移動
  - 値編集
- **イージングカーブエディタ**:
  - ベジェ曲線
  - プリセット（linear, ease-in, ease-out など）
- **タイムライン再生**:
  - 再生/停止、シーク、ループ
- **アニメーションプレビュー**:
  - リアルタイムプレビュー

---

## Phase 18: Game Engine（ゲームエンジン）

実際にゲームを動作させるエンジンの実装です。

- **エンジンコア**:
  - GameEngine: ゲームループ
  - SceneManager: シーン管理
  - MapRenderer: マップ描画
  - SpriteRenderer: スプライト描画
  - UIRenderer: UI 描画
- **ゲーム API**:
  - `game.map`: マップ操作（load, getTile, setTile）
  - `game.object`: オブジェクト操作（create, destroy, find）
  - `game.player`: プレイヤー操作（moveTo, teleport, face）
  - `game.ui`: UI 操作（show, hide, setText）
  - `game.audio`: 音声再生（playBGM, playSE, stop）
  - `game.variable`: 変数操作（get, set）
  - `game.tween`: アニメーション（to, from, chain）
  - `game.input`: 入力検知（isPressed, isJustPressed）
- **イベント実行**:
  - EventRunner: アクション実行
  - DialogueRunner: メッセージ・選択肢

---

## Phase 19: Test Play（テストプレイ）

エディタ内でゲームをテストプレイする機能です。

- **テストプレイページ**:
  - ゲームエンジン埋め込み
  - フルスクリーン対応
- **クイックプレイ**:
  - 現在のマップから開始
  - F5 キーで起動
- **デバッグオーバーレイ**:
  - FPS 表示
  - 変数ウォッチ
  - コンソール出力
  - F12 でトグル
- **セーブステート**:
  - クイックセーブ（F6）
  - クイックロード（F7）
- **変数インスペクタ**:
  - リアルタイム変数監視
  - 値の編集

---

## Phase 20: Polish（仕上げ）

製品としての完成度を高める最終フェーズです。

- **ゲームエクスポート**:
  - HTML5 形式出力
  - アセットバンドル
  - gzip 圧縮
- **最適化**:
  - アセット重複除去
  - コード最小化
  - ソースマップ生成
- **デフォルトアセット**:
  - チップセット（草、水、道、壁など）
  - キャラクタースプライト
  - UI 素材（ウィンドウ、ボタン）
- **プロジェクトテンプレート**:
  - スターターテンプレート
  - アクション RPG テンプレート
- **統合テスト**:
  - Playwright E2E テスト
  - パフォーマンスベンチマーク
- **ドキュメント**:
  - ユーザーガイド
  - API リファレンス
  - チュートリアル
  - FAQ

---

## フェーズ依存関係

```
Phase 0 (セットアップ)
    ↓
Phase 1 (型定義・基盤) ──────────────────────────┐
    ↓                                            │
Phase 2 (基本フィールドタイプ)                    │
    ↓                                            │
Phase 3 (ゲーム設定) ← Phase 2                   │
    │                                            │
Phase 4 (変数・クラス・フィールドセット) ← Phase 2│
    ↓                                            │
Phase 5 (データ参照フィールド) ← Phase 4         │
    ↓                                            │
Phase 6 (アセット管理) ← Phase 2                 │
    ↓                                            │
Phase 7 (データ設定) ← Phase 5, Phase 6          │
    ↓                                            │
Phase 8 (イベントシステム) ← Phase 5             │
    ↓                                            │
Phase 9 (スクリプトエディタ) ← Phase 1           │
    ↓                                            │
Phase 10 (マップ基盤) ← Phase 1 ─────────────────┤
    ↓                                            │
Phase 11 (マップデータ) ← Phase 10, Phase 6      │
    ↓                                            │
Phase 12 (プレハブ) ← Phase 10                   │
    ↓                                            │
Phase 13 (マップ編集) ← Phase 11, Phase 12       │
    ↓                                            │
Phase 14 (UI Foundation) ← Phase 10 ─────────────┘
    ↓
Phase 15 (Screen Design) ← Phase 14
    ↓
Phase 16 (Object UI) ← Phase 10, Phase 14
    ↓
Phase 17 (Timeline) ← Phase 10
    ↓
Phase 18 (Game Engine) ← Phase 8, Phase 10, Phase 14
    ↓
Phase 19 (Test Play) ← Phase 18
    ↓
Phase 20 (Polish) ← All Phases
```

---

## 推奨開発順序

1. **基盤構築** (Phase 0-1): 環境構築、型定義、レジストリ
2. **フィールドシステム** (Phase 2-5): フィールド型、データ参照
3. **ゲーム設定・データ** (Phase 3-4, 6-7): 設定、変数、アセット、データテーブル
4. **イベント・スクリプト** (Phase 8-9): イベントシステム、スクリプトエディタ
5. **マップシステム** (Phase 10-13): コンポーネント、マップ、プレハブ、マップエディタ
6. **UI システム** (Phase 14-16): UIComponent、スクリーン設計、オブジェクト UI
7. **アニメーション** (Phase 17): タイムラインエディタ
8. **ゲームエンジン** (Phase 18-19): エンジン、テストプレイ
9. **仕上げ** (Phase 20): エクスポート、テンプレート、ドキュメント

---

## フェーズ規模の目安

| Phase | 名称                           | 規模   |
| ----- | ------------------------------ | ------ |
| 0     | プロジェクトセットアップ       | 小     |
| 1     | 型定義・基盤                   | 中     |
| 2     | 基本フィールドタイプ           | 中     |
| 3     | ゲーム設定                     | 小     |
| 4     | 変数・クラス・フィールドセット | 小〜中 |
| 5     | P1 フィールドタイプ            | 小     |
| 6     | アセット管理                   | 中     |
| 7     | データ設定                     | 中〜大 |
| 8     | イベントシステム               | 中〜大 |
| 9     | スクリプトエディタ             | 大     |
| 10    | マップ基盤                     | 大     |
| 11    | マップデータページ             | 中     |
| 12    | オブジェクトプレハブ           | 中     |
| 13    | マップ編集ページ               | 大     |
| 14    | UI Foundation                  | 中     |
| 15    | Screen Design                  | 中     |
| 16    | Object UI                      | 小〜中 |
| 17    | Timeline                       | 中     |
| 18    | Game Engine                    | 大     |
| 19    | Test Play                      | 中     |
| 20    | Polish                         | 中     |
