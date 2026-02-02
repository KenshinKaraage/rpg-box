# RPG Box 実装タスク

## タスク管理ルール

### ステータス記号

| 記号  | 意味       |
| ----- | ---------- |
| `[ ]` | 未着手     |
| `[~]` | 進行中     |
| `[x]` | 完了       |
| `[!]` | ブロック中 |

### タスク記法

| 記号     | 意味                                   |
| -------- | -------------------------------------- |
| `[T001]` | タスクID                               |
| `[P]`    | 並列実行可能（他タスクと依存関係なし） |
| `[US1]`  | 所属ユーザーストーリー                 |
| `BLOCKS` | 後続フェーズの前提条件                 |

### タスクテンプレート

```markdown
### [T001] タスク名

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] 条件1
- [ ] 条件2
- [ ] テスト追加

**関連ファイル:**

- `src/path/to/file.ts`
```

---

## Phase 0: プロジェクトセットアップ (BLOCKS Phase 1)

### 環境構築

#### [T001] [P] Initialize Next.js project

- **ステータス:** [x] 完了
- **ブランチ:** feature/T001-init-nextjs
- **PR:** -

**完了条件:**

- [x] `npx create-next-app@latest` でプロジェクト作成
- [x] App Router 有効化
- [x] TypeScript 有効化
- [x] `npm run dev` で起動確認

**関連ファイル:**

- `package.json`
- `tsconfig.json`
- `next.config.js`

---

#### [T002] [P] Configure Tailwind CSS

- **ステータス:** [x] 完了
- **ブランチ:** feature/T001-init-nextjs
- **PR:** -

**完了条件:**

- [x] Tailwind CSS インストール済み
- [x] `tailwind.config.js` 設定済み
- [x] `globals.css` に Tailwind ディレクティブ追加
- [x] サンプルクラス（`bg-blue-500` 等）が適用されることを確認

**関連ファイル:**

- `tailwind.config.js`
- `src/styles/globals.css`

---

#### [T003] [P] Install and configure shadcn/ui

- **ステータス:** [x] 完了
- **ブランチ:** feature/T001-init-nextjs
- **PR:** -

**完了条件:**

- [x] `npx shadcn-ui@latest init` 実行
- [x] Button, Dialog, Input 等の基本コンポーネント追加
- [x] `components.json` 設定済み
- [x] コンポーネントが正しく動作することを確認

**関連ファイル:**

- `components.json`
- `src/components/ui/`

---

#### [T004] [P] Configure ESLint + Prettier

- **ステータス:** [x] 完了
- **ブランチ:** feature/T001-init-nextjs
- **PR:** -

**完了条件:**

- [x] `.eslintrc.json` 作成（CLAUDE.md の設定に従う）
- [x] `.prettierrc` 作成
- [x] `npm run lint` が動作
- [x] VSCode 設定との連携確認

**関連ファイル:**

- `.eslintrc.json`
- `.prettierrc`
- `.vscode/settings.json`

---

#### [T005] [P] Set up path aliases

- **ステータス:** [x] 完了
- **ブランチ:** feature/T001-init-nextjs
- **PR:** -

**完了条件:**

- [x] `tsconfig.json` に `@/` エイリアス設定
- [x] `import { Button } from '@/components/ui/button'` が動作

**関連ファイル:**

- `tsconfig.json`

---

### 基本構造

#### [T006] Create directory structure

- **ステータス:** [x] 完了
- **ブランチ:** feature/T001-init-nextjs
- **PR:** -

**完了条件:**

- [x] `src/features/` ディレクトリ作成
- [x] `src/stores/` ディレクトリ作成
- [x] `src/types/` ディレクトリ作成
- [x] `src/hooks/` ディレクトリ作成
- [x] `src/lib/` ディレクトリ作成
- [x] `src/components/common/` ディレクトリ作成
- [x] 各ディレクトリに `index.ts` または `.gitkeep` 配置

**関連ファイル:**

- `src/` 配下のディレクトリ構造

---

#### [T007] [P] Set up Zustand store

- **ステータス:** [x] 完了
- **ブランチ:** feature/T007-zustand-store
- **PR:** -

**完了条件:**

- [x] `zustand` と `immer` インストール
- [x] `src/stores/index.ts` 作成
- [x] immer middleware 設定
- [x] サンプル slice で動作確認

**関連ファイル:**

- `src/stores/index.ts`

**参照:**

- design.md#5-状態管理設計

---

#### [T008] [P] Create base layout

- **ステータス:** [x] 完了
- **ブランチ:** feature/T008-base-layout
- **PR:** -

**完了条件:**

- [x] `src/app/layout.tsx` 作成
- [x] メタデータ設定（title, description）
- [x] フォント設定（Inter または Noto Sans JP）
- [x] 全画面レイアウト（`min-h-screen`）
- [x] Header コンポーネント組み込み

**関連ファイル:**

- `src/app/layout.tsx`

---

#### [T009] [P] Create Header component

- **ステータス:** [x] 完了
- **ブランチ:** feature/T009-header
- **PR:** -

**完了条件:**

- [x] `src/components/common/Header.tsx` 作成
- [x] ロゴ/タイトル表示
- [x] ナビゲーションリンク（データ/マップ/スクリプト/UI/テスト）
- [x] 現在ページのハイライト表示
- [x] レスポンシブ対応

**関連ファイル:**

- `src/components/common/Header.tsx`
- `src/components/common/Header.test.tsx`

**参照:**

- ui-flow-design.md#共通レイアウト

---

#### [T010] [P] Create ThreeColumnLayout

- **ステータス:** [x] 完了
- **ブランチ:** feature/T010-three-column-layout
- **PR:** -

**完了条件:**

- [x] `src/components/common/ThreeColumnLayout.tsx` 作成
- [x] 左・中央・右の3カラム構成
- [x] 各カラムのサイズ調整可能（リサイズハンドル）
- [x] 最小/最大幅の制限
- [x] テスト追加

**関連ファイル:**

- `src/components/common/ThreeColumnLayout.tsx`
- `src/components/common/ThreeColumnLayout.test.tsx`

---

#### [T011] [P] Create TwoColumnLayout

- **ステータス:** [x] 完了
- **ブランチ:** feature/T011-two-column-layout
- **PR:** -

**完了条件:**

- [x] `src/components/common/TwoColumnLayout.tsx` 作成
- [x] 左・右の2カラム構成
- [x] リサイズハンドル
- [x] テスト追加

**関連ファイル:**

- `src/components/common/TwoColumnLayout.tsx`
- `src/components/common/TwoColumnLayout.test.tsx`

---

### ハンバーガーメニュー

#### [T011a] Create HamburgerMenu

- **ステータス:** [x] 完了
- **ブランチ:** feature/T011a-hamburger-menu
- **PR:** -

**完了条件:**

- [x] `src/components/common/HamburgerMenu.tsx` 作成
- [x] メニューアイコンクリックで展開
- [x] 外部クリックで閉じる
- [x] キーボード操作対応（Escape で閉じる）
- [x] サブメニュー構造対応

**関連ファイル:**

- `src/components/common/HamburgerMenu.tsx`
- `src/components/common/HamburgerMenu.test.tsx`

---

#### [T011b] [P] Create ProjectMenu

- **ステータス:** [x] 完了
- **ブランチ:** feature/T011g-save-indicator
- **PR:** -

**完了条件:**

- [x] `src/components/common/menus/ProjectMenu.tsx` 作成
- [x] 「新規作成」メニュー項目
- [x] 「開く」メニュー項目
- [x] 「保存」メニュー項目（Ctrl+S）
- [x] 「名前を付けて保存」メニュー項目
- [x] 「一時保存クリア」メニュー項目
- [x] ショートカットキー表示

**関連ファイル:**

- `src/components/common/menus/ProjectMenu.tsx`

---

#### [T011c] [P] Create ExportMenu

- **ステータス:** [x] 完了
- **ブランチ:** feature/T011g-save-indicator
- **PR:** -

**完了条件:**

- [x] `src/components/common/menus/ExportMenu.tsx` 作成
- [x] 「WebGL出力」メニュー項目
- [ ] 出力設定オプション表示（後続タスクで実装）

**関連ファイル:**

- `src/components/common/menus/ExportMenu.tsx`

---

#### [T011d] [P] Create SettingsMenu

- **ステータス:** [x] 完了
- **ブランチ:** feature/T011g-save-indicator
- **PR:** -

**完了条件:**

- [x] `src/components/common/menus/SettingsMenu.tsx` 作成
- [x] 「エディタ設定」メニュー項目
- [x] 「ショートカット」メニュー項目

**関連ファイル:**

- `src/components/common/menus/SettingsMenu.tsx`

---

#### [T011e] [P] Create HelpMenu

- **ステータス:** [x] 完了
- **ブランチ:** feature/T011g-save-indicator
- **PR:** -

**完了条件:**

- [x] `src/components/common/menus/HelpMenu.tsx` 作成
- [x] 「ドキュメント」メニュー項目（外部リンク）
- [x] 「バージョン情報」メニュー項目

**関連ファイル:**

- `src/components/common/menus/HelpMenu.tsx`

---

#### [T011f] [P] Create AccountMenu

- **ステータス:** [x] 完了
- **ブランチ:** feature/T011g-save-indicator
- **PR:** -

**完了条件:**

- [x] `src/components/common/menus/AccountMenu.tsx` 作成
- [x] 「ログイン」メニュー項目（Phase 2 用プレースホルダー）
- [x] 「ログアウト」メニュー項目
- [x] 「プロフィール」メニュー項目

**関連ファイル:**

- `src/components/common/menus/AccountMenu.tsx`

---

### 保存状態表示

#### [T011g] Create SaveIndicator

- **ステータス:** [x] 完了
- **ブランチ:** feature/T011g-save-indicator
- **PR:** -

**完了条件:**

- [x] `src/components/common/SaveIndicator.tsx` 作成
- [x] 未保存時の表示（ドット等）
- [x] 保存中のローディング表示
- [x] 保存完了時の表示
- [x] store の `unsavedChanges` と連携

**関連ファイル:**

- `src/components/common/SaveIndicator.tsx`
- `src/components/common/SaveIndicator.test.tsx`

---

## Phase 1: 型定義・基盤 (BLOCKS Phase 2)

### 基底クラス定義

#### [T012] [P] Define FieldType abstract class

- **ステータス:** [x] 完了
- **ブランチ:** feature/T012-field-type
- **PR:** -

**完了条件:**

- [x] `src/types/fields/FieldType.ts` 作成
- [x] abstract class `FieldType` 定義
- [x] 必須プロパティ: `type`, `id`, `name`, `required`
- [x] 抽象メソッド: `getDefaultValue()`, `validate()`, `serialize()`, `deserialize()`, `renderEditor()`, `getValue()`
- [x] `displayCondition` オプショナルプロパティ
- [x] JSDoc コメント追加

**関連ファイル:**

- `src/types/fields/FieldType.ts`

**参照:**

- design.md#4.1-フィールドタイプ

---

#### [T013] [P] Define Component abstract class

- **ステータス:** [x] 完了
- **ブランチ:** feature/T012-field-type
- **PR:** -

**完了条件:**

- [x] `src/types/components/Component.ts` 作成
- [x] abstract class `Component` 定義
- [x] 必須プロパティ: `type`
- [x] 抽象メソッド: `serialize()`, `deserialize()`, `clone()`, `renderPropertyPanel()`
- [x] JSDoc コメント追加

**関連ファイル:**

- `src/types/components/Component.ts`

**参照:**

- design.md#4.3-コンポーネント

---

#### [T014] [P] Define EventAction abstract class

- **ステータス:** [x] 完了
- **ブランチ:** feature/T012-field-type
- **PR:** -

**完了条件:**

- [x] `src/types/actions/EventAction.ts` 作成
- [x] abstract class `EventAction` 定義
- [x] 必須プロパティ: `type`
- [x] 抽象メソッド: `execute()`, `serialize()`, `deserialize()`, `renderBlock()`, `renderPropertyPanel()`
- [x] `EventContext` インターフェース定義
- [x] JSDoc コメント追加

**関連ファイル:**

- `src/types/actions/EventAction.ts`

**参照:**

- design.md#4.5-イベントアクション

---

#### [T015] [P] Define UIObject and UIComponent

- **ステータス:** [x] 完了
- **ブランチ:** feature/T012-field-type
- **PR:** -

**完了条件:**

- [x] `src/types/ui/UIComponent.ts` 作成
- [x] `UIObject` インターフェース定義（id, name, parentId, transform, components）
- [x] `RectTransform` インターフェース定義
- [x] abstract class `UIComponent` 定義
- [x] 抽象メソッド: `serialize()`, `deserialize()`, `clone()`, `renderPropertyPanel()`
- [x] JSDoc コメント追加

**関連ファイル:**

- `src/types/ui/UIComponent.ts`

**参照:**

- design.md#4.7-UIオブジェクト・コンポーネント

---

### レジストリ

#### [T016] Create FieldType registry

- **ステータス:** [x] 完了
- **ブランチ:** feature/T012-field-type
- **PR:** -

**完了条件:**

- [x] `src/types/fields/index.ts` 作成
- [x] `fieldTypeRegistry` Map 作成
- [x] `registerFieldType(type, class)` 関数
- [x] `getFieldType(type)` 関数
- [x] `getAllFieldTypes()` 関数
- [x] テスト追加

**関連ファイル:**

- `src/types/fields/index.ts`
- `src/types/fields/index.test.ts`

---

#### [T017] Create Component registry

- **ステータス:** [x] 完了
- **ブランチ:** feature/T012-field-type
- **PR:** -

**完了条件:**

- [x] `src/types/components/index.ts` 作成
- [x] `componentRegistry` Map 作成
- [x] `registerComponent(type, class)` 関数
- [x] `getComponent(type)` 関数
- [x] `getAllComponents()` 関数
- [x] テスト追加

**関連ファイル:**

- `src/types/components/index.ts`
- `src/types/components/index.test.ts`

---

#### [T018] Create EventAction registry

- **ステータス:** [x] 完了
- **ブランチ:** feature/T012-field-type
- **PR:** -

**完了条件:**

- [x] `src/types/actions/index.ts` 作成
- [x] `actionRegistry` Map 作成
- [x] `registerAction(type, class)` 関数
- [x] `getAction(type)` 関数
- [x] `getAllActions()` 関数
- [ ] テスト追加（後続タスクで追加予定）

**関連ファイル:**

- `src/types/actions/index.ts`
- `src/types/actions/index.test.ts`

---

#### [T019] Create UIComponent registry

- **ステータス:** [x] 完了
- **ブランチ:** feature/T012-field-type
- **PR:** -

**完了条件:**

- [x] `src/types/ui/index.ts` 作成
- [x] `uiComponentRegistry` Map 作成
- [x] `registerUIComponent(type, class)` 関数
- [x] `getUIComponent(type)` 関数
- [x] `getAllUIComponents()` 関数
- [ ] テスト追加（後続タスクで追加予定）

**関連ファイル:**

- `src/types/ui/index.ts`
- `src/types/ui/index.test.ts`

---

### ストレージ

#### [T020] [P] Define storage interfaces

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/lib/storage/types.ts` 作成
- [ ] `StorageProvider` インターフェース定義
- [ ] `ProjectData` インターフェース定義
- [ ] `SaveResult` 型定義
- [ ] `LoadResult` 型定義

**関連ファイル:**

- `src/lib/storage/types.ts`

**参照:**

- design.md#6-ストレージ設計

---

#### [T021] Implement IndexedDB storage

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/lib/storage/indexedDB.ts` 作成
- [ ] `idb` ライブラリ使用（または直接 IndexedDB API）
- [ ] `projects` オブジェクトストア
- [ ] `undoHistory` オブジェクトストア
- [ ] `gameSaves` オブジェクトストア
- [ ] CRUD 操作実装
- [ ] エラーハンドリング
- [ ] テスト追加

**関連ファイル:**

- `src/lib/storage/indexedDB.ts`
- `src/lib/storage/indexedDB.test.ts`

---

#### [T022] Implement LocalStorage auto-save

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/lib/storage/localStorage.ts` 作成
- [ ] 一時保存データの保存/読み込み
- [ ] タイムスタンプ付きで保存
- [ ] サイズ制限のチェック
- [ ] テスト追加

**関連ファイル:**

- `src/lib/storage/localStorage.ts`
- `src/lib/storage/localStorage.test.ts`

---

#### [T023] Create useAutoSave hook

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/hooks/useAutoSave.ts` 作成
- [ ] 500ms デバウンスで LocalStorage に保存
- [ ] store の変更を監視
- [ ] 保存状態の通知
- [ ] テスト追加

**関連ファイル:**

- `src/hooks/useAutoSave.ts`
- `src/hooks/useAutoSave.test.ts`

**参照:**

- design.md#自動保存フロー

---

#### [T024] Create useStorage hook

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/hooks/useStorage.ts` 作成
- [ ] `save()` 関数（IndexedDB に保存）
- [ ] `load()` 関数
- [ ] `exportProject()` 関数
- [ ] `importProject()` 関数
- [ ] ローディング状態管理
- [ ] エラーハンドリング
- [ ] テスト追加

**関連ファイル:**

- `src/hooks/useStorage.ts`
- `src/hooks/useStorage.test.ts`

---

### 共通フック

#### [T025] [P] Create useUndo hook

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/hooks/useUndo.ts` 作成
- [ ] `undo()` 関数
- [ ] `redo()` 関数
- [ ] `canUndo` / `canRedo` 状態
- [ ] `pushState()` 関数
- [ ] 履歴サイズ制限（設定可能）
- [ ] テスト追加

**関連ファイル:**

- `src/hooks/useUndo.ts`
- `src/hooks/useUndo.test.ts`

---

#### [T026] [P] Create useKeyboardShortcut hook

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/hooks/useKeyboardShortcut.ts` 作成
- [ ] ショートカットキーの登録
- [ ] コンテキスト（ページ/モーダル）による優先度
- [ ] 修飾キー（Ctrl, Shift, Alt）対応
- [ ] クリーンアップ処理
- [ ] テスト追加

**関連ファイル:**

- `src/hooks/useKeyboardShortcut.ts`
- `src/hooks/useKeyboardShortcut.test.ts`

---

#### [T026a] Create ShortcutManager

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/lib/shortcuts/ShortcutManager.ts` 作成
- [ ] ショートカットの一元管理
- [ ] コンテキスト（global, page, modal）の管理
- [ ] 重複チェック
- [ ] ショートカット一覧の取得
- [ ] テスト追加

**関連ファイル:**

- `src/lib/shortcuts/ShortcutManager.ts`
- `src/lib/shortcuts/ShortcutManager.test.ts`

---

#### [T026b] Create ShortcutHelpModal

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/components/common/ShortcutHelpModal.tsx` 作成
- [ ] 「?」キーでトリガー
- [ ] カテゴリ別ショートカット一覧表示
- [ ] 現在のコンテキストに応じた表示
- [ ] 検索機能
- [ ] テスト追加

**関連ファイル:**

- `src/components/common/ShortcutHelpModal.tsx`
- `src/components/common/ShortcutHelpModal.test.tsx`

---

#### [T026c] Implement per-page undo history

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/stores/undoSlice.ts` 作成
- [ ] ページごとの履歴スタック管理
- [ ] ページ切り替え時の履歴保持
- [ ] 最大履歴サイズ設定
- [ ] テスト追加

**関連ファイル:**

- `src/stores/undoSlice.ts`
- `src/stores/undoSlice.test.ts`

---

### バリデーション・検索システム

#### [T026d] Create ValidationManager

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/lib/validation/ValidationManager.ts` 作成
- [ ] バリデーションルールの登録
- [ ] フィールド単位のバリデーション
- [ ] フォーム全体のバリデーション
- [ ] エラーメッセージの管理
- [ ] テスト追加

**関連ファイル:**

- `src/lib/validation/ValidationManager.ts`
- `src/lib/validation/ValidationManager.test.ts`

---

#### [T026e] [P] Create InlineError component

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/components/common/InlineError.tsx` 作成
- [ ] エラーメッセージ表示
- [ ] アニメーション（フェードイン）
- [ ] アイコン付き表示オプション
- [ ] テスト追加

**関連ファイル:**

- `src/components/common/InlineError.tsx`
- `src/components/common/InlineError.test.tsx`

---

#### [T026f] Create useValidation hook

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/hooks/useValidation.ts` 作成
- [ ] ValidationManager との連携
- [ ] フィールドエラー状態管理
- [ ] 送信時バリデーション
- [ ] テスト追加

**関連ファイル:**

- `src/hooks/useValidation.ts`
- `src/hooks/useValidation.test.ts`

---

#### [T026g] Create SearchModal (Ctrl+F)

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/components/common/SearchModal.tsx` 作成
- [ ] Ctrl+F でトリガー
- [ ] テキスト検索入力
- [ ] 検索結果一覧表示
- [ ] 結果クリックでジャンプ
- [ ] テスト追加

**関連ファイル:**

- `src/components/common/SearchModal.tsx`
- `src/components/common/SearchModal.test.tsx`

---

#### [T026h] Create ReferenceSearchModal (Ctrl+P)

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/components/common/ReferenceSearchModal.tsx` 作成
- [ ] Ctrl+P でトリガー
- [ ] データ/マップ/スクリプト等の参照検索
- [ ] ファジー検索対応
- [ ] カテゴリフィルター
- [ ] テスト追加

**関連ファイル:**

- `src/components/common/ReferenceSearchModal.tsx`
- `src/components/common/ReferenceSearchModal.test.tsx`

---

### クリップボード

#### [T026i] Create ClipboardManager

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/lib/clipboard/ClipboardManager.ts` 作成
- [ ] コピーデータの型情報管理
- [ ] 複数アイテムのコピー対応
- [ ] シリアライズ/デシリアライズ
- [ ] テスト追加

**関連ファイル:**

- `src/lib/clipboard/ClipboardManager.ts`
- `src/lib/clipboard/ClipboardManager.test.ts`

---

#### [T026j] Implement copy/paste with type validation

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/hooks/useClipboard.ts` 作成
- [ ] `copy()` 関数
- [ ] `paste()` 関数
- [ ] 型互換性チェック
- [ ] ペースト先での ID 再生成
- [ ] テスト追加

**関連ファイル:**

- `src/hooks/useClipboard.ts`
- `src/hooks/useClipboard.test.ts`

---

### 共通コンポーネント

#### [T027] [P] Create PropertyPanel

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/components/common/PropertyPanel.tsx` 作成
- [ ] セクション折りたたみ機能
- [ ] 動的フィールドレンダリング
- [ ] スクロール対応
- [ ] テスト追加

**関連ファイル:**

- `src/components/common/PropertyPanel.tsx`
- `src/components/common/PropertyPanel.test.tsx`

---

#### [T028] [P] Create Toast notification

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/components/common/Toast.tsx` 作成
- [ ] success/warning/error バリアント
- [ ] 自動消去（タイムアウト設定可能）
- [ ] 手動クローズボタン
- [ ] スタック表示（複数同時表示）
- [ ] テスト追加

**関連ファイル:**

- `src/components/common/Toast.tsx`
- `src/components/common/Toast.test.tsx`

---

#### [T029] [P] Create Modal component

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/components/common/Modal.tsx` 作成
- [ ] オーバーレイ背景
- [ ] Escape キーで閉じる
- [ ] フォーカストラップ
- [ ] アニメーション（フェードイン/アウト）
- [ ] サイズバリアント（sm, md, lg, full）
- [ ] テスト追加

**関連ファイル:**

- `src/components/common/Modal.tsx`
- `src/components/common/Modal.test.tsx`

---

#### [T030] [P] Create ConfirmDialog

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/components/common/ConfirmDialog.tsx` 作成
- [ ] タイトル/メッセージ表示
- [ ] 確認/キャンセルボタン
- [ ] バリアント（warning, danger）
- [ ] Promise ベースの API
- [ ] テスト追加

**関連ファイル:**

- `src/components/common/ConfirmDialog.tsx`
- `src/components/common/ConfirmDialog.test.tsx`

---

## Phase 2: 基本フィールドタイプ (BLOCKS Phase 3)

### P0 フィールドタイプ（必須）

#### [T031] [P] Implement NumberFieldType

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/fields/NumberFieldType.ts` 作成
- [ ] FieldType を継承
- [ ] `min`, `max`, `step` プロパティ
- [ ] `getDefaultValue()` → 0 を返す
- [ ] `validate()` で範囲チェック
- [ ] `serialize()` / `deserialize()` 実装
- [ ] `renderEditor()` で数値入力 UI を返す
- [ ] レジストリに登録
- [ ] テスト追加

**関連ファイル:**

- `src/types/fields/NumberFieldType.ts`
- `src/types/fields/NumberFieldType.test.ts`

**参照:**

- design.md#4.1-フィールドタイプ

---

#### [T032] [P] Implement StringFieldType

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/fields/StringFieldType.ts` 作成
- [ ] FieldType を継承
- [ ] `maxLength`, `placeholder` プロパティ
- [ ] `getDefaultValue()` → 空文字を返す
- [ ] `validate()` で長さチェック
- [ ] レジストリに登録
- [ ] テスト追加

**関連ファイル:**

- `src/types/fields/StringFieldType.ts`
- `src/types/fields/StringFieldType.test.ts`

---

#### [T033] [P] Implement TextareaFieldType

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/fields/TextareaFieldType.ts` 作成
- [ ] FieldType を継承
- [ ] `maxLength`, `rows` プロパティ
- [ ] 複数行テキスト対応
- [ ] レジストリに登録
- [ ] テスト追加

**関連ファイル:**

- `src/types/fields/TextareaFieldType.ts`
- `src/types/fields/TextareaFieldType.test.ts`

---

#### [T034] [P] Implement BooleanFieldType

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/fields/BooleanFieldType.ts` 作成
- [ ] FieldType を継承
- [ ] `getDefaultValue()` → false を返す
- [ ] チェックボックス UI
- [ ] レジストリに登録
- [ ] テスト追加

**関連ファイル:**

- `src/types/fields/BooleanFieldType.ts`
- `src/types/fields/BooleanFieldType.test.ts`

---

#### [T035] [P] Implement SelectFieldType

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/fields/SelectFieldType.ts` 作成
- [ ] FieldType を継承
- [ ] `options: { value: string; label: string }[]` プロパティ
- [ ] `getDefaultValue()` → 最初のオプション値
- [ ] ドロップダウン UI
- [ ] レジストリに登録
- [ ] テスト追加

**関連ファイル:**

- `src/types/fields/SelectFieldType.ts`
- `src/types/fields/SelectFieldType.test.ts`

---

#### [T036] [P] Implement ColorFieldType

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/fields/ColorFieldType.ts` 作成
- [ ] FieldType を継承
- [ ] `getDefaultValue()` → '#000000' を返す
- [ ] カラーピッカー UI
- [ ] HEX/RGB 形式対応
- [ ] レジストリに登録
- [ ] テスト追加

**関連ファイル:**

- `src/types/fields/ColorFieldType.ts`
- `src/types/fields/ColorFieldType.test.ts`

---

#### [T036a] [P] Implement FormulaFieldType

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/fields/FormulaFieldType.ts` 作成
- [ ] FieldType を継承
- [ ] 数式文字列を格納
- [ ] 変数参照（`{hp}` 等）対応
- [ ] 構文チェック
- [ ] レジストリに登録
- [ ] テスト追加

**関連ファイル:**

- `src/types/fields/FormulaFieldType.ts`
- `src/types/fields/FormulaFieldType.test.ts`

---

### P2 フィールドタイプ（高度）

#### [T036b] [P] Implement EffectFieldType

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/fields/EffectFieldType.ts` 作成
- [ ] FieldType を継承
- [ ] エフェクトIDを参照
- [ ] プレビュー表示
- [ ] レジストリに登録
- [ ] テスト追加

**関連ファイル:**

- `src/types/fields/EffectFieldType.ts`
- `src/types/fields/EffectFieldType.test.ts`

---

#### [T036c] [P] Implement ScriptFieldType

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/fields/ScriptFieldType.ts` 作成
- [ ] FieldType を継承
- [ ] スクリプトIDを参照
- [ ] スクリプト名表示
- [ ] レジストリに登録
- [ ] テスト追加

**関連ファイル:**

- `src/types/fields/ScriptFieldType.ts`
- `src/types/fields/ScriptFieldType.test.ts`

---

### フィールドエディタコンポーネント

#### [T037] [P] Create NumberFieldEditor

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/data-editor/components/fields/NumberFieldEditor.tsx` 作成
- [ ] 数値入力 UI
- [ ] min/max/step 制約の適用
- [ ] インライン バリデーションエラー表示
- [ ] テスト追加

**関連ファイル:**

- `src/features/data-editor/components/fields/NumberFieldEditor.tsx`
- `src/features/data-editor/components/fields/NumberFieldEditor.test.tsx`

---

#### [T038] [P] Create StringFieldEditor

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/data-editor/components/fields/StringFieldEditor.tsx` 作成
- [ ] テキスト入力 UI
- [ ] maxLength 制約の適用
- [ ] 文字数カウンター表示
- [ ] テスト追加

**関連ファイル:**

- `src/features/data-editor/components/fields/StringFieldEditor.tsx`
- `src/features/data-editor/components/fields/StringFieldEditor.test.tsx`

---

#### [T039] [P] Create TextareaFieldEditor

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/data-editor/components/fields/TextareaFieldEditor.tsx` 作成
- [ ] 複数行テキスト入力 UI
- [ ] 自動リサイズオプション
- [ ] テスト追加

**関連ファイル:**

- `src/features/data-editor/components/fields/TextareaFieldEditor.tsx`
- `src/features/data-editor/components/fields/TextareaFieldEditor.test.tsx`

---

#### [T040] [P] Create BooleanFieldEditor

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/data-editor/components/fields/BooleanFieldEditor.tsx` 作成
- [ ] チェックボックス UI
- [ ] ラベル表示
- [ ] テスト追加

**関連ファイル:**

- `src/features/data-editor/components/fields/BooleanFieldEditor.tsx`
- `src/features/data-editor/components/fields/BooleanFieldEditor.test.tsx`

---

#### [T041] [P] Create SelectFieldEditor

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/data-editor/components/fields/SelectFieldEditor.tsx` 作成
- [ ] ドロップダウン UI
- [ ] オプション一覧表示
- [ ] テスト追加

**関連ファイル:**

- `src/features/data-editor/components/fields/SelectFieldEditor.tsx`
- `src/features/data-editor/components/fields/SelectFieldEditor.test.tsx`

---

#### [T042] [P] Create ColorFieldEditor

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/data-editor/components/fields/ColorFieldEditor.tsx` 作成
- [ ] カラーピッカー UI
- [ ] HEX 入力フィールド
- [ ] プレビュー表示
- [ ] テスト追加

**関連ファイル:**

- `src/features/data-editor/components/fields/ColorFieldEditor.tsx`
- `src/features/data-editor/components/fields/ColorFieldEditor.test.tsx`

---

#### [T042a] [P] Create FormulaFieldEditor

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/data-editor/components/fields/FormulaFieldEditor.tsx` 作成
- [ ] 数式入力 UI
- [ ] 変数候補の補完
- [ ] 構文エラー表示
- [ ] テスト追加

**関連ファイル:**

- `src/features/data-editor/components/fields/FormulaFieldEditor.tsx`
- `src/features/data-editor/components/fields/FormulaFieldEditor.test.tsx`

---

#### [T042b] [P] Create EffectFieldEditor

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/data-editor/components/fields/EffectFieldEditor.tsx` 作成
- [ ] エフェクト選択 UI
- [ ] プレビュー表示
- [ ] テスト追加

**関連ファイル:**

- `src/features/data-editor/components/fields/EffectFieldEditor.tsx`
- `src/features/data-editor/components/fields/EffectFieldEditor.test.tsx`

---

#### [T042c] [P] Create ScriptFieldEditor

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/data-editor/components/fields/ScriptFieldEditor.tsx` 作成
- [ ] スクリプト選択 UI
- [ ] スクリプトへのリンク
- [ ] テスト追加

**関連ファイル:**

- `src/features/data-editor/components/fields/ScriptFieldEditor.tsx`
- `src/features/data-editor/components/fields/ScriptFieldEditor.test.tsx`

---

### 条件付きフィールド表示

#### [T042d] Create ConditionEvaluator

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/data-editor/utils/conditionEvaluator.ts` 作成
- [ ] `displayCondition` の評価ロジック
- [ ] 比較演算子（==, !=, <, >, etc.）対応
- [ ] テスト追加

**関連ファイル:**

- `src/features/data-editor/utils/conditionEvaluator.ts`
- `src/features/data-editor/utils/conditionEvaluator.test.ts`

---

#### [T042e] Create ConditionEditor

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/data-editor/components/ConditionEditor.tsx` 作成
- [ ] 条件設定 UI
- [ ] フィールド選択
- [ ] 値選択/入力
- [ ] テスト追加

**関連ファイル:**

- `src/features/data-editor/components/ConditionEditor.tsx`
- `src/features/data-editor/components/ConditionEditor.test.tsx`

---

## Phase 3: ゲーム設定（小）

最もシンプルなページから実装を開始します。

### US1: ゲーム情報

#### [T043] [US1] Create gameSettingsSlice

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/stores/gameSettingsSlice.ts` 作成
- [ ] `GameSettings` 状態定義
- [ ] `updateGameSettings()` アクション
- [ ] デフォルト値設定
- [ ] テスト追加

**関連ファイル:**

- `src/stores/gameSettingsSlice.ts`
- `src/stores/gameSettingsSlice.test.ts`

---

#### [T044] [US1] Create GameInfoPage

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/app/(editor)/settings/info/page.tsx` 作成
- [ ] TwoColumnLayout 使用
- [ ] GameInfoForm コンポーネント配置
- [ ] ページタイトル設定

**関連ファイル:**

- `src/app/(editor)/settings/info/page.tsx`

---

#### [T045] [US1] Create GameInfoForm

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/game-settings/components/GameInfoForm.tsx` 作成
- [ ] ゲームタイトル入力
- [ ] バージョン入力
- [ ] 作者名入力
- [ ] 説明文入力（Textarea）
- [ ] 解像度設定（幅 x 高さ）
- [ ] 開始マップ選択
- [ ] 開始位置設定
- [ ] React Hook Form + Zod バリデーション
- [ ] テスト追加

**関連ファイル:**

- `src/features/game-settings/components/GameInfoForm.tsx`
- `src/features/game-settings/components/GameInfoForm.test.tsx`

---

#### [T046] [US1] Define GameSettings type

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/gameSettings.ts` 作成
- [ ] `GameSettings` インターフェース定義
- [ ] 必須フィールド: title, version, author, resolution, startMapId, startPosition
- [ ] オプションフィールド: description, defaultBGM

**関連ファイル:**

- `src/types/gameSettings.ts`

**参照:**

- design.md#GameSettings

---

## Phase 4: 変数・クラス・フィールドセット（小〜中）

2カラムレイアウトのシンプルなページ群。

### US2: 変数ページ

#### [T047] [US2] Create variableSlice

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/stores/variableSlice.ts` 作成
- [ ] `variables: Variable[]` 状態
- [ ] `addVariable()`, `updateVariable()`, `deleteVariable()` アクション
- [ ] `selectedVariableId` 状態
- [ ] テスト追加

**関連ファイル:**

- `src/stores/variableSlice.ts`
- `src/stores/variableSlice.test.ts`

---

#### [T048] [US2] Create VariablePage

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/app/(editor)/data/variables/page.tsx` 作成
- [ ] TwoColumnLayout 使用
- [ ] 左: VariableList、右: VariableEditor
- [ ] 変数追加ボタン

**関連ファイル:**

- `src/app/(editor)/data/variables/page.tsx`

---

#### [T049] [US2] Create VariableList

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/data-editor/components/VariableList.tsx` 作成
- [ ] 変数一覧表示
- [ ] 選択状態のハイライト
- [ ] ドラッグ&ドロップで並び替え
- [ ] 右クリックコンテキストメニュー（削除、複製）
- [ ] テスト追加

**関連ファイル:**

- `src/features/data-editor/components/VariableList.tsx`
- `src/features/data-editor/components/VariableList.test.tsx`

---

#### [T050] [US2] Create VariableEditor

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/data-editor/components/VariableEditor.tsx` 作成
- [ ] 変数名入力
- [ ] 変数ID入力（自動生成オプション）
- [ ] 型選択（FieldType 選択）
- [ ] 配列フラグ
- [ ] 初期値設定
- [ ] テスト追加

**関連ファイル:**

- `src/features/data-editor/components/VariableEditor.tsx`
- `src/features/data-editor/components/VariableEditor.test.tsx`

---

#### [T051] [US2] Define Variable type

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/data.ts` に `Variable` インターフェース追加
- [ ] フィールド: id, name, fieldType, isArray, initialValue

**関連ファイル:**

- `src/types/data.ts`

---

### US3: クラスページ

#### [T052] [US3] Create classSlice

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/stores/classSlice.ts` 作成
- [ ] `classes: CustomClass[]` 状態
- [ ] CRUD アクション
- [ ] `selectedClassId` 状態
- [ ] テスト追加

**関連ファイル:**

- `src/stores/classSlice.ts`
- `src/stores/classSlice.test.ts`

---

#### [T053] [US3] Create ClassPage

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/app/(editor)/data/classes/page.tsx` 作成
- [ ] TwoColumnLayout 使用
- [ ] クラス追加ボタン

**関連ファイル:**

- `src/app/(editor)/data/classes/page.tsx`

---

#### [T054] [US3] Create ClassList

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/data-editor/components/ClassList.tsx` 作成
- [ ] クラス一覧表示
- [ ] 選択状態
- [ ] テスト追加

**関連ファイル:**

- `src/features/data-editor/components/ClassList.tsx`
- `src/features/data-editor/components/ClassList.test.tsx`

---

#### [T055] [US3] Create ClassEditor

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/data-editor/components/ClassEditor.tsx` 作成
- [ ] クラス名入力
- [ ] クラスID入力
- [ ] フィールド一覧編集
- [ ] フィールド追加/削除/並び替え
- [ ] テスト追加

**関連ファイル:**

- `src/features/data-editor/components/ClassEditor.tsx`
- `src/features/data-editor/components/ClassEditor.test.tsx`

---

#### [T056] [US3] Define CustomClass type

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/data.ts` に `CustomClass` インターフェース追加
- [ ] フィールド: id, name, fields

**関連ファイル:**

- `src/types/data.ts`

---

### US4: フィールドセットページ

#### [T057] [US4] Create fieldSetSlice

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/stores/fieldSetSlice.ts` 作成
- [ ] `fieldSets: FieldSet[]` 状態
- [ ] CRUD アクション
- [ ] テスト追加

**関連ファイル:**

- `src/stores/fieldSetSlice.ts`
- `src/stores/fieldSetSlice.test.ts`

---

#### [T058] [US4] Create FieldSetPage

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/app/(editor)/data/fieldsets/page.tsx` 作成
- [ ] TwoColumnLayout 使用

**関連ファイル:**

- `src/app/(editor)/data/fieldsets/page.tsx`

---

#### [T059] [US4] Create FieldSetList

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/data-editor/components/FieldSetList.tsx` 作成
- [ ] フィールドセット一覧表示
- [ ] テスト追加

**関連ファイル:**

- `src/features/data-editor/components/FieldSetList.tsx`
- `src/features/data-editor/components/FieldSetList.test.tsx`

---

#### [T060] [US4] Create FieldSetEditor

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/data-editor/components/FieldSetEditor.tsx` 作成
- [ ] フィールドセット名入力
- [ ] フィールド一覧編集
- [ ] テスト追加

**関連ファイル:**

- `src/features/data-editor/components/FieldSetEditor.tsx`
- `src/features/data-editor/components/FieldSetEditor.test.tsx`

---

#### [T061] [US4] Implement FieldSetFieldType

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/fields/FieldSetFieldType.ts` 作成
- [ ] FieldType を継承
- [ ] `fieldSetId` プロパティ
- [ ] フィールドセットの各フィールドを展開表示
- [ ] レジストリに登録
- [ ] テスト追加

**関連ファイル:**

- `src/types/fields/FieldSetFieldType.ts`
- `src/types/fields/FieldSetFieldType.test.ts`

---

#### [T062] [US4] Define FieldSet type

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/data.ts` に `FieldSet` インターフェース追加
- [ ] フィールド: id, name, fields

**関連ファイル:**

- `src/types/data.ts`

---

#### [T062a] [US4] Create default FieldSets

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/lib/defaultFieldSets.ts` 作成
- [ ] status フィールドセット（HP, MP, ATK, DEF 等）
- [ ] effect フィールドセット（エフェクト関連）
- [ ] battleSkillResult フィールドセット（スキル結果）
- [ ] 初期化時に登録

**関連ファイル:**

- `src/lib/defaultFieldSets.ts`
- `src/lib/defaultFieldSets.test.ts`

---

## Phase 5: P1 フィールドタイプ（データ参照系）

データ設定の前にデータ参照系フィールドを実装。

### データ参照フィールド

#### [T063] [P] Implement DataSelectFieldType

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/fields/DataSelectFieldType.ts` 作成
- [ ] FieldType を継承
- [ ] `referenceTypeId` プロパティ（参照先データタイプ）
- [ ] データ一覧からの選択 UI
- [ ] 参照先データのプレビュー
- [ ] レジストリに登録
- [ ] テスト追加

**関連ファイル:**

- `src/types/fields/DataSelectFieldType.ts`
- `src/types/fields/DataSelectFieldType.test.ts`

---

#### [T064] [P] Implement DataListFieldType

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/fields/DataListFieldType.ts` 作成
- [ ] FieldType を継承
- [ ] `referenceTypeId` プロパティ
- [ ] 複数データ選択（リスト形式）
- [ ] 追加/削除/並び替え UI
- [ ] レジストリに登録
- [ ] テスト追加

**関連ファイル:**

- `src/types/fields/DataListFieldType.ts`
- `src/types/fields/DataListFieldType.test.ts`

---

#### [T065] [P] Implement DataTableFieldType

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/fields/DataTableFieldType.ts` 作成
- [ ] FieldType を継承
- [ ] テーブル形式でデータ表示
- [ ] 列定義（FieldType 配列）
- [ ] 行の追加/削除
- [ ] レジストリに登録
- [ ] テスト追加

**関連ファイル:**

- `src/types/fields/DataTableFieldType.ts`
- `src/types/fields/DataTableFieldType.test.ts`

---

#### [T066] [P] Implement FieldSetListFieldType

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/fields/FieldSetListFieldType.ts` 作成
- [ ] FieldType を継承
- [ ] `fieldSetId` プロパティ
- [ ] フィールドセットの複数インスタンス管理
- [ ] 追加/削除 UI
- [ ] レジストリに登録
- [ ] テスト追加

**関連ファイル:**

- `src/types/fields/FieldSetListFieldType.ts`
- `src/types/fields/FieldSetListFieldType.test.ts`

---

### データ参照エディタ

#### [T067] [P] Create DataSelectFieldEditor

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/data-editor/components/fields/DataSelectFieldEditor.tsx` 作成
- [ ] ドロップダウンでデータ選択
- [ ] 検索フィルター
- [ ] 選択中データのプレビュー
- [ ] テスト追加

**関連ファイル:**

- `src/features/data-editor/components/fields/DataSelectFieldEditor.tsx`
- `src/features/data-editor/components/fields/DataSelectFieldEditor.test.tsx`

---

#### [T068] [P] Create DataListFieldEditor

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/data-editor/components/fields/DataListFieldEditor.tsx` 作成
- [ ] リスト形式で選択済みデータ表示
- [ ] 追加モーダル
- [ ] ドラッグ&ドロップで並び替え
- [ ] テスト追加

**関連ファイル:**

- `src/features/data-editor/components/fields/DataListFieldEditor.tsx`
- `src/features/data-editor/components/fields/DataListFieldEditor.test.tsx`

---

#### [T069] [P] Create DataTableFieldEditor

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/data-editor/components/fields/DataTableFieldEditor.tsx` 作成
- [ ] テーブル UI
- [ ] 列ごとのフィールドエディタ
- [ ] 行追加/削除ボタン
- [ ] テスト追加

**関連ファイル:**

- `src/features/data-editor/components/fields/DataTableFieldEditor.tsx`
- `src/features/data-editor/components/fields/DataTableFieldEditor.test.tsx`

---

#### [T070] [P] Create FieldSetListFieldEditor

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/data-editor/components/fields/FieldSetListFieldEditor.tsx` 作成
- [ ] フィールドセットインスタンス一覧
- [ ] 展開/折りたたみ
- [ ] 追加/削除ボタン
- [ ] テスト追加

**関連ファイル:**

- `src/features/data-editor/components/fields/FieldSetListFieldEditor.tsx`
- `src/features/data-editor/components/fields/FieldSetListFieldEditor.test.tsx`

---

## Phase 6: アセット管理（中）

データ設定の前にアセット参照を可能にする。

### アセットフィールドタイプ

#### [T071] [P] Implement ImageFieldType

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/fields/ImageFieldType.ts` 作成
- [ ] FieldType を継承
- [ ] `assetId` を格納
- [ ] サムネイルプレビュー
- [ ] レジストリに登録
- [ ] テスト追加

**関連ファイル:**

- `src/types/fields/ImageFieldType.ts`
- `src/types/fields/ImageFieldType.test.ts`

---

#### [T072] [P] Implement AudioFieldType

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/fields/AudioFieldType.ts` 作成
- [ ] FieldType を継承
- [ ] `assetId` を格納
- [ ] 再生ボタン付きプレビュー
- [ ] レジストリに登録
- [ ] テスト追加

**関連ファイル:**

- `src/types/fields/AudioFieldType.ts`
- `src/types/fields/AudioFieldType.test.ts`

---

### US5: 画像アセット

#### [T073] [US5] Create assetSlice

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/stores/assetSlice.ts` 作成
- [ ] `assets: AssetReference[]` 状態
- [ ] `assetFolders: AssetFolder[]` 状態
- [ ] CRUD アクション
- [ ] フォルダ操作アクション
- [ ] テスト追加

**関連ファイル:**

- `src/stores/assetSlice.ts`
- `src/stores/assetSlice.test.ts`

---

#### [T074] [US5] Create ImageAssetPage

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/app/(editor)/settings/images/page.tsx` 作成
- [ ] ThreeColumnLayout 使用
- [ ] 左: フォルダツリー、中央: グリッド、右: プレビュー

**関連ファイル:**

- `src/app/(editor)/settings/images/page.tsx`

---

#### [T075] [US5] Create AssetFolderTree

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/asset-manager/components/AssetFolderTree.tsx` 作成
- [ ] フォルダ階層表示
- [ ] 展開/折りたたみ
- [ ] フォルダ選択
- [ ] 右クリックメニュー（新規、名前変更、削除）
- [ ] テスト追加

**関連ファイル:**

- `src/features/asset-manager/components/AssetFolderTree.tsx`
- `src/features/asset-manager/components/AssetFolderTree.test.tsx`

---

#### [T076] [US5] Create AssetGrid

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/asset-manager/components/AssetGrid.tsx` 作成
- [ ] グリッド形式でアセット表示
- [ ] サムネイル表示
- [ ] 選択状態
- [ ] 複数選択対応
- [ ] 仮想化（大量アセット対応）
- [ ] テスト追加

**関連ファイル:**

- `src/features/asset-manager/components/AssetGrid.tsx`
- `src/features/asset-manager/components/AssetGrid.test.tsx`

---

#### [T077] [US5] Create AssetUploader

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/asset-manager/components/AssetUploader.tsx` 作成
- [ ] ドラッグ&ドロップアップロード
- [ ] ファイル選択ダイアログ
- [ ] 複数ファイル対応
- [ ] プログレス表示
- [ ] ファイルタイプ検証
- [ ] テスト追加

**関連ファイル:**

- `src/features/asset-manager/components/AssetUploader.tsx`
- `src/features/asset-manager/components/AssetUploader.test.tsx`

---

#### [T078] [US5] Create AssetPreview

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/asset-manager/components/AssetPreview.tsx` 作成
- [ ] 画像プレビュー（ズーム対応）
- [ ] メタデータ表示（サイズ、形式、ファイルサイズ）
- [ ] 名前変更
- [ ] 削除ボタン
- [ ] テスト追加

**関連ファイル:**

- `src/features/asset-manager/components/AssetPreview.tsx`
- `src/features/asset-manager/components/AssetPreview.test.tsx`

---

#### [T079] [US5] Create ImageFieldEditor

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/data-editor/components/fields/ImageFieldEditor.tsx` 作成
- [ ] サムネイル表示
- [ ] 選択ボタン（AssetPickerModal を開く）
- [ ] クリアボタン
- [ ] テスト追加

**関連ファイル:**

- `src/features/data-editor/components/fields/ImageFieldEditor.tsx`
- `src/features/data-editor/components/fields/ImageFieldEditor.test.tsx`

---

#### [T080] [US5] Create AssetPickerModal

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/asset-manager/components/AssetPickerModal.tsx` 作成
- [ ] モーダル内でアセット選択
- [ ] フォルダナビゲーション
- [ ] 検索フィルター
- [ ] タイプフィルター（image/audio）
- [ ] 選択確定/キャンセルボタン
- [ ] テスト追加

**関連ファイル:**

- `src/features/asset-manager/components/AssetPickerModal.tsx`
- `src/features/asset-manager/components/AssetPickerModal.test.tsx`

---

### アセットフォルダ管理

#### [T080a] [US5] Create CreateFolderModal

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/asset-manager/components/CreateFolderModal.tsx` 作成
- [ ] フォルダ名入力
- [ ] 親フォルダ選択
- [ ] 重複チェック
- [ ] テスト追加

**関連ファイル:**

- `src/features/asset-manager/components/CreateFolderModal.tsx`
- `src/features/asset-manager/components/CreateFolderModal.test.tsx`

---

#### [T080b] [US5] Create RenameFolderModal

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/asset-manager/components/RenameFolderModal.tsx` 作成
- [ ] 現在の名前表示
- [ ] 新しい名前入力
- [ ] 重複チェック
- [ ] テスト追加

**関連ファイル:**

- `src/features/asset-manager/components/RenameFolderModal.tsx`
- `src/features/asset-manager/components/RenameFolderModal.test.tsx`

---

#### [T080c] [US5] Create DeleteFolderConfirm

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/asset-manager/components/DeleteFolderConfirm.tsx` 作成
- [ ] 削除確認ダイアログ
- [ ] 中身があるフォルダの警告
- [ ] テスト追加

**関連ファイル:**

- `src/features/asset-manager/components/DeleteFolderConfirm.tsx`
- `src/features/asset-manager/components/DeleteFolderConfirm.test.tsx`

---

#### [T080d] [US5] Implement folder drag-and-drop

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/asset-manager/hooks/useFolderDragDrop.ts` 作成
- [ ] フォルダのドラッグ&ドロップ移動
- [ ] ドロップ先のハイライト
- [ ] 無効なドロップ先の判定
- [ ] テスト追加

**関連ファイル:**

- `src/features/asset-manager/hooks/useFolderDragDrop.ts`
- `src/features/asset-manager/hooks/useFolderDragDrop.test.ts`

---

#### [T080e] [US5] Implement asset move between folders

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/asset-manager/utils/assetMove.ts` 作成
- [ ] アセットのフォルダ間移動
- [ ] 複数選択移動
- [ ] 参照の更新
- [ ] テスト追加

**関連ファイル:**

- `src/features/asset-manager/utils/assetMove.ts`
- `src/features/asset-manager/utils/assetMove.test.ts`

---

### US6: 音声アセット

#### [T081] [US6] Create AudioAssetPage

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/app/(editor)/settings/audio/page.tsx` 作成
- [ ] ImageAssetPage と同様のレイアウト
- [ ] 音声ファイル対応

**関連ファイル:**

- `src/app/(editor)/settings/audio/page.tsx`

---

#### [T082] [US6] Create AudioFieldEditor

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/data-editor/components/fields/AudioFieldEditor.tsx` 作成
- [ ] 音声ファイル名表示
- [ ] 再生/停止ボタン
- [ ] 選択ボタン
- [ ] テスト追加

**関連ファイル:**

- `src/features/data-editor/components/fields/AudioFieldEditor.tsx`
- `src/features/data-editor/components/fields/AudioFieldEditor.test.tsx`

---

#### [T083] [US6] Create AudioPlayer

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/asset-manager/components/AudioPlayer.tsx` 作成
- [ ] 再生/一時停止/停止
- [ ] シークバー
- [ ] ボリューム調整
- [ ] ループ切り替え
- [ ] 時間表示
- [ ] テスト追加

**関連ファイル:**

- `src/features/asset-manager/components/AudioPlayer.tsx`
- `src/features/asset-manager/components/AudioPlayer.test.tsx`

---

### US7: フォントアセット

#### [T084] [US7] Create FontAssetPage

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/app/(editor)/settings/fonts/page.tsx` 作成
- [ ] フォント一覧表示
- [ ] アップロード機能

**関連ファイル:**

- `src/app/(editor)/settings/fonts/page.tsx`

---

#### [T085] [US7] Create FontPreview

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/asset-manager/components/FontPreview.tsx` 作成
- [ ] サンプルテキスト表示
- [ ] フォントサイズ変更
- [ ] テスト追加

**関連ファイル:**

- `src/features/asset-manager/components/FontPreview.tsx`
- `src/features/asset-manager/components/FontPreview.test.tsx`

---

## Phase 7: データ設定（中〜大）

3カラムレイアウト、仮想スクロール、フォームビルダー。

### US8: データ設定

#### [T086] [US8] Create dataSlice

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/stores/dataSlice.ts` 作成
- [ ] `dataTypes: DataType[]` 状態
- [ ] `dataEntries: Record<string, DataEntry[]>` 状態
- [ ] CRUD アクション
- [ ] ID 変更時の参照同期アクション
- [ ] テスト追加

**関連ファイル:**

- `src/stores/dataSlice.ts`
- `src/stores/dataSlice.test.ts`

**参照:**

- design.md#stores/dataSlice.ts

---

#### [T087] [US8] Create DataPage

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/app/(editor)/data/page.tsx` 作成
- [ ] ThreeColumnLayout 使用
- [ ] 左: DataTypeList、中央: DataEntryList、右: FormBuilder

**関連ファイル:**

- `src/app/(editor)/data/page.tsx`

---

#### [T088] [US8] Create DataTypeList

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/data-editor/components/DataTypeList.tsx` 作成
- [ ] データタイプ一覧表示
- [ ] 選択状態
- [ ] 追加/削除ボタン
- [ ] ドラッグ&ドロップ並び替え
- [ ] テスト追加

**関連ファイル:**

- `src/features/data-editor/components/DataTypeList.tsx`
- `src/features/data-editor/components/DataTypeList.test.tsx`

---

#### [T089] [US8] Create DataEntryList (virtualized)

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/data-editor/components/DataEntryList.tsx` 作成
- [ ] @tanstack/react-virtual で仮想化
- [ ] 最大1000件対応
- [ ] 検索フィルター
- [ ] 選択状態
- [ ] 追加/削除/複製
- [ ] テスト追加

**関連ファイル:**

- `src/features/data-editor/components/DataEntryList.tsx`
- `src/features/data-editor/components/DataEntryList.test.tsx`

---

#### [T090] [US8] Create FormBuilder

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/data-editor/components/FormBuilder.tsx` 作成
- [ ] DataType の fields に基づいてフォーム生成
- [ ] 各 FieldType の renderEditor() を使用
- [ ] 条件付き表示対応
- [ ] バリデーションエラー表示
- [ ] テスト追加

**関連ファイル:**

- `src/features/data-editor/components/FormBuilder.tsx`
- `src/features/data-editor/components/FormBuilder.test.tsx`

---

#### [T091] [US8] Create FieldTypeSelector modal

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/data-editor/components/FieldTypeSelector.tsx` 作成
- [ ] 登録済み FieldType 一覧表示
- [ ] カテゴリ分類
- [ ] 検索フィルター
- [ ] 選択で新規フィールド追加
- [ ] テスト追加

**関連ファイル:**

- `src/features/data-editor/components/FieldTypeSelector.tsx`
- `src/features/data-editor/components/FieldTypeSelector.test.tsx`

---

#### [T092] [US8] Create DataTypeEditor sidebar

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/data-editor/components/DataTypeEditor.tsx` 作成
- [ ] データタイプ名編集
- [ ] フィールド一覧編集
- [ ] フィールド追加/削除/並び替え
- [ ] 各フィールドの詳細設定
- [ ] テスト追加

**関連ファイル:**

- `src/features/data-editor/components/DataTypeEditor.tsx`
- `src/features/data-editor/components/DataTypeEditor.test.tsx`

---

#### [T093] [US8] Define DataType and DataEntry types

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/data.ts` に `DataType` インターフェース追加
- [ ] `src/types/data.ts` に `DataEntry` インターフェース追加
- [ ] DataType: id, name, fields
- [ ] DataEntry: id, typeId, values

**関連ファイル:**

- `src/types/data.ts`

**参照:**

- design.md#4.2-データ構造

---

#### [T094] [US8] Implement data search/filter

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/data-editor/hooks/useDataFilter.ts` 作成
- [ ] テキスト検索
- [ ] フィールド値でのフィルター
- [ ] debounce 処理
- [ ] テスト追加

**関連ファイル:**

- `src/features/data-editor/hooks/useDataFilter.ts`
- `src/features/data-editor/hooks/useDataFilter.test.ts`

---

#### [T095] [US8] Implement ID change synchronization

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/data-editor/utils/idSync.ts` 作成
- [ ] データID変更時に全参照を更新
- [ ] 影響範囲の検出
- [ ] 一括更新処理
- [ ] テスト追加

**関連ファイル:**

- `src/features/data-editor/utils/idSync.ts`
- `src/features/data-editor/utils/idSync.test.ts`

**参照:**

- requirements.md#データID変更時の動作

---

#### [T096] [US8] Implement reference integrity check

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/data-editor/utils/referenceCheck.ts` 作成
- [ ] データ削除時の参照チェック
- [ ] 参照されている場合の警告
- [ ] 参照元の一覧表示
- [ ] テスト追加

**関連ファイル:**

- `src/features/data-editor/utils/referenceCheck.ts`
- `src/features/data-editor/utils/referenceCheck.test.ts`

---

### デフォルトデータタイプ

#### [T097] [US8] Create default DataTypes

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/lib/defaultDataTypes.ts` 作成
- [ ] character（キャラクター）データタイプ
- [ ] job（職業）データタイプ
- [ ] skill（スキル）データタイプ
- [ ] item（アイテム）データタイプ
- [ ] enemy（敵）データタイプ
- [ ] enemyGroup（敵グループ）データタイプ
- [ ] status（ステータス異常）データタイプ
- [ ] element（属性）データタイプ
- [ ] 初期化時に登録
- [ ] テスト追加

**関連ファイル:**

- `src/lib/defaultDataTypes.ts`
- `src/lib/defaultDataTypes.test.ts`

---

## Phase 8: イベントシステム（中〜大）

### 基本アクション実装

#### [T098] [P] Implement MessageAction

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/actions/MessageAction.ts` 作成
- [ ] EventAction を継承
- [ ] プロパティ: text, faceImageId, faceName, position
- [ ] execute(): メッセージ表示、入力待ち
- [ ] レジストリに登録
- [ ] テスト追加

**関連ファイル:**

- `src/types/actions/MessageAction.ts`
- `src/types/actions/MessageAction.test.ts`

---

#### [T099] [P] Implement ChoiceAction

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/actions/ChoiceAction.ts` 作成
- [ ] EventAction を継承
- [ ] プロパティ: choices, cancelIndex
- [ ] execute(): 選択肢表示、結果を context に保存
- [ ] レジストリに登録
- [ ] テスト追加

**関連ファイル:**

- `src/types/actions/ChoiceAction.ts`
- `src/types/actions/ChoiceAction.test.ts`

---

#### [T100] [P] Implement VariableOpAction

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/actions/VariableOpAction.ts` 作成
- [ ] EventAction を継承
- [ ] プロパティ: variableId, operation, value
- [ ] operation: set, add, subtract, multiply, divide
- [ ] execute(): 変数を操作
- [ ] レジストリに登録
- [ ] テスト追加

**関連ファイル:**

- `src/types/actions/VariableOpAction.ts`
- `src/types/actions/VariableOpAction.test.ts`

---

#### [T101] [P] Implement ConditionalAction

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/actions/ConditionalAction.ts` 作成
- [ ] EventAction を継承
- [ ] プロパティ: condition, thenActions, elseActions
- [ ] execute(): 条件評価、分岐実行
- [ ] ネスト対応
- [ ] レジストリに登録
- [ ] テスト追加

**関連ファイル:**

- `src/types/actions/ConditionalAction.ts`
- `src/types/actions/ConditionalAction.test.ts`

---

#### [T102] [P] Implement LoopAction

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/actions/LoopAction.ts` 作成
- [ ] EventAction を継承
- [ ] プロパティ: count, actions
- [ ] execute(): 指定回数ループ
- [ ] break 対応
- [ ] レジストリに登録
- [ ] テスト追加

**関連ファイル:**

- `src/types/actions/LoopAction.ts`
- `src/types/actions/LoopAction.test.ts`

---

#### [T103] [P] Implement WaitAction

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/actions/WaitAction.ts` 作成
- [ ] EventAction を継承
- [ ] プロパティ: frames
- [ ] execute(): 指定フレーム待機
- [ ] レジストリに登録
- [ ] テスト追加

**関連ファイル:**

- `src/types/actions/WaitAction.ts`
- `src/types/actions/WaitAction.test.ts`

---

#### [T104] [P] Implement PlaySEAction

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/actions/PlaySEAction.ts` 作成
- [ ] EventAction を継承
- [ ] プロパティ: audioId, volume, pitch
- [ ] execute(): SE 再生
- [ ] レジストリに登録
- [ ] テスト追加

**関連ファイル:**

- `src/types/actions/PlaySEAction.ts`
- `src/types/actions/PlaySEAction.test.ts`

---

#### [T105] [P] Implement PlayBGMAction

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/actions/PlayBGMAction.ts` 作成
- [ ] EventAction を継承
- [ ] プロパティ: audioId, volume, fadeIn
- [ ] execute(): BGM 再生
- [ ] レジストリに登録
- [ ] テスト追加

**関連ファイル:**

- `src/types/actions/PlayBGMAction.ts`
- `src/types/actions/PlayBGMAction.test.ts`

---

#### [T106] [P] Implement StopBGMAction

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/actions/StopBGMAction.ts` 作成
- [ ] EventAction を継承
- [ ] プロパティ: fadeOut
- [ ] execute(): BGM 停止
- [ ] レジストリに登録
- [ ] テスト追加

**関連ファイル:**

- `src/types/actions/StopBGMAction.ts`
- `src/types/actions/StopBGMAction.test.ts`

---

#### [T107] [P] Implement FadeScreenAction

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/actions/FadeScreenAction.ts` 作成
- [ ] EventAction を継承
- [ ] プロパティ: type (in/out), duration, color
- [ ] execute(): 画面フェード
- [ ] レジストリに登録
- [ ] テスト追加

**関連ファイル:**

- `src/types/actions/FadeScreenAction.ts`
- `src/types/actions/FadeScreenAction.test.ts`

---

#### [T108] [P] Implement CallScriptAction

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/actions/CallScriptAction.ts` 作成
- [ ] EventAction を継承
- [ ] プロパティ: scriptId, args
- [ ] execute(): スクリプト呼び出し
- [ ] レジストリに登録
- [ ] テスト追加

**関連ファイル:**

- `src/types/actions/CallScriptAction.ts`
- `src/types/actions/CallScriptAction.test.ts`

---

#### [T109] [P] Implement CallTemplateAction

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/actions/CallTemplateAction.ts` 作成
- [ ] EventAction を継承
- [ ] プロパティ: templateId, args
- [ ] execute(): テンプレート呼び出し
- [ ] レジストリに登録
- [ ] テスト追加

**関連ファイル:**

- `src/types/actions/CallTemplateAction.ts`
- `src/types/actions/CallTemplateAction.test.ts`

---

#### [T109a] [P] Implement InputAction

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/actions/InputAction.ts` 作成
- [ ] EventAction を継承
- [ ] プロパティ: variableId, inputType (number/text), min, max
- [ ] execute(): 入力待ち、変数に保存
- [ ] レジストリに登録
- [ ] テスト追加

**関連ファイル:**

- `src/types/actions/InputAction.ts`
- `src/types/actions/InputAction.test.ts`

---

#### [T109b] [P] Implement ChangeMapAction

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/actions/ChangeMapAction.ts` 作成
- [ ] EventAction を継承
- [ ] プロパティ: mapId, x, y, fadeType
- [ ] execute(): マップ移動
- [ ] レジストリに登録
- [ ] テスト追加

**関連ファイル:**

- `src/types/actions/ChangeMapAction.ts`
- `src/types/actions/ChangeMapAction.test.ts`

---

#### [T109c] [P] Implement MoveAction

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/actions/MoveAction.ts` 作成
- [ ] EventAction を継承
- [ ] プロパティ: targetId, path, speed
- [ ] execute(): オブジェクト移動
- [ ] レジストリに登録
- [ ] テスト追加

**関連ファイル:**

- `src/types/actions/MoveAction.ts`
- `src/types/actions/MoveAction.test.ts`

---

#### [T109d] [P] Implement AppearanceChangeAction

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/actions/AppearanceChangeAction.ts` 作成
- [ ] EventAction を継承
- [ ] プロパティ: targetId, imageId, animationId
- [ ] execute(): 見た目変更
- [ ] レジストリに登録
- [ ] テスト追加

**関連ファイル:**

- `src/types/actions/AppearanceChangeAction.ts`
- `src/types/actions/AppearanceChangeAction.test.ts`

---

#### [T109e] [P] Implement SaveAction

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/actions/SaveAction.ts` 作成
- [ ] EventAction を継承
- [ ] プロパティ: slotId（省略時は選択UI）
- [ ] execute(): ゲームセーブ
- [ ] レジストリに登録
- [ ] テスト追加

**関連ファイル:**

- `src/types/actions/SaveAction.ts`
- `src/types/actions/SaveAction.test.ts`

---

#### [T109f] [P] Implement LoadAction

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/actions/LoadAction.ts` 作成
- [ ] EventAction を継承
- [ ] プロパティ: slotId（省略時は選択UI）
- [ ] execute(): ゲームロード
- [ ] レジストリに登録
- [ ] テスト追加

**関連ファイル:**

- `src/types/actions/LoadAction.ts`
- `src/types/actions/LoadAction.test.ts`

---

### US9: イベントテンプレートページ

#### [T110] [US9] Create eventSlice

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/stores/eventSlice.ts` 作成
- [ ] `events: GameEvent[]` 状態
- [ ] `eventTemplates: EventTemplate[]` 状態
- [ ] CRUD アクション
- [ ] テスト追加

**関連ファイル:**

- `src/stores/eventSlice.ts`
- `src/stores/eventSlice.test.ts`

---

#### [T111] [US9] Create EventTemplatePage

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/app/(editor)/map/templates/page.tsx` 作成
- [ ] ThreeColumnLayout 使用
- [ ] 左: テンプレート一覧、中央: ブロックエディタ、右: プロパティ

**関連ファイル:**

- `src/app/(editor)/map/templates/page.tsx`

---

#### [T112] [US9] Create EventTemplateList

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/event-editor/components/EventTemplateList.tsx` 作成
- [ ] テンプレート一覧表示
- [ ] 追加/削除ボタン
- [ ] テスト追加

**関連ファイル:**

- `src/features/event-editor/components/EventTemplateList.tsx`
- `src/features/event-editor/components/EventTemplateList.test.tsx`

---

#### [T113] [US9] Create EventTemplateEditor

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/event-editor/components/EventTemplateEditor.tsx` 作成
- [ ] テンプレート名編集
- [ ] 引数一覧編集
- [ ] アクションブロック編集
- [ ] テスト追加

**関連ファイル:**

- `src/features/event-editor/components/EventTemplateEditor.tsx`
- `src/features/event-editor/components/EventTemplateEditor.test.tsx`

---

#### [T114] [US9] Create TemplateArgEditor

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/event-editor/components/TemplateArgEditor.tsx` 作成
- [ ] 引数名入力
- [ ] 引数型選択（FieldType）
- [ ] 必須フラグ
- [ ] デフォルト値設定
- [ ] テスト追加

**関連ファイル:**

- `src/features/event-editor/components/TemplateArgEditor.tsx`
- `src/features/event-editor/components/TemplateArgEditor.test.tsx`

---

#### [T115] [US9] Create ActionBlockEditor

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/event-editor/components/ActionBlockEditor.tsx` 作成
- [ ] アクションブロック一覧表示
- [ ] ドラッグ&ドロップ並び替え
- [ ] ブロックの追加/削除
- [ ] ネスト表示（条件分岐、ループ）
- [ ] テスト追加

**関連ファイル:**

- `src/features/event-editor/components/ActionBlockEditor.tsx`
- `src/features/event-editor/components/ActionBlockEditor.test.tsx`

---

#### [T116] [US9] Create ActionSelector modal

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/event-editor/components/ActionSelector.tsx` 作成
- [ ] 登録済みアクション一覧
- [ ] カテゴリ分類（ロジック、基礎、スクリプト、テンプレート）
- [ ] 検索フィルター
- [ ] テスト追加

**関連ファイル:**

- `src/features/event-editor/components/ActionSelector.tsx`
- `src/features/event-editor/components/ActionSelector.test.tsx`

---

#### [T117] [US9] Define GameEvent and EventTemplate types

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/event.ts` 作成
- [ ] `GameEvent` インターフェース定義
- [ ] `EventTemplate` インターフェース定義
- [ ] `TemplateArg` インターフェース定義

**関連ファイル:**

- `src/types/event.ts`

**参照:**

- design.md#4.6-イベント・テンプレート構造

---

### アクションブロックエディタ

#### [T118] [P] Create MessageActionBlock

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/event-editor/components/blocks/MessageActionBlock.tsx` 作成
- [ ] メッセージテキスト表示/編集
- [ ] 顔グラフィック設定
- [ ] プレビュー
- [ ] テスト追加

**関連ファイル:**

- `src/features/event-editor/components/blocks/MessageActionBlock.tsx`
- `src/features/event-editor/components/blocks/MessageActionBlock.test.tsx`

---

#### [T119] [P] Create ChoiceActionBlock

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/event-editor/components/blocks/ChoiceActionBlock.tsx` 作成
- [ ] 選択肢一覧表示/編集
- [ ] 選択肢の追加/削除
- [ ] テスト追加

**関連ファイル:**

- `src/features/event-editor/components/blocks/ChoiceActionBlock.tsx`
- `src/features/event-editor/components/blocks/ChoiceActionBlock.test.tsx`

---

#### [T120] [P] Create VariableOpActionBlock

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/event-editor/components/blocks/VariableOpActionBlock.tsx` 作成
- [ ] 変数選択
- [ ] 演算子選択
- [ ] 値入力
- [ ] テスト追加

**関連ファイル:**

- `src/features/event-editor/components/blocks/VariableOpActionBlock.tsx`
- `src/features/event-editor/components/blocks/VariableOpActionBlock.test.tsx`

---

#### [T121] [P] Create ConditionalActionBlock

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/event-editor/components/blocks/ConditionalActionBlock.tsx` 作成
- [ ] 条件設定 UI
- [ ] Then/Else ブランチ表示
- [ ] ネスト対応
- [ ] テスト追加

**関連ファイル:**

- `src/features/event-editor/components/blocks/ConditionalActionBlock.tsx`
- `src/features/event-editor/components/blocks/ConditionalActionBlock.test.tsx`

---

#### [T122] [P] Create LoopActionBlock

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/event-editor/components/blocks/LoopActionBlock.tsx` 作成
- [ ] ループ回数設定
- [ ] 子アクション表示
- [ ] テスト追加

**関連ファイル:**

- `src/features/event-editor/components/blocks/LoopActionBlock.tsx`
- `src/features/event-editor/components/blocks/LoopActionBlock.test.tsx`

---

#### [T122a] [P] Create WaitActionBlock

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/event-editor/components/blocks/WaitActionBlock.tsx` 作成
- [ ] フレーム数入力
- [ ] テスト追加

**関連ファイル:**

- `src/features/event-editor/components/blocks/WaitActionBlock.tsx`
- `src/features/event-editor/components/blocks/WaitActionBlock.test.tsx`

---

#### [T122b] [P] Create PlaySEActionBlock

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/event-editor/components/blocks/PlaySEActionBlock.tsx` 作成
- [ ] 音声ファイル選択
- [ ] ボリューム/ピッチ設定
- [ ] 試聴ボタン
- [ ] テスト追加

**関連ファイル:**

- `src/features/event-editor/components/blocks/PlaySEActionBlock.tsx`
- `src/features/event-editor/components/blocks/PlaySEActionBlock.test.tsx`

---

#### [T122c] [P] Create PlayBGMActionBlock

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/event-editor/components/blocks/PlayBGMActionBlock.tsx` 作成
- [ ] BGM選択
- [ ] ボリューム/フェードイン設定
- [ ] テスト追加

**関連ファイル:**

- `src/features/event-editor/components/blocks/PlayBGMActionBlock.tsx`
- `src/features/event-editor/components/blocks/PlayBGMActionBlock.test.tsx`

---

#### [T122d] [P] Create StopBGMActionBlock

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/event-editor/components/blocks/StopBGMActionBlock.tsx` 作成
- [ ] フェードアウト設定
- [ ] テスト追加

**関連ファイル:**

- `src/features/event-editor/components/blocks/StopBGMActionBlock.tsx`
- `src/features/event-editor/components/blocks/StopBGMActionBlock.test.tsx`

---

#### [T122e] [P] Create FadeScreenActionBlock

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/event-editor/components/blocks/FadeScreenActionBlock.tsx` 作成
- [ ] フェードタイプ選択
- [ ] 時間/色設定
- [ ] テスト追加

**関連ファイル:**

- `src/features/event-editor/components/blocks/FadeScreenActionBlock.tsx`
- `src/features/event-editor/components/blocks/FadeScreenActionBlock.test.tsx`

---

#### [T122f] [P] Create CallScriptActionBlock

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/event-editor/components/blocks/CallScriptActionBlock.tsx` 作成
- [ ] スクリプト選択
- [ ] 引数設定
- [ ] テスト追加

**関連ファイル:**

- `src/features/event-editor/components/blocks/CallScriptActionBlock.tsx`
- `src/features/event-editor/components/blocks/CallScriptActionBlock.test.tsx`

---

#### [T122g] [P] Create CallTemplateActionBlock

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/event-editor/components/blocks/CallTemplateActionBlock.tsx` 作成
- [ ] テンプレート選択
- [ ] 引数設定 UI
- [ ] テスト追加

**関連ファイル:**

- `src/features/event-editor/components/blocks/CallTemplateActionBlock.tsx`
- `src/features/event-editor/components/blocks/CallTemplateActionBlock.test.tsx`

---

#### [T122h] [P] Create InputActionBlock

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/event-editor/components/blocks/InputActionBlock.tsx` 作成
- [ ] 入力タイプ選択
- [ ] 保存先変数選択
- [ ] テスト追加

**関連ファイル:**

- `src/features/event-editor/components/blocks/InputActionBlock.tsx`
- `src/features/event-editor/components/blocks/InputActionBlock.test.tsx`

---

#### [T122i] [P] Create ChangeMapActionBlock

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/event-editor/components/blocks/ChangeMapActionBlock.tsx` 作成
- [ ] マップ選択
- [ ] 座標設定
- [ ] フェード設定
- [ ] テスト追加

**関連ファイル:**

- `src/features/event-editor/components/blocks/ChangeMapActionBlock.tsx`
- `src/features/event-editor/components/blocks/ChangeMapActionBlock.test.tsx`

---

#### [T122j] [P] Create MoveActionBlock

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/event-editor/components/blocks/MoveActionBlock.tsx` 作成
- [ ] 対象選択
- [ ] 移動パス設定
- [ ] テスト追加

**関連ファイル:**

- `src/features/event-editor/components/blocks/MoveActionBlock.tsx`
- `src/features/event-editor/components/blocks/MoveActionBlock.test.tsx`

---

#### [T122k] [P] Create AppearanceChangeActionBlock

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/event-editor/components/blocks/AppearanceChangeActionBlock.tsx` 作成
- [ ] 対象選択
- [ ] 画像/アニメーション選択
- [ ] テスト追加

**関連ファイル:**

- `src/features/event-editor/components/blocks/AppearanceChangeActionBlock.tsx`
- `src/features/event-editor/components/blocks/AppearanceChangeActionBlock.test.tsx`

---

#### [T122l] [P] Create SaveActionBlock

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/event-editor/components/blocks/SaveActionBlock.tsx` 作成
- [ ] スロット選択
- [ ] テスト追加

**関連ファイル:**

- `src/features/event-editor/components/blocks/SaveActionBlock.tsx`
- `src/features/event-editor/components/blocks/SaveActionBlock.test.tsx`

---

#### [T122m] [P] Create LoadActionBlock

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/event-editor/components/blocks/LoadActionBlock.tsx` 作成
- [ ] スロット選択
- [ ] テスト追加

**関連ファイル:**

- `src/features/event-editor/components/blocks/LoadActionBlock.tsx`
- `src/features/event-editor/components/blocks/LoadActionBlock.test.tsx`

---

## Phase 9: スクリプトエディタ（大）

### US10: スクリプトページ

#### [T123] [US10] Create scriptSlice

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/stores/scriptSlice.ts` 作成
- [ ] `scripts: Script[]` 状態
- [ ] CRUD アクション
- [ ] 階層構造（内部スクリプト）対応
- [ ] テスト追加

**関連ファイル:**

- `src/stores/scriptSlice.ts`
- `src/stores/scriptSlice.test.ts`

---

#### [T124] [US10] Create EventScriptPage

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/app/(editor)/script/event/page.tsx` 作成
- [ ] ThreeColumnLayout 使用
- [ ] 左: スクリプト一覧、中央: エディタ、右: 設定

**関連ファイル:**

- `src/app/(editor)/script/event/page.tsx`

---

#### [T125] [US10] Create ComponentScriptPage

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/app/(editor)/script/component/page.tsx` 作成
- [ ] EventScriptPage と同様のレイアウト
- [ ] コンポーネント用フィールド設定

**関連ファイル:**

- `src/app/(editor)/script/component/page.tsx`

---

#### [T126] [US10] Create ScriptList

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/script-editor/components/ScriptList.tsx` 作成
- [ ] 階層構造表示
- [ ] 親スクリプト + 内部スクリプト
- [ ] 追加/削除ボタン
- [ ] テスト追加

**関連ファイル:**

- `src/features/script-editor/components/ScriptList.tsx`
- `src/features/script-editor/components/ScriptList.test.tsx`

---

#### [T127] [US10] Create ScriptEditor (Monaco wrapper)

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/script-editor/components/ScriptEditor.tsx` 作成
- [ ] Monaco Editor 統合
- [ ] JavaScript/TypeScript シンタックスハイライト
- [ ] エラー表示
- [ ] 自動補完
- [ ] テスト追加

**関連ファイル:**

- `src/features/script-editor/components/ScriptEditor.tsx`
- `src/features/script-editor/components/ScriptEditor.test.tsx`

---

#### [T128] [US10] Create ScriptSettingsPanel

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/script-editor/components/ScriptSettingsPanel.tsx` 作成
- [ ] スクリプト名編集
- [ ] 引数定義（イベントスクリプト）
- [ ] フィールド定義（コンポーネントスクリプト）
- [ ] テスト追加

**関連ファイル:**

- `src/features/script-editor/components/ScriptSettingsPanel.tsx`
- `src/features/script-editor/components/ScriptSettingsPanel.test.tsx`

---

#### [T129] [US10] Create ScriptTestPanel

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/script-editor/components/ScriptTestPanel.tsx` 作成
- [ ] テスト実行ボタン
- [ ] 引数入力 UI
- [ ] 実行結果表示
- [ ] コンソール出力表示
- [ ] テスト追加

**関連ファイル:**

- `src/features/script-editor/components/ScriptTestPanel.tsx`
- `src/features/script-editor/components/ScriptTestPanel.test.tsx`

---

#### [T130] [US10] Create InternalScriptList

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/script-editor/components/InternalScriptList.tsx` 作成
- [ ] 内部スクリプト一覧
- [ ] 追加/削除
- [ ] テスト追加

**関連ファイル:**

- `src/features/script-editor/components/InternalScriptList.tsx`
- `src/features/script-editor/components/InternalScriptList.test.tsx`

---

#### [T131] [US10] Define Script types

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/script.ts` 作成
- [ ] `Script` インターフェース
- [ ] `ScriptType` ('event' | 'component' | 'internal')
- [ ] `ScriptArg` インターフェース

**関連ファイル:**

- `src/types/script.ts`

---

#### [T132] [US10] Implement API autocomplete definitions

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/script-editor/utils/apiDefinitions.ts` 作成
- [ ] ゲームAPI の型定義（Data, Variable, Sound, etc.）
- [ ] Monaco Editor への登録
- [ ] ホバー時のドキュメント表示
- [ ] テスト追加

**関連ファイル:**

- `src/features/script-editor/utils/apiDefinitions.ts`
- `src/features/script-editor/utils/apiDefinitions.test.ts`

---

## Phase 10: マップ基盤（大）

### コンポーネント定義

#### [T133] [P] Implement TransformComponent

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/components/TransformComponent.ts` 作成
- [ ] Component を継承
- [ ] プロパティ: x, y, rotation, scaleX, scaleY
- [ ] レジストリに登録
- [ ] テスト追加

**関連ファイル:**

- `src/types/components/TransformComponent.ts`
- `src/types/components/TransformComponent.test.ts`

---

#### [T134] [P] Implement SpriteComponent

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/components/SpriteComponent.ts` 作成
- [ ] Component を継承
- [ ] プロパティ: imageId, animationId, flipX, flipY, tint, opacity
- [ ] レジストリに登録
- [ ] テスト追加

**関連ファイル:**

- `src/types/components/SpriteComponent.ts`
- `src/types/components/SpriteComponent.test.ts`

---

#### [T135] [P] Implement ColliderComponent

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/components/ColliderComponent.ts` 作成
- [ ] Component を継承
- [ ] プロパティ: width, height, passable, layer
- [ ] グリッド単位
- [ ] レジストリに登録
- [ ] テスト追加

**関連ファイル:**

- `src/types/components/ColliderComponent.ts`
- `src/types/components/ColliderComponent.test.ts`

---

#### [T136] [P] Implement MovementComponent

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/components/MovementComponent.ts` 作成
- [ ] Component を継承
- [ ] プロパティ: pattern, speed, routePoints
- [ ] pattern: fixed, random, route
- [ ] レジストリに登録
- [ ] テスト追加

**関連ファイル:**

- `src/types/components/MovementComponent.ts`
- `src/types/components/MovementComponent.test.ts`

---

#### [T137] [P] Implement VariablesComponent

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/components/VariablesComponent.ts` 作成
- [ ] Component を継承
- [ ] プロパティ: variables
- [ ] オブジェクト専用変数の管理
- [ ] レジストリに登録
- [ ] テスト追加

**関連ファイル:**

- `src/types/components/VariablesComponent.ts`
- `src/types/components/VariablesComponent.test.ts`

---

#### [T138] [P] Implement ControllerComponent

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/components/ControllerComponent.ts` 作成
- [ ] Component を継承
- [ ] プロパティ: moveSpeed, dashEnabled, inputEnabled
- [ ] プレイヤー操作可能化
- [ ] レジストリに登録
- [ ] テスト追加

**関連ファイル:**

- `src/types/components/ControllerComponent.ts`
- `src/types/components/ControllerComponent.test.ts`

---

#### [T139] [P] Implement EffectComponent

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/components/EffectComponent.ts` 作成
- [ ] Component を継承
- [ ] プロパティ: effectId, onComplete
- [ ] onComplete: delete, hide, none
- [ ] レジストリに登録
- [ ] テスト追加

**関連ファイル:**

- `src/types/components/EffectComponent.ts`
- `src/types/components/EffectComponent.test.ts`

---

#### [T140] [P] Implement ObjectCanvasComponent

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/components/ObjectCanvasComponent.ts` 作成
- [ ] Component を継承
- [ ] プロパティ: offset, elements
- [ ] UI要素の配置
- [ ] レジストリに登録
- [ ] テスト追加

**関連ファイル:**

- `src/types/components/ObjectCanvasComponent.ts`
- `src/types/components/ObjectCanvasComponent.test.ts`

---

### トリガーコンポーネント（タイプ別）

#### [T141] [P] Implement TalkTriggerComponent

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/components/triggers/TalkTriggerComponent.ts` 作成
- [ ] Component を継承
- [ ] プロパティ: eventId, direction
- [ ] direction: front, any
- [ ] レジストリに登録
- [ ] テスト追加

**関連ファイル:**

- `src/types/components/triggers/TalkTriggerComponent.ts`
- `src/types/components/triggers/TalkTriggerComponent.test.ts`

---

#### [T142] [P] Implement TouchTriggerComponent

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/components/triggers/TouchTriggerComponent.ts` 作成
- [ ] Component を継承
- [ ] プロパティ: eventId
- [ ] レジストリに登録
- [ ] テスト追加

**関連ファイル:**

- `src/types/components/triggers/TouchTriggerComponent.ts`
- `src/types/components/triggers/TouchTriggerComponent.test.ts`

---

#### [T143] [P] Implement StepTriggerComponent

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/components/triggers/StepTriggerComponent.ts` 作成
- [ ] Component を継承
- [ ] プロパティ: eventId
- [ ] レジストリに登録
- [ ] テスト追加

**関連ファイル:**

- `src/types/components/triggers/StepTriggerComponent.ts`
- `src/types/components/triggers/StepTriggerComponent.test.ts`

---

#### [T144] [P] Implement AutoTriggerComponent

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/components/triggers/AutoTriggerComponent.ts` 作成
- [ ] Component を継承
- [ ] プロパティ: eventId, interval, runOnce
- [ ] レジストリに登録
- [ ] テスト追加

**関連ファイル:**

- `src/types/components/triggers/AutoTriggerComponent.ts`
- `src/types/components/triggers/AutoTriggerComponent.test.ts`

---

#### [T144a] [P] Implement InputTriggerComponent

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/components/triggers/InputTriggerComponent.ts` 作成
- [ ] Component を継承
- [ ] プロパティ: eventId, key
- [ ] 特定キー入力で発火
- [ ] レジストリに登録
- [ ] テスト追加

**関連ファイル:**

- `src/types/components/triggers/InputTriggerComponent.ts`
- `src/types/components/triggers/InputTriggerComponent.test.ts`

---

### マップ型定義

#### [T145] Define GameMap, MapLayer, MapObject types

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/map.ts` 作成
- [ ] `GameMap` インターフェース
- [ ] `MapLayer` インターフェース
- [ ] `MapObject` インターフェース

**関連ファイル:**

- `src/types/map.ts`

**参照:**

- design.md#4.4-マップ構造

---

## Phase 11: マップデータページ（中）

### US11: マップデータ

#### [T146] [US11] Create mapSlice

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/stores/mapSlice.ts` 作成
- [ ] `maps: GameMap[]` 状態
- [ ] `chipsets: Chipset[]` 状態
- [ ] CRUD アクション
- [ ] タイル操作アクション
- [ ] テスト追加

**関連ファイル:**

- `src/stores/mapSlice.ts`
- `src/stores/mapSlice.test.ts`

---

#### [T147] [US11] Create MapDataPage

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/app/(editor)/map/data/page.tsx` 作成
- [ ] ThreeColumnLayout 使用
- [ ] 左: マップ一覧、中央: 設定、右: チップセット

**関連ファイル:**

- `src/app/(editor)/map/data/page.tsx`

---

#### [T148] [US11] Create MapList

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/map-editor/components/MapList.tsx` 作成
- [ ] マップ一覧表示
- [ ] 追加/削除ボタン
- [ ] ドラッグ&ドロップ並び替え
- [ ] テスト追加

**関連ファイル:**

- `src/features/map-editor/components/MapList.tsx`
- `src/features/map-editor/components/MapList.test.tsx`

---

#### [T149] [US11] Create MapSettingsEditor

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/map-editor/components/MapSettingsEditor.tsx` 作成
- [ ] マップ名編集
- [ ] マップID編集
- [ ] サイズ設定（幅 x 高さ）
- [ ] BGM 選択
- [ ] 背景画像選択
- [ ] テスト追加

**関連ファイル:**

- `src/features/map-editor/components/MapSettingsEditor.tsx`
- `src/features/map-editor/components/MapSettingsEditor.test.tsx`

---

#### [T150] [US11] Create LayerEditor

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/map-editor/components/LayerEditor.tsx` 作成
- [ ] レイヤー一覧
- [ ] 追加/削除/並び替え
- [ ] 表示/非表示トグル
- [ ] タイプ切り替え（tile/object）
- [ ] テスト追加

**関連ファイル:**

- `src/features/map-editor/components/LayerEditor.tsx`
- `src/features/map-editor/components/LayerEditor.test.tsx`

---

#### [T151] [US11] Create ChipsetEditor

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/map-editor/components/ChipsetEditor.tsx` 作成
- [ ] チップセット画像選択
- [ ] タイルサイズ設定
- [ ] チップ一覧表示
- [ ] テスト追加

**関連ファイル:**

- `src/features/map-editor/components/ChipsetEditor.tsx`
- `src/features/map-editor/components/ChipsetEditor.test.tsx`

---

#### [T152] [US11] Create ChipPropertyEditor

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/map-editor/components/ChipPropertyEditor.tsx` 作成
- [ ] チップ選択時のプロパティ編集
- [ ] 通行設定
- [ ] 足音設定
- [ ] テスト追加

**関連ファイル:**

- `src/features/map-editor/components/ChipPropertyEditor.tsx`
- `src/features/map-editor/components/ChipPropertyEditor.test.tsx`

---

## Phase 12: オブジェクトプレハブ（中）

### US12: プレハブページ

#### [T153] [US12] Create prefabSlice

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/stores/prefabSlice.ts` 作成
- [ ] `prefabs: Prefab[]` 状態
- [ ] CRUD アクション
- [ ] テスト追加

**関連ファイル:**

- `src/stores/prefabSlice.ts`
- `src/stores/prefabSlice.test.ts`

---

#### [T154] [US12] Create PrefabPage

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/app/(editor)/map/prefabs/page.tsx` 作成
- [ ] ThreeColumnLayout 使用

**関連ファイル:**

- `src/app/(editor)/map/prefabs/page.tsx`

---

#### [T155] [US12] Create PrefabList

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/map-editor/components/PrefabList.tsx` 作成
- [ ] プレハブ一覧表示
- [ ] 追加/削除ボタン
- [ ] テスト追加

**関連ファイル:**

- `src/features/map-editor/components/PrefabList.tsx`
- `src/features/map-editor/components/PrefabList.test.tsx`

---

#### [T156] [US12] Create PrefabPreview

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/map-editor/components/PrefabPreview.tsx` 作成
- [ ] プレハブのプレビュー表示
- [ ] Sprite 表示
- [ ] テスト追加

**関連ファイル:**

- `src/features/map-editor/components/PrefabPreview.tsx`
- `src/features/map-editor/components/PrefabPreview.test.tsx`

---

#### [T157] [US12] Create ComponentEditor

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/map-editor/components/ComponentEditor.tsx` 作成
- [ ] コンポーネント一覧表示
- [ ] 各コンポーネントの renderPropertyPanel() 呼び出し
- [ ] コンポーネントの追加/削除
- [ ] テスト追加

**関連ファイル:**

- `src/features/map-editor/components/ComponentEditor.tsx`
- `src/features/map-editor/components/ComponentEditor.test.tsx`

---

#### [T158] [US12] Create ComponentSelector modal

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/map-editor/components/ComponentSelector.tsx` 作成
- [ ] 登録済みコンポーネント一覧
- [ ] カテゴリ分類
- [ ] 検索フィルター
- [ ] テスト追加

**関連ファイル:**

- `src/features/map-editor/components/ComponentSelector.tsx`
- `src/features/map-editor/components/ComponentSelector.test.tsx`

---

## Phase 13: マップ編集ページ（大）

### US13: マップ編集

#### [T159] [US13] Create MapEditPage

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/app/(editor)/map/page.tsx` 作成
- [ ] ThreeColumnLayout 使用
- [ ] 左: パレット、中央: キャンバス、右: プロパティ

**関連ファイル:**

- `src/app/(editor)/map/page.tsx`

---

#### [T160] [US13] Create MapCanvas

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/map-editor/components/MapCanvas.tsx` 作成
- [ ] Canvas/WebGL でマップ描画
- [ ] タイルレイヤー表示
- [ ] オブジェクトレイヤー表示
- [ ] グリッド表示切り替え
- [ ] ズーム/パン対応
- [ ] テスト追加

**関連ファイル:**

- `src/features/map-editor/components/MapCanvas.tsx`
- `src/features/map-editor/components/MapCanvas.test.tsx`

---

#### [T161] [US13] Create ChipPalette

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/map-editor/components/ChipPalette.tsx` 作成
- [ ] チップセット画像からタイル選択
- [ ] 選択範囲表示
- [ ] 複数タイル選択（スタンプ用）
- [ ] テスト追加

**関連ファイル:**

- `src/features/map-editor/components/ChipPalette.tsx`
- `src/features/map-editor/components/ChipPalette.test.tsx`

---

#### [T162] [US13] Create LayerTabs

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/map-editor/components/LayerTabs.tsx` 作成
- [ ] レイヤータブ表示
- [ ] 選択切り替え
- [ ] 表示/非表示トグル
- [ ] テスト追加

**関連ファイル:**

- `src/features/map-editor/components/LayerTabs.tsx`
- `src/features/map-editor/components/LayerTabs.test.tsx`

---

#### [T163] [US13] Create MapToolbar

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/map-editor/components/MapToolbar.tsx` 作成
- [ ] ツール選択（選択、ペン、消しゴム、塗りつぶし、矩形）
- [ ] ズームコントロール
- [ ] グリッド表示トグル
- [ ] テスト追加

**関連ファイル:**

- `src/features/map-editor/components/MapToolbar.tsx`
- `src/features/map-editor/components/MapToolbar.test.tsx`

---

#### [T164] [US13] Create ObjectList

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/map-editor/components/ObjectList.tsx` 作成
- [ ] マップ内オブジェクト一覧
- [ ] プレハブからのインスタンス表示
- [ ] 選択/削除
- [ ] テスト追加

**関連ファイル:**

- `src/features/map-editor/components/ObjectList.tsx`
- `src/features/map-editor/components/ObjectList.test.tsx`

---

#### [T165] [US13] Create MapPropertyPanel

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/map-editor/components/MapPropertyPanel.tsx` 作成
- [ ] 選択オブジェクトのプロパティ表示
- [ ] コンポーネント編集
- [ ] オーバーライド管理
- [ ] テスト追加

**関連ファイル:**

- `src/features/map-editor/components/MapPropertyPanel.tsx`
- `src/features/map-editor/components/MapPropertyPanel.test.tsx`

---

### マップ編集フック

#### [T166] [US13] Create useMapCanvas hook

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/map-editor/hooks/useMapCanvas.ts` 作成
- [ ] Canvas 初期化
- [ ] レンダリングループ
- [ ] リサイズ対応
- [ ] テスト追加

**関連ファイル:**

- `src/features/map-editor/hooks/useMapCanvas.ts`
- `src/features/map-editor/hooks/useMapCanvas.test.ts`

---

#### [T167] [US13] Create useTilePainting hook

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/map-editor/hooks/useTilePainting.ts` 作成
- [ ] マウスイベント処理
- [ ] ツール別の描画処理
- [ ] アンドゥ対応
- [ ] テスト追加

**関連ファイル:**

- `src/features/map-editor/hooks/useTilePainting.ts`
- `src/features/map-editor/hooks/useTilePainting.test.ts`

---

#### [T168] [US13] Create useObjectPlacement hook

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/map-editor/hooks/useObjectPlacement.ts` 作成
- [ ] オブジェクト配置
- [ ] ドラッグ移動
- [ ] 削除
- [ ] テスト追加

**関連ファイル:**

- `src/features/map-editor/hooks/useObjectPlacement.ts`
- `src/features/map-editor/hooks/useObjectPlacement.test.ts`

---

#### [T169] [US13] Create useMapViewport hook

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/map-editor/hooks/useMapViewport.ts` 作成
- [ ] ズーム制御
- [ ] パン制御
- [ ] 座標変換
- [ ] テスト追加

**関連ファイル:**

- `src/features/map-editor/hooks/useMapViewport.ts`
- `src/features/map-editor/hooks/useMapViewport.test.ts`

---

### マップユーティリティ

#### [T170] [US13] Implement tile fill algorithm

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/map-editor/utils/tileFill.ts` 作成
- [ ] 塗りつぶしアルゴリズム（flood fill）
- [ ] パフォーマンス最適化
- [ ] テスト追加

**関連ファイル:**

- `src/features/map-editor/utils/tileFill.ts`
- `src/features/map-editor/utils/tileFill.test.ts`

---

#### [T171] [US13] Implement visible tile calculation

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/map-editor/utils/visibleTiles.ts` 作成
- [ ] ビューポート内のタイル計算
- [ ] カリング最適化
- [ ] テスト追加

**関連ファイル:**

- `src/features/map-editor/utils/visibleTiles.ts`
- `src/features/map-editor/utils/visibleTiles.test.ts`

---

### マップエディタキーボードショートカット

#### [T171a] [US13] Implement map editor shortcuts

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/map-editor/hooks/useMapShortcuts.ts` 作成
- [ ] B: ペンツール
- [ ] E: 消しゴム
- [ ] G: 塗りつぶし
- [ ] 1-9: レイヤー切り替え
- [ ] Ctrl+C/V: コピー/ペースト
- [ ] Delete: 選択削除
- [ ] テスト追加

**関連ファイル:**

- `src/features/map-editor/hooks/useMapShortcuts.ts`
- `src/features/map-editor/hooks/useMapShortcuts.test.ts`

---

#### [T171b] [US13] Implement multi-tile selection

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/map-editor/hooks/useMultiTileSelect.ts` 作成
- [ ] 範囲選択
- [ ] Shift+クリックで追加選択
- [ ] 選択範囲のハイライト
- [ ] テスト追加

**関連ファイル:**

- `src/features/map-editor/hooks/useMultiTileSelect.ts`
- `src/features/map-editor/hooks/useMultiTileSelect.test.ts`

---

#### [T171c] [US13] Implement tile copy/paste

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/map-editor/utils/tileCopyPaste.ts` 作成
- [ ] 選択範囲のコピー
- [ ] オフセット付きペースト
- [ ] テスト追加

**関連ファイル:**

- `src/features/map-editor/utils/tileCopyPaste.ts`
- `src/features/map-editor/utils/tileCopyPaste.test.ts`

---

### イベント編集モーダル

#### [T172] [US13] Create EventEditorModal

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/event-editor/components/EventEditorModal.tsx` 作成
- [ ] マップ上でオブジェクトをダブルクリックで開く
- [ ] イベント編集 UI 表示
- [ ] 保存/キャンセル
- [ ] テスト追加

**関連ファイル:**

- `src/features/event-editor/components/EventEditorModal.tsx`
- `src/features/event-editor/components/EventEditorModal.test.tsx`

---

## Phase 14: UI Foundation（UIComponent 定義）

### UIComponentベース

#### [T173] [P] Define UIComponent abstract class

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/ui/UIComponent.ts` 作成
- [ ] `type: string` 抽象プロパティ
- [ ] `serialize(): unknown` メソッド
- [ ] `deserialize(data: unknown): void` メソッド
- [ ] `clone(): UIComponent` メソッド
- [ ] `renderPropertyPanel(): React.ReactNode` メソッド
- [ ] テスト追加

**関連ファイル:**

- `src/types/ui/UIComponent.ts`
- `src/types/ui/UIComponent.test.ts`

---

#### [T174] [P] Define UIObject interface

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/ui/UIObject.ts` 作成
- [ ] `id`, `name`, `parentId`, `transform`, `components` プロパティ
- [ ] RectTransform 型定義
- [ ] テスト追加

**関連ファイル:**

- `src/types/ui/UIObject.ts`
- `src/types/ui/UIObject.test.ts`

---

### Visual Components

#### [T175] [P] Implement ImageComponent

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/ui/components/ImageComponent.ts` 作成
- [ ] `imageId`, `tint`, `flipX`, `flipY` プロパティ
- [ ] serialize/deserialize 実装
- [ ] PropertyPanel 実装
- [ ] テスト追加

**関連ファイル:**

- `src/types/ui/components/ImageComponent.ts`
- `src/types/ui/components/ImageComponent.test.ts`

---

#### [T176] [P] Implement TextComponent

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/ui/components/TextComponent.ts` 作成
- [ ] `text`, `fontSize`, `fontFamily`, `color`, `alignment` プロパティ
- [ ] 変数埋め込み `{variable}` サポート
- [ ] serialize/deserialize 実装
- [ ] PropertyPanel 実装
- [ ] テスト追加

**関連ファイル:**

- `src/types/ui/components/TextComponent.ts`
- `src/types/ui/components/TextComponent.test.ts`

---

#### [T177] [P] Implement NineSliceComponent

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/ui/components/NineSliceComponent.ts` 作成
- [ ] `imageId`, `borderSize` プロパティ
- [ ] 9スライスレンダリング対応
- [ ] serialize/deserialize 実装
- [ ] テスト追加

**関連ファイル:**

- `src/types/ui/components/NineSliceComponent.ts`
- `src/types/ui/components/NineSliceComponent.test.ts`

---

### Mask Components

#### [T178] [P] Implement FillMaskComponent

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/ui/components/FillMaskComponent.ts` 作成
- [ ] `fillAmount`, `fillDirection` プロパティ
- [ ] **オブジェクト自体をマスク**（子ではない）
- [ ] serialize/deserialize 実装
- [ ] テスト追加

**関連ファイル:**

- `src/types/ui/components/FillMaskComponent.ts`
- `src/types/ui/components/FillMaskComponent.test.ts`

---

#### [T179] [P] Implement ScrollMaskComponent

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/ui/components/ScrollMaskComponent.ts` 作成
- [ ] `scrollX`, `scrollY` プロパティ
- [ ] スクロール領域マスク
- [ ] serialize/deserialize 実装
- [ ] テスト追加

**関連ファイル:**

- `src/types/ui/components/ScrollMaskComponent.ts`
- `src/types/ui/components/ScrollMaskComponent.test.ts`

---

#### [T180] [P] Implement ShapeMaskComponent

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/ui/components/ShapeMaskComponent.ts` 作成
- [ ] `shape: 'rect' | 'ellipse' | 'custom'`
- [ ] カスタムパスサポート
- [ ] serialize/deserialize 実装
- [ ] テスト追加

**関連ファイル:**

- `src/types/ui/components/ShapeMaskComponent.ts`
- `src/types/ui/components/ShapeMaskComponent.test.ts`

---

### Layout Components

#### [T181] [P] Implement LayoutGroupComponent

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/ui/components/LayoutGroupComponent.ts` 作成
- [ ] `direction: 'horizontal' | 'vertical'`
- [ ] `spacing`, `padding` プロパティ
- [ ] 子オブジェクト自動配置
- [ ] serialize/deserialize 実装
- [ ] テスト追加

**関連ファイル:**

- `src/types/ui/components/LayoutGroupComponent.ts`
- `src/types/ui/components/LayoutGroupComponent.test.ts`

---

#### [T182] [P] Implement GridLayoutComponent

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/ui/components/GridLayoutComponent.ts` 作成
- [ ] `columns`, `rows`, `cellSize` プロパティ
- [ ] グリッド配置
- [ ] serialize/deserialize 実装
- [ ] テスト追加

**関連ファイル:**

- `src/types/ui/components/GridLayoutComponent.ts`
- `src/types/ui/components/GridLayoutComponent.test.ts`

---

### Navigation Components

#### [T183] [P] Implement SelectableComponent

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/ui/components/SelectableComponent.ts` 作成
- [ ] `navigation: { up, down, left, right }` プロパティ
- [ ] フォーカス状態管理
- [ ] キーボード/ゲームパッドナビゲーション
- [ ] serialize/deserialize 実装
- [ ] テスト追加

**関連ファイル:**

- `src/types/ui/components/SelectableComponent.ts`
- `src/types/ui/components/SelectableComponent.test.ts`

---

### Action Components

#### [T184] [P] Implement ButtonComponent

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/ui/components/ButtonComponent.ts` 作成
- [ ] `onClick` イベントID
- [ ] 押下状態アニメーション
- [ ] serialize/deserialize 実装
- [ ] テスト追加

**関連ファイル:**

- `src/types/ui/components/ButtonComponent.ts`
- `src/types/ui/components/ButtonComponent.test.ts`

---

#### [T185] [P] Implement InputFieldComponent

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/ui/components/InputFieldComponent.ts` 作成
- [ ] `targetVariable`, `placeholder`, `maxLength` プロパティ
- [ ] 入力バリデーション
- [ ] serialize/deserialize 実装
- [ ] テスト追加

**関連ファイル:**

- `src/types/ui/components/InputFieldComponent.ts`
- `src/types/ui/components/InputFieldComponent.test.ts`

---

### Animation Components

#### [T186] [P] Implement TweenComponent

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/ui/components/TweenComponent.ts` 作成
- [ ] `property`, `from`, `to`, `duration`, `easing` プロパティ
- [ ] ループ/pingpong サポート
- [ ] serialize/deserialize 実装
- [ ] テスト追加

**関連ファイル:**

- `src/types/ui/components/TweenComponent.ts`
- `src/types/ui/components/TweenComponent.test.ts`

---

### Template Components

#### [T187] [P] Implement TemplateControllerComponent

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/ui/components/TemplateControllerComponent.ts` 作成
- [ ] `templateId` プロパティ
- [ ] テンプレート展開ロジック
- [ ] serialize/deserialize 実装
- [ ] テスト追加

**関連ファイル:**

- `src/types/ui/components/TemplateControllerComponent.ts`
- `src/types/ui/components/TemplateControllerComponent.test.ts`

---

#### [T188] [P] Create UIComponentRegistry

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/types/ui/UIComponentRegistry.ts` 作成
- [ ] コンポーネントタイプ登録
- [ ] 型安全なファクトリー
- [ ] 拡張可能な設計
- [ ] テスト追加

**関連ファイル:**

- `src/types/ui/UIComponentRegistry.ts`
- `src/types/ui/UIComponentRegistry.test.ts`

---

## Phase 15: Screen Design

### UIキャンバス

#### [T189] [US14] Create UICanvas component

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/ui-editor/components/UICanvas.tsx` 作成
- [ ] 解像度プレビュー（16:9, 4:3対応）
- [ ] グリッドスナップ
- [ ] ズーム/パン
- [ ] テスト追加

**関連ファイル:**

- `src/features/ui-editor/components/UICanvas.tsx`
- `src/features/ui-editor/components/UICanvas.test.tsx`

---

#### [T190] [US14] Create UIObjectTree component

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/ui-editor/components/UIObjectTree.tsx` 作成
- [ ] 階層表示
- [ ] ドラッグ&ドロップで親子変更
- [ ] 右クリックメニュー
- [ ] テスト追加

**関連ファイル:**

- `src/features/ui-editor/components/UIObjectTree.tsx`
- `src/features/ui-editor/components/UIObjectTree.test.tsx`

---

#### [T191] [US14] Create UIPropertyPanel component

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/ui-editor/components/UIPropertyPanel.tsx` 作成
- [ ] Transform編集
- [ ] コンポーネント一覧表示
- [ ] コンポーネント追加/削除
- [ ] テスト追加

**関連ファイル:**

- `src/features/ui-editor/components/UIPropertyPanel.tsx`
- `src/features/ui-editor/components/UIPropertyPanel.test.tsx`

---

#### [T192] [US14] Create UIComponentPalette component

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/ui-editor/components/UIComponentPalette.tsx` 作成
- [ ] 使用可能なコンポーネント一覧
- [ ] ドラッグで追加
- [ ] カテゴリ分類
- [ ] テスト追加

**関連ファイル:**

- `src/features/ui-editor/components/UIComponentPalette.tsx`
- `src/features/ui-editor/components/UIComponentPalette.test.tsx`

---

### UIオブジェクト操作

#### [T193] [US14] Implement UIObject selection

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/ui-editor/hooks/useUISelection.ts` 作成
- [ ] クリック選択
- [ ] 複数選択（Shift+クリック）
- [ ] 選択ハイライト表示
- [ ] テスト追加

**関連ファイル:**

- `src/features/ui-editor/hooks/useUISelection.ts`
- `src/features/ui-editor/hooks/useUISelection.test.ts`

---

#### [T194] [US14] Implement UIObject transform handles

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/ui-editor/components/TransformHandles.tsx` 作成
- [ ] 移動ハンドル
- [ ] リサイズハンドル（8方向）
- [ ] 回転ハンドル
- [ ] テスト追加

**関連ファイル:**

- `src/features/ui-editor/components/TransformHandles.tsx`
- `src/features/ui-editor/components/TransformHandles.test.tsx`

---

#### [T195] [US14] Implement anchor presets

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/ui-editor/components/AnchorPresets.tsx` 作成
- [ ] 9ポイントプリセット
- [ ] ストレッチプリセット
- [ ] ビジュアルプレビュー
- [ ] テスト追加

**関連ファイル:**

- `src/features/ui-editor/components/AnchorPresets.tsx`
- `src/features/ui-editor/components/AnchorPresets.test.tsx`

---

### UIテンプレート

#### [T196] [US14] Implement UITemplate save

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/ui-editor/utils/templateUtils.ts` 作成
- [ ] 選択オブジェクトをテンプレート化
- [ ] 名前付けダイアログ
- [ ] ストアに保存
- [ ] テスト追加

**関連ファイル:**

- `src/features/ui-editor/utils/templateUtils.ts`
- `src/features/ui-editor/utils/templateUtils.test.ts`

---

#### [T197] [US14] Implement UITemplate instantiation

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] テンプレートからインスタンス生成
- [ ] ID再生成
- [ ] 配置位置指定
- [ ] テスト追加

**関連ファイル:**

- `src/features/ui-editor/utils/templateUtils.ts`
- `src/features/ui-editor/utils/templateUtils.test.ts`

---

## Phase 16: Object UI

### オブジェクトパネル

#### [T198] [US15] Create ObjectPanel component

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/object-editor/components/ObjectPanel.tsx` 作成
- [ ] オブジェクト一覧表示
- [ ] 検索/フィルター
- [ ] カテゴリ分類
- [ ] テスト追加

**関連ファイル:**

- `src/features/object-editor/components/ObjectPanel.tsx`
- `src/features/object-editor/components/ObjectPanel.test.tsx`

---

#### [T199] [US15] Create ObjectPropertyPanel component

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/object-editor/components/ObjectPropertyPanel.tsx` 作成
- [ ] 基本プロパティ編集
- [ ] コンポーネント一覧
- [ ] コンポーネント追加UI
- [ ] テスト追加

**関連ファイル:**

- `src/features/object-editor/components/ObjectPropertyPanel.tsx`
- `src/features/object-editor/components/ObjectPropertyPanel.test.tsx`

---

#### [T200] [US15] Create ComponentEditor component

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/object-editor/components/ComponentEditor.tsx` 作成
- [ ] コンポーネントタイプ別PropertyPanel表示
- [ ] 展開/折りたたみ
- [ ] 削除ボタン
- [ ] テスト追加

**関連ファイル:**

- `src/features/object-editor/components/ComponentEditor.tsx`
- `src/features/object-editor/components/ComponentEditor.test.tsx`

---

### プレハブシステム

#### [T201] [US15] Implement Prefab creation

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/prefab/utils/prefabUtils.ts` 作成
- [ ] オブジェクトからプレハブ作成
- [ ] コンポーネントのシリアライズ
- [ ] ストアに保存
- [ ] テスト追加

**関連ファイル:**

- `src/features/prefab/utils/prefabUtils.ts`
- `src/features/prefab/utils/prefabUtils.test.ts`

---

#### [T202] [US15] Implement Prefab instantiation

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] プレハブからオブジェクト生成
- [ ] ID再生成
- [ ] 位置指定
- [ ] テスト追加

**関連ファイル:**

- `src/features/prefab/utils/prefabUtils.ts`
- `src/features/prefab/utils/prefabUtils.test.ts`

---

#### [T203] [US15] Create PrefabBrowser component

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/prefab/components/PrefabBrowser.tsx` 作成
- [ ] プレハブ一覧表示
- [ ] プレビュー表示
- [ ] ドラッグ&ドロップでマップに配置
- [ ] テスト追加

**関連ファイル:**

- `src/features/prefab/components/PrefabBrowser.tsx`
- `src/features/prefab/components/PrefabBrowser.test.tsx`

---

## Phase 17: Timeline

### タイムラインエディタ

#### [T204] [US16] Create TimelineEditor component

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/timeline/components/TimelineEditor.tsx` 作成
- [ ] トラック表示
- [ ] キーフレーム表示
- [ ] スクロール/ズーム
- [ ] テスト追加

**関連ファイル:**

- `src/features/timeline/components/TimelineEditor.tsx`
- `src/features/timeline/components/TimelineEditor.test.tsx`

---

#### [T205] [US16] Create TimelineTrack component

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/timeline/components/TimelineTrack.tsx` 作成
- [ ] プロパティごとのトラック
- [ ] キーフレームマーカー
- [ ] 値カーブ表示
- [ ] テスト追加

**関連ファイル:**

- `src/features/timeline/components/TimelineTrack.tsx`
- `src/features/timeline/components/TimelineTrack.test.tsx`

---

#### [T206] [US16] Implement keyframe editing

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/timeline/hooks/useKeyframeEdit.ts` 作成
- [ ] クリックでキーフレーム追加
- [ ] ドラッグで時間変更
- [ ] ダブルクリックで値編集
- [ ] Delete でキーフレーム削除
- [ ] テスト追加

**関連ファイル:**

- `src/features/timeline/hooks/useKeyframeEdit.ts`
- `src/features/timeline/hooks/useKeyframeEdit.test.ts`

---

#### [T207] [US16] Implement easing curve editor

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/timeline/components/EasingCurveEditor.tsx` 作成
- [ ] ベジェ曲線エディタ
- [ ] プリセット選択（linear, ease-in, ease-out, etc.）
- [ ] カスタムカーブ編集
- [ ] テスト追加

**関連ファイル:**

- `src/features/timeline/components/EasingCurveEditor.tsx`
- `src/features/timeline/components/EasingCurveEditor.test.tsx`

---

#### [T208] [US16] Implement timeline playback

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/timeline/hooks/useTimelinePlayback.ts` 作成
- [ ] 再生/停止
- [ ] シーク
- [ ] ループ再生
- [ ] 再生速度変更
- [ ] テスト追加

**関連ファイル:**

- `src/features/timeline/hooks/useTimelinePlayback.ts`
- `src/features/timeline/hooks/useTimelinePlayback.test.ts`

---

### アニメーションプレビュー

#### [T209] [US16] Create AnimationPreview component

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/timeline/components/AnimationPreview.tsx` 作成
- [ ] リアルタイムプレビュー
- [ ] オブジェクト表示
- [ ] 現在フレームのプロパティ反映
- [ ] テスト追加

**関連ファイル:**

- `src/features/timeline/components/AnimationPreview.tsx`
- `src/features/timeline/components/AnimationPreview.test.tsx`

---

## Phase 18: Game Engine

### エンジンコア

#### [T210] [P] Create GameEngine core

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/engine/core/GameEngine.ts` 作成
- [ ] ゲームループ実装
- [ ] シーン管理
- [ ] 入力ハンドリング
- [ ] テスト追加

**関連ファイル:**

- `src/engine/core/GameEngine.ts`
- `src/engine/core/GameEngine.test.ts`

---

#### [T211] [P] Create SceneManager

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/engine/core/SceneManager.ts` 作成
- [ ] シーン読み込み
- [ ] シーン切り替え
- [ ] トランジション
- [ ] テスト追加

**関連ファイル:**

- `src/engine/core/SceneManager.ts`
- `src/engine/core/SceneManager.test.ts`

---

#### [T212] [P] Create MapRenderer

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/engine/renderer/MapRenderer.ts` 作成
- [ ] タイルレンダリング
- [ ] レイヤー合成
- [ ] カリング最適化
- [ ] テスト追加

**関連ファイル:**

- `src/engine/renderer/MapRenderer.ts`
- `src/engine/renderer/MapRenderer.test.ts`

---

#### [T213] [P] Create SpriteRenderer

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/engine/renderer/SpriteRenderer.ts` 作成
- [ ] スプライト描画
- [ ] アニメーション再生
- [ ] Zソート
- [ ] テスト追加

**関連ファイル:**

- `src/engine/renderer/SpriteRenderer.ts`
- `src/engine/renderer/SpriteRenderer.test.ts`

---

#### [T214] [P] Create UIRenderer

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/engine/renderer/UIRenderer.ts` 作成
- [ ] UIObject描画
- [ ] コンポーネント処理
- [ ] マスク処理
- [ ] テスト追加

**関連ファイル:**

- `src/engine/renderer/UIRenderer.ts`
- `src/engine/renderer/UIRenderer.test.ts`

---

### ゲームAPI

#### [T215] [P] Implement MapAPI

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/engine/api/MapAPI.ts` 作成
- [ ] `game.map.load(id)`
- [ ] `game.map.getTile(x, y, layer)`
- [ ] `game.map.setTile(x, y, layer, tileId)`
- [ ] テスト追加

**関連ファイル:**

- `src/engine/api/MapAPI.ts`
- `src/engine/api/MapAPI.test.ts`

---

#### [T216] [P] Implement ObjectAPI

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/engine/api/ObjectAPI.ts` 作成
- [ ] `game.object.create(prefabId)`
- [ ] `game.object.destroy(id)`
- [ ] `game.object.find(name)`
- [ ] `game.object.getComponent(type)`
- [ ] テスト追加

**関連ファイル:**

- `src/engine/api/ObjectAPI.ts`
- `src/engine/api/ObjectAPI.test.ts`

---

#### [T217] [P] Implement PlayerAPI

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/engine/api/PlayerAPI.ts` 作成
- [ ] `game.player.moveTo(x, y)`
- [ ] `game.player.teleport(mapId, x, y)`
- [ ] `game.player.face(direction)`
- [ ] テスト追加

**関連ファイル:**

- `src/engine/api/PlayerAPI.ts`
- `src/engine/api/PlayerAPI.test.ts`

---

#### [T218] [P] Implement UIAPI

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/engine/api/UIAPI.ts` 作成
- [ ] `game.ui.show(screenId)`
- [ ] `game.ui.hide(screenId)`
- [ ] `game.ui.setText(objectId, text)`
- [ ] テスト追加

**関連ファイル:**

- `src/engine/api/UIAPI.ts`
- `src/engine/api/UIAPI.test.ts`

---

#### [T219] [P] Implement AudioAPI

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/engine/api/AudioAPI.ts` 作成
- [ ] `game.audio.playBGM(id, loop)`
- [ ] `game.audio.playSE(id, volume)`
- [ ] `game.audio.stopBGM(fadeTime)`
- [ ] テスト追加

**関連ファイル:**

- `src/engine/api/AudioAPI.ts`
- `src/engine/api/AudioAPI.test.ts`

---

#### [T220] [P] Implement VariableAPI

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/engine/api/VariableAPI.ts` 作成
- [ ] `game.variable.get(name)`
- [ ] `game.variable.set(name, value)`
- [ ] スコープ管理（グローバル/ローカル）
- [ ] テスト追加

**関連ファイル:**

- `src/engine/api/VariableAPI.ts`
- `src/engine/api/VariableAPI.test.ts`

---

#### [T221] [P] Implement TweenAPI

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/engine/api/TweenAPI.ts` 作成
- [ ] `game.tween.to(target, props, duration, easing)`
- [ ] `game.tween.from(target, props, duration, easing)`
- [ ] チェーン/シーケンス
- [ ] コールバック（onComplete, onUpdate）
- [ ] テスト追加

**関連ファイル:**

- `src/engine/api/TweenAPI.ts`
- `src/engine/api/TweenAPI.test.ts`

---

#### [T222] [P] Implement InputAPI

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/engine/api/InputAPI.ts` 作成
- [ ] `game.input.isPressed(key)`
- [ ] `game.input.isJustPressed(key)`
- [ ] ゲームパッドサポート
- [ ] テスト追加

**関連ファイル:**

- `src/engine/api/InputAPI.ts`
- `src/engine/api/InputAPI.test.ts`

---

### イベント実行

#### [T223] [P] Create EventRunner

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/engine/event/EventRunner.ts` 作成
- [ ] コマンド順次実行
- [ ] 条件分岐処理
- [ ] ループ処理
- [ ] async/await対応
- [ ] テスト追加

**関連ファイル:**

- `src/engine/event/EventRunner.ts`
- `src/engine/event/EventRunner.test.ts`

---

#### [T224] [P] Create DialogueRunner

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/engine/event/DialogueRunner.ts` 作成
- [ ] テキスト表示（タイプライター効果）
- [ ] 選択肢表示
- [ ] 変数埋め込み
- [ ] テスト追加

**関連ファイル:**

- `src/engine/event/DialogueRunner.ts`
- `src/engine/event/DialogueRunner.test.ts`

---

## Phase 19: Test Play

### テストプレイ機能

#### [T225] [US17] Create TestPlayPage

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/app/(editor)/test-play/page.tsx` 作成
- [ ] GameEngine埋め込み
- [ ] フルスクリーン対応
- [ ] エディタに戻るボタン
- [ ] テスト追加

**関連ファイル:**

- `src/app/(editor)/test-play/page.tsx`
- `src/app/(editor)/test-play/page.test.tsx`

---

#### [T226] [US17] Implement quick test play

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/test-play/hooks/useQuickPlay.ts` 作成
- [ ] 現在のマップから開始
- [ ] 現在位置から開始
- [ ] F5キーで起動
- [ ] テスト追加

**関連ファイル:**

- `src/features/test-play/hooks/useQuickPlay.ts`
- `src/features/test-play/hooks/useQuickPlay.test.ts`

---

#### [T227] [US17] Create DebugOverlay component

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/test-play/components/DebugOverlay.tsx` 作成
- [ ] FPS表示
- [ ] 変数ウォッチ
- [ ] コンソール出力
- [ ] トグル表示（F12）
- [ ] テスト追加

**関連ファイル:**

- `src/features/test-play/components/DebugOverlay.tsx`
- `src/features/test-play/components/DebugOverlay.test.tsx`

---

#### [T228] [US17] Implement save state

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/test-play/utils/saveState.ts` 作成
- [ ] ゲーム状態シリアライズ
- [ ] クイックセーブ（F6）
- [ ] クイックロード（F7）
- [ ] テスト追加

**関連ファイル:**

- `src/features/test-play/utils/saveState.ts`
- `src/features/test-play/utils/saveState.test.ts`

---

#### [T229] [US17] Implement variable inspector

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/test-play/components/VariableInspector.tsx` 作成
- [ ] 変数一覧表示
- [ ] リアルタイム更新
- [ ] 値の編集
- [ ] テスト追加

**関連ファイル:**

- `src/features/test-play/components/VariableInspector.tsx`
- `src/features/test-play/components/VariableInspector.test.tsx`

---

## Phase 20: Polish

### ゲームエクスポート

#### [T230] [US18] Implement game export

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/export/utils/gameExport.ts` 作成
- [ ] HTML5形式エクスポート
- [ ] アセットバンドル
- [ ] 圧縮（gzip）
- [ ] テスト追加

**関連ファイル:**

- `src/features/export/utils/gameExport.ts`
- `src/features/export/utils/gameExport.test.ts`

---

#### [T231] [US18] Implement asset deduplication

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/export/utils/assetDedup.ts` 作成
- [ ] 重複アセット検出
- [ ] 参照の統合
- [ ] サイズ削減レポート
- [ ] テスト追加

**関連ファイル:**

- `src/features/export/utils/assetDedup.ts`
- `src/features/export/utils/assetDedup.test.ts`

---

#### [T232] [US18] Implement code minification

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/features/export/utils/minify.ts` 作成
- [ ] スクリプト最小化
- [ ] データJSON最小化
- [ ] ソースマップ生成（オプション）
- [ ] テスト追加

**関連ファイル:**

- `src/features/export/utils/minify.ts`
- `src/features/export/utils/minify.test.ts`

---

### デフォルトアセット

#### [T233] [US18] Create default chipset

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `public/assets/default/chipset.png` 作成
- [ ] 基本タイル（草、水、道、壁など）
- [ ] 16x16タイルサイズ
- [ ] ChipProperty設定

**関連ファイル:**

- `public/assets/default/chipset.png`
- `public/assets/default/chipset.json`

---

#### [T234] [US18] Create default character sprites

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `public/assets/default/characters/` ディレクトリ作成
- [ ] プレイヤースプライト
- [ ] 4方向歩行アニメーション
- [ ] NPCスプライト（3種類以上）

**関連ファイル:**

- `public/assets/default/characters/player.png`
- `public/assets/default/characters/npc_*.png`

---

#### [T235] [US18] Create default UI assets

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `public/assets/default/ui/` ディレクトリ作成
- [ ] メッセージウィンドウ（9スライス）
- [ ] ボタン
- [ ] カーソル
- [ ] フォント

**関連ファイル:**

- `public/assets/default/ui/window.png`
- `public/assets/default/ui/button.png`
- `public/assets/default/ui/cursor.png`

---

### テンプレート

#### [T236] [US18] Create starter project template

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `templates/starter/` ディレクトリ作成
- [ ] サンプルマップ
- [ ] プレイヤー設定
- [ ] タイトル画面
- [ ] セーブ/ロード画面

**関連ファイル:**

- `templates/starter/project.json`
- `templates/starter/maps/`
- `templates/starter/screens/`

---

#### [T237] [US18] Create action RPG template

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `templates/action-rpg/` ディレクトリ作成
- [ ] 戦闘システムサンプル
- [ ] HPバーUI
- [ ] 敵キャラクター

**関連ファイル:**

- `templates/action-rpg/project.json`
- `templates/action-rpg/prefabs/`
- `templates/action-rpg/events/`

---

### 統合テスト

#### [T238] [US18] Create E2E test suite

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] Playwright設定
- [ ] マップ編集E2Eテスト
- [ ] イベント編集E2Eテスト
- [ ] テストプレイE2Eテスト
- [ ] CI統合

**関連ファイル:**

- `playwright.config.ts`
- `e2e/map-editor.spec.ts`
- `e2e/event-editor.spec.ts`
- `e2e/test-play.spec.ts`

---

#### [T239] [US18] Create performance benchmark

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `benchmarks/` ディレクトリ作成
- [ ] マップレンダリングベンチマーク
- [ ] 大量オブジェクトテスト
- [ ] メモリ使用量計測
- [ ] 基準値の設定

**関連ファイル:**

- `benchmarks/map-rendering.bench.ts`
- `benchmarks/object-stress.bench.ts`

---

#### [T240] [US18] Documentation

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] ユーザーガイド作成
- [ ] API リファレンス
- [ ] チュートリアル
- [ ] FAQ

**関連ファイル:**

- `docs/user-guide.md`
- `docs/api-reference.md`
- `docs/tutorial.md`
- `docs/faq.md`

---

## 進捗トラッキング

### フェーズ別サマリー

| Phase     | 名称          | タスク数 | 完了  | 進捗   |
| --------- | ------------- | -------- | ----- | ------ |
| 0         | Setup         | 6        | 0     | 0%     |
| 1         | Core Types    | 24       | 0     | 0%     |
| 2         | Data Layer    | 20       | 0     | 0%     |
| 3         | Field Types   | 11       | 0     | 0%     |
| 4         | Field Editors | 11       | 0     | 0%     |
| 5         | Database      | 23       | 0     | 0%     |
| 6         | Components    | 22       | 0     | 0%     |
| 7         | Event Types   | 19       | 0     | 0%     |
| 8         | Event Editor  | 16       | 0     | 0%     |
| 9         | Asset Manager | 12       | 0     | 0%     |
| 10        | Script Editor | 13       | 0     | 0%     |
| 11        | Game Settings | 9        | 0     | 0%     |
| 12        | Layout        | 8        | 0     | 0%     |
| 13        | Map Editor    | 18       | 0     | 0%     |
| 14        | UI Foundation | 16       | 0     | 0%     |
| 15        | Screen Design | 9        | 0     | 0%     |
| 16        | Object UI     | 6        | 0     | 0%     |
| 17        | Timeline      | 6        | 0     | 0%     |
| 18        | Game Engine   | 15       | 0     | 0%     |
| 19        | Test Play     | 5        | 0     | 0%     |
| 20        | Polish        | 11       | 0     | 0%     |
| **Total** |               | **270**  | **0** | **0%** |

### 優先度凡例

- **[P]**: 優先（他タスクの依存元）
- **[US{N}]**: ユーザーストーリー番号
