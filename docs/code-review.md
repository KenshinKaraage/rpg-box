# コードレビュー結果

対象: 変更差分中心（`src/lib/storage/types.ts`, `src/stores/scriptSlice.ts`, `src/stores/index.ts`, `src/types/script.ts`）

## Findings

1. **[High] `Script` 型の参照が壊れており `type-check` が失敗する**

- 該当: `/Users/kenshin/rpg_box/src/lib/storage/types.ts:244`, `/Users/kenshin/rpg_box/src/lib/storage/types.ts:308`
- 内容: `export type { Script } from '@/types/script';` は再エクスポートのみで、同一ファイル内の型名 `Script` をローカルに導入しません。そのため `ProjectData.scripts: Script[]` で `TS2304: Cannot find name 'Script'` になります。
- 影響: 型チェックが通らずCIを止めます。`ProjectData` を利用する箇所の開発効率も落ちます。
- 修正案: `import type { Script } from '@/types/script';` を追加し、再エクスポートが必要なら別途 `export type { Script };` と分離する。

2. **[Medium] 親スクリプト削除時、選択中の内部スクリプトIDが不正なまま残る**

- 該当: `/Users/kenshin/rpg_box/src/stores/scriptSlice.ts:58`
- 内容: `deleteScript` は `id` 本体と子要素（`parentId === id`）を削除しますが、`selectedScriptId === id` の場合しか選択解除しません。選択中が内部スクリプト（子）だった場合、削除後に `selectedScriptId` が存在しないIDを指し続けます。
- 影響: UI側で「選択中スクリプト取得」が `undefined` になり、詳細パネルやエディタ表示で不整合・例外の原因になります。
- 修正案: 削除対象ID集合を先に作成し、`selectedScriptId` が集合に含まれる場合は `null` へ戻す。あわせてこのケースのテストを追加する。

3. **[Medium] `updateScript` でID重複を防いでおらず、ストア整合性が崩れる**

- 該当: `/Users/kenshin/rpg_box/src/stores/scriptSlice.ts:47`
- 内容: `updateScript('a', { id: 'b' })` が既存ID `b` と衝突しても更新され、ID一意性が保証されません。
- 影響: `getScriptById` の結果が先頭一致依存になり、参照先が不安定になります。削除・選択などIDベース操作の誤動作リスクがあります。
- 修正案: `updates.id` が既存別レコードと重複する場合は更新拒否またはエラー返却にする。

## 補足

- `npx jest src/stores/scriptSlice.test.ts --runInBand` は成功しました。
- `npm run -s type-check` は既存の他領域エラーも多く失敗していますが、上記 Finding 1 は今回差分に直接起因する失敗です。
