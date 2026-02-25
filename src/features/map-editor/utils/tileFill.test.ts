import { floodFill } from './tileFill';

function makeGrid(rows: string[][]): string[][] {
  return rows.map((row) => [...row]);
}

describe('floodFill', () => {
  it('同じチップの隣接タイルを置き換える', () => {
    const grid = makeGrid([
      ['A', 'A', 'B'],
      ['A', 'A', 'B'],
      ['B', 'B', 'B'],
    ]);
    const changes = floodFill(grid, 0, 0, 'C', 3, 3);
    expect(changes).toContainEqual({ x: 0, y: 0, prev: 'A', next: 'C' });
    expect(changes).toContainEqual({ x: 1, y: 0, prev: 'A', next: 'C' });
    expect(changes).toContainEqual({ x: 0, y: 1, prev: 'A', next: 'C' });
    expect(changes).toHaveLength(4);
  });

  it('既に同じチップなら変更なし', () => {
    const grid = makeGrid([
      ['A', 'A'],
      ['A', 'A'],
    ]);
    const changes = floodFill(grid, 0, 0, 'A', 2, 2);
    expect(changes).toHaveLength(0);
  });

  it('マップ範囲外に出ない', () => {
    const grid = makeGrid([['A']]);
    const changes = floodFill(grid, 0, 0, 'B', 1, 1);
    expect(changes).toHaveLength(1);
  });

  it('未初期化グリッド（空配列）でも全セルを塗りつぶせる', () => {
    // 新規マップは layer.tiles が undefined → [] として渡される
    const changes = floodFill([], 0, 0, 'cs1:0', 3, 2);
    expect(changes).toHaveLength(6); // 3×2 全セル
    expect(changes.every((c) => c.next === 'cs1:0')).toBe(true);
    expect(changes.every((c) => c.prev === '')).toBe(true);
  });
});
