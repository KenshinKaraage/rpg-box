'use client';

import { useState, useMemo } from 'react';
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
import { createFieldTypeInstance } from '@/types/fields';
import { FieldRow } from '@/features/data-editor/components/FieldRow';
import { ImageFieldEditor } from '@/features/data-editor/components/fields/ImageFieldEditor';
import { useStore } from '@/stores';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ImageMetadata } from '@/types/assets';
import { ChipPropertyEditor } from './ChipPropertyEditor';
import type { Chipset } from '@/types/map';
import type { FieldType } from '@/types/fields/FieldType';

const DISPLAY_SIZE = 32;
const PLACEHOLDER_COLS = 8;
const PLACEHOLDER_ROWS = 8;

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
  onReorderChipsetFields: _onReorderChipsetFields,
}: ChipsetEditorProps) {
  const [selectedChipsetId, setSelectedChipsetId] = useState<string | null>(
    chipsets[0]?.id ?? null
  );
  const [selectedChipIndex, setSelectedChipIndex] = useState<number | null>(null);
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());

  const chipset = chipsets.find((c) => c.id === selectedChipsetId) ?? null;
  const assets = useStore((state) => state.assets);

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

  const getPassable = (index: number): boolean | null => {
    if (!chipset) return null;
    const passableField = chipset.fields.find((f) => f.id === 'passable');
    if (!passableField) return null;
    const chip = chipset.chips.find((c) => c.index === index);
    const value = chip?.values['passable'] ?? passableField.getDefaultValue();
    return Boolean(value);
  };

  // chipset の画像メタデータを取得（chipCols 計算と chipStyles で共用）
  const chipImageMeta = useMemo(() => {
    if (!chipset?.imageId) return null;
    const imgAsset = assets.find((a) => a.id === chipset.imageId);
    if (!imgAsset) return null;
    const metadata = imgAsset.metadata as ImageMetadata | null;
    if (!metadata?.width || !metadata?.height) return null;
    return { imgAsset, metadata };
  }, [chipset, assets]);

  const chipCols = chipImageMeta
    ? Math.max(1, Math.floor(chipImageMeta.metadata.width / (chipset?.tileWidth ?? 1)))
    : PLACEHOLDER_COLS;

  const chipStyles = useMemo<(React.CSSProperties | null)[]>(() => {
    if (!chipImageMeta || !chipset) {
      // 画像なし: passable などを先に設定できるようプレースホルダーを表示
      return Array(PLACEHOLDER_COLS * PLACEHOLDER_ROWS).fill(null);
    }
    const { imgAsset, metadata } = chipImageMeta;
    const { tileWidth, tileHeight } = chipset;
    const scale = DISPLAY_SIZE / tileWidth;
    const cols = Math.max(1, Math.floor(metadata.width / tileWidth));
    const rows = Math.max(1, Math.floor(metadata.height / tileHeight));
    return Array.from({ length: cols * rows }, (_, i) => ({
      backgroundImage: `url(${imgAsset.data})`,
      backgroundSize: `${metadata.width * scale}px ${metadata.height * scale}px`,
      backgroundPosition: `-${(i % cols) * DISPLAY_SIZE}px -${Math.floor(i / cols) * DISPLAY_SIZE}px`,
      backgroundRepeat: 'no-repeat',
    }));
  }, [chipImageMeta, chipset]);

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
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {/* 常時表示: 名前・画像・タイルサイズ設定 */}
          <div className="shrink-0 space-y-4 overflow-auto border-b p-3">
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
              {/* チップグリッド */}
              <div className="space-y-2">
                <Label className="text-xs">
                  チップ一覧{chipImageMeta ? `（${chipStyles.length} チップ）` : ''}
                </Label>
                <div
                  className="grid gap-0.5"
                  style={{ gridTemplateColumns: `repeat(${chipCols}, ${DISPLAY_SIZE}px)` }}
                  data-testid="chip-grid"
                >
                  {chipStyles.map((chipStyle, i) => {
                    const passable = getPassable(i);
                    const isSelected = selectedChipIndex === i;
                    return (
                      <button
                        key={i}
                        className={cn(
                          'relative overflow-hidden rounded border',
                          !chipStyle && 'flex items-center justify-center text-xs',
                          isSelected
                            ? 'border-primary bg-primary/20'
                            : 'border-border bg-muted/30 hover:bg-muted'
                        )}
                        style={
                          chipStyle
                            ? {
                                ...chipStyle,
                                width: `${DISPLAY_SIZE}px`,
                                height: `${DISPLAY_SIZE}px`,
                              }
                            : { width: `${DISPLAY_SIZE}px`, height: `${DISPLAY_SIZE}px` }
                        }
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
              {/* フィールドスキーマ */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">フィールド定義</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={handleAddField}
                  >
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
      )}
    </div>
  );
}
