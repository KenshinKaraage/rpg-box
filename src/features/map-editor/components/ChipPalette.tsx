'use client';
import type { Chipset } from '@/types/map';

interface ChipPaletteProps {
  chipset: Chipset | null;
  imageDataUrl: string | null;
  /** アセットの ImageMetadata から取得した画像サイズ */
  imageSize: { w: number; h: number } | null;
  selectedChipId: string | null;
  onSelectChip: (chipId: string) => void;
}

export function ChipPalette({
  chipset,
  imageDataUrl,
  imageSize,
  selectedChipId,
  onSelectChip,
}: ChipPaletteProps) {
  if (!chipset || !imageDataUrl) {
    return <div className="p-4 text-sm text-muted-foreground">チップセットを選択してください</div>;
  }

  const tilesPerRow = imageSize ? Math.max(1, Math.floor(imageSize.w / chipset.tileWidth)) : 0;
  const totalTiles = imageSize
    ? tilesPerRow * Math.max(1, Math.floor(imageSize.h / chipset.tileHeight))
    : 0;

  // オートタイル: 5バリアントを1チップとして扱い、先頭バリアント（行0）のみ表示
  const chips: Array<{ chipId: string; col: number; row: number }> = chipset.autotile
    ? Array.from({ length: tilesPerRow }, (_, col) => ({
        chipId: `${chipset.id}:${col}`,
        col,
        row: 0,
      }))
    : Array.from({ length: totalTiles }, (_, i) => ({
        chipId: `${chipset.id}:${i}`,
        col: i % tilesPerRow,
        row: Math.floor(i / tilesPerRow),
      }));

  return (
    <div className="overflow-auto p-2">
      <div
        className="grid gap-0"
        style={{ gridTemplateColumns: `repeat(${tilesPerRow}, ${chipset.tileWidth}px)` }}
      >
        {chips.map(({ chipId, col, row }) => {
          const isSelected = selectedChipId === chipId;
          return (
            <button
              key={chipId}
              aria-label={`チップ ${chipId}`}
              onClick={() => {
                console.log('[ChipPalette] chip selected:', chipId);
                onSelectChip(chipId);
              }}
              className={`cursor-pointer border-0 p-0 ${isSelected ? 'ring-2 ring-primary' : ''}`}
              style={{
                width: chipset.tileWidth,
                height: chipset.tileHeight,
                backgroundImage: `url(${imageDataUrl})`,
                backgroundPosition: `-${col * chipset.tileWidth}px -${row * chipset.tileHeight}px`,
                backgroundRepeat: 'no-repeat',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
