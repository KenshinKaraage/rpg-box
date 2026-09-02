import { copyTiles, pasteTiles } from './tileCopyPaste';

const grid = [
  ['a', 'b', 'c'],
  ['d', 'e', 'f'],
  ['g', 'h', 'i'],
];

describe('copyTiles', () => {
  it('選択セルを左上基準の相対座標に変換してコピーする', () => {
    const cells = [
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
    ];
    const copied = copyTiles(grid, cells);
    expect(copied).toEqual([
      { dx: 0, dy: 0, chipId: 'e' },
      { dx: 1, dy: 0, chipId: 'f' },
      { dx: 0, dy: 1, chipId: 'h' },
      { dx: 1, dy: 1, chipId: 'i' },
    ]);
  });

  it('未配置のマス（空文字）もコピーされる', () => {
    const sparse = [['', 'b']];
    const copied = copyTiles(sparse, [{ x: 0, y: 0 }]);
    expect(copied).toEqual([{ dx: 0, dy: 0, chipId: '' }]);
  });

  it('空の選択では空配列を返す', () => {
    expect(copyTiles(grid, [])).toEqual([]);
  });
});

describe('pasteTiles', () => {
  it('anchor を左上として貼り付け先の座標を計算する', () => {
    const copied = [
      { dx: 0, dy: 0, chipId: 'e' },
      { dx: 1, dy: 0, chipId: 'f' },
      { dx: 0, dy: 1, chipId: 'h' },
      { dx: 1, dy: 1, chipId: 'i' },
    ];
    const targets = pasteTiles(copied, { x: 5, y: 5 }, 20, 15);
    expect(targets).toEqual([
      { x: 5, y: 5, chipId: 'e' },
      { x: 6, y: 5, chipId: 'f' },
      { x: 5, y: 6, chipId: 'h' },
      { x: 6, y: 6, chipId: 'i' },
    ]);
  });

  it('マップ範囲外になるセルは除外する', () => {
    const copied = [
      { dx: 0, dy: 0, chipId: 'a' },
      { dx: 1, dy: 0, chipId: 'b' },
    ];
    const targets = pasteTiles(copied, { x: 19, y: 0 }, 20, 15);
    expect(targets).toEqual([{ x: 19, y: 0, chipId: 'a' }]);
  });
});
