'use client';
import type { Chipset } from '@/types/map';

interface ChipPaletteProps {
  chipset: Chipset | null;
  imageDataUrl: string | null;
  selectedChipId: string | null;
  onSelectChip: (chipId: string) => void;
}

export function ChipPalette({
  chipset,
  imageDataUrl,
  selectedChipId,
  onSelectChip,
}: ChipPaletteProps) {
  if (!chipset || !imageDataUrl) {
    return <div className="p-4 text-sm text-muted-foreground">チップセットを選択してください</div>;
  }

  const tilesPerRow = Math.floor(128 / chipset.tileWidth) || 4;
  const totalTiles = 64; // TODO: 画像サイズから動的計算

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
