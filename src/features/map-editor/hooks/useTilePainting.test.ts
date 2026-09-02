import { getTilesToPaint, filterChangedTargets } from './useTilePainting';

describe('getTilesToPaint', () => {
  it('pen ツール: 1タイルを返す', () => {
    const result = getTilesToPaint('pen', { tx: 2, ty: 3 }, null, 'cs1:0');
    expect(result).toEqual([{ x: 2, y: 3, chipId: 'cs1:0' }]);
  });

  it('eraser ツール: 空文字チップを返す', () => {
    const result = getTilesToPaint('eraser', { tx: 1, ty: 1 }, null, 'cs1:0');
    expect(result).toEqual([{ x: 1, y: 1, chipId: '' }]);
  });

  it('selectedChipId が null なら pen でも空配列', () => {
    const result = getTilesToPaint('pen', { tx: 0, ty: 0 }, null, null);
    expect(result).toHaveLength(0);
  });

  it('pen ツール: selectedChipRange があれば範囲分のタイルをアンカー起点で返す', () => {
    const range = {
      chipsetId: 'cs1',
      startCol: 0,
      startRow: 0,
      width: 2,
      height: 2,
      cells: ['cs1:0', 'cs1:1', 'cs1:2', 'cs1:3'],
    };
    const result = getTilesToPaint('pen', { tx: 5, ty: 5 }, null, 'cs1:0', range);
    expect(result).toEqual([
      { x: 5, y: 5, chipId: 'cs1:0' },
      { x: 6, y: 5, chipId: 'cs1:1' },
      { x: 5, y: 6, chipId: 'cs1:2' },
      { x: 6, y: 6, chipId: 'cs1:3' },
    ]);
  });

  it('pen ツール: selectedChipRange が優先され selectedChipId 単体は使われない', () => {
    const range = {
      chipsetId: 'cs1',
      startCol: 0,
      startRow: 0,
      width: 1,
      height: 2,
      cells: ['cs1:9', 'cs1:9'],
    };
    const result = getTilesToPaint('pen', { tx: 0, ty: 0 }, null, 'cs1:0', range);
    expect(result).toEqual([
      { x: 0, y: 0, chipId: 'cs1:9' },
      { x: 0, y: 1, chipId: 'cs1:9' },
    ]);
  });
});

describe('filterChangedTargets', () => {
  it('既存タイルと異なるチップのみを残す', () => {
    const tiles = [
      ['cs1:0', 'cs1:1'],
      ['', ''],
    ];
    const targets = [
      { x: 0, y: 0, chipId: 'cs1:0' }, // 既に同じ値 → 変化なし
      { x: 1, y: 0, chipId: 'cs1:9' }, // 変化あり
      { x: 0, y: 1, chipId: 'cs1:5' }, // 変化あり（既存は空文字）
    ];
    expect(filterChangedTargets(tiles, targets)).toEqual([
      { x: 1, y: 0, chipId: 'cs1:9' },
      { x: 0, y: 1, chipId: 'cs1:5' },
    ]);
  });

  it('tiles が未初期化(undefined)でも空文字扱いで比較できる', () => {
    const targets = [
      { x: 0, y: 0, chipId: '' }, // 未初期化=空文字と同じなので変化なし
      { x: 1, y: 0, chipId: 'cs1:0' }, // 変化あり
    ];
    expect(filterChangedTargets(undefined, targets)).toEqual([{ x: 1, y: 0, chipId: 'cs1:0' }]);
  });

  it('全て変化なしなら空配列を返す', () => {
    const tiles = [['cs1:0']];
    const targets = [{ x: 0, y: 0, chipId: 'cs1:0' }];
    expect(filterChangedTargets(tiles, targets)).toEqual([]);
  });
});
