import { getTilesToPaint } from './useTilePainting';

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
});
