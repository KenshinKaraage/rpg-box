import { buildTileBatch } from './tileBatch';

describe('buildTileBatch', () => {
  it('空のレイヤーなら空の配列を返す', () => {
    const result = buildTileBatch(
      [],
      { minX: 0, minY: 0, maxX: 2, maxY: 2 },
      32,
      128,
      128,
      32,
      32,
      4
    );
    expect(result.positions).toHaveLength(0);
    expect(result.texcoords).toHaveLength(0);
  });

  it('タイル1枚分の頂点データを生成する', () => {
    // "chipsetId:0" → チップ0番 = 左上 UV (0,0)-(srcTileW/imgW, srcTileH/imgH)
    const tiles = [['cs1:0']];
    const result = buildTileBatch(
      tiles,
      { minX: 0, minY: 0, maxX: 1, maxY: 1 },
      32,
      64,
      64,
      32,
      32,
      2
    );
    // 1タイル = 2三角形 = 6頂点 = 12 floats (x,y per vertex)
    expect(result.positions).toHaveLength(12);
    expect(result.texcoords).toHaveLength(12);
  });

  it('UV座標がネイティブタイルサイズ基準で計算される', () => {
    // 128x64 画像、32x32 タイル → tilesPerRow=4
    // チップ5番 = col=1, row=1 → uvX=32/128=0.25, uvY=32/64=0.5
    const tiles = [['cs1:5']];
    const result = buildTileBatch(
      tiles,
      { minX: 0, minY: 0, maxX: 1, maxY: 1 },
      32,
      128,
      64,
      32,
      32,
      4
    );
    // texcoords[0,1] = 左上 = (0.25, 0.5)
    expect(result.texcoords[0]).toBeCloseTo(0.25);
    expect(result.texcoords[1]).toBeCloseTo(0.5);
  });
});
