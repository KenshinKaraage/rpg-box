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

  return (
    <div className="overflow-auto p-2">
      <div
        className="grid gap-0"
        style={{ gridTemplateColumns: `repeat(${tilesPerRow}, ${chipset.tileWidth}px)` }}
      >
        {Array.from({ length: totalTiles }, (_, i) => {
          const chipId = `${chipset.id}:${i}`;
          const col = i % tilesPerRow;
          const row = Math.floor(i / tilesPerRow);
          const isSelected = selectedChipId === chipId;
          return (
            <button
              key={i}
              aria-label={`チップ ${i}`}
              onClick={() => onSelectChip(chipId)}
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
