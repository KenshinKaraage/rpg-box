'use client';
import { useRef, useEffect, useState, useCallback } from 'react';
import type { Chipset, ChipRangeSelection } from '@/types/map';

interface ChipPaletteProps {
  chipset: Chipset | null;
  imageDataUrl: string | null;
  /** アセットの ImageMetadata から取得した画像サイズ */
  imageSize: { w: number; h: number } | null;
  selectedChipId: string | null;
  onSelectChip: (chipId: string) => void;
  /** 複数タイル選択（スタンプ用）の確定結果 */
  selectedRange?: ChipRangeSelection | null;
  /** 複数マスをドラッグ選択したときに呼ばれる（1マスのみの場合は呼ばれず onSelectChip が使われる） */
  onSelectRange?: (range: ChipRangeSelection | null) => void;
}

interface CellRect {
  minCol: number;
  minRow: number;
  maxCol: number;
  maxRow: number;
}

interface DragRange {
  startCol: number;
  startRow: number;
  endCol: number;
  endRow: number;
}

function normalizeDragRange(chipset: Chipset, drag: DragRange): CellRect {
  return {
    minCol: Math.min(drag.startCol, drag.endCol),
    maxCol: Math.max(drag.startCol, drag.endCol),
    minRow: chipset.autotile ? 0 : Math.min(drag.startRow, drag.endRow),
    maxRow: chipset.autotile ? 0 : Math.max(drag.startRow, drag.endRow),
  };
}

/** 現在ハイライトすべき範囲を決定する（ドラッグ中 > 確定済み範囲選択 > 単一選択の優先順） */
function computeHighlightRect(
  chipset: Chipset,
  tilesPerRow: number,
  selectedChipId: string | null,
  selectedRange: ChipRangeSelection | null | undefined,
  liveDrag: DragRange | null
): CellRect | null {
  if (liveDrag) {
    return normalizeDragRange(chipset, liveDrag);
  }

  if (selectedRange && selectedRange.chipsetId === chipset.id) {
    return {
      minCol: selectedRange.startCol,
      maxCol: selectedRange.startCol + selectedRange.width - 1,
      minRow: selectedRange.startRow,
      maxRow: selectedRange.startRow + selectedRange.height - 1,
    };
  }

  if (selectedChipId) {
    const colonIdx = selectedChipId.indexOf(':');
    if (colonIdx !== -1 && selectedChipId.slice(0, colonIdx) === chipset.id) {
      const chipIndex = parseInt(selectedChipId.slice(colonIdx + 1), 10);
      if (!isNaN(chipIndex)) {
        const col = chipset.autotile ? chipIndex : chipIndex % tilesPerRow;
        const row = chipset.autotile ? 0 : Math.floor(chipIndex / tilesPerRow);
        return { minCol: col, maxCol: col, minRow: row, maxRow: row };
      }
    }
  }

  return null;
}

/** チップパレットを canvas に描画する（純粋関数）。jsdom では ctx が null なので何もしない。 */
function drawPalette(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  chipset: Chipset,
  imageSize: { w: number; h: number },
  tilesPerRow: number,
  selectedChipId: string | null,
  selectedRange: ChipRangeSelection | null | undefined,
  liveDrag: DragRange | null
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;

  if (chipset.autotile) {
    // バリアント0行目（"無"）のみ表示
    ctx.drawImage(img, 0, 0, imageSize.w, chipset.tileHeight, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.drawImage(img, 0, 0);
  }

  const rect = computeHighlightRect(chipset, tilesPerRow, selectedChipId, selectedRange, liveDrag);
  if (rect) {
    ctx.strokeStyle = '#f97316'; // orange-500
    ctx.lineWidth = 2;
    ctx.strokeRect(
      rect.minCol * chipset.tileWidth + 1,
      rect.minRow * chipset.tileHeight + 1,
      (rect.maxCol - rect.minCol + 1) * chipset.tileWidth - 2,
      (rect.maxRow - rect.minRow + 1) * chipset.tileHeight - 2
    );
  }
}

export function ChipPalette({
  chipset,
  imageDataUrl,
  imageSize,
  selectedChipId,
  onSelectChip,
  selectedRange,
  onSelectRange,
}: ChipPaletteProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const currentDataUrlRef = useRef<string | null>(null);
  const dragStartRef = useRef<{ col: number; row: number } | null>(null);
  const [liveDrag, setLiveDrag] = useState<DragRange | null>(null);

  const tilesPerRow =
    chipset && imageSize ? Math.max(1, Math.floor(imageSize.w / chipset.tileWidth)) : 0;
  const totalRows =
    chipset && imageSize
      ? chipset.autotile
        ? 1
        : Math.max(1, Math.floor(imageSize.h / chipset.tileHeight))
      : 0;
  const totalTiles =
    chipset && imageSize ? (chipset.autotile ? tilesPerRow : tilesPerRow * totalRows) : 0;

  // canvas のピクセルサイズ
  const canvasW = imageSize?.w ?? 0;
  const canvasH = chipset?.autotile && imageSize ? chipset.tileHeight : (imageSize?.h ?? 0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !chipset || !imageDataUrl || !imageSize) return;

    const redraw = (img: HTMLImageElement) => {
      drawPalette(
        canvas,
        img,
        chipset,
        imageSize,
        tilesPerRow,
        selectedChipId,
        selectedRange,
        liveDrag
      );
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
  }, [imageDataUrl, chipset, imageSize, tilesPerRow, selectedChipId, selectedRange, liveDrag]);

  /** クライアント座標 → セル座標（グリッド範囲外はクランプ） */
  const cellFromClientPoint = useCallback(
    (clientX: number, clientY: number): { col: number; row: number } | null => {
      const canvas = canvasRef.current;
      if (!canvas || !chipset) return null;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (clientX - rect.left) * scaleX;
      const y = (clientY - rect.top) * scaleY;

      const col = Math.min(Math.max(Math.floor(x / chipset.tileWidth), 0), tilesPerRow - 1);
      const row = Math.min(Math.max(Math.floor(y / chipset.tileHeight), 0), totalRows - 1);
      return { col, row };
    },
    [chipset, tilesPerRow, totalRows]
  );

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!chipset) return;
    const cell = cellFromClientPoint(e.clientX, e.clientY);
    if (!cell) return;

    dragStartRef.current = cell;
    setLiveDrag({ startCol: cell.col, startRow: cell.row, endCol: cell.col, endRow: cell.row });

    const handleWindowMouseMove = (ev: MouseEvent) => {
      const start = dragStartRef.current;
      if (!start) return;
      const point = cellFromClientPoint(ev.clientX, ev.clientY);
      if (!point) return;
      setLiveDrag({
        startCol: start.col,
        startRow: start.row,
        endCol: point.col,
        endRow: point.row,
      });
    };

    const handleWindowMouseUp = (ev: MouseEvent) => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);

      const start = dragStartRef.current;
      dragStartRef.current = null;
      setLiveDrag(null);
      if (!start || !chipset) return;

      const point = cellFromClientPoint(ev.clientX, ev.clientY) ?? start;
      const rect = normalizeDragRange(chipset, {
        startCol: start.col,
        startRow: start.row,
        endCol: point.col,
        endRow: point.row,
      });
      const width = rect.maxCol - rect.minCol + 1;
      const height = rect.maxRow - rect.minRow + 1;

      const anchorIndex = chipset.autotile ? rect.minCol : rect.minRow * tilesPerRow + rect.minCol;
      if (anchorIndex >= 0 && anchorIndex < totalTiles) {
        onSelectChip(`${chipset.id}:${anchorIndex}`);
      }

      if (width === 1 && height === 1) {
        onSelectRange?.(null);
      } else {
        const cells: string[] = [];
        for (let row = rect.minRow; row <= rect.maxRow; row++) {
          for (let col = rect.minCol; col <= rect.maxCol; col++) {
            const index = chipset.autotile ? col : row * tilesPerRow + col;
            cells.push(`${chipset.id}:${index}`);
          }
        }
        onSelectRange?.({
          chipsetId: chipset.id,
          startCol: rect.minCol,
          startRow: rect.minRow,
          width,
          height,
          cells,
        });
      }
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
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
        onMouseDown={handleMouseDown}
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
        style={{
          cursor: 'crosshair',
          display: 'block',
          width: `${canvasW}px`,
          height: `${canvasH}px`,
        }}
        aria-label="チップパレット"
        role="img"
      />
    </div>
  );
}
