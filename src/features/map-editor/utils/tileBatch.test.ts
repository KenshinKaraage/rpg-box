import { buildTileBatch } from './tileBatch';

describe('buildTileBatch', () => {
  it('空のレイヤーなら空の配列を返す', () => {
    const result = buildTileBatch(
      [],
      { minX: 0, minY: 0, maxX: 2, maxY: 2 },
      'cs1',
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
      'cs1',
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
      'cs1',
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

  it('別チップセットのタイルは除外される', () => {
    // cs1 と cs2 が混在するレイヤー。cs1 でビルドすると cs2 のタイルは含まない
    const tiles = [['cs1:0', 'cs2:3']];
    const result = buildTileBatch(
      tiles,
      { minX: 0, minY: 0, maxX: 2, maxY: 1 },
      'cs1',
      32,
      64,
      64,
      32,
      32,
      2
    );
    // cs1:0 だけが対象 → 1タイル = 12 floats
    expect(result.positions).toHaveLength(12);
  });
});

describe('buildTileBatch (autotile)', () => {
  // オートタイルチップセット設定:
  // - imgW=32, imgH=160（32x32 タイル × 1列 × 5行）
  // - tilesPerRow=1, srcTileW=32, srcTileH=32
  // - tileSize=32（スクリーン）

  it('孤立オートタイル → 4クォーター × 2三角形 = 48 floats', () => {
    // 周囲に同チップセットなし → 全クォーターが無(0) → 全部行0から取得
    const tiles = [['cs1:0']];
    const result = buildTileBatch(
      tiles,
      { minX: 0, minY: 0, maxX: 1, maxY: 1 },
      'cs1',
      32,
      32,
      160,
      32,
      32,
      1,
      true,
      1,
      1
    );
    // 4クォーター × 2三角形 × 3頂点 × 2成分 = 48
    expect(result.positions).toHaveLength(48);
    expect(result.texcoords).toHaveLength(48);
  });

  it('TLクォーター=無(0) → UV左上が (0, 0)', () => {
    // imgW=32, imgH=160, srcTileW=32, srcTileH=32
    // 行0=無: uvY = 0 * (32/160) = 0
    // TL = 左半分・上半分: uvX=0, uvY=0
    const tiles = [['cs1:0']];
    const result = buildTileBatch(
      tiles,
      { minX: 0, minY: 0, maxX: 1, maxY: 1 },
      'cs1',
      32,
      32,
      160,
      32,
      32,
      1,
      true,
      1,
      1
    );
    // TLクォーターの最初の頂点（左上）のtexcoord = (0, 0)
    expect(result.texcoords[0]).toBeCloseTo(0); // u
    expect(result.texcoords[1]).toBeCloseTo(0); // v
  });

  it('TLクォーター=縦(1) → UV左上のvが 1行目の位置', () => {
    // 上に同チップセットあり → TL/TRが縦(1)
    // imgH=160, srcTileH=32 → uvH = 32/160 = 0.2
    // 行1のuvY = 1 * 0.2 = 0.2
    const tiles = [['cs1:0'], ['cs1:0']]; // tiles[0][0], tiles[1][0]
    const result = buildTileBatch(
      tiles,
      { minX: 0, minY: 1, maxX: 1, maxY: 2 }, // (0,1) を描画
      'cs1',
      32,
      32,
      160,
      32,
      32,
      1,
      true,
      1,
      2 // mapHeight=2
    );
    // tiles[1][0] の上 = tiles[0][0] = 同チップセット → TL=縦(1)
    // TLクォーターの最初の頂点のv = 行1の上半分 = 1 * (32/160) = 0.2
    expect(result.texcoords[1]).toBeCloseTo(0.2);
  });

  it('非オートタイルパスは従来通り1タイル=12 floats', () => {
    const tiles = [['cs1:0']];
    const result = buildTileBatch(
      tiles,
      { minX: 0, minY: 0, maxX: 1, maxY: 1 },
      'cs1',
      32,
      64,
      64,
      32,
      32,
      2,
      false,
      1,
      1
    );
    expect(result.positions).toHaveLength(12);
  });

  it('isAutotile未指定（既存呼び出し形式）も動作する', () => {
    const tiles = [['cs1:0']];
    const result = buildTileBatch(
      tiles,
      { minX: 0, minY: 0, maxX: 1, maxY: 1 },
      'cs1',
      32,
      64,
      64,
      32,
      32,
      2
    );
    expect(result.positions).toHaveLength(12);
  });
});
