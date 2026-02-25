export interface TileChange {
  x: number;
  y: number;
  prev: string;
  next: string;
}

export function floodFill(
  grid: string[][],
  startX: number,
  startY: number,
  newChip: string,
  mapW: number,
  mapH: number
): TileChange[] {
  const targetChip = grid[startY]?.[startX] ?? '';
  if (targetChip === newChip) return [];

  const changes: TileChange[] = [];
  const visited = new Set<string>();
  const queue: Array<{ x: number; y: number }> = [{ x: startX, y: startY }];

  while (queue.length > 0) {
    const cell = queue.shift()!;
    const key = `${cell.x},${cell.y}`;
    if (visited.has(key)) continue;
    if (cell.x < 0 || cell.x >= mapW || cell.y < 0 || cell.y >= mapH) continue;
    if ((grid[cell.y]?.[cell.x] ?? '') !== targetChip) continue;

    visited.add(key);
    changes.push({ x: cell.x, y: cell.y, prev: targetChip, next: newChip });

    queue.push(
      { x: cell.x + 1, y: cell.y },
      { x: cell.x - 1, y: cell.y },
      { x: cell.x, y: cell.y + 1 },
      { x: cell.x, y: cell.y - 1 }
    );
  }

  return changes;
}
