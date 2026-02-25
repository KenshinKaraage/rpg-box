import { buildTileBatch } from './tileBatch';

describe('buildTileBatch', () => {
  it('空のレイヤーなら空の配列を返す', () => {
    const result = buildTileBatch([], { minX: 0, minY: 0, maxX: 2, maxY: 2 }, 32, 128, 128, 1);
    expect(result.positions).toHaveLength(0);
    expect(result.texcoords).toHaveLength(0);
  });

  it('タイル1枚分の頂点データを生成する', () => {
    // "chipsetId:0" → チップ0番 = 左上 UV (0,0)-(tileW/imgW, tileH/imgH)
    const tiles = [['cs1:0']];
    const result = buildTileBatch(tiles, { minX: 0, minY: 0, maxX: 1, maxY: 1 }, 32, 64, 64, 1);
    // 1タイル = 2三角形 = 6頂点 = 12 floats (x,y per vertex)
    expect(result.positions).toHaveLength(12);
    expect(result.texcoords).toHaveLength(12);
  });
});
