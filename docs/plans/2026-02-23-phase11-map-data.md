# Phase 11 Map Data (T150/T151/T152) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** LayerEditor（レイヤー管理）、ChipsetEditor（チップセット管理＋フィールドスキーマ編集）、ChipPropertyEditor（チップ個別プロパティ編集）を実装し、MapDataPage の右パネルを完成させる。

**Architecture:**

- `MapLayer` に `visible?: boolean` と `chipsetIds: string[]` を追加する（chipId フォーマットは `"chipsetId:chipIndex"`）
- `Chipset.fields` は FieldType スキーマ定義、`ChipProperty.values` はチップ個別の値（スパース保存）
- ChipsetEditor はフィールドスキーマ編集に `FieldRow`（data-editor から import）を再利用する

**Tech Stack:** TypeScript, React, Zustand/Immer, shadcn/ui, Jest + RTL, lucide-react

---

## Task 0: MapLayer 型の更新

**Files:**

- Modify: `src/types/map.ts`
- Modify: `src/types/map.test.ts`（あれば）

### Step 1: `MapLayer` に `visible?` と `chipsetIds` を追加

```typescript
// src/types/map.ts
export interface MapLayer {
  id: string;
  name: string;
  type: 'tile' | 'object';
  visible?: boolean; // エディタでの表示/非表示（省略時 = 表示）
  chipsetIds: string[]; // このレイヤーで使用するチップセットIDの配列
  tiles?: string[][]; // tiles[y][x] = "chipsetId:chipIndex" 形式
  objects?: MapObject[];
}
```

### Step 2: TypeScript エラーがないか確認

```bash
npx tsc --noEmit 2>&1 | grep -E "error|map\.ts" | head -20
```

`chipsetIds` が必須になるため、既存のテスト・コードで `MapLayer` オブジェクトを直接作っている箇所を修正する。

**修正が必要な可能性のある箇所:**

```bash
grep -rn "type: 'tile'\|type: 'object'" src --include="*.ts" --include="*.tsx" | grep -v "node_modules"
```

各 `MapLayer` リテラルに `chipsetIds: []` を追加する。

### Step 3: 型テストが PASS することを確認

```bash
npx jest src/types/map.test.ts --no-coverage 2>&1 | tail -10
```

### Step 4: コミット

```bash
git add src/types/map.ts
git commit -m "feat(map): add visible and chipsetIds to MapLayer type [T150]"
```

---

## Task 1: mapSlice に updateChipProperty アクション追加

**Files:**

- Modify: `src/stores/mapSlice.ts`
- Modify: `src/stores/mapSlice.test.ts`

### Step 1: `MapSlice` インターフェースに追加

```typescript
// src/stores/mapSlice.ts - MapSlice interface に追加
updateChipProperty: (chipsetId: string, chipIndex: number, values: Record<string, unknown>) => void;
```

### Step 2: テストを先に書く

`src/stores/mapSlice.test.ts` の `describe('Chipset operations')` ブロックに追加:

```typescript
describe('updateChipProperty', () => {
  it('既存チップの values を更新する', () => {
    const chipset: Chipset = {
      id: 'cs_001',
      name: 'テスト',
      imageId: '',
      tileWidth: 32,
      tileHeight: 32,
      fields: [],
      chips: [{ index: 0, values: { passable: false } }],
    };
    store.addChipset(chipset);
    store.updateChipProperty('cs_001', 0, { passable: true });
    const updated = store.chipsets.find((c) => c.id === 'cs_001');
    expect(updated?.chips[0]?.values['passable']).toBe(true);
  });

  it('存在しないチップインデックスなら新規追加する', () => {
    const chipset: Chipset = {
      id: 'cs_002',
      name: 'テスト2',
      imageId: '',
      tileWidth: 32,
      tileHeight: 32,
      fields: [],
      chips: [],
    };
    store.addChipset(chipset);
    store.updateChipProperty('cs_002', 5, { passable: true });
    const updated = store.chipsets.find((c) => c.id === 'cs_002');
    expect(updated?.chips).toHaveLength(1);
    expect(updated?.chips[0]?.index).toBe(5);
    expect(updated?.chips[0]?.values['passable']).toBe(true);
  });

  it('存在しないチップセットIDは何もしない', () => {
    store.updateChipProperty('nonexistent', 0, { passable: true });
    // エラーが出ないこと
  });
});
```

### Step 3: テスト実行（FAIL 確認）

```bash
npx jest src/stores/mapSlice.test.ts --no-coverage -t "updateChipProperty" 2>&1 | tail -15
```

Expected: FAIL（アクション未定義）

### Step 4: アクション実装

`createMapSlice` 内の Chipset CRUD セクション末尾に追加:

```typescript
updateChipProperty: (chipsetId: string, chipIndex: number, values: Record<string, unknown>) =>
  set((state) => {
    const cs = state.chipsets.find((c) => c.id === chipsetId);
    if (!cs) return;
    const existing = cs.chips.find((c) => c.index === chipIndex);
    if (existing) {
      Object.assign(existing.values, values);
    } else {
      cs.chips.push({ index: chipIndex, values: { ...values } });
    }
  }),
```

### Step 5: テスト実行（PASS 確認）

```bash
npx jest src/stores/mapSlice.test.ts --no-coverage 2>&1 | tail -10
```

### Step 6: コミット

```bash
git add src/stores/mapSlice.ts src/stores/mapSlice.test.ts
git commit -m "feat(stores): add updateChipProperty action to mapSlice [T151]"
```

---

## Task 2: defaultChipsetFields の作成

**Files:**

- Create: `src/lib/defaultChipsetFields.ts`
- Create: `src/lib/defaultChipsetFields.test.ts`

### Step 1: テストを先に書く

```typescript
// src/lib/defaultChipsetFields.test.ts
import { createDefaultChipsetFields } from './defaultChipsetFields';

describe('createDefaultChipsetFields', () => {
  it('通行設定と足音の2フィールドを返す', () => {
    const fields = createDefaultChipsetFields();
    expect(fields).toHaveLength(2);
  });

  it('1つ目は BooleanFieldType の passable', () => {
    const fields = createDefaultChipsetFields();
    expect(fields[0]!.id).toBe('passable');
    expect(fields[0]!.type).toBe('boolean');
    expect(fields[0]!.name).toBe('通行可能');
  });

  it('2つ目は SelectFieldType の footstep_type', () => {
    const fields = createDefaultChipsetFields();
    expect(fields[1]!.id).toBe('footstep_type');
    expect(fields[1]!.type).toBe('select');
    expect(fields[1]!.name).toBe('足音');
  });

  it('footstep_type は草むら/石畳/木床/砂地 の選択肢を持つ', () => {
    const fields = createDefaultChipsetFields();
    const footstepField = fields[1] as import('@/types/fields').SelectFieldType;
    expect(footstepField.options.map((o) => o.value)).toEqual([
      '',
      'grass',
      'stone',
      'wood',
      'sand',
    ]);
  });

  it('呼び出し毎に新しいインスタンスを返す', () => {
    const a = createDefaultChipsetFields();
    const b = createDefaultChipsetFields();
    expect(a[0]).not.toBe(b[0]);
  });
});
```

### Step 2: テスト実行（FAIL 確認）

```bash
npx jest src/lib/defaultChipsetFields.test.ts --no-coverage 2>&1 | tail -10
```

### Step 3: 実装

```typescript
// src/lib/defaultChipsetFields.ts
import { BooleanFieldType, SelectFieldType } from '@/types/fields';
import type { FieldType } from '@/types/fields/FieldType';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createDefaultChipsetFields(): FieldType<any>[] {
  const passableField = new BooleanFieldType();
  passableField.id = 'passable';
  passableField.name = '通行可能';

  const footstepField = new SelectFieldType();
  footstepField.id = 'footstep_type';
  footstepField.name = '足音';
  footstepField.options = [
    { value: '', label: 'なし' },
    { value: 'grass', label: '草むら' },
    { value: 'stone', label: '石畳' },
    { value: 'wood', label: '木床' },
    { value: 'sand', label: '砂地' },
  ];

  return [passableField, footstepField];
}
```

### Step 4: テスト実行（PASS 確認）

```bash
npx jest src/lib/defaultChipsetFields.test.ts --no-coverage 2>&1 | tail -10
```

### Step 5: コミット

```bash
git add src/lib/defaultChipsetFields.ts src/lib/defaultChipsetFields.test.ts
git commit -m "feat(map): add createDefaultChipsetFields utility [T151]"
```

---

## Task 3: LayerEditor 作成

**Files:**

- Create: `src/features/map-editor/components/LayerEditor.tsx`
- Create: `src/features/map-editor/components/LayerEditor.test.tsx`

### Step 1: テストを先に書く

```typescript
// src/features/map-editor/components/LayerEditor.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { LayerEditor } from './LayerEditor';
import type { MapLayer } from '@/types/map';
import type { Chipset } from '@/types/map';

const mockLayers: MapLayer[] = [
  { id: 'layer_1', name: 'レイヤー1', type: 'tile', chipsetIds: [] },
  { id: 'layer_2', name: 'レイヤー2', type: 'object', chipsetIds: [] },
];

const mockChipsets: Chipset[] = [
  { id: 'cs_001', name: 'フィールド', imageId: '', tileWidth: 32, tileHeight: 32, fields: [], chips: [] },
];

const defaultProps = {
  layers: mockLayers,
  chipsets: mockChipsets,
  onAddLayer: jest.fn(),
  onUpdateLayer: jest.fn(),
  onDeleteLayer: jest.fn(),
  onReorderLayers: jest.fn(),
};

describe('LayerEditor', () => {
  beforeEach(() => jest.clearAllMocks());

  it('レイヤー一覧が表示される', () => {
    render(<LayerEditor {...defaultProps} />);
    expect(screen.getByDisplayValue('レイヤー1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('レイヤー2')).toBeInTheDocument();
  });

  it('追加ボタンで onAddLayer が呼ばれる', () => {
    render(<LayerEditor {...defaultProps} />);
    fireEvent.click(screen.getByTestId('add-layer-button'));
    expect(defaultProps.onAddLayer).toHaveBeenCalledTimes(1);
  });

  it('削除ボタンで onDeleteLayer が呼ばれる', () => {
    render(<LayerEditor {...defaultProps} />);
    fireEvent.click(screen.getByTestId('delete-layer-layer_1'));
    expect(defaultProps.onDeleteLayer).toHaveBeenCalledWith('layer_1');
  });

  it('名前変更で onUpdateLayer が呼ばれる', () => {
    render(<LayerEditor {...defaultProps} />);
    const input = screen.getByTestId('layer-name-layer_1');
    fireEvent.change(input, { target: { value: '新しい名前' } });
    expect(defaultProps.onUpdateLayer).toHaveBeenCalledWith('layer_1', { name: '新しい名前' });
  });

  it('表示/非表示トグルで visible が切り替わる', () => {
    render(<LayerEditor {...defaultProps} />);
    fireEvent.click(screen.getByTestId('toggle-visible-layer_1'));
    expect(defaultProps.onUpdateLayer).toHaveBeenCalledWith('layer_1', { visible: false });
  });

  it('visible=false のレイヤーは EyeOff アイコンになる', () => {
    const hiddenLayers: MapLayer[] = [
      { id: 'layer_1', name: 'レイヤー1', type: 'tile', chipsetIds: [], visible: false },
    ];
    render(<LayerEditor {...defaultProps} layers={hiddenLayers} />);
    expect(screen.getByTestId('toggle-visible-layer_1')).toHaveAttribute('data-visible', 'false');
  });

  it('▼ボタンで下のレイヤーと入れ替わる', () => {
    render(<LayerEditor {...defaultProps} />);
    fireEvent.click(screen.getByTestId('move-down-layer_1'));
    expect(defaultProps.onReorderLayers).toHaveBeenCalledWith(0, 1);
  });

  it('▲ボタンで上のレイヤーと入れ替わる', () => {
    render(<LayerEditor {...defaultProps} />);
    fireEvent.click(screen.getByTestId('move-up-layer_2'));
    expect(defaultProps.onReorderLayers).toHaveBeenCalledWith(1, 0);
  });

  it('先頭レイヤーの▲ボタンは disabled', () => {
    render(<LayerEditor {...defaultProps} />);
    expect(screen.getByTestId('move-up-layer_1')).toBeDisabled();
  });

  it('末尾レイヤーの▼ボタンは disabled', () => {
    render(<LayerEditor {...defaultProps} />);
    expect(screen.getByTestId('move-down-layer_2')).toBeDisabled();
  });
});
```

### Step 2: テスト実行（FAIL 確認）

```bash
npx jest src/features/map-editor/components/LayerEditor.test.tsx --no-coverage 2>&1 | tail -15
```

### Step 3: 実装

```tsx
// src/features/map-editor/components/LayerEditor.tsx
'use client';

import { Plus, Trash2, Eye, EyeOff, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { MapLayer, Chipset } from '@/types/map';

interface LayerEditorProps {
  layers: MapLayer[];
  chipsets: Chipset[];
  onAddLayer: () => void;
  onUpdateLayer: (layerId: string, updates: Partial<MapLayer>) => void;
  onDeleteLayer: (layerId: string) => void;
  onReorderLayers: (fromIndex: number, toIndex: number) => void;
}

export function LayerEditor({
  layers,
  chipsets,
  onAddLayer,
  onUpdateLayer,
  onDeleteLayer,
  onReorderLayers,
}: LayerEditorProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>レイヤー</Label>
        <Button size="sm" variant="outline" onClick={onAddLayer} data-testid="add-layer-button">
          <Plus className="mr-1 h-4 w-4" />
          追加
        </Button>
      </div>

      {layers.length === 0 ? (
        <div className="text-sm text-muted-foreground">レイヤーがありません</div>
      ) : (
        <ul className="space-y-1" data-testid="layer-list">
          {layers.map((layer, index) => {
            const isVisible = layer.visible !== false;
            return (
              <li
                key={layer.id}
                className="flex items-center gap-1 rounded border p-1.5"
                data-testid={`layer-item-${layer.id}`}
              >
                {/* 表示/非表示 */}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 shrink-0"
                  onClick={() => onUpdateLayer(layer.id, { visible: !isVisible })}
                  aria-label={isVisible ? '非表示にする' : '表示する'}
                  data-testid={`toggle-visible-${layer.id}`}
                  data-visible={String(isVisible)}
                >
                  {isVisible ? (
                    <Eye className="h-3.5 w-3.5" />
                  ) : (
                    <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </Button>

                {/* 名前 */}
                <Input
                  value={layer.name}
                  onChange={(e) => onUpdateLayer(layer.id, { name: e.target.value })}
                  className={cn('h-7 flex-1 text-sm', !isVisible && 'opacity-50')}
                  data-testid={`layer-name-${layer.id}`}
                />

                {/* タイプバッジ */}
                <button
                  className="shrink-0"
                  onClick={() =>
                    onUpdateLayer(layer.id, {
                      type: layer.type === 'tile' ? 'object' : 'tile',
                    })
                  }
                  title="クリックでタイプ切り替え"
                  data-testid={`toggle-type-${layer.id}`}
                >
                  <Badge variant="secondary" className="cursor-pointer text-xs">
                    {layer.type}
                  </Badge>
                </button>

                {/* 並び替え */}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 shrink-0"
                  onClick={() => onReorderLayers(index, index - 1)}
                  disabled={index === 0}
                  aria-label="上に移動"
                  data-testid={`move-up-${layer.id}`}
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 shrink-0"
                  onClick={() => onReorderLayers(index, index + 1)}
                  disabled={index === layers.length - 1}
                  aria-label="下に移動"
                  data-testid={`move-down-${layer.id}`}
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>

                {/* 削除 */}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 shrink-0 text-destructive hover:text-destructive"
                  onClick={() => onDeleteLayer(layer.id)}
                  aria-label={`${layer.name}を削除`}
                  data-testid={`delete-layer-${layer.id}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
```

### Step 4: テスト実行（PASS 確認）

```bash
npx jest src/features/map-editor/components/LayerEditor.test.tsx --no-coverage 2>&1 | tail -10
```

### Step 5: コミット

```bash
git add src/features/map-editor/components/LayerEditor.tsx src/features/map-editor/components/LayerEditor.test.tsx
git commit -m "feat(map-editor): implement LayerEditor component [T150]"
```

---

## Task 4: MapSettingsEditor を LayerEditor に置き換え

**Files:**

- Modify: `src/features/map-editor/components/MapSettingsEditor.tsx`
- Modify: `src/features/map-editor/components/MapSettingsEditor.test.tsx`

### Step 1: `MapSettingsEditor` の props を更新

以下を追加:

```typescript
interface MapSettingsEditorProps {
  map: GameMap | null;
  chipsets: Chipset[]; // 追加
  onUpdateMap: (id: string, updates: Partial<GameMap>) => void;
  onUpdateMapValues: (mapId: string, values: Record<string, unknown>) => void;
  onAddLayer: (mapId: string, layer: MapLayer) => void;
  onUpdateLayer: (mapId: string, layerId: string, updates: Partial<MapLayer>) => void;
  onDeleteLayer: (mapId: string, layerId: string) => void;
  onReorderLayers: (mapId: string, fromIndex: number, toIndex: number) => void; // 追加
}
```

### Step 2: 内部のレイヤーリスト JSX を LayerEditor に置き換え

```tsx
import { LayerEditor } from './LayerEditor';

// JSX 内のレイヤーセクション全体を:
<LayerEditor
  layers={map.layers}
  chipsets={chipsets}
  onAddLayer={handleAddLayer}
  onUpdateLayer={(layerId, updates) => onUpdateLayer(map.id, layerId, updates)}
  onDeleteLayer={(layerId) => onDeleteLayer(map.id, layerId)}
  onReorderLayers={(from, to) => onReorderLayers(map.id, from, to)}
/>;
// に置き換える
```

import に `type { Chipset }` を追加する。

### Step 3: MapSettingsEditor テストを更新

`defaultProps` に `chipsets: []` と `onReorderLayers: jest.fn()` を追加。

### Step 4: テスト実行（PASS 確認）

```bash
npx jest src/features/map-editor/components/MapSettingsEditor.test.tsx --no-coverage 2>&1 | tail -10
```

### Step 5: コミット

```bash
git add src/features/map-editor/components/MapSettingsEditor.tsx src/features/map-editor/components/MapSettingsEditor.test.tsx
git commit -m "refactor(map-editor): replace inline layer list with LayerEditor [T150]"
```

---

## Task 5: ChipPropertyEditor 作成

**Files:**

- Create: `src/features/map-editor/components/ChipPropertyEditor.tsx`
- Create: `src/features/map-editor/components/ChipPropertyEditor.test.tsx`

### Step 1: テストを先に書く

```typescript
// src/features/map-editor/components/ChipPropertyEditor.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ChipPropertyEditor } from './ChipPropertyEditor';
import { BooleanFieldType, SelectFieldType } from '@/types/fields';
import type { Chipset } from '@/types/map';

function makeChipset(): Chipset {
  const passableField = new BooleanFieldType();
  passableField.id = 'passable';
  passableField.name = '通行可能';

  const footstepField = new SelectFieldType();
  footstepField.id = 'footstep_type';
  footstepField.name = '足音';
  footstepField.options = [
    { value: '', label: 'なし' },
    { value: 'grass', label: '草むら' },
  ];

  return {
    id: 'cs_001',
    name: 'テスト',
    imageId: '',
    tileWidth: 32,
    tileHeight: 32,
    fields: [passableField, footstepField],
    chips: [],
  };
}

describe('ChipPropertyEditor', () => {
  const onUpdate = jest.fn();

  beforeEach(() => onUpdate.mockClear());

  it('チップ番号が表示される', () => {
    render(
      <ChipPropertyEditor chipset={makeChipset()} chipIndex={5} onUpdateChipProperty={onUpdate} />
    );
    expect(screen.getByText('チップ #5')).toBeInTheDocument();
  });

  it('chipset.fields のエディタが表示される', () => {
    render(
      <ChipPropertyEditor chipset={makeChipset()} chipIndex={0} onUpdateChipProperty={onUpdate} />
    );
    expect(screen.getByText('通行可能')).toBeInTheDocument();
    expect(screen.getByText('足音')).toBeInTheDocument();
  });

  it('chipset が null なら何も表示しない', () => {
    const { container } = render(
      <ChipPropertyEditor chipset={null} chipIndex={null} onUpdateChipProperty={onUpdate} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('chipIndex が null なら何も表示しない', () => {
    const { container } = render(
      <ChipPropertyEditor chipset={makeChipset()} chipIndex={null} onUpdateChipProperty={onUpdate} />
    );
    expect(container).toBeEmptyDOMElement();
  });
});
```

### Step 2: テスト実行（FAIL 確認）

```bash
npx jest src/features/map-editor/components/ChipPropertyEditor.test.tsx --no-coverage 2>&1 | tail -15
```

### Step 3: 実装

```tsx
// src/features/map-editor/components/ChipPropertyEditor.tsx
'use client';

import { Label } from '@/components/ui/label';
import type { Chipset } from '@/types/map';

interface ChipPropertyEditorProps {
  chipset: Chipset | null;
  chipIndex: number | null;
  onUpdateChipProperty: (
    chipsetId: string,
    chipIndex: number,
    values: Record<string, unknown>
  ) => void;
}

export function ChipPropertyEditor({
  chipset,
  chipIndex,
  onUpdateChipProperty,
}: ChipPropertyEditorProps) {
  if (!chipset || chipIndex === null) return null;

  const chip = chipset.chips.find((c) => c.index === chipIndex);
  const values = chip?.values ?? {};

  const handleFieldChange = (fieldId: string, value: unknown) => {
    onUpdateChipProperty(chipset.id, chipIndex, { ...values, [fieldId]: value });
  };

  return (
    <div className="space-y-3" data-testid="chip-property-editor">
      <div className="text-sm font-medium">チップ #{chipIndex}</div>
      {chipset.fields.length === 0 ? (
        <div className="text-xs text-muted-foreground">フィールドがありません</div>
      ) : (
        <div className="space-y-2">
          {chipset.fields.map((field) => {
            const value = values[field.id] ?? field.getDefaultValue();
            return (
              <div key={field.id} className="space-y-1">
                <Label className="text-xs">{field.name}</Label>
                {field.renderEditor({
                  value,
                  onChange: (newValue: unknown) => handleFieldChange(field.id, newValue),
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

### Step 4: テスト実行（PASS 確認）

```bash
npx jest src/features/map-editor/components/ChipPropertyEditor.test.tsx --no-coverage 2>&1 | tail -10
```

### Step 5: コミット

```bash
git add src/features/map-editor/components/ChipPropertyEditor.tsx src/features/map-editor/components/ChipPropertyEditor.test.tsx
git commit -m "feat(map-editor): implement ChipPropertyEditor component [T152]"
```

---

## Task 6: ChipsetEditor 作成

**Files:**

- Create: `src/features/map-editor/components/ChipsetEditor.tsx`
- Create: `src/features/map-editor/components/ChipsetEditor.test.tsx`

ChipsetEditor は以下の4セクションを持つ:

1. **チップセット選択** — 上部ドロップダウン + 追加/削除ボタン
2. **チップセット設定** — 名前・画像・タイルサイズ
3. **フィールドスキーマ** — `FieldRow`（data-editor から import）で通行設定などを管理
4. **チップグリッド** — 8列固定の番号グリッド（passable 値でマーク表示）+ ChipPropertyEditor

### Step 1: テストを先に書く

```typescript
// src/features/map-editor/components/ChipsetEditor.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ChipsetEditor } from './ChipsetEditor';
import { BooleanFieldType } from '@/types/fields';
import type { Chipset } from '@/types/map';

function makeChipset(override?: Partial<Chipset>): Chipset {
  const passableField = new BooleanFieldType();
  passableField.id = 'passable';
  passableField.name = '通行可能';

  return {
    id: 'cs_001',
    name: 'フィールド',
    imageId: '',
    tileWidth: 32,
    tileHeight: 32,
    fields: [passableField],
    chips: [{ index: 0, values: { passable: true } }],
    ...override,
  };
}

const defaultProps = {
  chipsets: [makeChipset()],
  onAddChipset: jest.fn(),
  onUpdateChipset: jest.fn(),
  onDeleteChipset: jest.fn(),
  onUpdateChipProperty: jest.fn(),
  onAddFieldToChipset: jest.fn(),
  onReplaceChipsetField: jest.fn(),
  onDeleteChipsetField: jest.fn(),
  onReorderChipsetFields: jest.fn(),
};

describe('ChipsetEditor', () => {
  beforeEach(() => jest.clearAllMocks());

  it('チップセット名が表示される', () => {
    render(<ChipsetEditor {...defaultProps} />);
    expect(screen.getByDisplayValue('フィールド')).toBeInTheDocument();
  });

  it('チップセット一覧が空なら空状態を表示', () => {
    render(<ChipsetEditor {...defaultProps} chipsets={[]} />);
    expect(screen.getByText('チップセットがありません')).toBeInTheDocument();
  });

  it('追加ボタンで onAddChipset が呼ばれる', () => {
    render(<ChipsetEditor {...defaultProps} />);
    fireEvent.click(screen.getByTestId('add-chipset-button'));
    expect(defaultProps.onAddChipset).toHaveBeenCalledTimes(1);
  });

  it('名前変更で onUpdateChipset が呼ばれる', () => {
    render(<ChipsetEditor {...defaultProps} />);
    const input = screen.getByDisplayValue('フィールド');
    fireEvent.change(input, { target: { value: '新チップセット' } });
    expect(defaultProps.onUpdateChipset).toHaveBeenCalledWith('cs_001', { name: '新チップセット' });
  });

  it('フィールド一覧が表示される', () => {
    render(<ChipsetEditor {...defaultProps} />);
    expect(screen.getByText('通行可能')).toBeInTheDocument();
  });

  it('チップグリッドが表示される', () => {
    render(<ChipsetEditor {...defaultProps} />);
    expect(screen.getByTestId('chip-grid')).toBeInTheDocument();
  });

  it('チップをクリックすると ChipPropertyEditor が表示される', () => {
    render(<ChipsetEditor {...defaultProps} />);
    fireEvent.click(screen.getByTestId('chip-cell-0'));
    expect(screen.getByTestId('chip-property-editor')).toBeInTheDocument();
  });
});
```

### Step 2: テスト実行（FAIL 確認）

```bash
npx jest src/features/map-editor/components/ChipsetEditor.test.tsx --no-coverage 2>&1 | tail -15
```

### Step 3: 実装

```tsx
// src/features/map-editor/components/ChipsetEditor.tsx
'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { getFieldTypeOptions, createFieldTypeInstance } from '@/types/fields';
import { FieldRow } from '@/features/data-editor/components/FieldRow';
import { ChipPropertyEditor } from './ChipPropertyEditor';
import type { Chipset } from '@/types/map';
import type { FieldType } from '@/types/fields/FieldType';

const CHIP_COLUMNS = 8;
const CHIP_DISPLAY_COUNT = 64; // Phase 11: 固定64チップ表示

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFieldType = FieldType<any>;

interface ChipsetEditorProps {
  chipsets: Chipset[];
  onAddChipset: () => void;
  onUpdateChipset: (id: string, updates: Partial<Chipset>) => void;
  onDeleteChipset: (id: string) => void;
  onUpdateChipProperty: (
    chipsetId: string,
    chipIndex: number,
    values: Record<string, unknown>
  ) => void;
  onAddFieldToChipset: (chipsetId: string, field: AnyFieldType) => void;
  onReplaceChipsetField: (chipsetId: string, fieldId: string, newField: AnyFieldType) => void;
  onDeleteChipsetField: (chipsetId: string, fieldId: string) => void;
  onReorderChipsetFields: (chipsetId: string, fromIndex: number, toIndex: number) => void;
}

export function ChipsetEditor({
  chipsets,
  onAddChipset,
  onUpdateChipset,
  onDeleteChipset,
  onUpdateChipProperty,
  onAddFieldToChipset,
  onReplaceChipsetField,
  onDeleteChipsetField,
}: ChipsetEditorProps) {
  const [selectedChipsetId, setSelectedChipsetId] = useState<string | null>(
    chipsets[0]?.id ?? null
  );
  const [selectedChipIndex, setSelectedChipIndex] = useState<number | null>(null);
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());

  const chipset = chipsets.find((c) => c.id === selectedChipsetId) ?? null;

  // チップセットが変わったら chipIndex をリセット
  const handleSelectChipset = (id: string) => {
    setSelectedChipsetId(id);
    setSelectedChipIndex(null);
  };

  const handleAddField = () => {
    if (!chipset) return;
    const newField = createFieldTypeInstance('string')!;
    newField.id = `field_${Date.now()}`;
    newField.name = '新しいフィールド';
    onAddFieldToChipset(chipset.id, newField);
  };

  const handleFieldTypeChange = (fieldId: string, type: string) => {
    if (!chipset) return;
    const existing = chipset.fields.find((f) => f.id === fieldId);
    if (!existing) return;
    const newField = createFieldTypeInstance(type)!;
    newField.name = existing.name;
    onReplaceChipsetField(chipset.id, fieldId, newField);
  };

  const handleFieldConfigChange = (fieldId: string, updates: Record<string, unknown>) => {
    if (!chipset) return;
    const existing = chipset.fields.find((f) => f.id === fieldId);
    if (!existing) return;
    const newField = createFieldTypeInstance(existing.type)!;
    Object.assign(newField, existing, updates);
    onReplaceChipsetField(chipset.id, fieldId, newField);
  };

  // チップの passable 値（グリッドマーク表示用）
  const getPassable = (index: number): boolean | null => {
    if (!chipset) return null;
    const passableField = chipset.fields.find((f) => f.id === 'passable');
    if (!passableField) return null;
    const chip = chipset.chips.find((c) => c.index === index);
    const value = chip?.values['passable'] ?? passableField.getDefaultValue();
    return Boolean(value);
  };

  if (chipsets.length === 0) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b p-3">
          <h2 className="text-sm font-semibold">チップセット</h2>
          <Button
            size="sm"
            variant="outline"
            onClick={onAddChipset}
            data-testid="add-chipset-button"
          >
            <Plus className="mr-1 h-4 w-4" />
            追加
          </Button>
        </div>
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          チップセットがありません
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* ヘッダー: チップセット選択 */}
      <div className="flex items-center gap-1 border-b p-2">
        <Select value={selectedChipsetId ?? ''} onValueChange={handleSelectChipset}>
          <SelectTrigger className="h-8 flex-1 text-xs">
            <SelectValue placeholder="チップセットを選択" />
          </SelectTrigger>
          <SelectContent>
            {chipsets.map((cs) => (
              <SelectItem key={cs.id} value={cs.id}>
                {cs.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          variant="outline"
          className="h-8 px-2"
          onClick={onAddChipset}
          data-testid="add-chipset-button"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
        {chipset && (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2 text-destructive hover:text-destructive"
            onClick={() => onDeleteChipset(chipset.id)}
            aria-label="チップセットを削除"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {chipset && (
        <div className="flex-1 overflow-auto p-3 space-y-4">
          {/* 名前 */}
          <div className="space-y-1">
            <Label className="text-xs">名前</Label>
            <Input
              value={chipset.name}
              onChange={(e) => onUpdateChipset(chipset.id, { name: e.target.value })}
              className="h-8 text-sm"
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

          {/* フィールドスキーマ */}
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

          {/* チップグリッド */}
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
                return (
                  <button
                    key={i}
                    className={cn(
                      'flex h-8 w-full items-center justify-center rounded border text-xs',
                      isSelected
                        ? 'border-primary bg-primary/20'
                        : 'border-border bg-muted/30 hover:bg-muted'
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
                      <span className="text-muted-foreground/50 text-[10px]">{i}</span>
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
        </div>
      )}
    </div>
  );
}
```

### Step 4: テスト実行（PASS 確認）

```bash
npx jest src/features/map-editor/components/ChipsetEditor.test.tsx --no-coverage 2>&1 | tail -10
```

### Step 5: コミット

```bash
git add src/features/map-editor/components/ChipsetEditor.tsx src/features/map-editor/components/ChipsetEditor.test.tsx
git commit -m "feat(map-editor): implement ChipsetEditor component [T151]"
```

---

## Task 7: MapDataPage の更新

**Files:**

- Modify: `src/app/(editor)/map/data/page.tsx`

### Step 1: 必要な store actions を追加で取得

以下を `useStore` から取得:

```typescript
const reorderLayers = useStore((state) => state.reorderLayers);
const chipsets = useStore((state) => state.chipsets);
const addChipset = useStore((state) => state.addChipset);
const updateChipset = useStore((state) => state.updateChipset);
const deleteChipset = useStore((state) => state.deleteChipset);
const updateChipProperty = useStore((state) => state.updateChipProperty);
const addFieldToChipset = useStore((state) => state.addFieldToChipset);
const replaceChipsetField = useStore((state) => state.replaceChipsetField);
const deleteChipsetField = useStore((state) => state.deleteChipsetField);
const reorderChipsetFields = useStore((state) => state.reorderChipsetFields);
```

### Step 2: handleAddChipset を追加

```typescript
import { createDefaultChipsetFields } from '@/lib/defaultChipsetFields';

const handleAddChipset = () => {
  const id = generateId(
    'cs',
    chipsets.map((c) => c.id)
  );
  addChipset({
    id,
    name: '新しいチップセット',
    imageId: '',
    tileWidth: 32,
    tileHeight: 32,
    fields: createDefaultChipsetFields(),
    chips: [],
  });
};
```

### Step 3: MapSettingsEditor に新 props を追加

```tsx
<MapSettingsEditor
  key={selectedMapId ?? 'none'}
  map={selectedMap}
  chipsets={chipsets}              {/* 追加 */}
  onUpdateMap={updateMap}
  onUpdateMapValues={updateMapValues}
  onAddLayer={addLayer}
  onUpdateLayer={updateLayer}
  onDeleteLayer={deleteLayer}
  onReorderLayers={reorderLayers}  {/* 追加 */}
/>
```

### Step 4: 右パネルを ChipsetEditor に置き換え

```tsx
import { ChipsetEditor } from '@/features/map-editor/components/ChipsetEditor';

// right パネル:
right={
  <ChipsetEditor
    chipsets={chipsets}
    onAddChipset={handleAddChipset}
    onUpdateChipset={updateChipset}
    onDeleteChipset={deleteChipset}
    onUpdateChipProperty={updateChipProperty}
    onAddFieldToChipset={addFieldToChipset}
    onReplaceChipsetField={replaceChipsetField}
    onDeleteChipsetField={deleteChipsetField}
    onReorderChipsetFields={reorderChipsetFields}
  />
}
```

### Step 5: ビルド確認

```bash
npx tsc --noEmit 2>&1 | grep error | head -20
```

### Step 6: コミット

```bash
git add 'src/app/(editor)/map/data/page.tsx'
git commit -m "feat(map-editor): wire ChipsetEditor in right panel of MapDataPage [T151][T152]"
```

---

## Task 8: Feature exports + 全テスト + docs コミット

### Step 1: Feature index に新コンポーネントを追加

```typescript
// src/features/map-editor/index.ts
export { MapList } from './components/MapList';
export { MapSettingsEditor } from './components/MapSettingsEditor';
export { LayerEditor } from './components/LayerEditor';
export { ChipsetEditor } from './components/ChipsetEditor';
export { ChipPropertyEditor } from './components/ChipPropertyEditor';
```

### Step 2: 全テスト実行

```bash
npx jest --no-coverage 2>&1 | tail -20
```

Expected: 全テスト PASS

### Step 3: TypeScript 型チェック

```bash
npx tsc --noEmit
```

Expected: エラーなし

### Step 4: docs + tasks.md コミット

```bash
git add src/features/map-editor/index.ts
git add docs/tasks.md docs/plans/2026-02-23-phase11-map-data.md docs/design.md requirements.md
git commit -m "docs(tasks): mark T150/T151/T152 complete and update design docs [T150][T151][T152]"
```

---

## 完了チェックリスト

- [ ] `MapLayer` に `visible?` と `chipsetIds` が追加された
- [ ] `mapSlice` に `updateChipProperty` が追加された
- [ ] `defaultChipsetFields.ts` が作成された（passable + footstep_type）
- [ ] `LayerEditor` が動作する（表示/非表示・タイプ切り替え・並び替え）
- [ ] `MapSettingsEditor` が LayerEditor を使っている
- [ ] `ChipPropertyEditor` が chipset.fields を renderEditor() で描画する
- [ ] `ChipsetEditor` がフィールドスキーマ編集とチップグリッドを持つ
- [ ] MapDataPage の右パネルに ChipsetEditor が表示される
- [ ] 全テスト PASS
- [ ] TypeScript エラーなし
