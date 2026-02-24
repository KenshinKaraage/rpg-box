# Default Assets & Chipset Image Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** (1) Import default map chip images via explicit button in asset manager. (2) Allow ChipsetEditor to select an image asset. (3) Display actual image tiles in the chip grid with ○/× overlay.

**Architecture:** Config-driven default import (`defaultAssets.ts`) → fetch → Base64 → AssetReference. ChipsetEditor receives `assets` prop and shows `AssetPickerModal`. Chip grid uses CSS `background-image` + `background-position` scaled to 32px cells.

**Tech Stack:** Next.js App Router, React, Zustand, shadcn/ui, Jest + RTL

---

## Task 1: Copy PNG files to public/

**Files:**

- Create: `public/assets/images/map_chip/` (copy 37 PNGs from `assets/images/map_chip/`)

**Step 1: Create public directory and copy files**

```bash
mkdir -p public/assets/images/map_chip
cp assets/images/map_chip/*.png public/assets/images/map_chip/
```

**Step 2: Verify files are accessible**

```bash
ls public/assets/images/map_chip/ | wc -l
# Expected: 37
```

**Step 3: Commit**

```bash
git add public/assets/images/map_chip/
git commit -m "chore(assets): copy default map chip PNGs to public directory [T241]"
```

---

## Task 2: Create `defaultAssets.ts` config

**Files:**

- Create: `src/lib/defaultAssets.ts`

**Step 1: Create the config file**

```typescript
// src/lib/defaultAssets.ts
export interface DefaultAssetEntry {
  path: string;
  name: string;
}

export interface DefaultAssetGroup {
  folderName: string;
  assets: DefaultAssetEntry[];
}

export const DEFAULT_ASSET_GROUPS: DefaultAssetGroup[] = [
  {
    folderName: 'マップチップ',
    assets: [
      { path: '/assets/images/map_chip/at_cave01.png', name: 'at_cave01' },
      { path: '/assets/images/map_chip/at_cave02.png', name: 'at_cave02' },
      { path: '/assets/images/map_chip/at_cave03.png', name: 'at_cave03' },
      { path: '/assets/images/map_chip/at_cave04.png', name: 'at_cave04' },
      { path: '/assets/images/map_chip/at_dang01.png', name: 'at_dang01' },
      { path: '/assets/images/map_chip/at_dang02.png', name: 'at_dang02' },
      { path: '/assets/images/map_chip/at_dang03.png', name: 'at_dang03' },
      { path: '/assets/images/map_chip/m_castle.png', name: 'm_castle' },
      { path: '/assets/images/map_chip/m_cave.png', name: 'm_cave' },
      { path: '/assets/images/map_chip/m_mori.png', name: 'm_mori' },
      { path: '/assets/images/map_chip/m_mura.png', name: 'm_mura' },
      { path: '/assets/images/map_chip/m_snowtown.png', name: 'm_snowtown' },
      { path: '/assets/images/map_chip/m_town.png', name: 'm_town' },
      { path: '/assets/images/map_chip/t_castle01.png', name: 't_castle01' },
      { path: '/assets/images/map_chip/t_castle02.png', name: 't_castle02' },
      { path: '/assets/images/map_chip/t_castle03.png', name: 't_castle03' },
      { path: '/assets/images/map_chip/t_castle04.png', name: 't_castle04' },
      { path: '/assets/images/map_chip/t_cave01.png', name: 't_cave01' },
      { path: '/assets/images/map_chip/t_cave02.png', name: 't_cave02' },
      { path: '/assets/images/map_chip/t_cave03.png', name: 't_cave03' },
      { path: '/assets/images/map_chip/t_cave04.png', name: 't_cave04' },
      { path: '/assets/images/map_chip/t_cave05.png', name: 't_cave05' },
      { path: '/assets/images/map_chip/t_cave06.png', name: 't_cave06' },
      { path: '/assets/images/map_chip/t_dang01.png', name: 't_dang01' },
      { path: '/assets/images/map_chip/t_mori01.png', name: 't_mori01' },
      { path: '/assets/images/map_chip/t_mura01.png', name: 't_mura01' },
      { path: '/assets/images/map_chip/t_room01.png', name: 't_room01' },
      { path: '/assets/images/map_chip/t_room02.png', name: 't_room02' },
      { path: '/assets/images/map_chip/t_room03.png', name: 't_room03' },
      { path: '/assets/images/map_chip/t_snow01.png', name: 't_snow01' },
      { path: '/assets/images/map_chip/t_snow02.png', name: 't_snow02' },
      { path: '/assets/images/map_chip/t_snow03.png', name: 't_snow03' },
      { path: '/assets/images/map_chip/t_snow04.png', name: 't_snow04' },
      { path: '/assets/images/map_chip/t_town01.png', name: 't_town01' },
      { path: '/assets/images/map_chip/t_town02.png', name: 't_town02' },
      { path: '/assets/images/map_chip/t_town03.png', name: 't_town03' },
      { path: '/assets/images/map_chip/t_town04.png', name: 't_town04' },
    ],
  },
];
```

**Step 2: Commit**

```bash
git add src/lib/defaultAssets.ts
git commit -m "feat(assets): add DEFAULT_ASSET_GROUPS config for default map chips [T241]"
```

---

## Task 3: Create `importDefaultAssets.ts` + test

**Files:**

- Create: `src/lib/importDefaultAssets.ts`
- Create: `src/lib/importDefaultAssets.test.ts`

**Step 1: Write failing tests**

```typescript
// src/lib/importDefaultAssets.test.ts
import { importDefaultAssets } from './importDefaultAssets';
import type { AssetReference, AssetFolder } from '@/types/asset';

// globalThis.fetch をモック
const mockFetch = jest.fn();
global.fetch = mockFetch;

function makePngBlob(): Blob {
  return new Blob(['fake-png-data'], { type: 'image/png' });
}

describe('importDefaultAssets', () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(makePngBlob()),
    });
    // FileReader.readAsDataURL をモック
    jest.spyOn(global, 'FileReader').mockImplementation(() => {
      const reader = {
        readAsDataURL: jest.fn().mockImplementation(function (this: FileReader) {
          // @ts-expect-error mock
          this.result = 'data:image/png;base64,ZmFrZQ==';
          // @ts-expect-error mock
          this.onload?.({ target: this });
        }),
      } as unknown as FileReader;
      return reader;
    });
  });
  afterEach(() => jest.restoreAllMocks());

  it('新規アセットをインポートして件数を返す', async () => {
    const addAsset = jest.fn();
    const addFolder = jest.fn();
    const result = await importDefaultAssets([], addAsset, addFolder, []);
    expect(result.imported).toBeGreaterThan(0);
    expect(result.skipped).toBe(0);
    expect(addFolder).toHaveBeenCalledTimes(1);
    expect(addAsset).toHaveBeenCalledTimes(result.imported);
  });

  it('既存アセットはスキップされる', async () => {
    const existingAsset: AssetReference = {
      id: 'asset_1',
      name: 't_mura01',
      type: 'image',
      data: 'data:image/png;base64,xxx',
      metadata: null,
    };
    const addAsset = jest.fn();
    const addFolder = jest.fn();
    const result = await importDefaultAssets([existingAsset], addAsset, addFolder, []);
    expect(result.skipped).toBe(1);
    expect(addAsset).not.toHaveBeenCalledWith(expect.objectContaining({ name: 't_mura01' }));
  });

  it('既存フォルダがある場合は再作成しない', async () => {
    const existingFolder: AssetFolder = {
      id: 'folder_1',
      name: 'マップチップ',
    };
    const addAsset = jest.fn();
    const addFolder = jest.fn();
    await importDefaultAssets([], addAsset, addFolder, [existingFolder]);
    expect(addFolder).not.toHaveBeenCalled();
  });

  it('fetchが失敗したアセットはスキップされる', async () => {
    mockFetch.mockResolvedValue({ ok: false });
    const addAsset = jest.fn();
    const addFolder = jest.fn();
    const result = await importDefaultAssets([], addAsset, addFolder, []);
    expect(result.imported).toBe(0);
    expect(addAsset).not.toHaveBeenCalled();
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
npx jest src/lib/importDefaultAssets.test.ts --no-coverage
# Expected: FAIL (importDefaultAssets not found)
```

**Step 3: Implement `importDefaultAssets.ts`**

```typescript
// src/lib/importDefaultAssets.ts
import { DEFAULT_ASSET_GROUPS } from './defaultAssets';
import { generateId } from './utils';
import type { AssetReference, AssetFolder } from '@/types/asset';

export async function importDefaultAssets(
  existingAssets: AssetReference[],
  addAsset: (asset: AssetReference) => void,
  addFolder: (folder: AssetFolder) => void,
  existingFolders: AssetFolder[]
): Promise<{ imported: number; skipped: number }> {
  let imported = 0;
  let skipped = 0;

  const allAssetIds = existingAssets.map((a) => a.id);
  const allFolderIds = existingFolders.map((f) => f.id);

  for (const group of DEFAULT_ASSET_GROUPS) {
    // フォルダを作成（既存チェック）
    let folder = existingFolders.find((f) => f.name === group.folderName);
    if (!folder) {
      const folderId = generateId('folder', allFolderIds);
      allFolderIds.push(folderId);
      folder = { id: folderId, name: group.folderName };
      addFolder(folder);
    }

    for (const entry of group.assets) {
      // 重複チェック（name で判定）
      if (existingAssets.some((a) => a.name === entry.name)) {
        skipped++;
        continue;
      }

      // fetch → blob → Base64
      let data: string;
      try {
        const response = await fetch(entry.path);
        if (!response.ok) {
          skipped++;
          continue;
        }
        const blob = await response.blob();
        data = await blobToBase64(blob);
      } catch {
        skipped++;
        continue;
      }

      const assetId = generateId('asset', allAssetIds);
      allAssetIds.push(assetId);
      addAsset({
        id: assetId,
        name: entry.name,
        type: 'image',
        folderId: folder.id,
        data,
        metadata: null,
      });
      imported++;
    }
  }

  return { imported, skipped };
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Failed to read blob'));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
```

**Step 4: Run tests to verify they pass**

```bash
npx jest src/lib/importDefaultAssets.test.ts --no-coverage
# Expected: PASS (all 4 tests)
```

**Step 5: Commit**

```bash
git add src/lib/defaultAssets.ts src/lib/importDefaultAssets.ts src/lib/importDefaultAssets.test.ts
git commit -m "feat(assets): implement importDefaultAssets with DEFAULT_ASSET_GROUPS config [T241]"
```

---

## Task 4: Add "デフォルトをインポート" button to AssetsPage

**Files:**

- Modify: `src/app/(editor)/settings/assets/page.tsx`

**Step 1: Add import loading state and handler**

In `AssetsPage`, add after the existing `useState` declarations:

```typescript
const [isImporting, setIsImporting] = useState(false);
```

Add import at top of file:

```typescript
import { importDefaultAssets } from '@/lib/importDefaultAssets';
```

Add handler function before `return`:

```typescript
const handleImportDefaults = async () => {
  setIsImporting(true);
  try {
    const result = await importDefaultAssets(assets, addAsset, addFolder, assetFolders);
    console.info(`インポート完了: ${result.imported}件インポート（${result.skipped}件スキップ）`);
    // TODO: toast通知（実装後に追加）
  } finally {
    setIsImporting(false);
  }
};
```

**Step 2: Add button to the AssetGrid area header**

In `AssetsPage` return JSX, the center panel currently is:

```tsx
{/* 中央: グリッド */}
<div className="flex-1 border-r">
  <AssetGrid ... />
</div>
```

Change it to add a header bar above the grid:

```tsx
{/* 中央: グリッド */}
<div className="flex flex-col flex-1 border-r overflow-hidden">
  <div className="flex items-center justify-end gap-2 border-b px-3 py-2 shrink-0">
    <Button
      size="sm"
      variant="outline"
      onClick={handleImportDefaults}
      disabled={isImporting}
      data-testid="import-defaults-button"
    >
      {isImporting ? 'インポート中...' : 'デフォルトをインポート'}
    </Button>
  </div>
  <div className="flex-1 overflow-hidden">
    <AssetGrid ... />
  </div>
</div>
```

Add `Button` import if not present:

```typescript
import { Button } from '@/components/ui/button';
```

**Step 3: Verify the page compiles**

```bash
npx tsc --noEmit
# Expected: no errors
```

**Step 4: Commit**

```bash
git add src/app/(editor)/settings/assets/page.tsx
git commit -m "feat(assets): add default import button to AssetsPage [T241]"
```

---

## Task 5: Add image selection to ChipsetEditor

**Files:**

- Modify: `src/features/map-editor/components/ChipsetEditor.tsx`
- Modify: `src/features/map-editor/components/ChipsetEditor.test.tsx`
- Modify: `src/app/(editor)/map/data/page.tsx`

**Step 1: Add failing test for image section**

In `ChipsetEditor.test.tsx`, add to `defaultProps`:

```typescript
assets: [],
assetFolders: [],
```

Add new test:

```typescript
it('画像セクションが表示される', () => {
  render(<ChipsetEditor {...defaultProps} />);
  expect(screen.getByText('画像')).toBeInTheDocument();
});

it('imageId未設定時は「画像を選択」ボタンが表示される', () => {
  render(<ChipsetEditor {...defaultProps} />);
  expect(screen.getByRole('button', { name: '画像を選択' })).toBeInTheDocument();
});
```

**Step 2: Run to verify they fail**

```bash
npx jest src/features/map-editor/components/ChipsetEditor.test.tsx --no-coverage
# Expected: FAIL (no 画像 label, no 画像を選択 button)
```

**Step 3: Update ChipsetEditor props and add image section**

Add to `ChipsetEditorProps` interface:

```typescript
assets: import('@/types/asset').AssetReference[];
assetFolders: import('@/types/asset').AssetFolder[];
```

Add to destructured props in the function signature:

```typescript
assets,
assetFolders,
```

Add `useState` for picker open state (at top of component):

```typescript
const [imagePickerOpen, setImagePickerOpen] = useState(false);
```

Add import at top:

```typescript
import { AssetPickerModal } from '@/features/asset-manager/components/AssetPickerModal';
```

In the chipset settings section (after the 名前 section, before タイルサイズ), add:

```tsx
{
  /* 画像 */
}
<div className="space-y-1">
  <Label className="text-xs">画像</Label>
  {chipset.imageId ? (
    (() => {
      const asset = assets.find((a) => a.id === chipset.imageId);
      return (
        <div className="flex items-center gap-2">
          {asset && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={asset.data}
              alt={asset.name}
              className="h-10 w-10 rounded border object-contain"
            />
          )}
          <span className="truncate text-xs">{asset?.name ?? chipset.imageId}</span>
          <Button
            size="sm"
            variant="outline"
            className="h-7 shrink-0 text-xs"
            onClick={() => setImagePickerOpen(true)}
          >
            変更
          </Button>
        </div>
      );
    })()
  ) : (
    <Button
      size="sm"
      variant="outline"
      className="h-7 text-xs"
      onClick={() => setImagePickerOpen(true)}
    >
      画像を選択
    </Button>
  )}
</div>;

{
  /* 画像選択モーダル */
}
<AssetPickerModal
  open={imagePickerOpen}
  onOpenChange={setImagePickerOpen}
  assets={assets}
  folders={assetFolders}
  assetType="image"
  selectedAssetId={chipset.imageId || null}
  onSelect={(id) => {
    onUpdateChipset(chipset.id, { imageId: id ?? '' });
    setImagePickerOpen(false);
  }}
/>;
```

**Step 4: Update test `defaultProps` to include assets/assetFolders**

In the test file, update `defaultProps`:

```typescript
const defaultProps = {
  chipsets: [makeChipset()],
  assets: [],
  assetFolders: [],
  onAddChipset: jest.fn(),
  // ...rest unchanged
};
```

**Step 5: Run tests to verify they pass**

```bash
npx jest src/features/map-editor/components/ChipsetEditor.test.tsx --no-coverage
# Expected: PASS (all tests including new ones)
```

**Step 6: Pass `assets` and `assetFolders` from `page.tsx`**

In `src/app/(editor)/map/data/page.tsx`, add to the store selectors:

```typescript
const assets = useStore((state) => state.assets);
const assetFolders = useStore((state) => state.assetFolders);
```

Pass to `ChipsetEditor`:

```tsx
<ChipsetEditor
  chipsets={chipsets}
  assets={assets}
  assetFolders={assetFolders}
  onAddChipset={handleAddChipset}
  // ...rest unchanged
/>
```

**Step 7: Verify types compile**

```bash
npx tsc --noEmit
# Expected: no errors
```

**Step 8: Commit**

```bash
git add src/features/map-editor/components/ChipsetEditor.tsx \
        src/features/map-editor/components/ChipsetEditor.test.tsx \
        src/app/(editor)/map/data/page.tsx
git commit -m "feat(map-editor): add image asset selection to ChipsetEditor [T241]"
```

---

## Task 6: Display image tiles in chip grid with ○/× overlay

**Files:**

- Modify: `src/features/map-editor/components/ChipsetEditor.tsx`

**Step 1: Add image dimension state**

In `ChipsetEditor`, add state for image natural dimensions:

```typescript
const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
```

Add a hidden `<img>` element to get natural dimensions when imageId is set. Place just inside the outer `<div>` (not inside the chipset conditional block — needs to be always rendered when chipset changes):

Actually, add inside the `{chipset && ...}` block, as a hidden img tag for measurement:

```tsx
{
  chipset.imageId &&
    (() => {
      const imgAsset = assets.find((a) => a.id === chipset.imageId);
      return imgAsset ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={chipset.imageId}
          src={imgAsset.data}
          alt=""
          className="hidden"
          onLoad={(e) => {
            const img = e.currentTarget;
            setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
          }}
        />
      ) : null;
    })();
}
```

**Step 2: Update `getPassable` and add `getChipStyle` helper**

Add a new helper function inside the component (after `getPassable`):

```typescript
const getChipStyle = (index: number): React.CSSProperties | null => {
  if (!chipset?.imageId || !imageSize) return null;
  const imgAsset = assets.find((a) => a.id === chipset.imageId);
  if (!imgAsset) return null;

  const { tileWidth, tileHeight } = chipset;
  const scale = 32 / tileWidth;
  const cols = Math.floor(imageSize.width / tileWidth);
  const col = index % cols;
  const row = Math.floor(index / cols);

  return {
    backgroundImage: `url(${imgAsset.data})`,
    backgroundSize: `${imageSize.width * scale}px ${imageSize.height * scale}px`,
    backgroundPosition: `-${col * 32}px -${row * 32}px`,
    backgroundRepeat: 'no-repeat',
  };
};
```

**Step 3: Update chip grid cells to use image style**

Replace the chip grid button rendering to use `getChipStyle`:

Current button class:

```tsx
<button
  key={i}
  className={cn(
    'flex h-8 w-full items-center justify-center rounded border text-xs',
    isSelected ? 'border-primary bg-primary/20' : 'border-border bg-muted/30 hover:bg-muted'
  )}
  onClick={() => setSelectedChipIndex(i)}
  data-testid={`chip-cell-${i}`}
  title={`チップ #${i}`}
>
  {passable === true ? (
    <span className="text-green-600">○</span>
  ) : passable === false ? (
    <span className="text-red-500">×</span>
  ) : (
    <span className="text-[10px] text-muted-foreground/50">{i}</span>
  )}
</button>
```

Replace with:

```tsx
{
  Array.from({ length: CHIP_DISPLAY_COUNT }, (_, i) => {
    const passable = getPassable(i);
    const isSelected = selectedChipIndex === i;
    const chipStyle = getChipStyle(i);
    return (
      <button
        key={i}
        className={cn(
          'relative h-8 w-full overflow-hidden rounded border',
          !chipStyle && 'flex items-center justify-center text-xs',
          isSelected ? 'border-primary bg-primary/20' : 'border-border bg-muted/30 hover:bg-muted'
        )}
        style={chipStyle ?? undefined}
        onClick={() => setSelectedChipIndex(i)}
        data-testid={`chip-cell-${i}`}
        title={`チップ #${i}`}
      >
        {chipStyle ? (
          // 画像あり: 通行インジケータのみ重ねる
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
        ) : // 画像なし: 従来表示
        passable === true ? (
          <span className="text-green-600">○</span>
        ) : passable === false ? (
          <span className="text-red-500">×</span>
        ) : (
          <span className="text-[10px] text-muted-foreground/50">{i}</span>
        )}
      </button>
    );
  });
}
```

**Step 4: Verify types compile**

```bash
npx tsc --noEmit
# Expected: no errors
```

**Step 5: Run all map-editor tests**

```bash
npx jest src/features/map-editor/ --no-coverage
# Expected: all pass
```

**Step 6: Commit**

```bash
git add src/features/map-editor/components/ChipsetEditor.tsx
git commit -m "feat(map-editor): display image tiles in chip grid with passable overlay [T241]"
```

---

## Task 7: Update tasks.md

**Files:**

- Modify: `docs/tasks.md`

**Step 1: Mark T241 tasks as done in tasks.md**

Find the T241 section in `docs/tasks.md` and mark all subtasks as completed.

**Step 2: Commit**

```bash
git add docs/tasks.md
git commit -m "docs(tasks): mark T241 default assets and chip image tasks complete [T241]"
```

---

## Task 8: Final verification

**Step 1: Run full test suite**

```bash
npx jest --no-coverage
# Expected: all tests pass
```

**Step 2: TypeScript check**

```bash
npx tsc --noEmit
# Expected: no errors
```

**Step 3: Done**

All tasks complete. Use superpowers:finishing-a-development-branch to handle merge/PR options.
