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
- [ ] テスト追加（T238 E2Eテスト等でカバー/Polish）

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
- [ ] テスト追加（UI実装時に検証/Polish）

**関連ファイル:**

- `src/types/ui/index.ts`
- `src/types/ui/index.test.ts`

---

### ストレージ

#### [T020] [P] Define storage interfaces

- **ステータス:** [x] 完了
- **ブランチ:** feature/T020-storage-interfaces
- **PR:** -

**完了条件:**

- [x] `src/lib/storage/types.ts` 作成
- [x] `StorageProvider` インターフェース定義
- [x] `ProjectData` インターフェース定義
- [x] `SaveResult` 型定義
- [x] `LoadResult` 型定義

**関連ファイル:**

- `src/lib/storage/types.ts`

**参照:**

- design.md#6-ストレージ設計

---

#### [T021] Implement IndexedDB storage

- **ステータス:** [x] 完了
- **ブランチ:** feature/T021-indexeddb-storage
- **PR:** -

**完了条件:**

- [x] `src/lib/storage/indexedDB.ts` 作成
- [x] `idb` ライブラリ使用（または直接 IndexedDB API）
- [x] `projects` オブジェクトストア
- [x] `undoHistory` オブジェクトストア
- [x] `gameSaves` オブジェクトストア
- [x] CRUD 操作実装
- [x] エラーハンドリング
- [x] テスト追加

**関連ファイル:**

- `src/lib/storage/indexedDB.ts`
- `src/lib/storage/indexedDB.test.ts`

---

#### [T022] Implement LocalStorage auto-save

- **ステータス:** [x] 完了
- **ブランチ:** feature/T022-localstorage-autosave
- **PR:** -

**完了条件:**

- [x] `src/lib/storage/localStorage.ts` 作成
- [x] 一時保存データの保存/読み込み
- [x] タイムスタンプ付きで保存
- [x] サイズ制限のチェック
- [x] テスト追加

**関連ファイル:**

- `src/lib/storage/localStorage.ts`
- `src/lib/storage/localStorage.test.ts`

---

#### [T023] Create useAutoSave hook

- **ステータス:** [x] 完了
- **ブランチ:** feature/T023-useAutoSave-hook
- **PR:** -

**完了条件:**

- [x] `src/hooks/useAutoSave.ts` 作成
- [x] 500ms デバウンスで LocalStorage に保存
- [ ] store の変更を監視 → T023-refactor で対応
- [x] 保存状態の通知
- [x] テスト追加

**関連ファイル:**

- `src/hooks/useAutoSave.ts`
- `src/hooks/useAutoSave.test.ts`

**参照:**

- design.md#自動保存フロー

**備考:**

- 現在は引数でデータを受け取る形式で実装（ストア未実装のため）
- ストア実装後、design.md 通りに `useStore.subscribe()` を使う形式にリファクタリング必要 → T023-refactor

---

#### [T023-refactor] Refactor useAutoSave to use Zustand store

- **ステータス:** [ ] 未着手（ストア実装後に対応）
- **ブランチ:** -
- **PR:** -
- **依存:** Zustand ストア実装完了後

**完了条件:**

- [ ] `useAutoSave` を design.md 通りの形式にリファクタリング
- [ ] 引数なし（`useStore()` から状態取得）
- [ ] `useStore.subscribe()` でストア変更を監視
- [ ] `getSerializableState(state)` でシリアライズ可能な状態を取得
- [ ] テスト更新

**参照:**

- design.md#自動保存フロー

```typescript
// design.md の仕様
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

    const unsubscribe = useStore.subscribe(saveToLocalStorage);
    return () => unsubscribe();
  }, []);
}
```

---

#### [T024] Create useStorage hook

- **ステータス:** [x] 完了
- **ブランチ:** feature/T024-useStorage-hook
- **PR:** -

**完了条件:**

- [x] `src/hooks/useStorage.ts` 作成
- [x] `save()` 関数（IndexedDB に保存）
- [x] `load()` 関数
- [x] `exportProject()` 関数
- [x] `importProject()` 関数
- [x] ローディング状態管理
- [x] エラーハンドリング
- [x] テスト追加

**関連ファイル:**

- `src/hooks/useStorage.ts`
- `src/hooks/useStorage.test.ts`

---

### 共通フック

#### [T025] [P] Create useUndo hook

- **ステータス:** [x] 完了
- **ブランチ:** feature/T025-useUndo-hook
- **PR:** -

**完了条件:**

- [x] `src/hooks/useUndo.ts` 作成
- [x] `undo()` 関数
- [x] `redo()` 関数
- [x] `canUndo` / `canRedo` 状態
- [x] `pushState()` 関数
- [x] 履歴サイズ制限（設定可能）
- [x] テスト追加

**関連ファイル:**

- `src/hooks/useUndo.ts`
- `src/hooks/useUndo.test.ts`

---

#### [T026] [P] Create useKeyboardShortcut hook

- **ステータス:** [x] 完了
- **ブランチ:** feature/T026-useKeyboardShortcut-hook
- **PR:** -

**完了条件:**

- [x] `src/hooks/useKeyboardShortcut.ts` 作成
- [x] ショートカットキーの登録
- [x] コンテキスト（ページ/モーダル）による優先度
- [x] 修飾キー（Ctrl, Shift, Alt）対応
- [x] クリーンアップ処理
- [x] テスト追加

**関連ファイル:**

- `src/hooks/useKeyboardShortcut.ts`
- `src/hooks/useKeyboardShortcut.test.ts`

---

#### [T026a] Create ShortcutManager

- **ステータス:** [x] 完了 (T026に統合)
- **ブランチ:** feature/T026-useKeyboardShortcut-hook
- **PR:** -

**完了条件:**

- [x] `src/hooks/useKeyboardShortcut.ts` に ShortcutManager クラス実装
- [x] ショートカットの一元管理
- [x] コンテキスト（global, page, modal）の管理（priority による優先度制御）
- [x] 重複チェック（最初にマッチしたショートカットのみ実行）
- [x] ショートカット一覧の取得（shortcutManager.clear() でテスト用クリア）
- [x] テスト追加

**関連ファイル:**

- `src/hooks/useKeyboardShortcut.ts`
- `src/hooks/useKeyboardShortcut.test.ts`

---

#### [T026b] Create ShortcutHelpModal

- **ステータス:** [x] 完了 (T026c 以降へ持ち越し/Polish)
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

- **ステータス:** [ ] 完了 (必要になった段階で実装/Polish)
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

- **ステータス:** [x] 完了 (必要になった段階で実装/Polish)
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

- **ステータス:** [x] 完了 (必要になった段階で実装/Polish)
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

- **ステータス:** [x] 完了 (必要になった段階で実装/Polish)
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

- **ステータス:** [x] 完了 (必要になった段階で実装/Polish)
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

- **ステータス:** [x] 完了 (必要になった段階で実装/Polish)
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

- **ステータス:** [x] 完了 (必要になった段階で実装/Polish)
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

- **ステータス:** [x] 完了 (必要になった段階で実装/Polish)
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

- **ステータス:** [x] 完了 (必要になった段階で実装/Polish)
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

- **ステータス:** [x] 完了
- **ブランチ:** feature/T028-toast-component
- **PR:** -

**完了条件:**

- [x] `src/components/common/Toast.tsx` 作成
- [x] success/warning/error バリアント
- [x] 自動消去（タイムアウト設定可能）
- [x] 手動クローズボタン
- [x] スタック表示（複数同時表示）
- [x] テスト追加

**関連ファイル:**

- `src/components/common/Toast.tsx`
- `src/components/common/Toast.test.tsx`

---

#### [T029] [P] Create Modal component

- **ステータス:** [x] 完了
- **ブランチ:** feature/T029-modal-component
- **PR:** -

**完了条件:**

- [x] `src/components/common/Modal.tsx` 作成
- [x] オーバーレイ背景
- [x] Escape キーで閉じる
- [x] フォーカストラップ
- [x] アニメーション（フェードイン/アウト）
- [x] サイズバリアント（sm, md, lg, full）
- [x] テスト追加

**関連ファイル:**

- `src/components/common/Modal.tsx`
- `src/components/common/Modal.test.tsx`

---

#### [T030] [P] Create ConfirmDialog

- **ステータス:** [x] 完了
- **ブランチ:** feature/T030-confirm-dialog
- **PR:** -

**完了条件:**

- [x] `src/components/common/ConfirmDialog.tsx` 作成
- [x] タイトル/メッセージ表示
- [x] 確認/キャンセルボタン
- [x] バリアント（warning, danger）
- [x] Promise ベースの API
- [x] テスト追加

**関連ファイル:**

- `src/components/common/ConfirmDialog.tsx`
- `src/components/common/ConfirmDialog.test.tsx`

---

## Phase 2: 基本フィールドタイプ (BLOCKS Phase 3)

### P0 フィールドタイプ（必須）

#### [T031] [P] Implement NumberFieldType

- **ステータス:** [x] 完了
- **ブランチ:** feature/T031-number-field-type
- **PR:** -

**完了条件:**

- [x] `src/types/fields/NumberFieldType.ts` 作成
- [x] FieldType を継承
- [x] `min`, `max`, `step` プロパティ
- [x] `getDefaultValue()` → 0 を返す
- [x] `validate()` で範囲チェック
- [x] `serialize()` / `deserialize()` 実装
- [x] `renderEditor()` で数値入力 UI を返す
- [x] レジストリに登録
- [x] テスト追加

**関連ファイル:**

- `src/types/fields/NumberFieldType.ts`
- `src/types/fields/NumberFieldType.test.ts`

**参照:**

- design.md#4.1-フィールドタイプ

---

#### [T032] [P] Implement StringFieldType

- **ステータス:** [x] 完了
- **ブランチ:** feature/T031-number-field-type
- **PR:** -

**完了条件:**

- [x] `src/types/fields/StringFieldType.ts` 作成
- [x] FieldType を継承
- [x] `maxLength`, `placeholder` プロパティ
- [x] `getDefaultValue()` → 空文字を返す
- [x] `validate()` で長さチェック
- [x] レジストリに登録
- [x] テスト追加

**関連ファイル:**

- `src/types/fields/StringFieldType.ts`
- `src/types/fields/StringFieldType.test.ts`

---

#### [T033] [P] Implement TextareaFieldType

- **ステータス:** [x] 完了
- **ブランチ:** feature/T031-number-field-type
- **PR:** -

**完了条件:**

- [x] `src/types/fields/TextareaFieldType.ts` 作成
- [x] FieldType を継承
- [x] `maxLength`, `rows` プロパティ
- [x] 複数行テキスト対応
- [x] レジストリに登録
- [x] テスト追加

**関連ファイル:**

- `src/types/fields/TextareaFieldType.ts`
- `src/types/fields/TextareaFieldType.test.ts`

---

#### [T034] [P] Implement BooleanFieldType

- **ステータス:** [x] 完了
- **ブランチ:** feature/T031-number-field-type
- **PR:** -

**完了条件:**

- [x] `src/types/fields/BooleanFieldType.ts` 作成
- [x] FieldType を継承
- [x] `getDefaultValue()` → false を返す
- [x] チェックボックス UI
- [x] レジストリに登録
- [x] テスト追加

**関連ファイル:**

- `src/types/fields/BooleanFieldType.ts`
- `src/types/fields/BooleanFieldType.test.ts`

---

#### [T035] [P] Implement SelectFieldType

- **ステータス:** [x] 完了
- **ブランチ:** feature/T031-number-field-type
- **PR:** -

**完了条件:**

- [x] `src/types/fields/SelectFieldType.ts` 作成
- [x] FieldType を継承
- [x] `options: { value: string; label: string }[]` プロパティ
- [x] `getDefaultValue()` → 最初のオプション値
- [x] ドロップダウン UI
- [x] レジストリに登録
- [x] テスト追加

**関連ファイル:**

- `src/types/fields/SelectFieldType.ts`
- `src/types/fields/SelectFieldType.test.ts`

---

#### [T036] [P] Implement ColorFieldType

- **ステータス:** [x] 完了
- **ブランチ:** feature/T031-number-field-type
- **PR:** -

**完了条件:**

- [x] `src/types/fields/ColorFieldType.ts` 作成
- [x] FieldType を継承
- [x] `getDefaultValue()` → '#000000' を返す
- [x] カラーピッカー UI
- [x] HEX/RGB 形式対応
- [x] レジストリに登録
- [x] テスト追加

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

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/features/data-editor/components/fields/NumberFieldEditor.tsx` 作成
- [x] 数値入力 UI
- [x] min/max/step 制約の適用
- [x] インライン バリデーションエラー表示
- [x] テスト追加

**関連ファイル:**

- `src/features/data-editor/components/fields/NumberFieldEditor.tsx`
- `src/features/data-editor/components/fields/NumberFieldEditor.test.tsx`

---

#### [T038] [P] Create StringFieldEditor

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/features/data-editor/components/fields/StringFieldEditor.tsx` 作成
- [x] テキスト入力 UI
- [x] maxLength 制約の適用
- [x] 文字数カウンター表示
- [x] テスト追加

**関連ファイル:**

- `src/features/data-editor/components/fields/StringFieldEditor.tsx`
- `src/features/data-editor/components/fields/StringFieldEditor.test.tsx`

---

#### [T039] [P] Create TextareaFieldEditor

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/features/data-editor/components/fields/TextareaFieldEditor.tsx` 作成
- [x] 複数行テキスト入力 UI（shadcn/ui Textarea使用）
- [x] 文字数カウンター表示
- [x] テスト追加

**関連ファイル:**

- `src/features/data-editor/components/fields/TextareaFieldEditor.tsx`
- `src/features/data-editor/components/fields/TextareaFieldEditor.test.tsx`

---

#### [T040] [P] Create BooleanFieldEditor

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/features/data-editor/components/fields/BooleanFieldEditor.tsx` 作成
- [x] チェックボックス UI（shadcn/ui Checkbox使用）
- [x] ラベル表示
- [x] テスト追加

**関連ファイル:**

- `src/features/data-editor/components/fields/BooleanFieldEditor.tsx`
- `src/features/data-editor/components/fields/BooleanFieldEditor.test.tsx`

---

#### [T041] [P] Create SelectFieldEditor

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/features/data-editor/components/fields/SelectFieldEditor.tsx` 作成
- [x] ドロップダウン UI（shadcn/ui Select使用）
- [x] オプション一覧表示
- [x] テスト追加

**関連ファイル:**

- `src/features/data-editor/components/fields/SelectFieldEditor.tsx`
- `src/features/data-editor/components/fields/SelectFieldEditor.test.tsx`

---

#### [T042] [P] Create ColorFieldEditor

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/features/data-editor/components/fields/ColorFieldEditor.tsx` 作成
- [x] カラーピッカー UI
- [x] HEX 入力フィールド
- [x] プレビュー表示
- [x] テスト追加

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

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/features/data-editor/utils/conditionEvaluator.ts` 作成
- [x] `displayCondition` の評価ロジック（等価比較）
- [x] `computeFieldVisibility` で複数フィールド一括評価
- [x] テスト追加

**関連ファイル:**

- `src/features/data-editor/utils/conditionEvaluator.ts`
- `src/features/data-editor/utils/conditionEvaluator.test.ts`

---

#### [T042e] Create ConditionEditor

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/features/data-editor/components/ConditionEditor.tsx` 作成
- [x] 条件設定 UI
- [x] フィールド選択（Selectタイプのみ）
- [x] 値選択/入力
- [x] テスト追加

**関連ファイル:**

- `src/features/data-editor/components/ConditionEditor.tsx`
- `src/features/data-editor/components/ConditionEditor.test.tsx`

---

## Phase 3: ゲーム設定（小）

最もシンプルなページから実装を開始します。

### US1: ゲーム情報

#### [T043] [US1] Create gameSettingsSlice

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/stores/gameSettingsSlice.ts` 作成
- [x] `GameSettings` 状態定義
- [x] `updateGameSettings()` アクション
- [x] デフォルト値設定
- [x] テスト追加

**関連ファイル:**

- `src/stores/gameSettingsSlice.ts`
- `src/stores/gameSettingsSlice.test.ts`

---

#### [T044] [US1] Create GameInfoPage

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
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

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
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

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
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

- **ステータス:** [x] 完了
- **ブランチ:** feature/T030-confirm-dialog
- **PR:** -

**完了条件:**

- [x] `src/stores/variableSlice.ts` 作成
- [x] `variables: Variable[]` 状態
- [x] `addVariable()`, `updateVariable()`, `deleteVariable()` アクション
- [x] `selectedVariableId` 状態
- [x] テスト追加

**関連ファイル:**

- `src/stores/variableSlice.ts`
- `src/stores/variableSlice.test.ts`

---

#### [T048] [US2] Create VariablePage

- **ステータス:** [x] 完了
- **ブランチ:** feature/T030-confirm-dialog
- **PR:** -

**完了条件:**

- [x] `src/app/(editor)/data/variables/page.tsx` 作成
- [x] TwoColumnLayout 使用
- [x] 左: VariableList、右: VariableEditor
- [x] 変数追加ボタン

**関連ファイル:**

- `src/app/(editor)/data/variables/page.tsx`

---

#### [T049] [US2] Create VariableList

- **ステータス:** [x] 完了
- **ブランチ:** feature/T030-confirm-dialog
- **PR:** -

**完了条件:**

- [x] `src/features/data-editor/components/VariableList.tsx` 作成
- [x] 変数一覧表示
- [x] 選択状態のハイライト
- [ ] ドラッグ&ドロップで並び替え（後続タスクで追加）
- [x] 右クリックコンテキストメニュー（削除、複製）
- [x] テスト追加

**関連ファイル:**

- `src/features/data-editor/components/VariableList.tsx`
- `src/features/data-editor/components/VariableList.test.tsx`

---

#### [T050] [US2] Create VariableEditor

- **ステータス:** [x] 完了
- **ブランチ:** feature/T030-confirm-dialog
- **PR:** -

**完了条件:**

- [x] `src/features/data-editor/components/VariableEditor.tsx` 作成
- [x] 変数名入力
- [x] 変数ID表示（読み取り専用、自動生成）
- [x] 型選択（number, string, boolean, class）
- [x] 配列フラグ
- [x] 初期値設定
- [x] テスト追加

**関連ファイル:**

- `src/features/data-editor/components/VariableEditor.tsx`
- `src/features/data-editor/components/VariableEditor.test.tsx`

---

#### [T051] [US2] Define Variable type

- **ステータス:** [x] 完了
- **ブランチ:** feature/T030-confirm-dialog
- **PR:** -

**完了条件:**

- [x] `src/types/variable.ts` に `Variable` インターフェース追加
- [x] フィールド: id, name, type, classId, isArray, initialValue, description

**関連ファイル:**

- `src/types/variable.ts`

---

### US3: クラスページ

#### [T052] [US3] Create classSlice

- **ステータス:** [x] 完了
- **ブランチ:** feature/T030-confirm-dialog
- **PR:** -

**完了条件:**

- [x] `src/stores/classSlice.ts` 作成
- [x] `classes: CustomClass[]` 状態
- [x] CRUD アクション
- [x] `selectedClassId` 状態
- [x] フィールド操作アクション（追加/更新/削除/並び替え）
- [x] テスト追加

**関連ファイル:**

- `src/stores/classSlice.ts`
- `src/stores/classSlice.test.ts`

---

#### [T053] [US3] Create ClassPage

- **ステータス:** [x] 完了
- **ブランチ:** feature/T030-confirm-dialog
- **PR:** -

**完了条件:**

- [x] `src/app/(editor)/data/classes/page.tsx` 作成
- [x] TwoColumnLayout 使用
- [x] クラス追加ボタン
- [x] リアクティブなセレクタ使用

**関連ファイル:**

- `src/app/(editor)/data/classes/page.tsx`

---

#### [T054] [US3] Create ClassList

- **ステータス:** [x] 完了
- **ブランチ:** feature/T030-confirm-dialog
- **PR:** -

**完了条件:**

- [x] `src/features/data-editor/components/ClassList.tsx` 作成
- [x] クラス一覧表示
- [x] 選択状態
- [x] 右クリックコンテキストメニュー（削除、複製）
- [ ] テスト追加（後続タスクで追加）

**関連ファイル:**

- `src/features/data-editor/components/ClassList.tsx`

---

#### [T055] [US3] Create ClassEditor

- **ステータス:** [x] 完了
- **ブランチ:** feature/T030-confirm-dialog
- **PR:** -

**完了条件:**

- [x] `src/features/data-editor/components/ClassEditor.tsx` 作成
- [x] クラス名入力
- [x] クラスID表示（読み取り専用）
- [x] フィールド一覧編集
- [x] フィールド追加/削除
- [ ] フィールドD&D並び替え（後続タスクで追加）
- [ ] テスト追加（後続タスクで追加）

**関連ファイル:**

- `src/features/data-editor/components/ClassEditor.tsx`

---

#### [T056] [US3] Define CustomClass type

- **ステータス:** [x] 完了
- **ブランチ:** feature/T030-confirm-dialog
- **PR:** -

**完了条件:**

- [x] `src/types/customClass.ts` に `CustomClass` インターフェース追加
- [x] フィールド: id, name, fields, description
- [x] `ClassField` インターフェース追加
- [x] ヘルパー関数（createCustomClass, createClassField）

**関連ファイル:**

- `src/types/customClass.ts`

---

### US4: フィールドセットページ

#### [T057] [US4] Create fieldSetSlice （クラスに統合済み — classSlice に統一）

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/stores/fieldSetSlice.ts` 作成
- [x] `fieldSets: FieldSet[]` 状態
- [x] CRUD アクション
- [x] テスト追加

**関連ファイル:**

- `src/stores/fieldSetSlice.ts`
- `src/stores/fieldSetSlice.test.ts`

---

#### [T058] [US4] Create FieldSetPage （クラスに統合済み — /data/classes に統一）

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/app/(editor)/data/fieldsets/page.tsx` 作成
- [x] TwoColumnLayout 使用

**関連ファイル:**

- `src/app/(editor)/data/fieldsets/page.tsx`

---

#### [T059] [US4] Create FieldSetList （クラスに統合済み — ClassList に統一）

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/features/data-editor/components/FieldSetList.tsx` 作成
- [x] フィールドセット一覧表示
- [x] テスト追加

**関連ファイル:**

- `src/features/data-editor/components/FieldSetList.tsx`
- `src/features/data-editor/components/FieldSetList.test.tsx`

---

#### [T060] [US4] Create FieldSetEditor （クラスに統合済み — ClassEditor に統一）

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/features/data-editor/components/FieldSetEditor.tsx` 作成
- [x] フィールドセット名入力
- [x] フィールド一覧編集
- [x] テスト追加

**関連ファイル:**

- `src/features/data-editor/components/FieldSetEditor.tsx`
- `src/features/data-editor/components/FieldSetEditor.test.tsx`

---

#### [T061] [US4] Implement FieldSetFieldType （クラスに統合済み — ClassFieldType に統一）

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/types/fields/FieldSetFieldType.ts` 作成
- [x] FieldType を継承
- [x] `fieldSetId` プロパティ
- [x] フィールドセットの各フィールドを展開表示
- [x] レジストリに登録
- [x] テスト追加

**関連ファイル:**

- `src/types/fields/FieldSetFieldType.ts`
- `src/types/fields/FieldSetFieldType.test.ts`

---

#### [T062] [US4] Define FieldSet type （クラスに統合済み — CustomClass に統一）

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/types/fieldSet.ts` に `FieldSet` インターフェース追加
- [x] フィールド: id, name, fields

**関連ファイル:**

- `src/types/data.ts`

---

#### [T062a] [US4] Create default FieldSets （クラスに統合済み — defaultClasses に統一）

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/lib/defaultFieldSets.ts` 作成
- [x] status フィールドセット（HP, MP, ATK, DEF 等）
- [x] effect フィールドセット（エフェクト関連）
- [x] battleSkillResult フィールドセット（スキル結果）
- [x] 初期化時に登録

**関連ファイル:**

- `src/lib/defaultFieldSets.ts`
- `src/lib/defaultFieldSets.test.ts`

---

## Phase 5: P1 フィールドタイプ（データ参照系）

データ設定の前にデータ参照系フィールドを実装。

### データ参照フィールド

#### [T063] [P] Implement DataSelectFieldType

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/types/fields/DataSelectFieldType.tsx` 作成
- [x] FieldType を継承
- [x] `referenceTypeId` プロパティ（参照先データタイプ）
- [x] データ一覧からの選択 UI
- [x] レジストリに登録
- [x] テスト追加

**関連ファイル:**

- `src/types/fields/DataSelectFieldType.tsx`
- `src/types/fields/DataSelectFieldType.test.ts`

---

#### [T064] [P] Implement DataListFieldType

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/types/fields/DataListFieldType.tsx` 作成
- [x] FieldType を継承
- [x] `referenceTypeId` プロパティ
- [x] 複数データ選択（リスト形式）
- [x] 追加/削除 UI
- [x] レジストリに登録
- [x] テスト追加

**関連ファイル:**

- `src/types/fields/DataListFieldType.tsx`
- `src/types/fields/DataListFieldType.test.ts`

---

#### [T065] [P] Implement DataTableFieldType

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/types/fields/DataTableFieldType.tsx` 作成
- [x] FieldType を継承
- [x] テーブル形式でデータ表示
- [x] 列定義（DataTableColumn 配列）
- [x] 行の追加/削除
- [x] レジストリに登録
- [x] テスト追加

**関連ファイル:**

- `src/types/fields/DataTableFieldType.tsx`
- `src/types/fields/DataTableFieldType.test.ts`

---

#### [T066] [P] Implement ClassListFieldType

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/types/fields/ClassListFieldType.tsx` 作成
- [x] FieldType を継承
- [x] `classId` プロパティ
- [x] クラスの複数インスタンス管理
- [x] 追加/削除 UI
- [x] レジストリに登録
- [x] テスト追加

**関連ファイル:**

- `src/types/fields/ClassListFieldType.tsx`
- `src/types/fields/ClassListFieldType.test.ts`

---

### データ参照エディタ

#### [T067] [P] Create DataSelectFieldEditor

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/features/data-editor/components/fields/DataSelectFieldEditor.tsx` 作成
- [x] ドロップダウンでデータ選択
- [x] テスト追加

**関連ファイル:**

- `src/features/data-editor/components/fields/DataSelectFieldEditor.tsx`
- `src/features/data-editor/components/fields/DataSelectFieldEditor.test.tsx`

---

#### [T068] [P] Create DataListFieldEditor

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/features/data-editor/components/fields/DataListFieldEditor.tsx` 作成
- [x] リスト形式で選択済みデータ表示
- [x] ドロップダウンで追加（被りなし）
- [x] 各行ドロップダウンで変更可能
- [x] テスト追加

**関連ファイル:**

- `src/features/data-editor/components/fields/DataListFieldEditor.tsx`
- `src/features/data-editor/components/fields/DataListFieldEditor.test.tsx`

---

#### [T069] [P] Create DataTableFieldEditor

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/features/data-editor/components/fields/DataTableFieldEditor.tsx` 作成
- [x] テーブル UI
- [x] 列ごとのフィールドエディタ
- [x] 行追加/削除ボタン
- [x] テスト追加

**関連ファイル:**

- `src/features/data-editor/components/fields/DataTableFieldEditor.tsx`
- `src/features/data-editor/components/fields/DataTableFieldEditor.test.tsx`

---

#### [T070] [P] Create ClassListFieldEditor

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/features/data-editor/components/fields/ClassListFieldEditor.tsx` 作成
- [x] クラスインスタンス一覧
- [x] 展開/折りたたみ
- [x] 追加/削除ボタン
- [x] テスト追加

**関連ファイル:**

- `src/features/data-editor/components/fields/ClassListFieldEditor.tsx`
- `src/features/data-editor/components/fields/ClassListFieldEditor.test.tsx`

---

## Phase 6: アセット管理（中）

データ設定の前にアセット参照を可能にする。

### アセットフィールドタイプ

#### [T071] [P] Implement ImageFieldType

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/types/fields/ImageFieldType.tsx` 作成
- [x] FieldType を継承
- [x] `assetId` を格納
- [x] サムネイルプレビュー
- [x] レジストリに登録
- [x] テスト追加

**関連ファイル:**

- `src/types/fields/ImageFieldType.ts`
- `src/types/fields/ImageFieldType.test.ts`

---

#### [T072] [P] Implement AudioFieldType

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/types/fields/AudioFieldType.tsx` 作成
- [x] FieldType を継承
- [x] `assetId` を格納
- [ ] 再生ボタン付きプレビュー（将来対応）
- [x] レジストリに登録
- [x] テスト追加

**関連ファイル:**

- `src/types/fields/AudioFieldType.ts`
- `src/types/fields/AudioFieldType.test.ts`

---

### US5: 画像アセット

#### [T073] [US5] Create assetSlice

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/stores/assetSlice.ts` 作成
- [x] `assets: AssetReference[]` 状態
- [x] `assetFolders: AssetFolder[]` 状態
- [x] CRUD アクション
- [x] フォルダ操作アクション
- [x] テスト追加

**関連ファイル:**

- `src/stores/assetSlice.ts`
- `src/stores/assetSlice.test.ts`

---

#### [T074] [US5] Create AssetsPage

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/app/(editor)/settings/assets/page.tsx` 作成
- [x] 3カラムレイアウト使用
- [x] 左: フォルダツリー、中央: グリッド、右: プレビュー

**関連ファイル:**

- `src/app/(editor)/settings/assets/page.tsx`

---

#### [T075] [US5] Create AssetFolderTree

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/features/asset-manager/components/AssetFolderTree.tsx` 作成
- [x] フォルダ階層表示
- [x] 展開/折りたたみ
- [x] フォルダ選択
- [x] 右クリックメニュー（新規、名前変更、削除）
- [ ] テスト追加（将来対応）

**関連ファイル:**

- `src/features/asset-manager/components/AssetFolderTree.tsx`
- `src/features/asset-manager/components/AssetFolderTree.test.tsx`

---

#### [T076] [US5] Create AssetGrid

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/features/asset-manager/components/AssetGrid.tsx` 作成
- [x] グリッド形式でアセット表示
- [x] サムネイル表示
- [x] 選択状態
- [ ] 複数選択対応（将来対応）
- [ ] 仮想化（大量アセット対応）（将来対応）
- [ ] テスト追加（将来対応）

**関連ファイル:**

- `src/features/asset-manager/components/AssetGrid.tsx`
- `src/features/asset-manager/components/AssetGrid.test.tsx`

---

#### [T077] [US5] Create AssetUploader

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] AssetGrid に統合実装
- [x] ドラッグ&ドロップアップロード
- [x] ファイル選択ダイアログ
- [x] 複数ファイル対応
- [ ] プログレス表示（将来対応）
- [x] ファイルタイプ検証
- [ ] テスト追加（将来対応）

**関連ファイル:**

- `src/features/asset-manager/components/AssetUploader.tsx`
- `src/features/asset-manager/components/AssetUploader.test.tsx`

---

#### [T078] [US5] Create AssetPreview

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/features/asset-manager/components/AssetPreview.tsx` 作成
- [x] 画像プレビュー
- [x] メタデータ表示（サイズ、解像度、ファイルサイズ）
- [x] 名前変更
- [x] 削除ボタン
- [x] テスト追加

**関連ファイル:**

- `src/features/asset-manager/components/AssetPreview.tsx`
- `src/features/asset-manager/components/AssetPreview.test.tsx`

---

#### [T079] [US5] Create ImageFieldEditor

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/features/data-editor/components/fields/ImageFieldEditor.tsx` 作成
- [x] サムネイル表示
- [x] 選択ボタン（AssetPickerModal を開く）
- [x] クリアボタン
- [x] テスト追加

**関連ファイル:**

- `src/features/data-editor/components/fields/ImageFieldEditor.tsx`
- `src/features/data-editor/components/fields/ImageFieldEditor.test.tsx`

---

#### [T080] [US5] Create AssetPickerModal

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/features/asset-manager/components/AssetPickerModal.tsx` 作成
- [x] モーダル内でアセット選択
- [x] フォルダナビゲーション
- [x] 検索フィルター
- [x] タイプフィルター（image/audio）
- [x] 選択確定/キャンセルボタン
- [x] テスト追加

**関連ファイル:**

- `src/features/asset-manager/components/AssetPickerModal.tsx`
- `src/features/asset-manager/components/AssetPickerModal.test.tsx`

---

### アセットフォルダ管理

#### [T080a] [US5] Create CreateFolderModal

- **ステータス:** [x] 完了
- **ブランチ:** feature/T030-confirm-dialog
- **PR:** -

**完了条件:**

- [x] `src/features/asset-manager/components/CreateFolderModal.tsx` 作成
- [x] フォルダ名入力
- [x] 親フォルダ選択
- [x] 重複チェック
- [x] テスト追加

**関連ファイル:**

- `src/features/asset-manager/components/CreateFolderModal.tsx`
- `src/features/asset-manager/components/CreateFolderModal.test.tsx`

---

#### [T080b] [US5] Create RenameFolderModal

- **ステータス:** [x] 完了
- **ブランチ:** feature/T030-confirm-dialog
- **PR:** -

**完了条件:**

- [x] `src/features/asset-manager/components/RenameFolderModal.tsx` 作成
- [x] 現在の名前表示
- [x] 新しい名前入力
- [x] 重複チェック
- [x] テスト追加

**関連ファイル:**

- `src/features/asset-manager/components/RenameFolderModal.tsx`
- `src/features/asset-manager/components/RenameFolderModal.test.tsx`

---

#### [T080c] [US5] Create DeleteFolderConfirm

- **ステータス:** [x] 完了
- **ブランチ:** feature/T030-confirm-dialog
- **PR:** -

**完了条件:**

- [x] `src/features/asset-manager/components/DeleteFolderConfirm.tsx` 作成
- [x] 削除確認ダイアログ
- [x] 中身があるフォルダの警告
- [x] テスト追加

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

- **ステータス:** [x] 完了
- **ブランチ:** feature/T030-confirm-dialog
- **PR:** -

**完了条件:**

- [x] `src/features/data-editor/components/fields/AudioFieldEditor.tsx` 作成
- [x] 音声ファイル名表示
- [x] 再生/停止ボタン
- [x] 選択ボタン
- [x] テスト追加

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

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/stores/dataSlice.ts` 作成
- [x] `dataTypes: DataType[]` 状態
- [x] `dataEntries: Record<string, DataEntry[]>` 状態
- [x] CRUD アクション
- [ ] ID 変更時の参照同期アクション（T095で対応）
- [x] テスト追加

**関連ファイル:**

- `src/stores/dataSlice.ts`
- `src/stores/dataSlice.test.ts`

**参照:**

- design.md#stores/dataSlice.ts

---

#### [T087] [US8] Create DataPage

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/app/(editor)/data/page.tsx` 作成
- [x] ThreeColumnLayout 使用
- [x] 左: DataTypeList、中央: DataEntryList、右: FormBuilder/DataTypeEditor

**関連ファイル:**

- `src/app/(editor)/data/page.tsx`

---

#### [T088] [US8] Create DataTypeList

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/features/data-editor/components/DataTypeList.tsx` 作成
- [x] データタイプ一覧表示
- [x] 選択状態
- [x] 追加/削除ボタン
- [ ] ドラッグ&ドロップ並び替え（後続タスクで対応）
- [x] テスト追加

**関連ファイル:**

- `src/features/data-editor/components/DataTypeList.tsx`
- `src/features/data-editor/components/DataTypeList.test.tsx`

---

#### [T089] [US8] Create DataEntryList (virtualized)

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/features/data-editor/components/DataEntryList.tsx` 作成
- [ ] @tanstack/react-virtual で仮想化（後続タスクで対応）
- [x] 最大1000件対応（maxEntries制限）
- [ ] 検索フィルター（T094で対応）
- [x] 選択状態
- [x] 追加/削除/複製
- [x] テスト追加

**関連ファイル:**

- `src/features/data-editor/components/DataEntryList.tsx`
- `src/features/data-editor/components/DataEntryList.test.tsx`

---

#### [T090] [US8] Create FormBuilder

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/features/data-editor/components/FormBuilder.tsx` 作成
- [x] DataType の fields に基づいてフォーム生成
- [x] 各 FieldType の renderEditor() を使用
- [x] 条件付き表示対応
- [ ] バリデーションエラー表示（後続タスクで対応）
- [x] テスト追加

**関連ファイル:**

- `src/features/data-editor/components/FormBuilder.tsx`
- `src/features/data-editor/components/FormBuilder.test.tsx`

---

#### [T091] [US8] Create FieldTypeSelector modal

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/features/data-editor/components/FieldTypeSelector.tsx` 作成
- [x] 登録済み FieldType 一覧表示
- [x] カテゴリ分類
- [x] 検索フィルター
- [x] 選択で新規フィールド追加
- [x] テスト追加

**関連ファイル:**

- `src/features/data-editor/components/FieldTypeSelector.tsx`
- `src/features/data-editor/components/FieldTypeSelector.test.tsx`

---

#### [T092] [US8] Create DataTypeEditor sidebar

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/features/data-editor/components/DataTypeEditor.tsx` 作成
- [x] データタイプ名編集
- [x] フィールド一覧編集
- [x] フィールド追加/削除/並び替え
- [ ] 各フィールドの詳細設定（後続タスクで対応）
- [x] テスト追加

**関連ファイル:**

- `src/features/data-editor/components/DataTypeEditor.tsx`
- `src/features/data-editor/components/DataTypeEditor.test.tsx`

---

#### [T093] [US8] Define DataType and DataEntry types

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/types/data.ts` に `DataType` インターフェース追加
- [x] `src/types/data.ts` に `DataEntry` インターフェース追加
- [x] DataType: id, name, fields
- [x] DataEntry: id, typeId, values

**関連ファイル:**

- `src/types/data.ts`

**参照:**

- design.md#4.2-データ構造

---

#### [T094] [US8] Implement data search/filter

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/features/data-editor/hooks/useDataFilter.ts` 作成
- [x] テキスト検索
- [x] フィールド値でのフィルター
- [x] debounce 処理
- [x] テスト追加

**関連ファイル:**

- `src/features/data-editor/hooks/useDataFilter.ts`
- `src/features/data-editor/hooks/useDataFilter.test.ts`

---

#### [T095] [US8] Implement ID change synchronization

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/features/data-editor/utils/idSync.ts` 作成
- [x] データID変更時に全参照を更新
- [x] 影響範囲の検出
- [x] 一括更新処理
- [x] テスト追加

**関連ファイル:**

- `src/features/data-editor/utils/idSync.ts`
- `src/features/data-editor/utils/idSync.test.ts`

**参照:**

- requirements.md#データID変更時の動作

---

#### [T096] [US8] Implement reference integrity check

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/features/data-editor/utils/referenceCheck.ts` 作成
- [x] データ削除時の参照チェック
- [x] 参照されている場合の警告
- [x] 参照元の一覧表示
- [x] テスト追加

**関連ファイル:**

- `src/features/data-editor/utils/referenceCheck.ts`
- `src/features/data-editor/utils/referenceCheck.test.ts`

---

### デフォルトデータタイプ

#### [T097] [US8] Create default DataTypes

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/lib/defaultDataTypes.ts` 作成
- [x] character（キャラクター）データタイプ
- [x] job（職業）データタイプ
- [x] skill（スキル）データタイプ
- [x] item（アイテム）データタイプ
- [x] enemy（敵）データタイプ
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

> **design.md との整合性メモ:**
> Message, Choice, Input (showMessage/showChoice/showNumberInput/showTextInput) は
> EventAction ではなく ScriptAPI のメソッドとしてイベントスクリプトから呼び出す設計。
> Save/Load も同様にスクリプト関数 (Save()/Load()) として提供。
> 旧 T098, T099, T109a, T109e, T109f は削除。

### 基本アクション実装

#### [T100] [P] Implement VariableOpAction

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/engine/actions/VariableOpAction.ts` 作成
- [x] EventAction を継承
- [x] プロパティ: variableId, operation, value (ValueSource)
- [x] operation: set, add, subtract, multiply, divide
- [x] execute(): 変数を操作（ValueSource で値解決）
- [x] レジストリに登録
- [x] テスト追加

**備考:** ファイルは `src/engine/actions/` に配置（UI分離設計）。value は ValueSource レジストリパターンで拡張可能。

**関連ファイル:**

- `src/engine/actions/VariableOpAction.ts`
- `src/engine/actions/VariableOpAction.test.ts`

---

#### [T101] [P] Implement ConditionalAction

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/engine/actions/ConditionalAction.ts` 作成
- [x] EventAction を継承
- [x] プロパティ: condition, thenActions, elseActions
- [x] execute(): 条件評価、分岐実行
- [x] ネスト対応
- [x] レジストリに登録
- [x] テスト追加（13テスト）

**関連ファイル:**

- `src/engine/actions/ConditionalAction.ts`
- `src/engine/actions/ConditionalAction.test.ts`

---

#### [T102] [P] Implement LoopAction

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/engine/actions/LoopAction.ts` 作成
- [x] EventAction を継承
- [x] プロパティ: count, actions
- [x] execute(): 指定回数ループ
- [x] break 対応
- [x] レジストリに登録
- [x] テスト追加（5テスト）

**関連ファイル:**

- `src/engine/actions/LoopAction.ts`
- `src/engine/actions/LoopAction.test.ts`

---

#### [T103] [P] Implement WaitAction

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/engine/actions/WaitAction.ts` 作成
- [x] EventAction を継承
- [x] プロパティ: frames
- [x] execute(): no-op（Phase 18で実装）
- [x] レジストリに登録
- [x] テスト追加

**関連ファイル:**

- `src/engine/actions/WaitAction.ts`
- `src/engine/actions/stubActions.test.ts`

---

#### [T104] [P] Implement AudioAction

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

> 旧 T104 (PlaySE) + T105 (PlayBGM) + T106 (StopBGM) を統合。
> design.md の AudioAction に準拠。

**完了条件:**

- [x] `src/engine/actions/AudioAction.ts` 作成
- [x] EventAction を継承
- [x] プロパティ: operation (playBGM/stopBGM/playSE), audioId, volume, pitch, fadeIn, fadeOut
- [x] execute(): operation に応じて context.sound の各メソッドを呼び出し
- [x] レジストリに登録
- [x] テスト追加（5テスト）

**関連ファイル:**

- `src/engine/actions/AudioAction.ts`
- `src/engine/actions/AudioAction.test.ts`

---

#### [T107] [P] Implement CameraAction

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

> 旧 FadeScreenAction を CameraAction に拡張。
> design.md の CameraAction (zoom/pan/effect/reset) に準拠。

**完了条件:**

- [x] `src/engine/actions/CameraAction.ts` 作成
- [x] EventAction を継承
- [x] プロパティ: operation (zoom/pan/effect/reset), scale, x, y, duration, effect (shake/flash/fadeIn/fadeOut), intensity, color
- [x] execute(): operation に応じて context.camera の各メソッドを呼び出し
- [x] レジストリに登録
- [x] テスト追加（4テスト）

**関連ファイル:**

- `src/engine/actions/CameraAction.ts`
- `src/engine/actions/CameraAction.test.ts`

---

#### [T108] [P] Implement ScriptAction

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

> 旧 CallScriptAction を ScriptAction に変更。
> design.md の ScriptAction に準拠。イベントスクリプトを呼び出し、
> スクリプト内から ScriptAPI (showMessage, showChoice 等) を利用する。

**完了条件:**

- [x] `src/engine/actions/ScriptAction.ts` 作成
- [x] EventAction を継承
- [x] プロパティ: scriptId, args
- [x] execute(): context.scriptRunner.executeById() で委譲
- [x] レジストリに登録
- [x] テスト追加（3テスト）

**関連ファイル:**

- `src/engine/actions/ScriptAction.ts`
- `src/engine/actions/ScriptAction.test.ts`

---

#### [T109] [P] Implement CallTemplateAction

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/engine/actions/CallTemplateAction.ts` 作成
- [x] EventAction を継承
- [x] プロパティ: templateId, args
- [x] execute(): no-op（テンプレート解決は後続フェーズ）
- [x] レジストリに登録
- [x] テスト追加（3テスト）

**関連ファイル:**

- `src/engine/actions/CallTemplateAction.ts`
- `src/engine/actions/CallTemplateAction.test.ts`

---

#### [T109b] [P] Implement MapAction

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

> 旧 ChangeMapAction を MapAction に拡張。
> design.md の MapAction (getChip/changeMap) に準拠。

**完了条件:**

- [x] `src/engine/actions/MapAction.ts` 作成
- [x] EventAction を継承
- [x] プロパティ: operation (changeMap/getChip), targetMapId, x, y, transition, resultVariableId, sourceMapId, chipX, chipY, layer
- [x] execute(): no-op（Phase 10で実装）
- [x] レジストリに登録
- [x] テスト追加

**関連ファイル:**

- `src/engine/actions/MapAction.ts`
- `src/engine/actions/stubActions.test.ts`

---

#### [T109c] [P] Implement ObjectAction

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

> 旧 MoveAction (T109c) + AppearanceChangeAction (T109d) を統合。
> design.md の ObjectAction (move/rotate/autoWalk) に準拠し、見た目変更も含む。

**完了条件:**

- [x] `src/engine/actions/ObjectAction.ts` 作成
- [x] EventAction を継承
- [x] プロパティ: operation (move/rotate/autoWalk), targetId, x, y, speed, angle, duration, enabled, pattern
- [x] execute(): no-op（Phase 10で実装）
- [x] レジストリに登録
- [x] テスト追加

**関連ファイル:**

- `src/engine/actions/ObjectAction.ts`
- `src/engine/actions/stubActions.test.ts`

---

### US9: イベントテンプレートページ

#### [T110] [US9] Create eventSlice

- **ステータス:** [x] 完了
- **ブランチ:** feature/T110-event-system
- **PR:** -

**完了条件:**

- [x] `src/stores/eventSlice.ts` 作成
- [x] `events: GameEvent[]` 状態
- [x] `eventTemplates: EventTemplate[]` 状態
- [x] CRUD アクション
- [x] テスト追加

**関連ファイル:**

- `src/stores/eventSlice.ts`
- `src/stores/eventSlice.test.ts`

---

#### [T111] [US9] Create EventTemplatePage

- **ステータス:** [x] 完了
- **ブランチ:** feature/T110-event-system
- **PR:** -

**完了条件:**

- [x] `src/app/(editor)/event/templates/page.tsx` 作成
- [x] ThreeColumnLayout 使用
- [x] 左: テンプレート一覧、中央: ブロックエディタ、右: プロパティ

**関連ファイル:**

- `src/app/(editor)/event/templates/page.tsx`

---

#### [T112] [US9] Create EventTemplateList

- **ステータス:** [x] 完了
- **ブランチ:** feature/T110-event-system
- **PR:** -

**完了条件:**

- [x] `src/features/event-editor/components/EventTemplateList.tsx` 作成
- [x] テンプレート一覧表示
- [x] 追加/削除ボタン
- [x] テスト追加

**関連ファイル:**

- `src/features/event-editor/components/EventTemplateList.tsx`
- `src/features/event-editor/components/EventTemplateList.test.tsx`

---

#### [T113] [US9] Create EventTemplateEditor

- **ステータス:** [x] 完了
- **ブランチ:** feature/T110-event-system
- **PR:** -

**完了条件:**

- [x] `src/features/event-editor/components/EventTemplateEditor.tsx` 作成
- [x] テンプレート名編集
- [x] 引数一覧編集
- [x] アクションブロック編集
- [x] テスト追加

**関連ファイル:**

- `src/features/event-editor/components/EventTemplateEditor.tsx`
- `src/features/event-editor/components/EventTemplateEditor.test.tsx`

---

#### [T114] [US9] Create TemplateArgEditor

- **ステータス:** [x] 完了
- **ブランチ:** feature/T110-event-system
- **PR:** -

**完了条件:**

- [x] `src/features/event-editor/components/TemplateArgEditor.tsx` 作成
- [x] 引数名入力
- [x] 引数型選択（FieldType）
- [x] 必須フラグ
- [x] デフォルト値設定
- [x] テスト追加

**関連ファイル:**

- `src/features/event-editor/components/TemplateArgEditor.tsx`
- `src/features/event-editor/components/TemplateArgEditor.test.tsx`

---

#### [T115] [US9] Create ActionBlockEditor

- **ステータス:** [x] 完了
- **ブランチ:** feature/T110-event-system
- **PR:** -

**完了条件:**

- [x] `src/features/event-editor/components/ActionBlockEditor.tsx` 作成
- [x] アクションブロック一覧表示
- [x] ドラッグ&ドロップ並び替え
- [x] ブロックの追加/削除
- [x] ネスト表示（条件分岐、ループ）
- [x] テスト追加

**関連ファイル:**

- `src/features/event-editor/components/ActionBlockEditor.tsx`
- `src/features/event-editor/components/ActionBlockEditor.test.tsx`

---

#### [T116] [US9] Create ActionSelector modal

- **ステータス:** [x] 完了
- **ブランチ:** feature/T110-event-system
- **PR:** -

**完了条件:**

- [x] `src/features/event-editor/components/ActionSelector.tsx` 作成
- [x] 登録済みアクション一覧
- [x] カテゴリ分類（ロジック、基礎、スクリプト、テンプレート）
- [x] 検索フィルター
- [x] テスト追加

**関連ファイル:**

- `src/features/event-editor/components/ActionSelector.tsx`
- `src/features/event-editor/components/ActionSelector.test.tsx`

---

#### [T117] [US9] Define GameEvent and EventTemplate types

- **ステータス:** [x] 完了
- **ブランチ:** feature/T110-event-system
- **PR:** -

**完了条件:**

- [x] `src/types/event.ts` 作成
- [x] `GameEvent` インターフェース定義
- [x] `EventTemplate` インターフェース定義
- [x] `TemplateArg` インターフェース定義

**関連ファイル:**

- `src/types/event.ts`

**参照:**

- design.md#4.6-イベント・テンプレート構造

---

### アクションブロックエディタ

> Message, Choice, Input のブロックエディタは削除（ScriptAPI に移行のため）。
> Save/Load も同様に削除（スクリプト関数として提供）。

#### [T120] [P] Create VariableOpActionBlock

- **ステータス:** [x] 完了
- **ブランチ:** feature/T110-event-system
- **PR:** -

**完了条件:**

- [x] `src/features/event-editor/components/blocks/VariableOpActionBlock.tsx` 作成
- [x] 変数選択（Store Select + 型フィルタリング + classId比較）
- [x] 演算子選択
- [x] ValueSource 4種切替（直値/変数/データ参照/ランダム）
- [x] クラスフィールドドリリング（サブフィールド選択）
- [x] 配列インデックス対応（ValueSource再利用）
- [x] 型不一致エラー表示
- [x] 空プレースホルダー表示
- [x] テスト追加（39テスト）

**関連ファイル:**

- `src/features/event-editor/components/blocks/VariableOpActionBlock.tsx`
- `src/features/event-editor/components/blocks/VariableOpActionBlock.test.tsx`

---

#### [T121] [P] Create ConditionalActionBlock

- **ステータス:** [x] 完了
- **ブランチ:** feature/T110-event-system
- **PR:** -

**完了条件:**

- [x] `src/features/event-editor/components/blocks/ConditionalActionBlock.tsx` 作成
- [x] 条件設定 UI（型安全オペランド + Store Select）
- [x] Then/Else ブランチ表示
- [x] ネスト対応
- [x] テスト追加

**関連ファイル:**

- `src/features/event-editor/components/blocks/ConditionalActionBlock.tsx`
- `src/features/event-editor/components/blocks/ConditionalActionBlock.test.tsx`

---

#### [T122] [P] Create LoopActionBlock

- **ステータス:** [x] 完了
- **ブランチ:** feature/T110-event-system
- **PR:** -

**完了条件:**

- [x] `src/features/event-editor/components/blocks/LoopActionBlock.tsx` 作成
- [x] ループ回数設定
- [x] 子アクション表示
- [x] テスト追加

**関連ファイル:**

- `src/features/event-editor/components/blocks/LoopActionBlock.tsx`
- `src/features/event-editor/components/blocks/LoopActionBlock.test.tsx`

---

#### [T122a] [P] Create WaitActionBlock

- **ステータス:** [x] 完了
- **ブランチ:** feature/T110-event-system
- **PR:** -

**完了条件:**

- [x] `src/features/event-editor/components/blocks/WaitActionBlock.tsx` 作成
- [x] フレーム数入力
- [x] テスト追加

**関連ファイル:**

- `src/features/event-editor/components/blocks/WaitActionBlock.tsx`
- `src/features/event-editor/components/blocks/WaitActionBlock.test.tsx`

---

#### [T122b] [P] Create AudioActionBlock

- **ステータス:** [x] 完了
- **ブランチ:** feature/T110-event-system
- **PR:** -

> 旧 PlaySEActionBlock (T122b) + PlayBGMActionBlock (T122c) + StopBGMActionBlock (T122d) を統合。

**完了条件:**

- [x] `src/features/event-editor/components/blocks/AudioActionBlock.tsx` 作成
- [x] operation 切替 UI（PlayBGM/StopBGM/PlaySE）
- [x] 音声ファイル選択（Store Select）、ボリューム/ピッチ/フェード設定
- [ ] 試聴ボタン（未実装）
- [x] テスト追加

**関連ファイル:**

- `src/features/event-editor/components/blocks/AudioActionBlock.tsx`
- `src/features/event-editor/components/blocks/AudioActionBlock.test.tsx`

---

#### [T122e] [P] Create CameraActionBlock

- **ステータス:** [x] 完了
- **ブランチ:** feature/T110-event-system
- **PR:** -

> 旧 FadeScreenActionBlock を CameraActionBlock に拡張。

**完了条件:**

- [x] `src/features/event-editor/components/blocks/CameraActionBlock.tsx` 作成
- [x] operation 切替 UI（zoom/pan/effect/reset）
- [x] effect サブタイプ選択（shake/flash/fadeIn/fadeOut）
- [x] スケール/座標/時間/色/強度設定
- [x] テスト追加

**関連ファイル:**

- `src/features/event-editor/components/blocks/CameraActionBlock.tsx`
- `src/features/event-editor/components/blocks/CameraActionBlock.test.tsx`

---

#### [T122f] [P] Create ScriptActionBlock

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

> 旧 CallScriptActionBlock を ScriptActionBlock に変更。

**完了条件:**

- [x] `src/features/event-editor/components/blocks/ScriptActionBlock.tsx` 作成
- [x] イベントスクリプト選択
- [x] 引数設定 UI
- [x] テスト追加

**関連ファイル:**

- `src/features/event-editor/components/blocks/ScriptActionBlock.tsx`
- `src/features/event-editor/components/blocks/ScriptActionBlock.test.tsx`

---

#### [T122g] [P] Create CallTemplateActionBlock

- **ステータス:** [x] 完了
- **ブランチ:** feature/T110-event-system
- **PR:** -

**完了条件:**

- [x] `src/features/event-editor/components/blocks/CallTemplateActionBlock.tsx` 作成
- [x] テンプレート選択（Store Select）
- [x] 引数設定 UI
- [x] テスト追加

**関連ファイル:**

- `src/features/event-editor/components/blocks/CallTemplateActionBlock.tsx`
- `src/features/event-editor/components/blocks/CallTemplateActionBlock.test.tsx`

---

#### [T122i] [P] Create MapActionBlock

- **ステータス:** [x] 完了
- **ブランチ:** feature/T110-event-system
- **PR:** -

> 旧 ChangeMapActionBlock を MapActionBlock に拡張。

**完了条件:**

- [x] `src/features/event-editor/components/blocks/MapActionBlock.tsx` 作成
- [x] operation 切替 UI（getChip/changeMap）
- [x] マップ選択（Store Select）、座標設定、フェード設定
- [x] getChip 時の結果変数選択（Store Select）
- [x] テスト追加

**関連ファイル:**

- `src/features/event-editor/components/blocks/MapActionBlock.tsx`
- `src/features/event-editor/components/blocks/MapActionBlock.test.tsx`

---

#### [T122j] [P] Create ObjectActionBlock

- **ステータス:** [x] 完了
- **ブランチ:** feature/T110-event-system
- **PR:** -

> 旧 MoveActionBlock (T122j) + AppearanceChangeActionBlock (T122k) を統合。

**完了条件:**

- [x] `src/features/event-editor/components/blocks/ObjectActionBlock.tsx` 作成
- [x] operation 切替 UI（move/rotate/autoWalk/appearance）
- [x] 対象オブジェクト選択
- [x] 各 operation に応じた設定（座標/速度/角度/画像等）
- [x] テスト追加

**関連ファイル:**

- `src/features/event-editor/components/blocks/ObjectActionBlock.tsx`
- `src/features/event-editor/components/blocks/ObjectActionBlock.test.tsx`

---

## Phase 9: スクリプトエディタ（大）

### US10: スクリプトページ

#### [T123] [US10] Create scriptSlice

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/stores/scriptSlice.ts` 作成
- [x] `scripts: Script[]` 状態
- [x] CRUD アクション
- [x] 階層構造（内部スクリプト）対応
- [x] テスト追加

**関連ファイル:**

- `src/stores/scriptSlice.ts`
- `src/stores/scriptSlice.test.ts`

---

#### [T124] [US10] Create EventScriptPage

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/app/(editor)/script/event/page.tsx` 作成
- [x] ThreeColumnLayout 使用
- [x] 左: スクリプト一覧、中央: エディタ、右: 設定

**関連ファイル:**

- `src/app/(editor)/script/event/page.tsx`

---

#### [T125] [US10] Create ComponentScriptPage

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/app/(editor)/script/component/page.tsx` 作成
- [x] EventScriptPage と同様のレイアウト
- [x] コンポーネント用フィールド設定

**関連ファイル:**

- `src/app/(editor)/script/component/page.tsx`

---

#### [T126] [US10] Create ScriptList

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/features/script-editor/components/ScriptList.tsx` 作成
- [x] 階層構造表示
- [x] 親スクリプト + 内部スクリプト
- [x] 追加/削除ボタン
- [x] テスト追加

**関連ファイル:**

- `src/features/script-editor/components/ScriptList.tsx`
- `src/features/script-editor/components/ScriptList.test.tsx`

---

#### [T127] [US10] Create ScriptEditor (Monaco wrapper)

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/features/script-editor/components/ScriptEditor.tsx` 作成
- [x] Monaco Editor 統合
- [x] JavaScript/TypeScript シンタックスハイライト
- [x] エラー表示
- [x] 自動補完
- [x] テスト追加

**関連ファイル:**

- `src/features/script-editor/components/ScriptEditor.tsx`
- `src/features/script-editor/components/ScriptEditor.test.tsx`

---

#### [T128] [US10] Create ScriptSettingsPanel

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/features/script-editor/components/ScriptSettingsPanel.tsx` 作成
- [x] スクリプト名編集
- [x] 引数定義（イベントスクリプト）
- [x] フィールド定義（コンポーネントスクリプト）
- [x] テスト追加

**関連ファイル:**

- `src/features/script-editor/components/ScriptSettingsPanel.tsx`
- `src/features/script-editor/components/ScriptSettingsPanel.test.tsx`

---

#### [T129] [US10] Create ScriptTestPanel

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/features/script-editor/components/ScriptTestPanel.tsx` 作成
- [x] テスト実行ボタン
- [x] 引数入力 UI
- [x] 実行結果表示
- [x] コンソール出力表示
- [x] テスト追加

**関連ファイル:**

- `src/features/script-editor/components/ScriptTestPanel.tsx`
- `src/features/script-editor/components/ScriptTestPanel.test.tsx`

---

#### [T130] [US10] Create InternalScriptList

- **ステータス:** [x] T126 で対応済み（ScriptList の再帰ツリーで内部スクリプト表示）
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] ScriptList の ScriptTreeItem で内部スクリプト一覧を再帰表示
- [x] コンテキストメニューから追加/削除
- [x] テスト追加（ScriptList.test.tsx に含む）

**関連ファイル:**

- `src/features/script-editor/components/ScriptList.tsx`（統合済み）

---

#### [T131] [US10] Define Script types

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/types/script.ts` 作成
- [x] `Script` インターフェース
- [x] `ScriptType` ('event' | 'component' | 'internal')
- [x] `ScriptArg` インターフェース

**関連ファイル:**

- `src/types/script.ts`

---

#### [T132] [US10] Implement API autocomplete definitions

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/features/script-editor/utils/apiDefinitions.ts` 作成
- [x] ゲームAPI の型定義（Data, Variable, Sound, etc.）
- [x] Monaco Editor への登録
- [x] ホバー時のドキュメント表示
- [x] テスト追加

**関連ファイル:**

- `src/features/script-editor/utils/apiDefinitions.ts`
- `src/features/script-editor/utils/apiDefinitions.test.ts`

---

## Phase 10: マップ基盤（大）

### コンポーネント定義

#### [T133] [P] Implement TransformComponent

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**備考:** Component 基底クラスから renderPropertyPanel 削除 + ライフサイクルメソッド追加も同時実施。

**完了条件:**

- [x] `src/types/components/TransformComponent.ts` 作成
- [x] Component を継承
- [x] プロパティ: x, y, rotation, scaleX, scaleY
- [x] レジストリに登録
- [x] テスト追加

**関連ファイル:**

- `src/types/components/TransformComponent.ts`
- `src/types/components/TransformComponent.test.ts`

---

#### [T134] [P] Implement SpriteComponent

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/types/components/SpriteComponent.ts` 作成
- [x] Component を継承
- [x] プロパティ: imageId, animationId, flipX, flipY, tint, opacity
- [x] レジストリに登録
- [x] テスト追加

**関連ファイル:**

- `src/types/components/SpriteComponent.ts`
- `src/types/components/SpriteComponent.test.ts`

---

#### [T135] [P] Implement ColliderComponent

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/types/components/ColliderComponent.ts` 作成
- [x] Component を継承
- [x] プロパティ: width, height, passable, layer
- [x] グリッド単位
- [x] レジストリに登録
- [x] テスト追加

**関連ファイル:**

- `src/types/components/ColliderComponent.ts`
- `src/types/components/ColliderComponent.test.ts`

---

#### [T136] [P] Implement MovementComponent

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/types/components/MovementComponent.ts` 作成
- [x] Component を継承
- [x] プロパティ: pattern, speed, routePoints
- [x] pattern: fixed, random, route
- [x] レジストリに登録
- [x] テスト追加

**関連ファイル:**

- `src/types/components/MovementComponent.ts`
- `src/types/components/MovementComponent.test.ts`

---

#### [T137] [P] Implement VariablesComponent

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/types/components/VariablesComponent.ts` 作成
- [x] Component を継承
- [x] プロパティ: variables
- [x] オブジェクト専用変数の管理
- [x] レジストリに登録
- [x] テスト追加

**関連ファイル:**

- `src/types/components/VariablesComponent.ts`
- `src/types/components/VariablesComponent.test.ts`

---

#### [T138] [P] Implement ControllerComponent

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/types/components/ControllerComponent.ts` 作成
- [x] Component を継承
- [x] プロパティ: moveSpeed, dashEnabled, inputEnabled
- [ ] プレイヤー操作可能化（実処理は Phase 18 T210d で実装）
- [x] レジストリに登録
- [x] テスト追加

**関連ファイル:**

- `src/types/components/ControllerComponent.ts`
- `src/types/components/ControllerComponent.test.ts`

---

#### [T139] [P] Implement EffectComponent

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/types/components/EffectComponent.ts` 作成
- [x] Component を継承
- [x] プロパティ: effectId, onComplete
- [x] onComplete: delete, hide, none
- [x] レジストリに登録
- [x] テスト追加

**関連ファイル:**

- `src/types/components/EffectComponent.ts`
- `src/types/components/EffectComponent.test.ts`

---

#### [T140] [P] Implement ObjectCanvasComponent

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/types/components/ObjectCanvasComponent.ts` 作成
- [x] Component を継承
- [x] プロパティ: offsetX, offsetY, elements
- [ ] UI要素の描画処理（実処理は Phase 18 T214 UIRenderer で実装）
- [x] レジストリに登録
- [x] テスト追加

**関連ファイル:**

- `src/types/components/ObjectCanvasComponent.ts`
- `src/types/components/ObjectCanvasComponent.test.ts`

---

### トリガーコンポーネント（タイプ別）

#### [T141] [P] Implement TalkTriggerComponent

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/types/components/triggers/TalkTriggerComponent.ts` 作成
- [x] Component を継承
- [x] プロパティ: eventId, direction
- [x] direction: front, any
- [x] レジストリに登録
- [x] テスト追加

**関連ファイル:**

- `src/types/components/triggers/TalkTriggerComponent.ts`
- `src/types/components/triggers/triggers.test.ts`

---

#### [T142] [P] Implement TouchTriggerComponent

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/types/components/triggers/TouchTriggerComponent.ts` 作成
- [x] Component を継承
- [x] プロパティ: eventId
- [x] レジストリに登録
- [x] テスト追加

**関連ファイル:**

- `src/types/components/triggers/TouchTriggerComponent.ts`
- `src/types/components/triggers/triggers.test.ts`

---

#### [T143] [P] Implement StepTriggerComponent

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/types/components/triggers/StepTriggerComponent.ts` 作成
- [x] Component を継承
- [x] プロパティ: eventId
- [x] レジストリに登録
- [x] テスト追加

**関連ファイル:**

- `src/types/components/triggers/StepTriggerComponent.ts`
- `src/types/components/triggers/triggers.test.ts`

---

#### [T144] [P] Implement AutoTriggerComponent

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/types/components/triggers/AutoTriggerComponent.ts` 作成
- [x] Component を継承
- [x] プロパティ: eventId, interval, runOnce
- [x] レジストリに登録
- [x] テスト追加

**関連ファイル:**

- `src/types/components/triggers/AutoTriggerComponent.ts`
- `src/types/components/triggers/triggers.test.ts`

---

#### [T144a] [P] Implement InputTriggerComponent

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/types/components/triggers/InputTriggerComponent.ts` 作成
- [x] Component を継承
- [x] プロパティ: eventId, key
- [x] 特定キー入力で発火
- [x] レジストリに登録
- [x] テスト追加

**関連ファイル:**

- `src/types/components/triggers/InputTriggerComponent.ts`
- `src/types/components/triggers/triggers.test.ts`

---

### マップ型定義

#### [T145] Define GameMap, MapLayer, MapObject types

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/types/map.ts` 作成
- [x] `GameMap` インターフェース
- [x] `MapLayer` インターフェース
- [x] `MapObject` インターフェース
- [x] `Chipset` / `ChipProperty` インターフェース
- [x] `Prefab` インターフェース
- [x] テスト追加

**関連ファイル:**

- `src/types/map.ts`
- `src/types/map.test.ts`

**参照:**

- design.md#4.4-マップ構造

---

## Phase 11: マップデータページ（中）

### US11: マップデータ

#### [T146] [US11] Create mapSlice

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/stores/mapSlice.ts` 作成
- [x] `maps: GameMap[]` 状態
- [x] `chipsets: Chipset[]` 状態
- [x] `selectedMapId`, `selectedLayerId`, `selectedObjectId` 選択状態
- [x] マップ/レイヤー/オブジェクト/チップセット CRUD アクション
- [x] タイル操作アクション (`setTile`)
- [x] 選択カスケード（マップ選択→レイヤー/オブジェクト選択クリア）
- [x] テスト追加（39テスト）

**関連ファイル:**

- `src/stores/mapSlice.ts`
- `src/stores/mapSlice.test.ts`

---

#### [T147] [US11] Create MapDataPage

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/app/(editor)/map/data/page.tsx` 作成
- [x] ThreeColumnLayout 使用
- [x] 左: マップ一覧、中央: 設定、右: チップセット

**関連ファイル:**

- `src/app/(editor)/map/data/page.tsx`

---

#### [T148] [US11] Create MapList

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/features/map-editor/components/MapList.tsx` 作成
- [x] マップ一覧表示
- [x] 追加/削除ボタン
- [x] ドラッグ&ドロップ並び替え
- [x] テスト追加

**関連ファイル:**

- `src/features/map-editor/components/MapList.tsx`
- `src/features/map-editor/components/MapList.test.tsx`

---

#### [T149] [US11] Create MapSettingsEditor

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/features/map-editor/components/MapSettingsEditor.tsx` 作成
- [x] マップ名編集
- [x] マップID編集
- [x] サイズ設定（幅 x 高さ）
- [x] BGM 選択
- [x] 背景画像選択
- [x] テスト追加

**関連ファイル:**

- `src/features/map-editor/components/MapSettingsEditor.tsx`
- `src/features/map-editor/components/MapSettingsEditor.test.tsx`

---

#### [T150] [US11] Create LayerEditor

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/features/map-editor/components/LayerEditor.tsx` 作成
- [x] レイヤー一覧（名前編集）
- [x] 追加/削除/▲▼並び替え
- [x] 表示/非表示トグル（`MapLayer.visible?: boolean`）
- [x] タイプ切り替え（tile/object）
- [x] チップセット割り当て（`MapLayer.chipsetIds: string[]`、tile レイヤーのみ）
- [x] `src/types/map.ts` の MapLayer に `visible?`, `chipsetIds` 追加
- [x] テスト追加

**関連ファイル:**

- `src/features/map-editor/components/LayerEditor.tsx`
- `src/features/map-editor/components/LayerEditor.test.tsx`
- `src/types/map.ts`

---

#### [T151] [US11] Create ChipsetEditor

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/features/map-editor/components/ChipsetEditor.tsx` 作成
- [x] チップセット一覧（追加/削除/名前変更）
- [ ] チップセット画像選択（AssetPicker）—次フェーズ
- [x] タイルサイズ設定（tileWidth / tileHeight）
- [x] フィールドスキーマ編集（FieldRow を使って通行設定・足音などを追加/削除/設定）
- [x] チップグリッド表示（番号 + 通行インジケータ ○/×）
- [x] `src/lib/defaultChipsetFields.ts` 作成（新規チップセットのデフォルトフィールド）
- [x] `src/stores/mapSlice.ts` に `updateChipProperty` アクション追加
- [x] テスト追加

**関連ファイル:**

- `src/features/map-editor/components/ChipsetEditor.tsx`
- `src/features/map-editor/components/ChipsetEditor.test.tsx`
- `src/lib/defaultChipsetFields.ts`
- `src/stores/mapSlice.ts`

---

#### [T152] [US11] Create ChipPropertyEditor

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/features/map-editor/components/ChipPropertyEditor.tsx` 作成
- [x] 選択チップの FieldType ベースプロパティ編集（chipset.fields を renderEditor() で描画）
- [x] 通行設定（BooleanFieldType デフォルト）
- [x] 足音設定（SelectFieldType デフォルト）
- [x] テスト追加

**関連ファイル:**

- `src/features/map-editor/components/ChipPropertyEditor.tsx`
- `src/features/map-editor/components/ChipPropertyEditor.test.tsx`

---

## Phase 12: オブジェクトプレハブ（中）

### US12: プレハブページ

#### [T153] [US12] Create prefabSlice

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/stores/prefabSlice.ts` 作成
- [x] `prefabs: Prefab[]` 状態
- [x] CRUD アクション
- [x] テスト追加（12テスト）

**関連ファイル:**

- `src/stores/prefabSlice.ts`
- `src/stores/prefabSlice.test.ts`

---

#### [T154] [US12] Create PrefabPage

- **ステータス:** [x] 完了
- **ブランチ:** main
- **PR:** -

**完了条件:**

- [x] `src/app/(editor)/map/prefabs/page.tsx` 作成
- [x] ThreeColumnLayout 使用

**関連ファイル:**

- `src/app/(editor)/map/prefabs/page.tsx`

---

#### [T155] [US12] Create PrefabList

- **ステータス:** [x] 完了
- **ブランチ:** main
- **PR:** -

**完了条件:**

- [x] `src/features/map-editor/components/PrefabList.tsx` 作成
- [x] プレハブ一覧表示
- [x] 追加/削除ボタン
- [x] テスト追加

**関連ファイル:**

- `src/features/map-editor/components/PrefabList.tsx`
- `src/features/map-editor/components/PrefabList.test.tsx`

---

#### [T156] [US12] Create PrefabPreview

- **ステータス:** [x] 完了（仮実装 — Phase 13 で Sprite 表示を本実装予定）
- **ブランチ:** main
- **PR:** -

**完了条件:**

- [x] `src/features/map-editor/components/PrefabPreview.tsx` 作成
- [x] プレハブのプレビュー表示（仮）
- [ ] Sprite 表示（Phase 13 で実装）
- [x] テスト追加

**関連ファイル:**

- `src/features/map-editor/components/PrefabPreview.tsx`
- `src/features/map-editor/components/PrefabPreview.test.tsx`

---

#### [T157] [US12] Create ComponentEditor

- **ステータス:** [x] 完了
- **ブランチ:** main
- **PR:** -

**完了条件:**

- [x] `src/features/map-editor/components/ComponentEditor.tsx` 作成
- [x] コンポーネント一覧表示
- [x] 各コンポーネントの renderPropertyPanel() 呼び出し
- [x] コンポーネントの追加/削除
- [x] テスト追加
- [x] Component クラスに renderPropertyPanel() を追加（Component.ts）
- [x] 9種 PropertyPanel ファイル作成（panels/ ディレクトリ）

**関連ファイル:**

- `src/features/map-editor/components/ComponentEditor.tsx`
- `src/features/map-editor/components/ComponentEditor.test.tsx`

---

#### [T158] [US12] Create ComponentSelector modal

- **ステータス:** [x] 完了（ComponentEditor に統合）
- **ブランチ:** main
- **PR:** -

**完了条件:**

- [x] 登録済みコンポーネント一覧（ComponentEditor の Select に統合）
- [x] カテゴリ分類（基本/動作/トリガー）
- [ ] 検索フィルター（省略 — Select ドロップダウンのため不要と判断）
- [x] テスト追加（ComponentEditor.test.tsx に含む）

**関連ファイル:**

- `src/features/map-editor/components/ComponentEditor.tsx`（統合済み）

---

## Phase 13: マップ編集ページ（大）

### US13: マップ編集

#### [T159] [US13] Create MapEditPage

- **ステータス:** [x] 完了
- **ブランチ:** feature/T242-chipset-editor-ui
- **PR:** -

**完了条件:**

- [x] `src/app/(editor)/map/page.tsx` 作成
- [x] ThreeColumnLayout 使用
- [x] 左: パレット、中央: キャンバス、右: プロパティ

**関連ファイル:**

- `src/app/(editor)/map/page.tsx`

---

#### [T160] [US13] Create MapCanvas

- **ステータス:** [x] 完了
- **ブランチ:** feature/T242-chipset-editor-ui
- **PR:** -

**完了条件:**

- [x] `src/features/map-editor/components/MapCanvas.tsx` 作成
- [x] Canvas/WebGL でマップ描画
- [x] タイルレイヤー表示
- [x] オブジェクトレイヤー表示
- [x] グリッド表示切り替え
- [x] ズーム/パン対応
- [x] テスト追加

**関連ファイル:**

- `src/features/map-editor/components/MapCanvas.tsx`
- `src/features/map-editor/components/MapCanvas.test.tsx`

---

#### [T161] [US13] Create ChipPalette

- **ステータス:** [x] 完了
- **ブランチ:** feature/T242-chipset-editor-ui
- **PR:** -

**完了条件:**

- [x] `src/features/map-editor/components/ChipPalette.tsx` 作成
- [x] チップセット画像からタイル選択
- [x] 選択範囲表示
- [x] 複数タイル選択（スタンプ用）
- [x] テスト追加

**関連ファイル:**

- `src/features/map-editor/components/ChipPalette.tsx`
- `src/features/map-editor/components/ChipPalette.test.tsx`

---

#### [T162] [US13] Create LayerTabs

- **ステータス:** [x] 完了
- **ブランチ:** feature/T242-chipset-editor-ui
- **PR:** -

**完了条件:**

- [x] `src/features/map-editor/components/LayerTabs.tsx` 作成
- [x] レイヤータブ表示
- [x] 選択切り替え
- [x] 表示/非表示トグル
- [x] テスト追加

**関連ファイル:**

- `src/features/map-editor/components/LayerTabs.tsx`
- `src/features/map-editor/components/LayerTabs.test.tsx`

---

#### [T163] [US13] Create MapToolbar

- **ステータス:** [x] 完了
- **ブランチ:** feature/T242-chipset-editor-ui
- **PR:** -

**完了条件:**

- [x] `src/features/map-editor/components/MapToolbar.tsx` 作成
- [x] ツール選択（選択、ペン、消しゴム、塗りつぶし、矩形）
- [x] ズームコントロール
- [x] グリッド表示トグル
- [x] テスト追加

**関連ファイル:**

- `src/features/map-editor/components/MapToolbar.tsx`
- `src/features/map-editor/components/MapToolbar.test.tsx`

---

#### [T164] [US13] Create ObjectList

- **ステータス:** [x] 完了
- **ブランチ:** feature/T242-chipset-editor-ui
- **PR:** -

**完了条件:**

- [x] `src/features/map-editor/components/MapObjectList.tsx` 作成
- [x] マップ内オブジェクト一覧
- [x] プレハブからのインスタンス表示
- [x] 選択/削除
- [x] テスト追加

**関連ファイル:**

- `src/features/map-editor/components/MapObjectList.tsx`
- `src/features/map-editor/components/MapObjectList.test.tsx`

---

#### [T165] [US13] Create MapPropertyPanel

- **ステータス:** [x] 完了
- **ブランチ:** feature/T242-chipset-editor-ui
- **PR:** -

**完了条件:**

- [x] `src/features/map-editor/components/MapPropertyPanel.tsx` 作成
- [x] 選択オブジェクトのプロパティ表示
- [x] コンポーネント編集
- [x] オーバーライド管理
- [x] テスト追加

**関連ファイル:**

- `src/features/map-editor/components/MapPropertyPanel.tsx`
- `src/features/map-editor/components/MapPropertyPanel.test.tsx`

---

### マップ編集フック

#### [T166] [US13] Create useMapCanvas hook

- **ステータス:** [x] 完了
- **ブランチ:** feature/T242-chipset-editor-ui
- **PR:** -

**完了条件:**

- [x] `src/features/map-editor/hooks/useMapCanvas.ts` 作成
- [x] Canvas 初期化
- [x] レンダリングループ
- [x] リサイズ対応

**関連ファイル:**

- `src/features/map-editor/hooks/useMapCanvas.ts`
- `src/features/map-editor/hooks/useMapCanvas.test.ts`

---

#### [T167] [US13] Create useTilePainting hook

- **ステータス:** [x] 完了
- **ブランチ:** feature/T242-chipset-editor-ui
- **PR:** -

**完了条件:**

- [x] `src/features/map-editor/hooks/useTilePainting.ts` 作成
- [x] マウスイベント処理
- [x] ツール別の描画処理
- [x] アンドゥ対応
- [x] テスト追加

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

- **ステータス:** [x] 完了
- **ブランチ:** feature/T242-chipset-editor-ui
- **PR:** -

**完了条件:**

- [x] `src/features/map-editor/hooks/useMapViewport.ts` 作成
- [x] ズーム制御
- [x] パン制御
- [x] 座標変換
- [x] テスト追加

**関連ファイル:**

- `src/features/map-editor/hooks/useMapViewport.ts`
- `src/features/map-editor/hooks/useMapViewport.test.ts`

---

### マップユーティリティ

#### [T170] [US13] Implement tile fill algorithm

- **ステータス:** [x] 完了
- **ブランチ:** feature/T242-chipset-editor-ui
- **PR:** -

**完了条件:**

- [x] `src/features/map-editor/utils/tileFill.ts` 作成
- [x] 塗りつぶしアルゴリズム（flood fill）
- [x] パフォーマンス最適化
- [x] テスト追加

**関連ファイル:**

- `src/features/map-editor/utils/tileFill.ts`
- `src/features/map-editor/utils/tileFill.test.ts`

---

#### [T171] [US13] Implement visible tile calculation

- **ステータス:** [x] 完了
- **ブランチ:** feature/T242-chipset-editor-ui
- **PR:** -

**完了条件:**

- [x] `src/features/map-editor/utils/visibleTiles.ts` 作成
- [x] ビューポート内のタイル計算
- [x] カリング最適化
- [x] テスト追加

**関連ファイル:**

- `src/features/map-editor/utils/visibleTiles.ts`
- `src/features/map-editor/utils/visibleTiles.test.ts`

---

### マップエディタキーボードショートカット

#### [T171a] [US13] Implement map editor shortcuts

- **ステータス:** [x] 完了
- **ブランチ:** feature/T242-chipset-editor-ui
- **PR:** -

**完了条件:**

- [x] `src/features/map-editor/hooks/useMapShortcuts.ts` 作成
- [x] B: ペンツール
- [x] E: 消しゴム
- [x] G: 塗りつぶし
- [x] 1-9: レイヤー切り替え
- [x] Ctrl+C/V: コピー/ペースト
- [x] Delete: 選択削除
- [x] テスト追加

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

### スプライトアニメーション強化

#### [T172a] [US13] Add animFramePattern to SpriteComponent

- **ステータス:** [x] 完了
- **ブランチ:** main
- **PR:** -

**完了条件:**

- [x] `SpriteComponent` に `animFramePattern: number[]` プロパティ追加
  - 空配列 = 0,1,2,...の線形ループ（従来動作）
  - 指定時 = パターン通りに再生（例: `[0,1,0,2]` で RPG歩行チップ標準）
- [x] バリデーション: deserialize 時に 0〜`animFrameCount - 1` 範囲外をフィルタ
- [x] serialize / deserialize / clone 対応
- [x] `SpriteRenderer` で `resolveFrameIndex()` ヘルパー追加（パターンあり→パターン順、なし→線形ループ）
- [x] テストデータに `animFramePattern: [0,1,0,2]` 設定

**関連ファイル:**

- `src/types/components/SpriteComponent.tsx`
- `src/engine/rendering/SpriteRenderer.ts`
- `src/lib/defaultTestData.ts`

---

#### [T172b] [US13] Add animFramePattern UI to SpritePropertyPanel

- **ステータス:** [x] 完了
- **ブランチ:** main
- **PR:** -

**完了条件:**

- [x] `FramePatternEditor` コンポーネント作成（独立ファイル）
  - [x] フレーム番号チップ（正方形）の表示、ホバーで×ボタン
  - [x] D&D（@dnd-kit/core）で並べ替え
  - [x] フレーム追加ボタン（0〜frameCount-1）
  - [x] クリアボタン（線形ループに戻す）
- [x] `SpritePropertyPanel` に組み込み（frameCount >= 2 で表示）
- [x] テストページ `test/frame-pattern` 作成

**関連ファイル:**

- `src/features/map-editor/components/panels/FramePatternEditor.tsx`
- `src/features/map-editor/components/panels/SpritePropertyPanel.tsx`
- `src/app/test/frame-pattern/page.tsx`

---

#### [T172c] [US13] Create sprite animation preview

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] スプライトアニメーションプレビューコンポーネント作成
- [ ] 上下左右の歩行モーションを同時にプレビュー表示
- [ ] animFramePattern / animIntervalMs の設定がリアルタイム反映
- [ ] SpritePropertyPanel 内に統合（または別パネル）
- [ ] テスト追加

**関連ファイル:**

- `src/features/map-editor/components/SpriteAnimPreview.tsx`
- `src/features/map-editor/components/panels/SpritePropertyPanel.tsx`

---

## Phase 14: UI Foundation（UIComponent 定義）

> **備考:** 設計議論で tasks.md の元タスク定義から大幅に変更。design.md ベースで再設計し実装済み。
> ブランチ: `feature/T173-ui-components`（全タスク共通）

### UIComponentベース

#### [T173] [P] Define UIComponent abstract class

- **ステータス:** [x] 完了
- **ブランチ:** feature/T173-ui-components
- **PR:** -

**完了条件:**

- [x] `src/types/ui/UIComponent.ts` 作成
- [x] `type: string`, `label: string` 抽象プロパティ
- [x] `serialize(): unknown` メソッド
- [x] `deserialize(data: unknown): void` メソッド
- [x] `clone(): UIComponent` メソッド
- [x] `renderPropertyPanel(): ReactNode` メソッド（非abstract、デフォルト null）
- [x] `UIObject` interface（同ファイル）
- [x] `RectTransform` interface（同ファイル）
- [x] `createDefaultRectTransform()` ヘルパー
- [x] テスト追加（`UIComponent.test.ts`）

**関連ファイル:**

- `src/types/ui/UIComponent.ts`
- `src/types/ui/UIComponent.test.ts`

**備考:** T174 の UIObject, RectTransform も同ファイルに統合

---

#### [T174] [P] Define UIObject interface

- **ステータス:** [x] 完了（T173 に統合）
- **ブランチ:** feature/T173-ui-components
- **PR:** -

**備考:** UIObject, RectTransform は `src/types/ui/UIComponent.ts` に定義。別ファイルは不要と判断。

---

### Visual Components

#### [T175] [P] Implement ImageComponent

- **ステータス:** [x] 完了
- **ブランチ:** feature/T173-ui-components
- **PR:** -

**完了条件:**

- [x] `src/types/ui/components/ImageComponent.ts` 作成
- [x] `imageId?`, `tint?`, `opacity`, `sliceMode` プロパティ
- [x] serialize/deserialize 実装
- [x] テスト追加

**関連ファイル:**

- `src/types/ui/components/ImageComponent.ts`
- `src/types/ui/components/ImageComponent.test.ts`

**備考:** NineSlice は `sliceMode: 'none' | 'nine-slice'` で統合（T177 廃止）

---

#### [T176] [P] Implement TextComponent

- **ステータス:** [x] 完了
- **ブランチ:** feature/T173-ui-components
- **PR:** -

**完了条件:**

- [x] `src/types/ui/components/TextComponent.ts` 作成
- [x] `content`, `fontSize`, `fontId?`, `color`, `align`, `verticalAlign`, `lineHeight` プロパティ
- [x] serialize/deserialize 実装
- [x] テスト追加

**関連ファイル:**

- `src/types/ui/components/TextComponent.ts`
- `src/types/ui/components/TextComponent.test.ts`

---

#### [T177] [P] Implement ShapeComponent

- **ステータス:** [x] 完了
- **ブランチ:** feature/T173-ui-components
- **PR:** -

**完了条件:**

- [x] `src/types/ui/components/ShapeComponent.ts` 作成
- [x] `shapeType`, `fillColor?`, `strokeColor?`, `strokeWidth`, `cornerRadius` プロパティ
- [x] serialize/deserialize 実装
- [x] テスト追加

**関連ファイル:**

- `src/types/ui/components/ShapeComponent.ts`
- `src/types/ui/components/ShapeComponent.test.ts`

**備考:** 元の NineSliceComponent は ImageComponent.sliceMode に統合。代わりに ShapeComponent を実装

---

### Mask Components

#### [T178] [P] Implement FillMaskComponent

- **ステータス:** [x] 完了
- **ブランチ:** feature/T173-ui-components
- **PR:** -

**完了条件:**

- [x] `src/types/ui/components/FillMaskComponent.ts` 作成
- [x] `direction`, `fillAmount`, `reverse` プロパティ
- [x] serialize/deserialize 実装
- [x] テスト追加

**関連ファイル:**

- `src/types/ui/components/FillMaskComponent.ts`
- `src/types/ui/components/FillMaskComponent.test.ts`

---

#### [T179] [P] Implement ColorMaskComponent

- **ステータス:** [x] 完了
- **ブランチ:** feature/T173-ui-components
- **PR:** -

**完了条件:**

- [x] `src/types/ui/components/ColorMaskComponent.ts` 作成
- [x] `color`, `blendMode`, `opacity` プロパティ
- [x] serialize/deserialize 実装
- [x] テスト追加

**関連ファイル:**

- `src/types/ui/components/ColorMaskComponent.ts`
- `src/types/ui/components/ColorMaskComponent.test.ts`

**備考:** 元の ScrollMaskComponent を廃止し ColorMaskComponent に変更

---

#### [T180] ShapeMaskComponent — 廃止

- **ステータス:** [x] 廃止（T179 ColorMaskComponent に統合）

**備考:** 設計議論で不要と判断。ColorMaskComponent がカバー

---

### Layout Components

#### [T181] [P] Implement LayoutGroupComponent

- **ステータス:** [x] 完了
- **ブランチ:** feature/T173-ui-components
- **PR:** -

**完了条件:**

- [x] `src/types/ui/components/LayoutGroupComponent.ts` 作成
- [x] `direction: 'horizontal' | 'vertical'`（統一クラス）
- [x] `spacing`, `alignment`, `reverseOrder` プロパティ
- [x] serialize/deserialize 実装
- [x] テスト追加

**関連ファイル:**

- `src/types/ui/components/LayoutGroupComponent.ts`
- `src/types/ui/components/LayoutGroupComponent.test.ts`

**備考:** HorizontalLayout / VerticalLayout を分けず direction プロパティで統一

---

#### [T182] [P] Implement GridLayoutComponent

- **ステータス:** [x] 完了
- **ブランチ:** feature/T173-ui-components
- **PR:** -

**完了条件:**

- [x] `src/types/ui/components/GridLayoutComponent.ts` 作成
- [x] `columns`, `spacingX`, `spacingY`, `cellWidth?`, `cellHeight?` プロパティ
- [x] serialize/deserialize 実装
- [x] テスト追加

**関連ファイル:**

- `src/types/ui/components/GridLayoutComponent.ts`
- `src/types/ui/components/GridLayoutComponent.test.ts`

---

### Navigation Components

#### [T183] [P] Implement Navigation Components

- **ステータス:** [x] 完了
- **ブランチ:** feature/T173-ui-components
- **PR:** -

**完了条件:**

- [x] `NavigationComponent.ts` — 方向(`horizontal`/`vertical`/`grid`)、`wrap`、`initialIndex`、`columns?`
- [x] `NavigationItemComponent.ts` — `onSelectActions: SerializedAction[]`（opt-in 選択制）
- [x] `NavigationCursorComponent.ts` — `offsetX`, `offsetY`
- [x] `SerializedAction` interface（NavigationItemComponent 内で定義、EventAction から疎結合）
- [x] serialize/deserialize/clone 実装（structuredClone 使用）
- [x] テスト追加（3ファイル）

**関連ファイル:**

- `src/types/ui/components/NavigationComponent.ts` + `.test.ts`
- `src/types/ui/components/NavigationItemComponent.ts` + `.test.ts`
- `src/types/ui/components/NavigationCursorComponent.ts` + `.test.ts`

**備考:** 元の SelectableComponent を廃止。Navigation + NavigationItem（opt-in）+ NavigationCursor の3分割に再設計。NavigationItem は `itemId` を保持し、スクリプトから `getComponent("navigation").select()` で選択結果を受け取る。`onSelectActions` は廃止（ActionComponent 廃止に伴い）

---

#### [T184] ~~ActionComponent~~ — 廃止

- **ステータス:** [-] 廃止

**備考:** 設計再検討により廃止。ActionComponent の責務は以下に分散:

- **クリック/キー入力** → NavigationComponent + NavigationItemComponent（select() でスクリプトに返す）
- **テンプレート生成時処理** → TemplateControllerComponent.onSpawn
- **ビジュアル操作マクロ** → UIFunction
- 既存の ActionComponent 型定義・エディタ（ActionComponentEditor.tsx 等）は段階的に削除

---

#### [T185] InputFieldComponent — 後回し

- **ステータス:** [ ] 後回し

**備考:** ゲーム内テキスト入力は MVP 外。必要になったフェーズで実装

---

### Animation Components

#### [T186] [P] Implement AnimationComponent + Tween基盤

- **ステータス:** [x] 完了
- **ブランチ:** feature/T173-ui-components
- **PR:** -

**完了条件:**

- [x] `src/types/ui/components/AnimationComponent.ts` 作成
- [x] `mode: 'reference' | 'inline'`, `timelineId?`, `inlineTimeline?`, `autoPlay`, `loop` プロパティ
- [x] `TweenTrack` interface（property, startTime, duration, from, to, easing）
- [x] `InlineTimeline` interface（duration, tracks）
- [x] `src/engine/tween/easings.ts` — Easing レジストリ（7 ビルトイン: linear, easeIn, easeOut, easeInOut, easeInQuad, easeOutQuad, easeInOutQuad）
- [x] `src/engine/tween/presets.ts` — Tween プリセットレジストリ（8 ビルトイン: fadeIn, fadeOut, slideIn, slideOut, bounce, vibe, scaleIn, scaleOut）
- [x] `src/engine/tween/index.ts` — re-exports
- [x] テスト追加（AnimationComponent.test.ts, easings.test.ts, presets.test.ts）

**関連ファイル:**

- `src/types/ui/components/AnimationComponent.ts` + `.test.ts`
- `src/engine/tween/easings.ts` + `.test.ts`
- `src/engine/tween/presets.ts` + `.test.ts`
- `src/engine/tween/index.ts`

**備考:** 元の TweenComponent を廃止。AnimationComponent として reference/inline 両モード対応。easing と preset はレジストリパターンで実装

---

### Template Components

#### [T187] [P] Implement TemplateControllerComponent

- **ステータス:** [x] 完了

**完了条件:**

- [x] `src/types/ui/components/TemplateControllerComponent.ts` 作成
- [x] `args: TemplateArg[]` — 公開引数
- [x] `onSpawnActions: SerializedAction[]` — 生成時に1回実行（引数 `{{argName}}` 参照可）
- [x] `onApplyActions: SerializedAction[]` — データ更新時に毎回実行（引数 `{{argName}}` 参照可）
- [x] serialize/deserialize/clone 実装
- [x] テスト追加
- [x] `register.ts` と `index.ts` を更新
- [x] エディタUI: TemplateControllerEditor（引数編集 + onSpawn/onApply アクション編集）

**関連ファイル:**

- `src/types/ui/components/TemplateControllerComponent.ts` + `.test.ts`
- `src/features/ui-editor/components/TemplateControllerEditor.tsx`

**備考:** onSpawn = インスタンス生成時（例: ダメージポップ出現）、onApply = データ更新時（例: キャラパネル更新）。両方とも全アクションブロックを許可（条件分岐、ループ、アニメーション再生等）

---

#### [T187a] [P] Implement RepeaterComponent

- **ステータス:** [x] 完了

**完了条件:**

- [x] `src/types/ui/components/RepeaterComponent.ts` 作成
- [x] `templateId: string` — 繰り返し生成するテンプレートID
- [x] serialize/deserialize/clone 実装
- [x] テスト追加
- [x] `register.ts` と `index.ts` を更新

**関連ファイル:**

- `src/types/ui/components/RepeaterComponent.ts` + `.test.ts`

**備考:** 配列データからテンプレートインスタンスを動的生成。スクリプトから `getComponent("repeater").setData(items)` で供給。各要素は TemplateController の onApply を通じてUIに反映

---

### Registry + Registration

#### [T188] [P] Create UIComponent Registry + Registration

- **ステータス:** [x] 完了
- **ブランチ:** feature/T173-ui-components
- **PR:** -

**完了条件:**

- [x] `src/types/ui/index.ts` — レジストリ関数（registerUIComponent, getUIComponent, getAllUIComponents, getUIComponentNames, clearUIComponentRegistry）
- [x] `src/types/ui/register.ts` — 11コンポーネント一括登録
- [x] `src/types/ui/registration.test.ts` — 全11コンポーネントの登録確認
- [x] `src/types/ui/index.test.ts` — レジストリ CRUD テスト
- [x] 全具象クラス + SerializedAction, TweenTrack, InlineTimeline を re-export

**関連ファイル:**

- `src/types/ui/index.ts`
- `src/types/ui/index.test.ts`
- `src/types/ui/register.ts`
- `src/types/ui/registration.test.ts`

**検証:** 16 テストスイート、109 テスト全 PASS

---

## Phase 15: Screen Design

> **備考:** T189 を拡張し Phase 18 の UIRenderer (T214) を統合。WebGL で全 11 UIComponent を描画。全タスク実装済み。

### UIエディタ基盤

#### [T189a] [US14] Create uiEditorSlice

- **ステータス:** [x] 完了

**完了条件:**

- [x] `src/stores/uiEditorSlice.ts` 作成
- [x] UICanvas CRUD（addUICanvas, updateUICanvas, deleteUICanvas, selectUICanvas）
- [x] UIObject CRUD（addUIObject, updateUIObject, deleteUIObject, reparentUIObject）
- [x] UIComponent 追加/削除/更新（addUIComponent, removeUIComponent, updateUIComponent）
- [x] UIFunction CRUD（addUIFunction, updateUIFunction, deleteUIFunction）
- [x] UITemplate CRUD（addUITemplate, updateUITemplate, deleteUITemplate）
- [x] エディタ状態（viewport, selectedObjectIds, showUIGrid, uiGridSize, snapToGrid, leftPanelMode）

**関連ファイル:**

- `src/stores/uiEditorSlice.ts`

---

#### [T189b] [US14] Create UI Screen Design page

- **ステータス:** [x] 完了

**完了条件:**

- [x] `src/app/(editor)/ui/screens/page.tsx` 作成
- [x] ThreeColumnLayout 使用（left: 240px, right: 300px）
- [x] 左パネル: ドロップダウン切替（画面一覧 / エレメント / テンプレート / ファンクション）
- [x] 中央: UICanvas
- [x] 右パネル: UIPropertyPanel
- [x] テスト追加

**関連ファイル:**

- `src/app/(editor)/ui/screens/page.tsx` + `.test.tsx`

---

### UIキャンバス + レンダリング

#### [T189c] [US14] Create UICanvas + useUIViewport

- **ステータス:** [x] 完了

**完了条件:**

- [x] `src/features/ui-editor/components/UICanvas.tsx` — WebGL + DOM オーバーレイ
- [x] `useUIViewport` — ズーム（ホイール + カーソルピボット）/ パン（ミドルクリック / Space+ドラッグ）
- [x] 解像度プレビュー枠、グリッド表示
- [x] テスト追加

**関連ファイル:**

- `src/features/ui-editor/components/UICanvas.tsx` + `.test.tsx`
- `src/features/ui-editor/hooks/useUIViewport.ts` + `.test.ts`

---

#### [T189d] [US14] Implement UIRenderer — Visual + Mask

- **ステータス:** [x] 完了

**完了条件:**

- [x] `UIRenderer.ts` — ツリー走査、Z-order ソート、描画ディスパッチ
- [x] Image: テクスチャ描画（tint, opacity, nine-slice, repeat）
- [x] Text: Canvas2D → テクスチャ変換
- [x] Shape: 矩形/楕円/多角形描画（fill, stroke, cornerRadius）
- [x] FillMask: 方向と fillAmount に基づくシェーダークリッピング
- [x] ColorMask: ブレンドモード切替
- [x] RectTransform → ワールド座標変換（親子階層、anchor, pivot, rotation, scale）
- [x] テスト追加

**関連ファイル:**

- `src/features/ui-editor/renderer/UIRenderer.ts`
- `src/features/ui-editor/renderer/imageRenderer.ts`
- `src/features/ui-editor/renderer/textRenderer.ts`
- `src/features/ui-editor/renderer/shapeRenderer.ts`
- `src/features/ui-editor/renderer/fillMaskRenderer.ts`
- `src/features/ui-editor/renderer/colorMaskRenderer.ts`
- `src/features/ui-editor/renderer/transformResolver.ts`
- `src/features/ui-editor/utils/shaders.ts`

---

#### [T189e] [US14] Implement UIRenderer — Layout + Navigation + Animation

- **ステータス:** [x] 完了

**完了条件:**

- [x] LayoutGroup: direction/spacing/alignment に基づく子配置
- [x] GridLayout: columns/spacingX/spacingY に基づくグリッド配置
- [x] Navigation: フォーカス移動ロジック
- [x] NavigationCursor: フォーカス中アイテム位置 + offset 配置
- [x] Animation: inlineTimeline の TweenTrack 補間、ループ（none/loop/pingpong）、相対モード
- [x] アクションプレビュー実行（actionPreview.ts — 全UIアクション対応、async/await）
- [x] テスト追加

**関連ファイル:**

- `src/features/ui-editor/renderer/layoutResolver.ts`
- `src/features/ui-editor/renderer/navigationResolver.ts`
- `src/features/ui-editor/renderer/animationResolver.ts`
- `src/features/ui-editor/utils/actionPreview.ts`
- `src/features/ui-editor/utils/animationPlayer.ts`

---

### 左カラム

#### [T190] [US14] Create UIObjectTree component

- **ステータス:** [x] 完了

**完了条件:**

- [x] 階層表示（parentId ベース）+ DraggableTree でドラッグ&ドロップ親子変更
- [x] コンテキストメニュー（追加 / 複製 / 削除 / テンプレート保存）
- [x] 図形サブメニュー（矩形/楕円/ポリゴン/画像/テキスト/ボタン）
- [x] 選択と UICanvas の同期
- [x] テスト追加

**関連ファイル:**

- `src/features/ui-editor/components/UIObjectTree.tsx` + `.test.tsx`

---

#### [T192] [US14] Create UIComponentPalette component

- **ステータス:** [x] 完了

**完了条件:**

- [x] UIComponentRegistry からコンポーネント一覧取得
- [x] 2カラムグリッド、クリックで選択オブジェクトに追加
- [x] テスト追加

**関連ファイル:**

- `src/features/ui-editor/components/UIComponentPalette.tsx` + `.test.tsx`

---

### 右カラム

#### [T191] [US14] Create UIPropertyPanel component

- **ステータス:** [x] 完了

**完了条件:**

- [x] RectTransform 編集（x, y, width, height, anchorX/Y, pivotX/Y, rotation, scaleX/Y）
- [x] アタッチ済みコンポーネント一覧 + 各コンポーネントのプロパティパネル
- [x] コンポーネント追加/削除
- [x] ComponentPropertyEditor による動的プロパティ編集（getPropertyDefs ベース）
- [x] テスト追加

**関連ファイル:**

- `src/features/ui-editor/components/UIPropertyPanel.tsx` + `.test.tsx`
- `src/features/ui-editor/components/ComponentPropertyEditor.tsx`
- `src/features/ui-editor/components/ComponentListItem.tsx`

---

### インタラクション

#### [T193] [US14] Implement UIObject selection

- **ステータス:** [x] 完了

**完了条件:**

- [x] ヒットテスト（AABB + 回転対応座標変換）
- [x] Shift+クリック複数選択
- [x] SelectionOverlay（WebGL 選択アウトライン）
- [x] ツリー ↔ キャンバス選択同期
- [x] テスト追加

**関連ファイル:**

- `src/features/ui-editor/hooks/useUISelection.ts` + `.test.ts`
- `src/features/ui-editor/components/SelectionOverlay.tsx`
- `src/features/ui-editor/renderer/selectionRenderer.ts`

---

#### [T194] [US14] Implement UIObject transform handles

- **ステータス:** [x] 完了

**完了条件:**

- [x] 移動ハンドル（ドラッグで x/y 変更）
- [x] 8方向リサイズハンドル
- [x] 回転ハンドル
- [x] グリッドスナップ対応
- [x] テスト追加

**関連ファイル:**

- `src/features/ui-editor/components/TransformHandles.tsx` + `.test.tsx`

---

#### [T195] [US14] Implement anchor presets

- **ステータス:** [x] 完了

**完了条件:**

- [x] 9ポイントプリセット（3×3 グリッド）
- [x] UIPropertyPanel 内に統合
- [x] テスト追加

**関連ファイル:**

- `src/features/ui-editor/components/AnchorPresets.tsx` + `.test.tsx`

---

### テンプレート

#### [T196] [US14] Implement UITemplate save

- **ステータス:** [x] 完了

**完了条件:**

- [x] collectObjectTree() — 深いコピー + ID 保持
- [x] ensureTemplateController() — TemplateControllerComponent 自動追加
- [x] useTemplateSave() フック
- [x] テスト追加

**関連ファイル:**

- `src/features/ui-editor/hooks/useTemplateSave.ts` + `.test.ts`

---

#### [T197] [US14] Implement UITemplate instantiation

- **ステータス:** [x] 完了

**完了条件:**

- [x] テンプレートからインスタンス生成
- [x] 全 ID 再生成（oldId → newId リマッピング）
- [x] useTemplateInstantiate() フック
- [x] テスト追加
- [ ] TemplateControllerComponent.onSpawn 実行 → Phase 18（Game Engine ランタイムで実行）
- [ ] TemplateControllerComponent.onApply 実行 → Phase 18（Game Engine ランタイムで実行）

**関連ファイル:**

- `src/features/ui-editor/hooks/useTemplateInstantiate.ts` + `.test.ts`

**備考:** インスタンス生成の基盤は完了。onSpawn/onApply はエディタでは定義のみ、実際の実行は Phase 18 Game Engine ランタイムで実装

---

### ファンクション + アクション編集

#### [T197a] [US14] Create UIFunction editor

- **ステータス:** [x] 完了

**完了条件:**

- [x] 左パネル「ファンクション」モード: ファンクション一覧、追加/削除/リネーム
- [x] 引数定義 UI（TemplateArg + フィールドタイプ選択）
- [x] ブロック編集（ActionBlockEditor 再利用）
- [x] テストボタン（▶）でファンクション単体実行（アクションプレビュー）
- [x] テスト追加

**関連ファイル:**

- `src/features/ui-editor/components/FunctionsPanel.tsx` + `.test.tsx`
- `src/features/ui-editor/components/ActionPreviewButton.tsx`
- `src/features/ui-editor/utils/actionBridge.ts`
- 各 `.test.tsx`

---

#### [T197b] ~~ActionComponent block editor~~ — 廃止

- **ステータス:** [-] 廃止

**備考:** ActionComponent 廃止（T184）に伴い不要。既存の ActionComponentEditor.tsx 等は段階的に削除。
ブロック編集UIはUIFunction（T197a）とTemplateController（T187）のonSpawn/onApplyで共有

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

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/engine/core/GameEngine.ts` 作成（script/event/full 3モード対応）
- [x] ゲームループ実装（`src/engine/runtime/GameLoop.ts` — 固定タイムステップ 60fps、pause/resume）
- [x] GameRuntime でサブシステム統合（input → world → triggers → events → camera → render）
- [x] シーン管理（`GameRuntime` にマップロード/切り替えを統合）
- [x] 入力ハンドリング（`InputManager.ts` — キーマッピング、just-pressed、waiter方式）
- [x] テスト追加

**関連ファイル:**

- `src/engine/core/GameEngine.ts`
- `src/engine/core/GameEngine.test.ts`
- `src/engine/runtime/GameLoop.ts`
- `src/engine/runtime/GameRuntime.ts`
- `src/engine/runtime/InputManager.ts`

---

### コンポーネント実処理

> Phase 10 で型定義・レジストリ登録済み。ランタイムロジックは `GameWorld.ts` に統合実装。

#### [T210a] [P] Implement MovementComponent runtime logic

- **ステータス:** [x] 完了
- **ブランチ:** main
- **PR:** -

**完了条件:**

- [x] `GameWorld.ts` にパターン別移動ロジック実装
- [x] fixed: 移動しない
- [x] random: ランダム方向に移動（activeness 設定可）
- [x] route: routePoints に沿って移動（ループ対応）
- [x] speed に基づく移動速度制御（ピクセル補間あり）
- [x] グリッドベース移動 + advanceMovement(dt) でスムーズ描画
- [x] テスト追加

**関連ファイル:**

- `src/engine/runtime/GameWorld.ts`

---

#### [T210b] [P] Implement ColliderComponent collision detection

- **ステータス:** [x] 完了
- **ブランチ:** main
- **PR:** -

**完了条件:**

- [x] `GameWorld.ts` にグリッドベース衝突判定実装
- [x] passable フラグによる通行可否判定
- [x] レイヤー別衝突判定（collideLayers フィルタリング）
- [x] マップチップの通行設定との統合（タイル passability チェック）
- [x] オブジェクト同士の衝突検出（移動先予測含む）

**関連ファイル:**

- `src/engine/runtime/GameWorld.ts`

---

#### [T210c] [P] Implement trigger components event firing

- **ステータス:** [x] 完了
- **ブランチ:** main
- **PR:** -

**完了条件:**

- [x] TalkTrigger: 確認ボタン + 方向判定 → eventId/ローカルアクション発火
- [x] TouchTrigger: 接触判定 → eventId のイベント発火
- [x] StepTrigger: 踏み判定 → eventId のイベント発火
- [x] AutoTrigger: interval カウンタ + runOnce 制御
- [x] InputTrigger: 指定キー入力検知 → eventId のイベント発火
- [x] 優先度順評価（Talk > Touch/Step > Auto > Input）
- [x] moveCompleted 通知との連携

**関連ファイル:**

- `src/engine/runtime/TriggerSystem.ts`

---

#### [T210d] [P] Implement ControllerComponent player input

- **ステータス:** [x] 完了
- **ブランチ:** main
- **PR:** -

**完了条件:**

- [x] `GameWorld.ts` にキー入力→移動変換ロジック実装
- [x] moveSpeed に基づく移動速度
- [x] inputEnabled による入力有効/無効切り替え
- [x] グリッドベース移動 + 衝突判定連携
- [ ] dashEnabled による走り切り替え（未実装 — 将来対応）

**関連ファイル:**

- `src/engine/runtime/GameWorld.ts`

---

#### [T210e] [P] Implement EffectComponent (UIComponent)

- **ステータス:** [x] 完了
- **ブランチ:** main
- **PR:** -

**完了条件:**

- [x] `src/types/ui/components/EffectComponent.ts` 作成（UIComponent として）
  - effectId, frameWidth/Height, frameCount, intervalMs, loop, onComplete
  - cropX/Y/W/H でランタイム時のフレーム切り出し管理
- [x] `generateRuntimeScript()` 実装
  - onShow: タイマーリセット、初期フレーム設定
  - onUpdate: フレーム送り、crop 更新
  - isFinished() / reset()
  - onComplete: 'hide' → visible=false, 'none' → 何もしない
- [x] `effectRenderer.ts` 新規作成（スプライトシート crop 描画）
- [x] UIRenderer に `case 'effect'` ディスパッチ追加
- [x] レジストリ登録

**関連ファイル:**

- `src/types/components/EffectComponent.ts`
- `src/types/components/EffectComponent.test.ts`

---

#### [T210f] [P] Implement SpriteComponent rendering integration

- **ステータス:** [x] 完了
- **ブランチ:** main
- **PR:** -

**完了条件:**

- [x] SpriteComponent の imageId に基づく描画処理
- [x] 4方向アニメーション（down/left/right/up、フレームサイクル）
- [x] flipX/flipY 反転
- [x] tint 色調変更
- [x] opacity 透明度
- [x] Yソートによる正しい重なり順

**関連ファイル:**

- `src/engine/rendering/SpriteRenderer.ts`

---

#### [T211] [P] Create SceneManager

- **ステータス:** [x] 完了（GameRuntime に統合）
- **ブランチ:** main
- **PR:** -

**完了条件:**

- [x] `GameRuntime.loadMap()` でマップロード（テクスチャ、オブジェクト、トリガーリセット）
- [x] マップ切り替え対応
- [ ] トランジションエフェクト（フェード等）— 将来対応

**関連ファイル:**

- `src/engine/runtime/GameRuntime.ts`

---

#### [T212] [P] Create MapRenderer

- **ステータス:** [x] 完了
- **ブランチ:** main
- **PR:** -

**完了条件:**

- [x] `src/engine/runtime/MapRenderer.ts` 作成（TileRenderer のラッパー）
- [x] チップセットテクスチャの非同期プリロード
- [x] 全タイルレイヤーの描画（visible 範囲最適化）
- [x] ビューポート正射行列の計算
- [x] `src/engine/rendering/TileRenderer.ts`（エディタと共有、バッチ描画）

**関連ファイル:**

- `src/engine/runtime/MapRenderer.ts`
- `src/engine/rendering/TileRenderer.ts`

---

#### [T213] [P] Create SpriteRenderer

- **ステータス:** [x] 完了
- **ブランチ:** main
- **PR:** -

**完了条件:**

- [x] `src/engine/rendering/SpriteRenderer.ts` 作成
- [x] スプライト描画（single / directional モード）
- [x] 4方向フレームアニメーション（フレーム幅/高さ、間隔設定可）
- [x] Yソート（下方のオブジェクトが上に描画）
- [x] flip/tint/opacity 対応

**関連ファイル:**

- `src/engine/rendering/SpriteRenderer.ts`

---

#### [T214] [P] Create UIRenderer

- **ステータス:** [x] 完了（UICanvasManager に統合）
- **ブランチ:** main
- **PR:** -

**完了条件:**

- [x] `UICanvasManager` がキャンバスの描画管理を担当
- [x] UIObject プロパティ設定・表示/非表示
- [x] アニメーション再生（duration、ループ対応）
- [x] UIFunction 実行（再帰深度制限あり）
- [x] スクリーンスペース描画（カメラ非依存）

**関連ファイル:**

- `src/engine/runtime/UICanvasManager.ts`

**備考:** エディタ用 UIRenderer (`src/features/ui-editor/renderer/`) とは別。エンジン側は UICanvasManager が描画統合

---

### ゲームAPI

#### [T215] [P] Implement MapAPI

- **ステータス:** [x] 完了
- **ブランチ:** main
- **PR:** -

**完了条件:**

- [x] GameContext に `map` プロパティ追加（MapAPI）
- [x] `Map.getCurrentId()` — 現在マップID取得
- [x] `Map.getWidth()` / `Map.getHeight()` — マップサイズ取得
- [x] `Map.getTile(x, y, layerId?)` — タイルデータ取得
- [x] `Map.changeMap(mapId, x?, y?)` — マップ切替（pendingMapChange 経由）
- [x] GameRuntime で pendingMapChange 消費（イベント完了後にマップロード + プレイヤーテレポート）
- [x] ScriptRunner に `'Map'` 注入追加
- [x] Monaco 補完定義追加

**関連ファイル:**

- `src/engine/runtime/GameContext.ts`
- `src/engine/runtime/GameRuntime.ts`
- `src/engine/core/ScriptRunner.ts`
- `src/features/script-editor/utils/apiDefinitions.ts`

---

#### [T216] [P] Implement ObjectAPI

- **ステータス:** [x] 完了
- **ブランチ:** main
- **PR:** -

**完了条件:**

- [x] GameContext に `object` プロパティ追加（ObjectAPI + ObjectProxy）
- [x] `GameObject.find(name)` — 名前でオブジェクト検索
- [x] `GameObject.findById(id)` — IDで検索
- [x] `GameObject.findAtTile(x, y)` — タイル上のオブジェクト検索
- [x] `GameObject.create(prefabId, x, y)` — プレハブからオブジェクト動的生成
- [x] `GameObject.destroy(id)` — オブジェクト破棄
- [x] ObjectProxy: getPosition/setPosition, getFacing/setFacing, isMoving, getComponent/setComponent, setVisible, destroy
- [x] GameWorld に findByName/findById/removeObject/spawnFromPrefab 追加
- [x] ScriptRunner に `'GameObject'` 注入追加
- [x] Monaco 補完定義追加

**関連ファイル:**

- `src/engine/runtime/GameContext.ts`
- `src/engine/runtime/GameWorld.ts`
- `src/engine/runtime/GameRuntime.ts`
- `src/engine/core/ScriptRunner.ts`
- `src/features/script-editor/utils/apiDefinitions.ts`

---

#### [T217] [P] Implement PlayerAPI

- **ステータス:** [-] 廃止

**廃止理由:** ControllerComponent を持つオブジェクトがプレイヤー。`GameObject.find("プレイヤー")` で取得して ObjectProxy 経由で操作可能（T216 で実装済み）。専用 API は不要。

---

#### [T218] [P] Implement UIAPI (UICanvasProxy / UIObjectProxy)

- **ステータス:** [x] 完了
- **ブランチ:** main
- **PR:** -

**完了条件:**

- [x] UICanvasManager に `executeFunction(canvasId, functionName, args)` 追加
- [x] UICanvasManager に `findObjectById()` ヘルパー追加
- [x] UICanvasManager に `setObjectVisibility()` 追加
- [x] UICanvasManager に `playAnimation()` / `updateAnimations(deltaMs)` 追加
- [x] UICanvasRuntimeProxy に `call(functionName, args)` メソッド追加
- [x] UIFunction 名を動的メソッドとして追加（既存キー衝突回避）
- [x] UIObjectRuntimeProxy に transform 直接アクセス（Proxy）
- [x] UIObjectRuntimeProxy に `getChild(name)` / `getChildren()` 追加
- [x] ScriptRunner の INJECTED_PARAM_NAMES に `'UI'` 追加
- [x] GameContext に `ui` プロパティ + `setUIProxies()` 追加
- [x] GameRuntime で `updateAnimations(dt * 1000)` 呼び出し + UI proxy 注入
- [x] テスト追加（15テスト全通過）

**関連ファイル:**

- `src/engine/runtime/UICanvasManager.ts`
- `src/engine/runtime/GameContext.ts`
- `src/engine/core/ScriptRunner.ts`
- `src/engine/runtime/GameRuntime.ts`

**参照:**

- `docs/superpowers/specs/2026-03-20-script-ui-integration-design.md` セクション1, 4

---

#### [T219] [P] Implement AudioAPI

- **ステータス:** [x] 完了
- **ブランチ:** main
- **PR:** -

**完了条件:**

- [x] `AudioManager` 作成（Web Audio API ベース）
  - [x] BGM 再生/停止（ループ、フェードイン/フェードアウト対応）
  - [x] SE 再生（ボリューム設定）
  - [x] AudioBuffer キャッシュ
  - [x] 全停止 + dispose
- [x] `SoundAPI` インターフェース拡張（playBGM/stopBGM/playSE/stopAll）
- [x] `GameRuntime` で AudioManager を初期化・注入（アセット名/ID 両対応）
- [x] `AudioAction` を新 SoundAPI に対応（volume/fadeIn/fadeOut パラメータ）
- [x] オーディオアセットを `public/assets/sounds/` にコピー + `defaultAssets.ts` に登録
- [x] `importDefaultAssets` をオーディオ対応（拡張子判定で type: 'audio'）
- [x] Monaco 補完定義更新
- [x] テスト更新

**関連ファイル:**

- `src/engine/runtime/AudioManager.ts`
- `src/engine/runtime/GameContext.ts`
- `src/engine/runtime/GameRuntime.ts`
- `src/engine/actions/AudioAction.ts`
- `src/lib/defaultAssets.ts`
- `src/lib/importDefaultAssets.ts`

---

#### [T220] [P] Implement VariableAPI

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/engine/runtime/GameContext.ts` 内に VariableAPI 実装
- [x] `Variable.get(name)` / `Variable.set(name, value)` / `Variable.getAll()`
- [x] デフォルト値初期化 + オーバーライド対応
- [x] テスト追加
- [ ] スコープ管理（グローバル/ローカル）— 将来対応

**関連ファイル:**

- `src/engine/runtime/GameContext.ts`
- `src/engine/runtime/GameContext.test.ts`

**備考:** クラス型・配列型の変数も `unknown` としてそのまま格納/取得する設計（型を問わずパススルー）

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

#### [T222] [P] Implement InputAPI (waitKey)

- **ステータス:** [x] 完了
- **ブランチ:** main
- **PR:** -

**完了条件:**

- [x] InputManager.pressed() をゲームループ同期に改修（rAF → waiter リスト方式）
- [x] InputManager に `processWaiters()` 追加
- [x] GameRuntime.update() で `processWaiters()` 呼び出し
- [x] GameContext に `input` プロパティ追加（InputAPI: waitKey, isDown, isJustPressed）
- [x] ScriptRunner の INJECTED_PARAM_NAMES に `'Input'` 追加
- [x] テスト追加

**関連ファイル:**

- `src/engine/runtime/InputManager.ts`
- `src/engine/runtime/GameContext.ts`
- `src/engine/core/ScriptRunner.ts`
- `src/engine/runtime/GameRuntime.ts`

---

### イベント実行

#### [T223] [P] Create EventRunner

- **ステータス:** [x] 完了
- **ブランチ:** feature/T043-game-settings
- **PR:** -

**完了条件:**

- [x] `src/engine/event/EventRunner.ts` 作成
- [x] コマンド順次実行
- [x] 条件分岐処理（ConditionalAction 経由）
- [x] ループ処理（LoopAction 経由）
- [x] async/await対応
- [x] イテレーション上限 (100,000) + 定期 yield (1,000回ごと)
- [x] テスト追加（5テスト）

**関連ファイル:**

- `src/engine/event/EventRunner.ts`
- `src/engine/event/EventRunner.test.ts`

---

#### [T224] [P] Message typewriter effect

- **ステータス:** [x] 完了
- **ブランチ:** main
- **PR:** -

**完了条件:**

- [x] メッセージスクリプトにタイプライター効果追加（1文字ずつ表示、確認キーでスキップ）
- [x] `typewriter` パラメータ（デフォルト true）、`typewriterSpeed` パラメータ（デフォルト 2フレーム）

**関連ファイル:**

- `src/lib/defaultTestData.ts`

**備考:** 変数埋め込みは不要（スクリプト内で `Variable["name"]` に直接アクセス可能）

---

#### [T224c] [P] Create choice / number input / text input scripts

- **ステータス:** [x] 完了
- **ブランチ:** main
- **PR:** -

**完了条件:**

- [x] **選択肢**: UICanvas（最大6項目、カーソル▶）+ `Script.choice({ items })` → インデックス返却（キャンセル = -1）
- [x] **数字入力**: UICanvas（ラベル+数値表示）+ `Script.input_number({ prompt, initial, min, max, step })` → 数値返却
  - 上下キーで ±step、左右キーで ±step*10
- [x] **文字列入力**: `Script.input_text({ prompt, initial })` → `window.prompt()` で文字列返却（ゲーム内キーボードは MVP 外）
- [x] 商人スクリプトに選択肢テスト組み込み

**関連ファイル:**

- `src/lib/defaultTestData.ts`

---

### コンポーネントランタイムスクリプト

> 設計: `docs/superpowers/specs/2026-03-28-component-runtime-script-design.md`

#### [T224d] Add generateRuntimeScript() to UIComponent base class

- **ステータス:** [x] 完了
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `Component.ts` に `generateRuntimeScript(): string | null` メソッド追加（デフォルト null）
- [ ] ビジュアル系コンポーネントは変更不要（null を返す）

**関連ファイル:**

- `src/types/components/Component.ts`

---

#### [T224e] Add lifecycle dispatch to UICanvasManager

- **ステータス:** [x] 完了
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `CompiledComponentRuntime` 型定義（onShow/onHide/onUpdate/onInput + customFunctions + state）
- [ ] `compileComponentScripts(canvasId)` — generateRuntimeScript() → new Function() でコンパイル、`self` 注入
- [ ] `dispatchShow(canvasId)` — showCanvas 時に全ランタイムの onShow 呼び出し
- [ ] `dispatchHide(canvasId)` — hideCanvas 時に onHide 呼び出し + ランタイム破棄
- [ ] `dispatchUpdate(canvasId, dt)` — 毎フレーム onUpdate 呼び出し
- [ ] `dispatchInput(canvasId, button)` — 入力時 onInput 呼び出し
- [ ] スクリプトからカスタム関数へのアクセス（UIObjectRuntimeProxy 経由）

**関連ファイル:**

- `src/engine/runtime/UICanvasManager.ts`

---

#### [T224f] Integrate lifecycle dispatch into GameRuntime

- **ステータス:** [x] 完了
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] GameRuntime の update ループで dispatchInput / dispatchUpdate を呼ぶ
- [ ] showCanvas / hideCanvas 時に compileComponentScripts / dispatchShow / dispatchHide を呼ぶ

**関連ファイル:**

- `src/engine/runtime/GameRuntime.ts`

---

#### [T224g] Implement NavigationComponent.generateRuntimeScript()

- **ステータス:** [x] 完了
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] NavigationComponent に generateRuntimeScript() 実装
  - onShow: 子 NavigationItem を収集、initialIndex でフォーカス初期化、カーソル位置更新
  - onInput: direction/wrap/columns に基づくフォーカス移動、confirm で result 設定、cancel で null
  - getResult(): self.state.result を返す
- [ ] NavigationCursorComponent の offsetX/offsetY を反映
- [ ] プロパティ値（direction, wrap, columns, initialIndex）をスクリプト内にリテラル埋め込み

**関連ファイル:**

- `src/types/ui/components/NavigationComponent.ts`

---

#### [T224h] Rewrite Script.choice() to use NavigationComponent

- **ステータス:** [x] 完了
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] 選択肢 UICanvas を NavigationComponent + NavigationItem + NavigationCursor 構成に変更
- [ ] Script.choice() スクリプトを書き直し: show → waitResult → hide
- [ ] テストプレイで選択肢が動作確認

**関連ファイル:**

- `src/lib/defaultTestData.ts`

---

### データ・変数・クラス連携テスト

#### [T224a] [P] Add class-typed data/variable integration tests

- **ステータス:** [ ] 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] GameContext テストにクラス型フィールドを持つデータエントリのテスト追加
  - [ ] `Data.item['sword'].base_status.atk` のようなネストアクセス
  - [ ] クラスリスト型: `Data.enemy['slime'].drops[0].item` のような配列+ネスト
- [ ] GameContext テストにクラス型変数のテスト追加
  - [ ] `Variable["party_status"].hp` のようなオブジェクトアクセス（Proxy直接アクセス）
  - [ ] `Variable["party_status"] = { hp: 200, ... }` でオブジェクト書き込み
- [ ] GameContext テストに配列型変数のテスト追加
  - [ ] `Variable["inventory"]` で配列取得
  - [ ] `Variable["inventory"].push(...)` で直接操作
- [ ] buildProjectData → EngineProjectData 変換でクラス型値が保持されるテスト追加
- [ ] ScriptRunner 経由での統合テスト（スクリプト内からクラス型データ/変数にアクセス）

**関連ファイル:**

- `src/engine/runtime/GameContext.test.ts`
- `src/engine/core/ScriptRunner.test.ts`
- `src/features/test-play/buildProjectData.ts`

**備考:** クラス値は `Record<string, unknown>` としてパススルーされる設計。Variable は Proxy で直接アクセス可能（`Variable["name"]`）。Immer frozen 対策として `structuredClone` で初期値をコピー済み。

---

#### [T224b] [P] Expand defaultTestData with data integration test set

- **ステータス:** [x] 完了
- **ブランチ:** main
- **PR:** -

**完了条件:**

- [x] デフォルトデータタイプ（character, item, skill, job, element）のサンプルエントリ追加
  - [x] クラス型フィールド（`base_stats`: class_status）
  - [x] クラスリスト型フィールド（`effects`: class_effect, `learn_skills`: class_learn_skill）
- [x] テスト用変数追加（`gold`: 数値, `leader_stats`: クラス型, `inventory`: 配列型）
- [x] ステータス表示スクリプト（`show_status`）: Data + Variable → UI 表示
- [x] 商人スクリプト（`shop_buy`）: Data 参照 + Variable 操作 + Script.message 呼び出し
- [x] ステータスHUD UICanvas（`status_hud`）: キャラ名/HP/ゴールド表示
- [x] テストマップにステータス確認NPC + 商人NPC 追加
- [x] `loadDefaultTestData` で `importDefaultAssets` を自動実行（マップチップ + 歩行キャラ）
- [x] 歩行スプライトを `public/assets/images/character_walk/` に配置 + `defaultAssets.ts` に登録
- [x] SpriteComponent にモード・フレームサイズ設定（directional, 32x32, 3フレーム）
- [x] ColliderComponent に `collideLayers: ['layer_obj']` 設定（オブジェクト間衝突）
- [x] アセット名→IDリゾルバで SpriteComponent.imageId に正しいアセットID設定
- [x] VariableAPI に Proxy 追加（`Variable["name"]` で直接アクセス）
- [x] `createVariableAPI` で `structuredClone` 適用（Immer frozen 対策）

**関連ファイル:**

- `src/lib/defaultTestData.ts`
- `src/lib/defaultAssets.ts`
- `src/engine/runtime/GameContext.ts`
- `src/features/script-editor/utils/apiDefinitions.ts`
- `public/assets/images/character_walk/*.png`

---

### スクリプト ↔ UI 連携

#### [T218a] [P] Add RectTransform visible flag

- **ステータス:** [x] 完了
- **ブランチ:** main
- **PR:** -

**完了条件:**

- [x] RectTransform に `visible: boolean` フィールド追加
- [x] `createDefaultRectTransform()` に `visible: true` 追加
- [x] UIRenderer で `visible === false` のオブジェクトと子孫を描画スキップ
- [x] actionPreview の scale=0 方式を visible フラグ方式に変更
- [x] 古い保存データの読み込み時に `visible ?? true` フォールバック
- [x] TransformEditor に「表示」チェックボックス追加
- [x] テスト追加

**関連ファイル:**

- `src/types/ui/UIComponent.ts`
- `src/features/ui-editor/renderer/UIRenderer.ts`
- `src/features/ui-editor/utils/actionPreview.ts`
- `src/features/ui-editor/components/TransformEditor.tsx`

---

#### [T223a] [P] Implement currentEvent.nextAction

- **ステータス:** [x] 完了
- **ブランチ:** main
- **PR:** -

**完了条件:**

- [x] EventRunner.run() に `parentNextAction` 引数追加（デフォルト null）
- [x] for...of → for+index に変更、次アクション情報を context にセット
- [x] 子ブロック（Conditional/Loop）に parentNextAction を伝播
- [x] GameContext に `currentEvent` / `setNextAction()` 追加
- [x] ScriptRunner の INJECTED_PARAM_NAMES に `'currentEvent'` 追加
- [x] テスト追加（7テスト全通過）

**関連ファイル:**

- `src/engine/event/EventRunner.ts`
- `src/engine/runtime/GameContext.ts`
- `src/engine/core/ScriptRunner.ts`

---

#### [T218b] Script ↔ UI 連携追加実装

- **ステータス:** [x] 完了
- **ブランチ:** main
- **PR:** -

**完了条件:**

- [x] UIAction 基底クラスに `execute(canvasId, manager)` 追加（switch/case 廃止）
- [x] UICanvasManager が `UIActionManager` インターフェースを実装
- [x] SetPropertyAction に構造化 `PropertyValueSource`（literal / arg）追加
- [x] SetPropertyBlock で固定値/引数の切替UI
- [x] ScriptActionBlock をドロップダウン選択 + 引数入力フォームに改修
- [x] スクリプト引数フィールドレジストリ（arg-fields）新規作成
- [x] arg-fields: string, number, boolean, color, image, audio 対応
- [x] ScriptTestPanel を arg-fields レジストリ対応に改修
- [x] ActionPreviewButton を arg-fields レジストリ対応に改修
- [x] FunctionsPanel 引数タイプに image, audio 追加
- [x] ScriptSettingsPanel 引数タイプに color, image, audio, dataSelect 追加
- [x] CanvasPropertyPanel 新規作成（画面名・ID編集）
- [x] UICanvasProxy のキーを name → ID に変更
- [x] キャンバスIDを編集可能に
- [x] ScriptRunner: 全スクリプトを常に async IIFE でラップ
- [x] ScriptAction: script.isAsync で完了待機を制御
- [x] buildProjectData: uiCanvases のみ structuredClone（Immer frozen 解除）
- [x] デフォルトテストデータ作成（メッセージ UICanvas + スクリプト + マップ）

**関連ファイル:**

- `src/types/ui/actions/UIAction.ts`
- `src/types/ui/actions/SetPropertyAction.ts`
- `src/types/ui/actions/SetVisibilityAction.ts`
- `src/types/ui/actions/PlayAnimationAction.ts`
- `src/types/ui/actions/CallFunctionAction.ts`
- `src/types/ui/actions/NavigateAction.ts`
- `src/engine/runtime/UICanvasManager.ts`
- `src/engine/actions/ScriptAction.ts`
- `src/engine/core/ScriptRunner.ts`
- `src/features/event-editor/components/arg-fields/`
- `src/features/event-editor/components/blocks/ScriptActionBlock.tsx`
- `src/features/ui-editor/components/blocks/SetPropertyBlock.tsx`
- `src/features/ui-editor/components/CanvasPropertyPanel.tsx`
- `src/features/ui-editor/components/ActionPreviewButton.tsx`
- `src/features/ui-editor/components/FunctionsPanel.tsx`
- `src/features/script-editor/components/ScriptSettingsPanel.tsx`
- `src/features/script-editor/components/ScriptTestPanel.tsx`
- `src/features/test-play/buildProjectData.ts`
- `src/lib/defaultTestData.ts`

---

#### [T218c] Fix renderer pivot handling

- **ステータス:** [x] 完了
- **ブランチ:** main
- **PR:** -

**完了条件:**

- [x] shapeRenderer: buildRoundedRectOutline がピボットを正しく考慮
- [x] shapeRenderer: renderEllipse / renderEllipseStroke がピボットを正しく考慮
- [x] transformResolver: resolveTransform が親のピボットを考慮して子の位置を計算
- [x] dt 秒→ミリ秒変換修正（UIアニメーション）

**関連ファイル:**

- `src/features/ui-editor/renderer/shapeRenderer.ts`
- `src/features/ui-editor/renderer/transformResolver.ts`
- `src/engine/runtime/GameRuntime.ts`

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

#### [T241] デフォルトアセット & チップセット画像表示

- **ステータス:** [x] 完了
- **ブランチ:** feature/T241-default-assets-chipset-image
- **PR:** -

**完了条件:**

- [x] `assets/images/map_chip/*.png` を `public/assets/images/map_chip/` にコピー
- [x] `src/lib/defaultAssets.ts`（DEFAULT_ASSET_GROUPS 設定ファイル）作成
- [x] `src/lib/importDefaultAssets.ts`（fetch → Base64 → AssetReference）+ テスト作成
- [x] アセット管理ページに「デフォルトをインポート」ボタン追加
- [x] ChipsetEditor に画像選択 UI（AssetPickerModal）追加
- [x] チップグリッドに実際の画像タイルを表示（CSS background-image）し、○/× を重ね表示

**関連ファイル:**

- `public/assets/images/map_chip/*.png`
- `src/lib/defaultAssets.ts`
- `src/lib/importDefaultAssets.ts`
- `src/app/(editor)/settings/assets/page.tsx`
- `src/features/map-editor/components/ChipsetEditor.tsx`

---

#### [T242] ChipsetEditor UI 改善

- **ステータス:** [x] 完了
- **ブランチ:** feature/T242-chipset-editor-ui
- **PR:** -

**完了条件:**

- [x] ImageFieldEditor に showPreview オプション追加
- [x] ChipsetEditor の画像セクションを ImageFieldEditor (showPreview=false) に置換
- [x] ChipsetEditor にタブ（チップ一覧 / フィールド定義）追加
- [x] importDefaultAssets でアセット保存時に画像寸法（width/height）を metadata に記録
- [x] ChipsetEditor のチップグリッドを CSS sprite で表示（Tailwind v4 対応: 明示的 px 指定）
- [x] チップ表示数を画像サイズ÷タイルサイズで動的に計算（固定64→動的）
- [x] スプライト表示確認用テストページ追加（`/test/sprite`）

**関連ファイル:**

- `src/features/data-editor/components/fields/ImageFieldEditor.tsx`
- `src/types/fields/ImageFieldType.tsx`
- `src/features/map-editor/components/ChipsetEditor.tsx`
- `src/lib/importDefaultAssets.ts`
- `src/lib/importDefaultAssets.test.ts`
- `src/app/test/sprite/page.tsx`

---

#### [T243] ChipsetEditor autotile/animation フィールド & 新規追加時自動選択

- **ステータス:** [x] 完了
- **ブランチ:** main（直接コミット）
- **PR:** -

**完了条件:**

- [x] `Chipset` 型に `autotile`, `animated`, `animFrameCount`, `animIntervalMs` を追加
- [x] ChipsetEditor に隣接変形・アニメーションチェックボックスを追加
- [x] `animated=true` の時のみフレーム数・間隔の入力欄を表示
- [x] チップセット追加（+ボタン）時に新規チップセットを自動選択

**関連ファイル:**

- `src/types/map.ts`
- `src/app/(editor)/map/data/page.tsx`
- `src/features/map-editor/components/ChipsetEditor.tsx`
- `src/features/map-editor/components/ChipsetEditor.test.tsx`

---

#### [T244] LayerEditor チップセット割り当て UI

- **ステータス:** [x] 完了
- **ブランチ:** main（直接コミット）
- **PR:** -

**完了条件:**

- [x] tile レイヤーに割り当て済みチップセットをバッジで表示
- [x] バッジの×ボタンでチップセットを除去
- [x] ドロップダウンで未割り当てチップセットを追加
- [x] 全チップセット割り当て済みの場合はドロップダウン非表示
- [x] object レイヤーには表示しない

**関連ファイル:**

- `src/features/map-editor/components/LayerEditor.tsx`
- `src/features/map-editor/components/LayerEditor.test.tsx`

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

## Phase 21: Lite / Full テンプレートシステム

詳細設計: `docs/lite-full-concept.md`

### US21: テンプレートファースト設計

#### [T245] [P] TemplatePackage / ProjectMeta 型定義

- **ステータス:** [x] 完了
- **ブランチ:** feature/T242-chipset-editor-ui（一時的に同ブランチで作業）
- **PR:** -

**完了条件:**

- [x] `src/types/template.ts` 作成（TemplateMetadata / TemplatePackage）
- [x] `src/types/project/projectMeta.ts` 作成（ProjectMeta / ProjectMode / isEntityLocked）
- [x] `src/types/project/index.ts` 作成（公開API）
- [ ] 各エンティティに `templateId?` 追加（T246 で実施）

**関連ファイル:**

- `src/types/template.ts`
- `src/types/project/projectMeta.ts`
- `src/types/project/index.ts`
- `docs/lite-full-concept.md`

---

#### [T246] ~~既存エンティティ型に templateId? 追加~~

- **ステータス:** [-] 不要（設計変更により廃止）

**廃止理由:**

テンプレート由来の管理を各エンティティへの `templateId?` 埋め込みではなく、
`ProjectMeta.templateRegistry`（`TemplateRegistry`）で一元管理する設計に変更。
エンティティ型の変更は不要となった。

---

#### [T247] RPGクラシックパック（テンプレートパッケージ）作成

- **ステータス:** ⬜ 未着手
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/lib/templates/rpg-classic/` ディレクトリ作成
- [ ] CustomClass: ステータス・エフェクト・バトルスキル結果
- [ ] Variable: gold / party_hp / party_mp / game_flags
- [ ] DataType: モンスター / アイテム / 武器 / スキル
- [ ] Script: バトルロジック・移動・イベント基本セット
- [ ] Prefab: NPC / 宝箱 / サイン / 敵シンボル
- [ ] Chipset: デフォルト素材セット
- [ ] UI: タイトル / バトル / メニュー / ステータス画面

**関連ファイル:**

- `src/lib/templates/rpg-classic/index.ts`

---

#### [T248] プロジェクト管理基盤（ProjectMeta ストア）

- **ステータス:** ⬜ 未着手（プロジェクト作成・ロード・ユーザーDB が未実装のため後回し）
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `src/stores/projectSlice.ts` 作成（ProjectMeta 状態管理）
- [ ] 新規プロジェクト作成（Lite / Full モード選択）
- [ ] プロジェクトロード
- [ ] プロジェクト一覧（ローカルストレージ or IndexedDB）

**関連ファイル:**

- `src/stores/projectSlice.ts`

---

#### [T249] テンプレートインポートUI

- **ステータス:** ⬜ 未着手（T248 完了後）
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] テンプレート選択画面
- [ ] 部分インポート対応（classes だけ、scripts だけ等）
- [ ] インポート済みエンティティへの `templateId` 付与

**関連ファイル:**

- `src/features/template/components/TemplateImportModal.tsx`

---

#### [T250] Lite UI（制限モード）

- **ステータス:** ⬜ 未着手（T248・T249 完了後）
- **ブランチ:** -
- **PR:** -

**完了条件:**

- [ ] `isEntityLocked()` を使ったロック表示（グレーアウト・編集不可）
- [ ] Lite モードでのナビゲーション制限（スクリプトエディタ非表示など）
- [ ] テンプレート提供変数への「テンプレートから」ラベル表示

**関連ファイル:**

- `src/hooks/useEntityLock.ts`

---

#### [T251] GameEngine テンプレート対応

- **ステータス:** ⬜ 未着手（設計未確定）
- **ブランチ:** -
- **PR:** -

**備考:**

`src/engine/` 以下のゲームエンジン（GameEngine / EventRunner / actions 等）の
Lite/Full テンプレート対応。
Lite ではエンジン全体が固定・Full では自由に改造可能とする予定だが、
「エンジンをどう編集するか・どうコードで実装するか」が未設計のため着手不可。
設計確定後にタスクを更新する。

**関連ファイル:**

- `src/engine/core/GameEngine.ts`
- `docs/lite-full-concept.md`

---

## 進捗トラッキング

### フェーズ別サマリー

| Phase | 名称                           | 状態      |
| ----- | ------------------------------ | --------- |
| 0     | プロジェクトセットアップ       | ✅ 完了   |
| 1     | 型定義・基盤                   | ✅ 完了   |
| 2     | 基本フィールドタイプ           | ✅ 完了   |
| 3     | ゲーム設定                     | ✅ 完了   |
| 4     | 変数・クラス・フィールドセット | 🚧 進行中 |
| 5     | P1 フィールドタイプ            | 🚧 進行中 |
| 6     | アセット管理                   | 🚧 進行中 |
| 7     | データ設定                     | 🚧 進行中 |
| 8     | イベントシステム               | ✅ 完了   |
| 9     | スクリプトエディタ             | ✅ 完了   |
| 10    | マップ基盤                     | ✅ 完了   |
| 11    | マップデータページ             | ✅ 完了   |
| 12    | オブジェクトプレハブ           | ✅ 完了   |
| 13    | マップ編集ページ               | 🚧 計画中 |
| 14    | UI Foundation                  | 🚧 進行中 |
| 15    | Screen Design                  | ✅ 完了   |
| 16    | Object UI                      | ⬜ 未着手 |
| 17    | Timeline                       | ⬜ 未着手 |
| 18    | Game Engine                    | ⬜ 未着手 |
| 19    | Test Play                      | ⬜ 未着手 |
| 20    | Polish                         | ⬜ 未着手 |
| 21    | Lite/Full テンプレートシステム | 🚧 進行中 |

### 優先度凡例

- **[P]**: 優先（他タスクの依存元）
- **[US{N}]**: ユーザーストーリー番号
