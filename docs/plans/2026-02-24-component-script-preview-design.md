# Component Script Preview Design

**Date:** 2026-02-24

## Goal

コンポーネントスクリプトページの右パネルを、フィールド定義のプレビューに置き換える。
ユーザーがコードを編集するとリアルタイムでプレビューが更新され、マップオブジェクトで
コンポーネントを追加したときのプロパティパネルの見え方を確認できる。

## Background

コンポーネントスクリプトのフィールド型定義はコード（上級者向け）で行う方針。
`export default` の各フィールドを `{ type, default, label }` 形式のリッチオブジェクトとして宣言する。

## Content Format

コンポーネントスクリプトのコードフォーマット:

```js
export default {
  x: { type: 'number', default: 0, label: 'X座標' },
  y: { type: 'number', default: 0, label: 'Y座標' },
  imageSrc: { type: 'image', default: '', label: '画像' },
};
```

- `type`: FieldType レジストリのキー（`'number'`, `'string'`, `'boolean'`, `'image'` 等）
- `default`: デフォルト値
- `label`: プロパティパネルに表示されるラベル

## Architecture

### 1. Content Generation (`componentScriptUtils.ts`)

`generateScriptContent(fields: ComponentField[]): string` を新フォーマットに変更:

```js
export default {
  fieldName: { type: 'number', default: 0, label: 'フィールド名' },
};
```

`inferFieldType` はそのまま使用（プリミティブ値から `'number'`/`'string'`/`'boolean'` を推論）。

### 2. Content Parser (`componentScriptUtils.ts`)

`parseComponentFields(content: string): ComponentField[]` を追加:

- `new Function()` でコードを評価
- パース失敗時は `[]` を返す（エラーは呼び出し側が表示）

### 3. Right Panel: ComponentScriptPreview

`src/features/script-editor/components/ComponentScriptPreview.tsx` を新規作成。

**Props:**

```typescript
interface ComponentScriptPreviewProps {
  content: string | null; // 現在のコードコンテンツ（リアルタイム更新）
}
```

**表示ルール:**

- `content` が null → 「スクリプトを選択してください」
- パース失敗（`parseComponentFields` が `[]` 返しかつ content が空でない）→ 「コードの解析に失敗しました」
- フィールドが 0 件（content が空等）→ 「フィールドがありません」
- 各フィールド: `getFieldType(fieldType)` でインスタンス生成 → `renderEditor({ value: defaultValue, onChange: noop, disabled: true })`
- 未知の type（レジストリ未登録）→ 「未対応の型: {type}」テキスト表示

### 4. ComponentScriptPage Right Panel

`src/app/(editor)/script/components/page.tsx` を更新:

- `ScriptSettingsPanel` / `ScriptTestPanel` タブを削除
- 代わりに `ComponentScriptPreview` を `content={selectedScript?.content ?? null}` で表示
- `ScriptSettingsPanel` と `ScriptTestPanel` は events ページでは引き続き使用

## Data Flow

```
User edits code
  → handleContentChange → updateScript({ content })
                                  ↓
                        ComponentScriptPreview re-renders
                        (parseComponentFields(content) → renderEditor[])
```

`Script.fields` の同期は今回のスコープ外（プロパティインスペクター実装時に対応）。

## Out of Scope

- `Script.fields` とコードコンテンツの同期
- FieldType 設定 UI（min/max など）のプレビュー内表示
- プレビューでの値編集
