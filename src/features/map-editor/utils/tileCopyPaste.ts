import type { TileCell } from '@/stores/mapEditorSlice';

/** コピーしたタイル1マス分。位置は選択範囲の左上を(0,0)とした相対座標 */
export interface CopiedTile {
  dx: number;
  dy: number;
  chipId: string;
}

export interface TilePasteTarget {
  x: number;
  y: number;
  chipId: string;
}

/** 選択セルのタイルをコピーする（位置は選択範囲の左上基準の相対座標に変換） */
export function copyTiles(tiles: string[][], cells: TileCell[]): CopiedTile[] {
  if (cells.length === 0) return [];

  const minX = Math.min(...cells.map((c) => c.x));
  const minY = Math.min(...cells.map((c) => c.y));

  return cells.map((c) => ({
    dx: c.x - minX,
    dy: c.y - minY,
    chipId: tiles[c.y]?.[c.x] ?? '',
  }));
}

/** コピーしたタイルを anchor を左上として貼り付ける（マップ範囲外のセルは除外） */
export function pasteTiles(
  copied: CopiedTile[],
  anchor: TileCell,
  mapWidth: number,
  mapHeight: number
): TilePasteTarget[] {
  const targets: TilePasteTarget[] = [];
  for (const c of copied) {
    const x = anchor.x + c.dx;
    const y = anchor.y + c.dy;
    if (x < 0 || x >= mapWidth || y < 0 || y >= mapHeight) continue;
    targets.push({ x, y, chipId: c.chipId });
  }
  return targets;
}
