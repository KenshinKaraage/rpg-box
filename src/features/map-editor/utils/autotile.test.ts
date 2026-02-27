import {
  getAutotileQuarters,
  AUTOTILE_NONE,
  AUTOTILE_VERTICAL,
  AUTOTILE_HORIZONTAL,
  AUTOTILE_CORNER,
  AUTOTILE_ALL,
} from './autotile';

const W = 5;
const H = 5;
const CS = 'cs1';

function makeTiles(chips: Array<[number, number]>, chipsetId = CS): string[][] {
  const t = Array.from({ length: H }, () => Array<string>(W).fill(''));
  for (const [x, y] of chips) {
    t[y]![x] = `${chipsetId}:0`;
  }
  return t;
}

describe('getAutotileQuarters', () => {
  it('孤立タイル（8方向すべて非同一）→ 全クォーター=0（無）', () => {
    const tiles = makeTiles([[2, 2]]);
    const q = getAutotileQuarters(tiles, 2, 2, CS, W, H);
    expect(q).toEqual({
      tl: AUTOTILE_NONE,
      tr: AUTOTILE_NONE,
      bl: AUTOTILE_NONE,
      br: AUTOTILE_NONE,
    });
  });

  it('上のみ隣接 → TL=1（縦）, TR=1（縦）, BL=0, BR=0', () => {
    const tiles = makeTiles([
      [2, 2],
      [2, 1],
    ]);
    const q = getAutotileQuarters(tiles, 2, 2, CS, W, H);
    expect(q.tl).toBe(AUTOTILE_VERTICAL); // 縦
    expect(q.tr).toBe(AUTOTILE_VERTICAL); // 縦
    expect(q.bl).toBe(AUTOTILE_NONE); // 無
    expect(q.br).toBe(AUTOTILE_NONE); // 無
  });

  it('下のみ隣接 → TL=0, TR=0, BL=1（縦）, BR=1（縦）', () => {
    const tiles = makeTiles([
      [2, 2],
      [2, 3],
    ]);
    const q = getAutotileQuarters(tiles, 2, 2, CS, W, H);
    expect(q.tl).toBe(AUTOTILE_NONE);
    expect(q.tr).toBe(AUTOTILE_NONE);
    expect(q.bl).toBe(AUTOTILE_VERTICAL);
    expect(q.br).toBe(AUTOTILE_VERTICAL);
  });

  it('左のみ隣接 → TL=2（横）, TR=0, BL=2（横）, BR=0', () => {
    const tiles = makeTiles([
      [2, 2],
      [1, 2],
    ]);
    const q = getAutotileQuarters(tiles, 2, 2, CS, W, H);
    expect(q.tl).toBe(AUTOTILE_HORIZONTAL); // 横
    expect(q.tr).toBe(AUTOTILE_NONE); // 無
    expect(q.bl).toBe(AUTOTILE_HORIZONTAL); // 横
    expect(q.br).toBe(AUTOTILE_NONE); // 無
  });

  it('右のみ隣接 → TL=0, TR=2（横）, BL=0, BR=2（横）', () => {
    const tiles = makeTiles([
      [2, 2],
      [3, 2],
    ]);
    const q = getAutotileQuarters(tiles, 2, 2, CS, W, H);
    expect(q.tl).toBe(AUTOTILE_NONE);
    expect(q.tr).toBe(AUTOTILE_HORIZONTAL);
    expect(q.bl).toBe(AUTOTILE_NONE);
    expect(q.br).toBe(AUTOTILE_HORIZONTAL);
  });

  it('上+左（斜め=なし）→ TL=3（隅）', () => {
    // 上(2,1), 左(1,2) に隣接。左上斜め(1,1)はなし
    const tiles = makeTiles([
      [2, 2],
      [2, 1],
      [1, 2],
    ]);
    const q = getAutotileQuarters(tiles, 2, 2, CS, W, H);
    expect(q.tl).toBe(AUTOTILE_CORNER); // 隅: v=上○, d=左上×, h=左○
    expect(q.tr).toBe(AUTOTILE_VERTICAL); // v=上○, d=右上×, h=右×
    expect(q.bl).toBe(AUTOTILE_HORIZONTAL); // v=下×, d=左下×, h=左○
    expect(q.br).toBe(AUTOTILE_NONE); // v=下×, d=右下×, h=右×
  });

  it('上+左+左上斜め → TL=4（全）', () => {
    // 上(2,1), 左(1,2), 左上(1,1) すべてあり
    const tiles = makeTiles([
      [2, 2],
      [2, 1],
      [1, 2],
      [1, 1],
    ]);
    const q = getAutotileQuarters(tiles, 2, 2, CS, W, H);
    expect(q.tl).toBe(AUTOTILE_ALL); // 全: v=上○, d=左上○, h=左○
  });

  it('上+右（斜め=なし）→ TR=3（隅）', () => {
    const tiles = makeTiles([
      [2, 2],
      [2, 1],
      [3, 2],
    ]);
    const q = getAutotileQuarters(tiles, 2, 2, CS, W, H);
    expect(q.tl).toBe(AUTOTILE_VERTICAL); // v=上○, d=右上×, h=左×
    expect(q.tr).toBe(AUTOTILE_CORNER); // v=上○, d=右上×, h=右○
    expect(q.bl).toBe(AUTOTILE_NONE); // v=下×, d=左下×, h=左×
    expect(q.br).toBe(AUTOTILE_HORIZONTAL); // v=下×, d=右下×, h=右○
  });

  it('下+左（斜め=なし）→ BL=3（隅）', () => {
    const tiles = makeTiles([
      [2, 2],
      [2, 3],
      [1, 2],
    ]);
    const q = getAutotileQuarters(tiles, 2, 2, CS, W, H);
    expect(q.tl).toBe(AUTOTILE_HORIZONTAL); // v=上×, d=左上×, h=左○
    expect(q.tr).toBe(AUTOTILE_NONE); // v=上×, d=右上×, h=右×
    expect(q.bl).toBe(AUTOTILE_CORNER); // v=下○, d=左下×, h=左○
    expect(q.br).toBe(AUTOTILE_VERTICAL); // v=下○, d=右下×, h=右×
  });

  it('下+右（斜め=なし）→ BR=3（隅）', () => {
    const tiles = makeTiles([
      [2, 2],
      [2, 3],
      [3, 2],
    ]);
    const q = getAutotileQuarters(tiles, 2, 2, CS, W, H);
    expect(q.tl).toBe(AUTOTILE_NONE); // v=上×, d=左上×, h=左×
    expect(q.tr).toBe(AUTOTILE_HORIZONTAL); // v=上×, d=右上×, h=右○
    expect(q.bl).toBe(AUTOTILE_VERTICAL); // v=下○, d=左下×, h=左×
    expect(q.br).toBe(AUTOTILE_CORNER); // v=下○, d=右下×, h=右○
  });

  it('4方向+斜めすべてあり → 全クォーター=4（全）', () => {
    const tiles = makeTiles([
      [2, 2],
      [2, 1],
      [2, 3],
      [1, 2],
      [3, 2], // 上下左右
      [1, 1],
      [3, 1],
      [1, 3],
      [3, 3], // 斜め4方向
    ]);
    const q = getAutotileQuarters(tiles, 2, 2, CS, W, H);
    expect(q).toEqual({ tl: AUTOTILE_ALL, tr: AUTOTILE_ALL, bl: AUTOTILE_ALL, br: AUTOTILE_ALL });
  });

  it('別チップセットは「同じタイル」と判定しない', () => {
    const tiles = makeTiles([[2, 2]]);
    tiles[1]![2] = 'cs2:0'; // 上は別チップセット
    const q = getAutotileQuarters(tiles, 2, 2, CS, W, H);
    expect(q.tl).toBe(AUTOTILE_NONE); // 上が同チップセットでないので縦なし
    expect(q.tr).toBe(AUTOTILE_NONE);
  });

  it('マップ端（0,0）でクラッシュしない → 全クォーター=0', () => {
    const tiles = makeTiles([[0, 0]]);
    const q = getAutotileQuarters(tiles, 0, 0, CS, W, H);
    expect(q).toEqual({
      tl: AUTOTILE_NONE,
      tr: AUTOTILE_NONE,
      bl: AUTOTILE_NONE,
      br: AUTOTILE_NONE,
    });
  });

  it('マップ端（右下隅）でクラッシュしない', () => {
    const tiles = makeTiles([[W - 1, H - 1]]);
    expect(() => getAutotileQuarters(tiles, W - 1, H - 1, CS, W, H)).not.toThrow();
  });
});
