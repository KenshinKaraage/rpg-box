# Default Assets & Chipset Image Design

**Date:** 2026-02-23

## Goal

1. デフォルトアセット（`assets/images/map_chip/` の PNG 群）を明示的なボタン操作でインポートできるようにする
2. ChipsetEditor で画像アセットを選択できるようにする
3. チップグリッドに実際の画像タイルを表示し、通行インジケータを重ねる

---

## Part 1: デフォルトアセットインポート

### ファイル配置

`assets/images/map_chip/*.png` を `public/assets/images/map_chip/` にコピーする。
ブラウザから `fetch('/assets/images/map_chip/t_mura01.png')` でアクセスできるようにする。

### 設定ファイル（変更の起点）

```typescript
// src/lib/defaultAssets.ts
export interface DefaultAssetGroup {
  folderName: string;
  assets: { path: string; name: string }[];
}

export const DEFAULT_ASSET_GROUPS: DefaultAssetGroup[] = [
  {
    folderName: 'マップチップ',
    assets: [
      { path: '/assets/images/map_chip/t_mura01.png', name: 't_mura01' },
      // ...全36ファイル
    ],
  },
];
```

将来デフォルトファイルが変わる場合は **このファイルだけ編集すればよい**。

### インポート関数

```typescript
// src/lib/importDefaultAssets.ts
export async function importDefaultAssets(
  existingAssets: AssetReference[],
  addAsset: (asset: AssetReference) => void,
  addFolder: (folder: AssetFolder) => void,
  existingFolders: AssetFolder[]
): Promise<{ imported: number; skipped: number }>;
```

処理フロー：

1. `DEFAULT_ASSET_GROUPS` を走査
2. フォルダが未作成なら `addFolder` で作成
3. 各 `asset.path` を `fetch` → `blob` → Base64 data URL に変換
4. 同名アセットが既存なら **スキップ**（`name` で重複チェック）
5. `addAsset` で登録
6. インポート件数 / スキップ件数を返す

### UI

アセット管理画面のヘッダーに「デフォルトをインポート」ボタンを追加。
インポート中はローディング表示、完了後にトースト通知（例: `36件インポートしました（2件スキップ）`）。

---

## Part 2: ChipsetEditor の画像選択

`Chipset.imageId` はすでに型定義に存在する（`string`）。

ChipsetEditor の「名前」セクションの下に「画像」セクションを追加：

```tsx
<div className="space-y-1">
  <Label className="text-xs">画像</Label>
  {chipset.imageId ? (
    <div className="flex items-center gap-2">
      <img src={assetData} className="h-10 w-10 object-contain border rounded" />
      <span className="text-xs">{assetName}</span>
      <Button onClick={openPicker}>変更</Button>
    </div>
  ) : (
    <Button onClick={openPicker}>画像を選択</Button>
  )}
</div>
```

- `AssetPickerModal` を `type="image"` で開く
- 選択後に `onUpdateChipset(id, { imageId: selectedId })` を呼ぶ
- `assets` を props 経由で受け取る（page.tsx から渡す）

---

## Part 3: チップグリッドの画像表示

### タイル計算

```
cols = Math.floor(imageWidth / tileWidth)
col  = index % cols
row  = Math.floor(index / cols)
```

### CSS スタイル

```tsx
<button
  style={{
    backgroundImage: `url(${imageData})`,
    backgroundSize: `${imageWidth}px ${imageHeight}px`,
    backgroundPosition: `-${col * tileWidth}px -${row * tileHeight}px`,
    width: tileWidth,
    height: tileHeight,
    position: 'relative',
  }}
>
  {/* 通行インジケータを絶対配置で重ねる */}
  {passable !== null && (
    <span
      className="absolute inset-0 flex items-center justify-center text-sm font-bold"
      style={{ textShadow: '0 0 3px white, 0 0 3px white' }}
    >
      {passable ? '○' : '×'}
    </span>
  )}
</button>
```

画像なしのときは従来の数字表示を維持。

### グリッドセルサイズ

`tileWidth × tileHeight` を実寸で表示すると大きすぎる場合があるため、
チップセルは **固定 32px × 32px** にスケールして表示する（CSS `background-size` で縮小）。

実寸 `imageWidth × imageHeight` に対して表示スケール `scale = 32 / tileWidth` を適用：

```
backgroundSize: `${imageWidth * scale}px ${imageHeight * scale}px`
backgroundPosition: `-${col * 32}px -${row * 32}px`
```

---

## 関連ファイル

| ファイル                                                     | 変更種別                       |
| ------------------------------------------------------------ | ------------------------------ |
| `public/assets/images/map_chip/*.png`                        | 新規（コピー）                 |
| `src/lib/defaultAssets.ts`                                   | 新規作成                       |
| `src/lib/importDefaultAssets.ts`                             | 新規作成                       |
| `src/lib/importDefaultAssets.test.ts`                        | 新規作成                       |
| `src/features/asset-manager/components/AssetManagerPage.tsx` | ボタン追加                     |
| `src/features/map-editor/components/ChipsetEditor.tsx`       | 画像選択 UI 追加               |
| `src/features/map-editor/components/ChipsetEditor.test.tsx`  | テスト追加                     |
| `src/app/(editor)/map/data/page.tsx`                         | assets を ChipsetEditor に渡す |
