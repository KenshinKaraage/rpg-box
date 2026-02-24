# ChipsetEditor UI Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** (1) Add `showPreview` option to ImageFieldEditor so ChipsetEditor can show a compact image selector without thumbnail. (2) Add tabs to ChipsetEditor splitting "チップ一覧" and "フィールド定義" into separate views.

**Architecture:** `ImageFieldEditor` gets a new `showPreview?: boolean` prop (default `true`). ChipsetEditor replaces its custom 画像 section with `ImageFieldEditor showPreview={false}` and reads `assets` from the store directly (removing props). Tabs split chip grid + ChipPropertyEditor (tab 1) from field schema editor (tab 2).

**Tech Stack:** React, Zustand, shadcn/ui (Tabs already installed at `src/components/ui/tabs.tsx`)

**Base branch:** `feature/T241-default-assets-chipset-image`
**New branch:** `feature/T242-chipset-editor-ui`

---

## Task 1: Create T242 branch

**Step 1: Create branch from T241**

```bash
git checkout feature/T241-default-assets-chipset-image
git checkout -b feature/T242-chipset-editor-ui
```

**Step 2: Commit the Tabs component that was already installed**

```bash
git add src/components/ui/tabs.tsx package.json package-lock.json
git commit -m "chore(ui): add shadcn Tabs component [T242]"
```

---

## Task 2: Add `showPreview` option to ImageFieldEditor

**Files:**

- Modify: `src/features/data-editor/components/fields/ImageFieldEditor.tsx`
- Test: `src/features/data-editor/components/fields/ImageFieldEditor.test.tsx` (create if not exists)

**Step 1: Write failing tests**

Create/open `src/features/data-editor/components/fields/ImageFieldEditor.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import { ImageFieldEditor } from './ImageFieldEditor';

// ストアをモック
jest.mock('@/stores', () => ({
  useStore: jest.fn((selector) =>
    selector({
      assets: [
        {
          id: 'asset_1',
          name: 'test.png',
          type: 'image',
          data: 'data:image/png;base64,abc',
          metadata: null,
        },
      ],
      assetFolders: [],
    })
  ),
}));

describe('ImageFieldEditor', () => {
  it('showPreview=true（デフォルト）は画像プレビューを表示する', () => {
    render(
      <ImageFieldEditor value="asset_1" onChange={jest.fn()} />
    );
    // プレビュー画像が表示される
    expect(screen.getByRole('img', { name: 'test.png' })).toBeInTheDocument();
  });

  it('showPreview=false はプレビュー画像を表示しない', () => {
    render(
      <ImageFieldEditor value="asset_1" onChange={jest.fn()} showPreview={false} />
    );
    // プレビュー画像が表示されない
    expect(screen.queryByRole('img', { name: 'test.png' })).not.toBeInTheDocument();
  });

  it('showPreview=false でもファイル名と変更ボタンは表示される', () => {
    render(
      <ImageFieldEditor value="asset_1" onChange={jest.fn()} showPreview={false} />
    );
    expect(screen.getByText('test.png')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '変更' })).toBeInTheDocument();
  });
});
```

**Step 2: Run to verify they fail**

```bash
npx jest src/features/data-editor/components/fields/ImageFieldEditor.test.tsx --no-coverage
# Expected: FAIL (showPreview prop not yet supported)
```

**Step 3: Update ImageFieldEditor**

Add `showPreview?: boolean` to props (default `true`). When `showPreview=false`, skip the preview block.

Current "選択済み状態" block (line 91+):

```typescript
// 選択済み状態
return (
  <>
    <div className="space-y-2">
      {/* プレビュー */}
      <div className="flex items-center justify-center overflow-hidden rounded border bg-muted/30 p-2" ...>
        <img ... />
      </div>
      {/* ファイル名 + アクションボタン */}
      <div className="flex items-center gap-2">
        ...
      </div>
    </div>
    <AssetPickerModal ... />
  </>
);
```

Replace with:

```typescript
interface ImageFieldEditorProps {
  value: string | null;
  onChange: (value: string | null) => void;
  initialFolderId?: string;
  /** プレビュー画像を表示するか（デフォルト: true） */
  showPreview?: boolean;
}

// 関数シグネチャも更新:
export function ImageFieldEditor({ value, onChange, initialFolderId, showPreview = true }: ImageFieldEditorProps) {
```

「選択済み状態」のreturn を以下に変更:

```typescript
// 選択済み状態
return (
  <>
    <div className="space-y-2">
      {/* プレビュー（showPreview=true のときのみ） */}
      {showPreview && (
        <div
          className="flex items-center justify-center overflow-hidden rounded border bg-muted/30 p-2"
          style={{ maxHeight: '160px' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selectedAsset.data}
            alt={selectedAsset.name}
            className="h-auto max-h-[144px] w-auto object-contain"
          />
        </div>
      )}

      {/* ファイル名 + アクションボタン */}
      <div className="flex items-center gap-2">
        <p className="min-w-0 flex-1 truncate text-sm" title={selectedAsset.name}>
          {selectedAsset.name}
        </p>
        <Button size="sm" variant="outline" onClick={() => setIsModalOpen(true)}>
          変更
        </Button>
        <Button size="sm" variant="ghost" onClick={handleClear} title="選択解除">
          <X className="h-4 w-4" />
          <span className="sr-only">クリア</span>
        </Button>
      </div>
    </div>

    <AssetPickerModal
      open={isModalOpen}
      onOpenChange={setIsModalOpen}
      assets={assets}
      folders={assetFolders}
      assetType="image"
      onSelect={handleSelect}
      selectedAssetId={value}
      initialFolderId={initialFolderId}
    />
  </>
);
```

**Step 4: Run tests to verify they pass**

```bash
npx jest src/features/data-editor/components/fields/ImageFieldEditor.test.tsx --no-coverage
# Expected: PASS (3 tests)
```

**Step 5: Update ImageFieldType to expose showPreview**

In `src/types/fields/ImageFieldType.tsx`, add `showPreview` property and pass to renderEditor:

```typescript
export class ImageFieldType extends FieldType<string | null> {
  readonly type = 'image';
  readonly label = '画像';
  readonly tsType = 'string';

  initialFolderId?: string;
  /** プレビュー画像を表示するか（デフォルト: true） */
  showPreview?: boolean;

  // ...

  renderEditor({ value, onChange }: FieldEditorProps<string | null>): ReactNode {
    return (
      <ImageFieldEditor
        value={value}
        onChange={onChange}
        initialFolderId={this.initialFolderId}
        showPreview={this.showPreview}
      />
    );
  }
}
```

**Step 6: TypeScript check**

```bash
npx tsc --noEmit
# Expected: no new errors
```

**Step 7: Commit**

```bash
git add src/features/data-editor/components/fields/ImageFieldEditor.tsx \
        src/features/data-editor/components/fields/ImageFieldEditor.test.tsx \
        src/types/fields/ImageFieldType.tsx
git commit -m "feat(fields): add showPreview option to ImageFieldEditor and ImageFieldType [T242]"
```

---

## Task 3: Simplify ChipsetEditor 画像 section

Replace the custom 画像 section (thumbnail + AssetPickerModal) in ChipsetEditor with `ImageFieldEditor showPreview={false}`. Also remove `assets` and `assetFolders` from props (read `assets` from store directly for `chipStyles`).

**Files:**

- Modify: `src/features/map-editor/components/ChipsetEditor.tsx`
- Modify: `src/features/map-editor/components/ChipsetEditor.test.tsx`
- Modify: `src/app/(editor)/map/data/page.tsx`

**Step 1: Write failing test**

In `ChipsetEditor.test.tsx`, add:

```typescript
it('画像フィールドはプレビューなしで表示される（「画像を選択」ボタンのみ）', () => {
  render(<ChipsetEditor {...defaultProps} />);
  // ImageFieldEditor のコンパクト表示を確認
  // ※ 既存の「画像を選択」テストと同等だが、ImageFieldEditor 経由であることを確認
  expect(screen.getByRole('button', { name: '画像を選択...' })).toBeInTheDocument();
});
```

NOTE: ImageFieldEditor の未選択状態は `画像を選択...`（`...` 付き）を表示する。

Also update existing test `imageId未設定時は「画像を選択」ボタンが表示される` to match the new text:

```typescript
it('imageId未設定時は「画像を選択...」ボタンが表示される', () => {
  render(<ChipsetEditor {...defaultProps} />);
  expect(screen.getByRole('button', { name: '画像を選択...' })).toBeInTheDocument();
});
```

**Step 2: Run to verify the change**

```bash
npx jest src/features/map-editor/components/ChipsetEditor.test.tsx --no-coverage
# Expected: some tests fail because button text changes
```

**Step 3: Update ChipsetEditor**

Changes to make to `ChipsetEditor.tsx`:

**3a. Remove `assets` and `assetFolders` from props, add store import:**

Remove from `ChipsetEditorProps`:

```typescript
assets: import('@/types/asset').AssetReference[];
assetFolders: import('@/types/asset').AssetFolder[];
```

Remove from function destructuring: `assets, assetFolders,`

Add at top of component (after chipset line):

```typescript
const assets = useStore((state) => state.assets);
```

Add import:

```typescript
import { useStore } from '@/stores';
import { ImageFieldEditor } from '@/features/data-editor/components/fields/ImageFieldEditor';
```

**3b. Remove `AssetPickerModal` import and `imagePickerOpen` state:**

Remove:

```typescript
import { AssetPickerModal } from '@/features/asset-manager/components/AssetPickerModal';
const [imagePickerOpen, setImagePickerOpen] = useState(false);
```

**3c. Replace the entire 画像 section (the `{/* 画像 */}` div + `{/* 画像選択モーダル */}` AssetPickerModal) with:**

```tsx
{
  /* 画像 */
}
<div className="space-y-1">
  <Label className="text-xs">画像</Label>
  <ImageFieldEditor
    value={chipset.imageId || null}
    onChange={(id) => onUpdateChipset(chipset.id, { imageId: id ?? '' })}
    showPreview={false}
  />
</div>;
```

**3d. Also remove `_onReorderChipsetFields` from destructuring and update:**
(This was added in T241. If it causes ESLint issues, keep the `_` prefix alias.)

**3e. Update test `defaultProps`** — remove `assets` and `assetFolders` from defaultProps:

```typescript
const defaultProps = {
  chipsets: [makeChipset()],
  // assets と assetFolders を削除
  onAddChipset: jest.fn(),
  // ...rest unchanged
};
```

Also delete the test `imageId設定時は変更ボタンが表示される` (it tested the old custom HTML; the new ImageFieldEditor test coverage handles this) and update `imageId未設定時は「画像を選択」ボタンが表示される`:

```typescript
it('imageId未設定時は「画像を選択...」ボタンが表示される', () => {
  render(<ChipsetEditor {...defaultProps} />);
  expect(screen.getByRole('button', { name: '画像を選択...' })).toBeInTheDocument();
});
```

**3f. Update page.tsx** — remove `assets` and `assetFolders` from ChipsetEditor props:

In `src/app/(editor)/map/data/page.tsx`, find the ChipsetEditor JSX and remove:

```tsx
assets = { assets };
assetFolders = { assetFolders };
```

Also remove (if they're only used for ChipsetEditor):

```typescript
const assets = useStore((state) => state.assets);
const assetFolders = useStore((state) => state.assetFolders);
```

**Step 4: Run tests to verify all pass**

```bash
npx jest src/features/map-editor/components/ChipsetEditor.test.tsx --no-coverage
# Expected: PASS
```

**Step 5: TypeScript check**

```bash
npx tsc --noEmit
# Expected: no new errors
```

**Step 6: Commit**

```bash
git add src/features/map-editor/components/ChipsetEditor.tsx \
        src/features/map-editor/components/ChipsetEditor.test.tsx \
        src/app/(editor)/map/data/page.tsx
git commit -m "refactor(map-editor): replace custom image section with ImageFieldEditor in ChipsetEditor [T242]"
```

---

## Task 4: Add tabs to ChipsetEditor (チップ一覧 / フィールド定義)

Split the chipset content area into two tabs.

**Files:**

- Modify: `src/features/map-editor/components/ChipsetEditor.tsx`
- Modify: `src/features/map-editor/components/ChipsetEditor.test.tsx`

**Current structure** (inside `{chipset && ...}`):

```
設定エリア:
  - 名前
  - 画像 (ImageFieldEditor)
  - タイルサイズ
フィールドスキーマ:
  - フィールド定義 (FieldRow list)
チップグリッド:
  - チップ一覧
ChipPropertyEditor
```

**Target structure**:

```
設定エリア (always visible):
  - 名前
  - 画像 (ImageFieldEditor)
  - タイルサイズ
[Tabs]
  Tab "チップ一覧":
    - チップグリッド
    - ChipPropertyEditor
  Tab "フィールド定義":
    - フィールドスキーマ (addField button + FieldRow list)
```

**Step 1: Write failing test**

In `ChipsetEditor.test.tsx`:

```typescript
it('タブ「チップ一覧」と「フィールド定義」が表示される', () => {
  render(<ChipsetEditor {...defaultProps} />);
  expect(screen.getByRole('tab', { name: 'チップ一覧' })).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: 'フィールド定義' })).toBeInTheDocument();
});

it('デフォルトでチップ一覧タブが選択されている', () => {
  render(<ChipsetEditor {...defaultProps} />);
  expect(screen.getByTestId('chip-grid')).toBeInTheDocument();
});

it('フィールド定義タブに切り替えるとフィールドが表示される', () => {
  render(<ChipsetEditor {...defaultProps} />);
  fireEvent.click(screen.getByRole('tab', { name: 'フィールド定義' }));
  expect(screen.getByDisplayValue('通行可能')).toBeInTheDocument();
});

it('チップ一覧タブではフィールド定義が非表示', () => {
  render(<ChipsetEditor {...defaultProps} />);
  // チップ一覧タブ（デフォルト）ではフィールド定義は非表示
  expect(screen.queryByDisplayValue('通行可能')).not.toBeInTheDocument();
});
```

**Step 2: Run to verify they fail**

```bash
npx jest src/features/map-editor/components/ChipsetEditor.test.tsx --no-coverage
# Expected: FAIL (no tabs exist yet)
```

**Step 3: Add Tabs import and restructure**

Add to imports in `ChipsetEditor.tsx`:

```typescript
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
```

Replace the content area inside `{chipset && (...)}` — change from `<div className="flex-1 space-y-4 overflow-auto p-3">` to:

```tsx
{
  chipset && (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* 常時表示: 名前・画像・タイルサイズ設定 */}
      <div className="shrink-0 space-y-4 overflow-auto border-b p-3">
        {/* 寸法計測用の隠し画像 */}
        {selectedImageAsset && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={chipset.imageId}
            src={selectedImageAsset.data}
            alt=""
            className="hidden"
            onLoad={(e) => {
              const img = e.currentTarget;
              setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
            }}
          />
        )}

        {/* 名前 */}
        <div className="space-y-1">
          <Label className="text-xs">名前</Label>
          <Input
            value={chipset.name}
            onChange={(e) => onUpdateChipset(chipset.id, { name: e.target.value })}
            className="h-8 text-sm"
          />
        </div>

        {/* 画像 */}
        <div className="space-y-1">
          <Label className="text-xs">画像</Label>
          <ImageFieldEditor
            value={chipset.imageId || null}
            onChange={(id) => onUpdateChipset(chipset.id, { imageId: id ?? '' })}
            showPreview={false}
          />
        </div>

        {/* タイルサイズ */}
        <div className="space-y-1">
          <Label className="text-xs">タイルサイズ</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              value={chipset.tileWidth}
              onChange={(e) =>
                onUpdateChipset(chipset.id, { tileWidth: parseInt(e.target.value, 10) || 32 })
              }
              className="h-8 w-20 text-sm"
            />
            <span className="self-center text-xs text-muted-foreground">×</span>
            <Input
              type="number"
              value={chipset.tileHeight}
              onChange={(e) =>
                onUpdateChipset(chipset.id, { tileHeight: parseInt(e.target.value, 10) || 32 })
              }
              className="h-8 w-20 text-sm"
            />
            <span className="self-center text-xs text-muted-foreground">px</span>
          </div>
        </div>
      </div>

      {/* タブ: チップ一覧 / フィールド定義 */}
      <Tabs defaultValue="chips" className="flex min-h-0 flex-1 flex-col">
        <TabsList className="mx-3 mt-2 shrink-0 grid w-auto grid-cols-2">
          <TabsTrigger value="chips" className="text-xs">
            チップ一覧
          </TabsTrigger>
          <TabsTrigger value="fields" className="text-xs">
            フィールド定義
          </TabsTrigger>
        </TabsList>

        {/* チップ一覧タブ */}
        <TabsContent value="chips" className="min-h-0 flex-1 overflow-auto p-3">
          <div className="space-y-2">
            <Label className="text-xs">チップ一覧</Label>
            <div
              className="grid gap-0.5"
              style={{ gridTemplateColumns: `repeat(${CHIP_COLUMNS}, 1fr)` }}
              data-testid="chip-grid"
            >
              {Array.from({ length: CHIP_DISPLAY_COUNT }, (_, i) => {
                const passable = getPassable(i);
                const isSelected = selectedChipIndex === i;
                const chipStyle = chipStyles[i] ?? null;
                return (
                  <button
                    key={i}
                    className={cn(
                      'relative h-8 w-full overflow-hidden rounded border',
                      !chipStyle && 'flex items-center justify-center text-xs',
                      isSelected
                        ? 'border-primary bg-primary/20'
                        : 'border-border bg-muted/30 hover:bg-muted'
                    )}
                    style={chipStyle ?? undefined}
                    onClick={() => setSelectedChipIndex(i)}
                    data-testid={`chip-cell-${i}`}
                    title={`チップ #${i}`}
                  >
                    {chipStyle ? (
                      passable !== null && (
                        <span
                          className={cn(
                            'absolute inset-0 flex items-center justify-center text-sm font-bold',
                            passable ? 'text-green-600' : 'text-red-500'
                          )}
                          style={{ textShadow: '0 0 3px white, 0 0 3px white' }}
                        >
                          {passable ? '○' : '×'}
                        </span>
                      )
                    ) : passable === true ? (
                      <span className="text-green-600">○</span>
                    ) : passable === false ? (
                      <span className="text-red-500">×</span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground/50">{i}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 選択チップのプロパティ */}
          <ChipPropertyEditor
            chipset={chipset}
            chipIndex={selectedChipIndex}
            onUpdateChipProperty={onUpdateChipProperty}
          />
        </TabsContent>

        {/* フィールド定義タブ */}
        <TabsContent value="fields" className="min-h-0 flex-1 overflow-auto p-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">フィールド定義</Label>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleAddField}>
                <Plus className="mr-1 h-3 w-3" />
                追加
              </Button>
            </div>
            {chipset.fields.length === 0 ? (
              <div className="text-xs text-muted-foreground">フィールドがありません</div>
            ) : (
              <div className="space-y-1">
                {chipset.fields.map((field) => (
                  <FieldRow
                    key={field.id}
                    field={field}
                    isExpanded={expandedFields.has(field.id)}
                    onToggleExpand={() =>
                      setExpandedFields((prev) => {
                        const next = new Set(prev);
                        if (next.has(field.id)) next.delete(field.id);
                        else next.add(field.id);
                        return next;
                      })
                    }
                    onIdChange={() => {}}
                    onNameChange={(name) => handleFieldConfigChange(field.id, { name })}
                    onTypeChange={(type) => handleFieldTypeChange(field.id, type)}
                    onConfigChange={(updates) => handleFieldConfigChange(field.id, updates)}
                    onDelete={() => onDeleteChipsetField(chipset.id, field.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

**NOTE about existing tests:**

- `フィールド一覧が表示される` test uses `getByDisplayValue('通行可能')` — this will now FAIL in the default (chips) tab since field names are hidden. Update it:
  ```typescript
  it('フィールド定義タブではフィールド名が表示される', () => {
    render(<ChipsetEditor {...defaultProps} />);
    fireEvent.click(screen.getByRole('tab', { name: 'フィールド定義' }));
    expect(screen.getByDisplayValue('通行可能')).toBeInTheDocument();
  });
  ```

**Step 4: Run all ChipsetEditor tests**

```bash
npx jest src/features/map-editor/components/ChipsetEditor.test.tsx --no-coverage
# Expected: PASS (all tests)
```

**Step 5: TypeScript check**

```bash
npx tsc --noEmit
# Expected: no new errors
```

**Step 6: Commit**

```bash
git add src/features/map-editor/components/ChipsetEditor.tsx \
        src/features/map-editor/components/ChipsetEditor.test.tsx
git commit -m "feat(map-editor): add チップ一覧/フィールド定義 tabs to ChipsetEditor [T242]"
```

---

## Task 5: Update tasks.md

**Step 1: Add T242 entry to docs/tasks.md**

Find the T241 entry and add T242 after it:

```markdown
#### [T242] ChipsetEditor UI 改善

- **ステータス:** [x] 完了
- **ブランチ:** feature/T242-chipset-editor-ui
- **PR:** -

**完了条件:**

- [x] ImageFieldEditor に showPreview オプション追加
- [x] ChipsetEditor の画像セクションを ImageFieldEditor (showPreview=false) に置換
- [x] ChipsetEditor にタブ（チップ一覧 / フィールド定義）追加

**関連ファイル:**

- `src/features/data-editor/components/fields/ImageFieldEditor.tsx`
- `src/types/fields/ImageFieldType.tsx`
- `src/features/map-editor/components/ChipsetEditor.tsx`
```

**Step 2: Commit**

```bash
git add docs/tasks.md
git commit -m "docs(tasks): add T242 chipset editor UI task [T242]"
```

---

## Task 6: Final verification

**Step 1: Run full test suite**

```bash
npx jest --no-coverage
# Expected: all tests pass
```

**Step 2: TypeScript check**

```bash
npx tsc --noEmit
# Expected: no new errors
```
