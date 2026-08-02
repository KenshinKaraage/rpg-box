import { cellsInRect, mergeCells } from './useMultiTileSelect';

describe('cellsInRect', () => {
  it('矩形範囲内の全セルを返す', () => {
    const cells = cellsInRect({ x: 0, y: 0 }, { x: 1, y: 1 });
    expect(cells).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ]);
  });

  it('逆方向のドラッグでも正規化される', () => {
    const cells = cellsInRect({ x: 2, y: 2 }, { x: 1, y: 1 });
    expect(cells).toEqual([
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
    ]);
  });

  it('1マスのみのドラッグは1セルを返す', () => {
    const cells = cellsInRect({ x: 3, y: 3 }, { x: 3, y: 3 });
    expect(cells).toEqual([{ x: 3, y: 3 }]);
  });
});

describe('mergeCells', () => {
  it('重複なしで結合する', () => {
    const result = mergeCells(
      [{ x: 0, y: 0 }],
      [
        { x: 1, y: 0 },
        { x: 1, y: 1 },
      ]
    );
    expect(result).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
    ]);
  });

  it('重複するセルは1つにまとめる', () => {
    const result = mergeCells([{ x: 0, y: 0 }], [{ x: 0, y: 0 }]);
    expect(result).toEqual([{ x: 0, y: 0 }]);
  });
});
