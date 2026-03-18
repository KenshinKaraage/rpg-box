# オブジェクト配置 — 設計 + 実装計画

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan.

**ゴール:** マップエディタ上でオブジェクトを配置・選択・移動・削除できるようにする。

**方針:** 既存のタイルペイント（useTilePainting）と同じパターンで useObjectPlacement フックを作成。MapCanvas にオブジェクト描画を追加。PrefabList に「空オブジェクト」を追加。

---

## 設計

### 操作フロー

1. レイヤーパネルでオブジェクトレイヤーを選択
2. 左パネルにプレハブリスト表示（先頭に「空オブジェクト」）
3. プレハブをクリックして選択状態にする
4. マップキャンバス上をクリック → そのタイル位置にオブジェクト配置
5. selectツールでオブジェクトをクリック → 選択（🔻マーカー表示）
6. 選択中にドラッグ → グリッド単位で移動
7. 選択中にDelete → 削除

### キャンバス上の表示

- **全オブジェクト**: 1タイル分の青い太枠。枠内にSpriteComponentの画像があれば表示
- **選択中**: 枠の上に🔻マーカー
- **枠の色**: mapEditorSlice の `objectFrameColor`（デフォルト `#3b82f6`）

### データ

オブジェクトの位置は既存の仕組み通り TransformComponent の x, y で保持。MapObject に新しいフィールドは追加しない。

```typescript
// 配置時に作成する MapObject
{
  id: generateId(),
  name: prefab ? prefab.name : 'オブジェクト',
  prefabId: prefab?.id,  // 空オブジェクトの場合は undefined
  components: [
    { type: 'transform', data: { x: tileX, y: tileY, rotation: 0, scaleX: 1, scaleY: 1 } },
    // prefab の場合: prefab.components もコピー（resolveObject で解決されるので prefabId だけでも可）
  ],
}
```

### 左パネル構成（オブジェクトレイヤー選択時）

```
── プレハブ ──
 ☐ 空オブジェクト    ← prefabId = undefined の特別枠
 NPC_基本
 宝箱
 プレイヤー

── 配置済み ──
 NPC_村人A (3,5)     ← クリックで選択
 宝箱_01  (7,2)
```

### スコープ外

- オブジェクトのコピー&ペースト
- 複数選択
- 回転・スケールのキャンバス操作（右パネルで数値編集のみ）
- オブジェクトの描画順序（Y-sort）はエディタでは不要

---

## 実装計画

### Task 1: mapEditorSlice に objectFrameColor と selectedPrefabId を追加

**ファイル:**
- 変更: `src/stores/mapEditorSlice.ts`

- [ ] `objectFrameColor: string`（デフォルト `'#3b82f6'`）を追加
- [ ] `setObjectFrameColor(color: string)` アクション追加
- [ ] `selectedPrefabId: string | null`（デフォルト `null`）を追加。`null` = 空オブジェクト選択状態ではない、`'__empty__'` = 空オブジェクト
- [ ] `selectPrefabForPlacement(id: string | null)` アクション追加
- [ ] コミット

---

### Task 2: PrefabList に「空オブジェクト」と配置選択UIを追加

**ファイル:**
- 変更: `src/features/map-editor/components/PrefabList.tsx`

- [ ] リスト先頭に「空オブジェクト」項目を追加（id = `'__empty__'`）
- [ ] 各項目クリックで `selectPrefabForPlacement(id)` を呼ぶ
- [ ] 選択中の項目をハイライト表示（`selectedPrefabId` と比較）
- [ ] 再クリックで選択解除（`selectPrefabForPlacement(null)`）
- [ ] コミット

---

### Task 3: useObjectPlacement フック作成

**ファイル:**
- 新規: `src/features/map-editor/hooks/useObjectPlacement.ts`

useTilePainting と同じパターンでマウスイベントを処理する。

- [ ] `handleMouseDown(screenX, screenY)`:
  - `selectedPrefabId` がある場合 → screenToTile でタイル座標変換 → `addObject()` で配置
  - `currentTool === 'select'` の場合 → タイル位置のオブジェクトを検索 → `selectObject(id)` で選択、ドラッグ開始
- [ ] `handleMouseMove(screenX, screenY)`:
  - ドラッグ中 → オブジェクトの Transform x, y を更新（グリッドスナップ）
- [ ] `handleMouseUp()`:
  - ドラッグ終了 → `updateObject()` で最終位置を確定
- [ ] `handleKeyDown(key)`:
  - Delete → 選択中のオブジェクトを `deleteObject()` で削除
- [ ] ヘルパー: `getObjectAtTile(x, y)` — 現在のオブジェクトレイヤーからタイル位置のオブジェクトを検索
- [ ] コミット

---

### Task 4: MapCanvas にオブジェクト描画を追加

**ファイル:**
- 変更: `src/features/map-editor/components/MapCanvas.tsx` または `src/features/map-editor/hooks/useMapCanvas.ts`

タイル描画の後にオブジェクトレイヤーのオブジェクトを描画する。

- [ ] 各オブジェクトの Transform から x, y を取得
- [ ] `objectFrameColor` で1タイル分の太枠を描画（WebGL で矩形 or Canvas 2D overlay）
- [ ] SpriteComponent の imageId があればテクスチャを枠内に描画
- [ ] 選択中のオブジェクト（`selectedObjectId`）の上に🔻マーカーを描画
- [ ] コミット

---

### Task 5: MapCanvas にオブジェクト操作のマウスイベントを接続

**ファイル:**
- 変更: `src/features/map-editor/components/MapCanvas.tsx`
- 変更: `src/app/(editor)/map/page.tsx`

- [ ] 選択レイヤーが object タイプの時、useTilePainting の代わりに useObjectPlacement のイベントハンドラを接続
- [ ] tile レイヤーと object レイヤーでハンドラを切り替える
- [ ] Delete キーイベントを useObjectPlacement に渡す
- [ ] コミット

---

### Task 6: 統合検証

- [ ] TypeScript コンパイル確認: `npx tsc --noEmit`
- [ ] テスト実行: `npx jest src/features/map-editor src/stores/mapEditorSlice --no-coverage`
- [ ] 手動検証:
  1. マップにオブジェクトレイヤーを追加
  2. プレハブリストから「空オブジェクト」を選択 → マップクリックで配置
  3. 青枠が表示される
  4. selectツールでオブジェクトをクリック → 🔻表示
  5. ドラッグで移動 → グリッドスナップ
  6. Delete で削除
  7. プレハブ（ControllerComponent付き）を配置 → ▶ でテストプレイ起動 → 歩ける
