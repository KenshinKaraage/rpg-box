'use client';
import { useRef, useEffect } from 'react';
import type { Chipset } from '@/types/map';

interface ChipPaletteProps {
  chipset: Chipset | null;
  imageDataUrl: string | null;
  /** アセットの ImageMetadata から取得した画像サイズ */
  imageSize: { w: number; h: number } | null;
  selectedChipId: string | null;
  onSelectChip: (chipId: string) => void;
}

/** チップパレットを canvas に描画する（純粋関数）。jsdom では ctx が null なので何もしない。 */
function drawPalette(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  chipset: Chipset,
  imageSize: { w: number; h: number },
  tilesPerRow: number,
  selectedChipId: string | null
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (chipset.autotile) {
    // バリアント0行目（"無"）のみ表示
    ctx.drawImage(img, 0, 0, imageSize.w, chipset.tileHeight, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.drawImage(img, 0, 0);
  }

  // 選択ハイライト
  if (selectedChipId) {
    const colonIdx = selectedChipId.indexOf(':');
    if (colonIdx !== -1 && selectedChipId.slice(0, colonIdx) === chipset.id) {
      const chipIndex = parseInt(selectedChipId.slice(colonIdx + 1), 10);
      if (!isNaN(chipIndex)) {
        const col = chipset.autotile ? chipIndex : chipIndex % tilesPerRow;
        const row = chipset.autotile ? 0 : Math.floor(chipIndex / tilesPerRow);
        ctx.strokeStyle = '#f97316'; // orange-500
        ctx.lineWidth = 2;
        ctx.strokeRect(
          col * chipset.tileWidth + 1,
          row * chipset.tileHeight + 1,
          chipset.tileWidth - 2,
          chipset.tileHeight - 2
        );
      }
    }
  }
}

export function ChipPalette({
  chipset,
  imageDataUrl,
  imageSize,
  selectedChipId,
  onSelectChip,
}: ChipPaletteProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const currentDataUrlRef = useRef<string | null>(null);

  const tilesPerRow =
    chipset && imageSize ? Math.max(1, Math.floor(imageSize.w / chipset.tileWidth)) : 0;
  const totalTiles =
    chipset && imageSize
      ? chipset.autotile
        ? tilesPerRow
        : tilesPerRow * Math.max(1, Math.floor(imageSize.h / chipset.tileHeight))
      : 0;

  // canvas のピクセルサイズ
  const canvasW = imageSize?.w ?? 0;
  const canvasH = chipset?.autotile && imageSize ? chipset.tileHeight : (imageSize?.h ?? 0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !chipset || !imageDataUrl || !imageSize) return;

    const redraw = (img: HTMLImageElement) => {
      drawPalette(canvas, img, chipset, imageSize, tilesPerRow, selectedChipId);
    };

    // 同じ URL なら再ロードせず再描画のみ
    if (currentDataUrlRef.current === imageDataUrl && imgRef.current) {
      redraw(imgRef.current);
      return;
    }

    // 新しい URL: 画像をロードして描画
    currentDataUrlRef.current = imageDataUrl;
    imgRef.current = null;

    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      redraw(img);
    };
    img.src = imageDataUrl;
    return () => {
      img.onload = null;
    };
  }, [imageDataUrl, chipset, imageSize, tilesPerRow, selectedChipId]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !chipset) return;

    const rect = canvas.getBoundingClientRect();
    // CSS サイズとキャンバス属性サイズの比率を考慮
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const col = Math.floor(x / chipset.tileWidth);
    const row = Math.floor(y / chipset.tileHeight);

    if (chipset.autotile) {
      if (col >= 0 && col < tilesPerRow) {
        onSelectChip(`${chipset.id}:${col}`);
      }
    } else {
      const chipIndex = row * tilesPerRow + col;
      if (chipIndex >= 0 && chipIndex < totalTiles) {
        onSelectChip(`${chipset.id}:${chipIndex}`);
      }
    }
  };

  if (!chipset || !imageDataUrl || !imageSize) {
    return <div className="p-4 text-sm text-muted-foreground">チップセットを選択してください</div>;
  }

  return (
    <div className="overflow-auto p-2">
      <canvas
        ref={canvasRef}
        width={canvasW}
        height={canvasH}
        onClick={handleClick}
        style={{ cursor: 'crosshair', display: 'block' }}
        aria-label="チップパレット"
        role="img"
      />
    </div>
  );
}
