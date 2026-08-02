'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createFieldTypeInstance } from '@/types/fields';
import { FieldRow } from '@/features/data-editor/components/FieldRow';
import { ImageFieldEditor } from '@/features/data-editor/components/fields/ImageFieldEditor';
import { useStore } from '@/stores';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Modal } from '@/components/common/Modal';
import { dataUrlToBlob } from '@/hooks/useBlobUrl';
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
  onAddChipset: () => string;
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
  const [isChipEditModalOpen, setIsChipEditModalOpen] = useState(false);

  const chipset = chipsets.find((c) => c.id === selectedChipsetId) ?? null;
  const assets = useStore((state) => state.assets);

  const handleSelectChipset = (id: string) => {
    setSelectedChipsetId(id);
    setSelectedChipIndex(null);
    setIsChipEditModalOpen(false);
  };

  const handleAddChipset = () => {
    const newId = onAddChipset();
    setSelectedChipsetId(newId);
    setSelectedChipIndex(null);
    setIsChipEditModalOpen(false);
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

  // chipset の画像メタデータを取得
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

  const chipCount = chipImageMeta
    ? chipCols * Math.max(1, Math.floor(chipImageMeta.metadata.height / (chipset?.tileHeight ?? 1)))
    : PLACEHOLDER_COLS * PLACEHOLDER_ROWS;

  // passable 状態を配列に事前計算（チップ数分）
  const passableMap = useMemo<ReadonlyArray<boolean | null>>(() => {
    if (!chipset) return [];
    const passableField = chipset.fields.find((f) => f.id === 'passable');
    if (!passableField) return Array(chipCount).fill(null);
    return Array.from({ length: chipCount }, (_, i) => {
      const chip = chipset.chips.find((c) => c.index === i);
      const value = chip?.values['passable'] ?? passableField.getDefaultValue();
      return Boolean(value);
    });
  }, [chipset, chipCount]);

  // グリッド上での右クリック: 選択せずにそのチップの通行可否だけをトグルする
  const handleTogglePassable = useCallback(
    (chipIndex: number) => {
      if (!chipset) return;
      const passableField = chipset.fields.find((f) => f.id === 'passable');
      if (!passableField) return;
      const chip = chipset.chips.find((c) => c.index === chipIndex);
      const currentValue = chip?.values['passable'] ?? passableField.getDefaultValue();
      onUpdateChipProperty(chipset.id, chipIndex, {
        ...(chip?.values ?? {}),
        passable: !currentValue,
      });
    },
    [chipset, onUpdateChipProperty]
  );

  if (chipsets.length === 0) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b p-3">
          <h2 className="text-sm font-semibold">チップセット</h2>
          <Button
            size="sm"
            variant="outline"
            onClick={handleAddChipset}
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
          onClick={handleAddChipset}
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
        <div className="min-h-0 flex-1 overflow-auto">
          {/* 名前・画像・タイルサイズ設定 */}
          <div className="space-y-4 border-b p-3">
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
                onChange={(id) => {
                  onUpdateChipset(chipset.id, { imageId: id ?? '' });
                  // 画像変更時: 全チップのデフォルト値を初期化
                  if (id) {
                    const imgAsset = assets.find((a) => a.id === id);
                    const meta = imgAsset?.metadata as ImageMetadata | null;
                    if (meta?.width && meta?.height) {
                      const cols = Math.max(1, Math.floor(meta.width / chipset.tileWidth));
                      const rows = Math.max(1, Math.floor(meta.height / chipset.tileHeight));
                      const total = cols * rows;
                      // デフォルト値で全チップを初期化（既存のチップは保持）
                      const existingMap = new Map(chipset.chips.map((c) => [c.index, c]));
                      const defaultValues: Record<string, unknown> = {};
                      for (const field of chipset.fields) {
                        defaultValues[field.id] = field.getDefaultValue();
                      }
                      const newChips = Array.from({ length: total }, (_, i) => {
                        const existing = existingMap.get(i);
                        return existing ?? { index: i, values: { ...defaultValues } };
                      });
                      onUpdateChipset(chipset.id, { chips: newChips });
                    }
                  }
                }}
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

            {/* 隣接変形・アニメーション */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`autotile-${chipset.id}`}
                  checked={chipset.autotile ?? false}
                  onCheckedChange={(checked) =>
                    onUpdateChipset(chipset.id, { autotile: checked === true })
                  }
                />
                <Label htmlFor={`autotile-${chipset.id}`} className="text-xs">
                  隣接変形（オートタイル）
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`animated-${chipset.id}`}
                  checked={chipset.animated ?? false}
                  onCheckedChange={(checked) =>
                    onUpdateChipset(chipset.id, { animated: checked === true })
                  }
                />
                <Label htmlFor={`animated-${chipset.id}`} className="text-xs">
                  アニメーション
                </Label>
              </div>
              {chipset.animated && (
                <div className="ml-6 flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">フレーム数</Label>
                  <Input
                    type="number"
                    value={chipset.animFrameCount ?? 3}
                    min={2}
                    onChange={(e) =>
                      onUpdateChipset(chipset.id, {
                        animFrameCount: parseInt(e.target.value, 10) || 3,
                      })
                    }
                    className="h-7 w-16 text-xs"
                  />
                  <Label className="text-xs text-muted-foreground">間隔</Label>
                  <Input
                    type="number"
                    value={chipset.animIntervalMs ?? 200}
                    min={1}
                    onChange={(e) =>
                      onUpdateChipset(chipset.id, {
                        animIntervalMs: parseInt(e.target.value, 10) || 200,
                      })
                    }
                    className="h-7 w-20 text-xs"
                  />
                  <span className="text-xs text-muted-foreground">ms</span>
                </div>
              )}
            </div>
          </div>

          {/* タブ: チップ一覧 / フィールド定義 */}
          <Tabs defaultValue="chips">
            <TabsList className="mx-3 mt-2 grid w-auto grid-cols-2">
              <TabsTrigger value="chips" className="text-xs">
                チップ一覧
              </TabsTrigger>
              <TabsTrigger value="fields" className="text-xs">
                フィールド定義
              </TabsTrigger>
            </TabsList>

            {/* チップ一覧タブ: グリッド・プロパティ編集ともにモーダルで行う（右カラムが狭いため） */}
            <TabsContent value="chips" className="p-3">
              <div className="space-y-2">
                <Label className="text-xs">
                  チップ一覧{chipImageMeta ? `（${chipCount} チップ）` : ''}
                </Label>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 w-full text-xs"
                  onClick={() => setIsChipEditModalOpen(true)}
                >
                  <Pencil className="mr-1 h-3 w-3" />
                  チップ一覧を編集
                </Button>
              </div>
            </TabsContent>

            {/* フィールド定義タブ */}
            <TabsContent value="fields" className="p-3">
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

      {/* チップ一覧編集モーダル: 左にグリッド、右にプロパティ。狭い右カラムから切り離して余裕を持たせる */}
      <Modal
        open={isChipEditModalOpen && chipset !== null}
        onOpenChange={setIsChipEditModalOpen}
        title="編集"
        size="xl"
      >
        {chipset && (
          <div className="flex max-h-[70vh] gap-4">
            <div className="min-w-0 flex-1 overflow-auto">
              <p className="mb-2 text-xs text-muted-foreground">
                クリックでチップを選択、選択中のチップをクリックすると通行可否を切り替え
              </p>
              <ChipGridCanvas
                imageDataUrl={chipImageMeta ? (chipImageMeta.imgAsset.data as string) : null}
                imageSize={
                  chipImageMeta
                    ? { w: chipImageMeta.metadata.width, h: chipImageMeta.metadata.height }
                    : null
                }
                tileWidth={chipset.tileWidth}
                tileHeight={chipset.tileHeight}
                chipCount={chipCount}
                chipCols={chipCols}
                selectedChipIndex={selectedChipIndex}
                passableMap={passableMap}
                onSelect={setSelectedChipIndex}
                onTogglePassable={handleTogglePassable}
              />
            </div>
            <div className="w-56 shrink-0 overflow-auto border-l pl-4">
              {selectedChipIndex !== null ? (
                <ChipPropertyEditor
                  chipset={chipset}
                  chipIndex={selectedChipIndex}
                  onUpdateChipProperty={onUpdateChipProperty}
                />
              ) : (
                <p className="text-xs text-muted-foreground">チップを選択してください</p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ChipGridCanvas: チップグリッドを canvas 1 枚で描画するサブコンポーネント
// ---------------------------------------------------------------------------

interface ChipGridCanvasProps {
  imageDataUrl: string | null;
  imageSize: { w: number; h: number } | null;
  tileWidth: number;
  tileHeight: number;
  chipCount: number;
  chipCols: number;
  selectedChipIndex: number | null;
  passableMap: ReadonlyArray<boolean | null>;
  onSelect: (index: number) => void;
  onTogglePassable: (index: number) => void;
}

function ChipGridCanvas({
  imageDataUrl,
  imageSize,
  tileWidth,
  tileHeight,
  chipCount,
  chipCols,
  selectedChipIndex,
  passableMap,
  onSelect,
  onTogglePassable,
}: ChipGridCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const blobUrlRef = useRef<{ dataUrl: string; blobUrl: string } | null>(null);

  const chipRows = Math.ceil(chipCount / chipCols);
  const canvasW = chipCols * DISPLAY_SIZE;
  const canvasH = chipRows * DISPLAY_SIZE;

  const drawGrid = useCallback(
    (canvas: HTMLCanvasElement, img: HTMLImageElement | null) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = false;

      // 全チップを一度に描画してサブピクセルの切れ目をなくす
      if (img && imageSize) {
        const chipRows = Math.ceil(chipCount / chipCols);
        ctx.drawImage(
          img,
          0,
          0,
          chipCols * tileWidth,
          chipRows * tileHeight,
          0,
          0,
          canvas.width,
          canvas.height
        );
      }

      for (let i = 0; i < chipCount; i++) {
        const col = i % chipCols;
        const row = Math.floor(i / chipCols);
        const x = col * DISPLAY_SIZE;
        const y = row * DISPLAY_SIZE;

        if (!img || !imageSize) {
          // プレースホルダー: 薄い背景 + インデックス番号
          ctx.fillStyle = 'rgba(100,100,100,0.15)';
          ctx.fillRect(x + 0.5, y + 0.5, DISPLAY_SIZE - 1, DISPLAY_SIZE - 1);
          ctx.strokeStyle = 'rgba(100,100,100,0.3)';
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 0.5, y + 0.5, DISPLAY_SIZE - 1, DISPLAY_SIZE - 1);
          ctx.fillStyle = 'rgba(150,150,150,0.6)';
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(i), x + DISPLAY_SIZE / 2, y + DISPLAY_SIZE / 2);
        }

        // 通行可能インジケーター（○/×）
        const passable = passableMap[i] ?? null;
        if (passable !== null) {
          ctx.font = 'bold 14px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.shadowColor = 'white';
          ctx.shadowBlur = 3;
          ctx.fillStyle = passable ? '#16a34a' : '#ef4444'; // green-600 / red-500
          ctx.fillText(passable ? '○' : '×', x + DISPLAY_SIZE / 2, y + DISPLAY_SIZE / 2);
          ctx.shadowBlur = 0;
        }

        // 選択ハイライト
        if (i === selectedChipIndex) {
          ctx.strokeStyle = '#f97316'; // orange-500
          ctx.lineWidth = 2;
          ctx.strokeRect(x + 1, y + 1, DISPLAY_SIZE - 2, DISPLAY_SIZE - 2);
        }
      }
    },
    [chipCount, chipCols, tileWidth, tileHeight, imageSize, passableMap, selectedChipIndex]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!imageDataUrl) {
      // 画像なし: Blob URL を解放してプレースホルダー描画
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current.blobUrl);
        blobUrlRef.current = null;
      }
      imgRef.current = null;
      drawGrid(canvas, null);
      return;
    }

    // 同じ data URL かつ画像ロード済み: 再描画のみ（選択/passable 変化に対応）
    if (blobUrlRef.current?.dataUrl === imageDataUrl && imgRef.current) {
      drawGrid(canvas, imgRef.current);
      return;
    }

    // 新しい data URL: Blob URL を作成して画像をロード
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current.blobUrl);
    const blobUrl = URL.createObjectURL(dataUrlToBlob(imageDataUrl));
    blobUrlRef.current = { dataUrl: imageDataUrl, blobUrl };
    imgRef.current = null;

    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      if (canvasRef.current) drawGrid(canvasRef.current, img);
    };
    img.src = blobUrl;
    return () => {
      img.onload = null;
    };
  }, [imageDataUrl, drawGrid]);

  // アンマウント時に Blob URL を解放
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current.blobUrl);
    };
  }, []);

  /** クライアント座標からチップインデックスを求める（範囲外は null） */
  const chipIndexFromEvent = (e: React.MouseEvent<HTMLCanvasElement>): number | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const col = Math.floor(x / DISPLAY_SIZE);
    const row = Math.floor(y / DISPLAY_SIZE);
    const chipIndex = row * chipCols + col;

    return chipIndex >= 0 && chipIndex < chipCount ? chipIndex : null;
  };

  // クリック: 未選択のチップなら選択、既に選択中のチップなら通行可否をその場でトグル
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const chipIndex = chipIndexFromEvent(e);
    if (chipIndex === null) return;
    if (chipIndex === selectedChipIndex) {
      onTogglePassable(chipIndex);
    } else {
      onSelect(chipIndex);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={canvasW}
      height={canvasH}
      onClick={handleClick}
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
      style={{ cursor: 'pointer', display: 'block', width: `${canvasW}px`, height: `${canvasH}px` }}
      aria-label="チップグリッド"
      data-testid="chip-grid"
    />
  );
}
