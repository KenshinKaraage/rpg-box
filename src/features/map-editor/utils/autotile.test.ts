import {
  getAutotileVariant,
  calcAutotileChanges,
  AUTOTILE_NONE,
  AUTOTILE_VERTICAL,
  AUTOTILE_HORIZONTAL,
  AUTOTILE_FOUR,
  AUTOTILE_ALL,
} from './autotile';

// ─── getAutotileVariant ───────────────────────────────────────────────────────

describe('getAutotileVariant', () => {
  it('隣接なし → NONE', () => {
    expect(getAutotileVariant(false, false, false, false)).toBe(AUTOTILE_NONE);
  });

  it('上のみ → VERTICAL', () => {
    expect(getAutotileVariant(true, false, false, false)).toBe(AUTOTILE_VERTICAL);
  });

  it('下のみ → VERTICAL', () => {
    expect(getAutotileVariant(false, true, false, false)).toBe(AUTOTILE_VERTICAL);
  });

  it('上下 → VERTICAL', () => {
    expect(getAutotileVariant(true, true, false, false)).toBe(AUTOTILE_VERTICAL);
  });

  it('左のみ → HORIZONTAL', () => {
    expect(getAutotileVariant(false, false, true, false)).toBe(AUTOTILE_HORIZONTAL);
  });

  it('右のみ → HORIZONTAL', () => {
    expect(getAutotileVariant(false, false, false, true)).toBe(AUTOTILE_HORIZONTAL);
  });

  it('左右 → HORIZONTAL', () => {
    expect(getAutotileVariant(false, false, true, true)).toBe(AUTOTILE_HORIZONTAL);
  });

  it('上下左右すべて → FOUR', () => {
    expect(getAutotileVariant(true, true, true, true)).toBe(AUTOTILE_FOUR);
  });

  it('上+左（縦横混在、四隅以外）→ ALL', () => {
    expect(getAutotileVariant(true, false, true, false)).toBe(AUTOTILE_ALL);
  });

  it('上+右 → ALL', () => {
    expect(getAutotileVariant(true, false, false, true)).toBe(AUTOTILE_ALL);
  });

  it('下+左 → ALL', () => {
    expect(getAutotileVariant(false, true, true, false)).toBe(AUTOTILE_ALL);
  });

  it('下+右 → ALL', () => {
    expect(getAutotileVariant(false, true, false, true)).toBe(AUTOTILE_ALL);
  });

  it('上下+左（右なし）→ ALL', () => {
    expect(getAutotileVariant(true, true, true, false)).toBe(AUTOTILE_ALL);
  });

  it('上下+右（左なし）→ ALL', () => {
    expect(getAutotileVariant(true, true, false, true)).toBe(AUTOTILE_ALL);
  });

  it('左右+上（下なし）→ ALL', () => {
    expect(getAutotileVariant(true, false, true, true)).toBe(AUTOTILE_ALL);
  });

  it('左右+下（上なし）→ ALL', () => {
    expect(getAutotileVariant(false, true, true, true)).toBe(AUTOTILE_ALL);
  });
});

// ─── calcAutotileChanges ──────────────────────────────────────────────────────

const W = 5;
const H = 5;
const CS = 'cs1';
const AT_IDS = new Set([CS]);

/** 空の tiles グリッド */
function emptyTiles(): string[][] {
  return Array.from({ length: H }, () => Array<string>(W).fill(''));
}

/** チップ chipsetId:0 を (x,y) に置いた tiles を作成 */
function tilesWithChip(x: number, y: number, chipsetId = CS): string[][] {
  const t = emptyTiles();
  t[y]![x] = `${chipsetId}:0`;
  return t;
}

describe('calcAutotileChanges', () => {
  it('空マップにオートタイルを配置 → 配置位置1件（NONE）', () => {
    const tiles = emptyTiles();
    const changes = calcAutotileChanges(tiles, 2, 2, CS, W, H, AT_IDS);
    expect(changes).toHaveLength(1);
    expect(changes[0]).toEqual({ x: 2, y: 2, chipId: `${CS}:${AUTOTILE_NONE}` });
  });

  it('隣に同チップセットがある状態で配置 → 両方のバリアントが更新される', () => {
    // (2,2) に既存チップ、(3,2) に新規配置
    const tiles = tilesWithChip(2, 2);
    const changes = calcAutotileChanges(tiles, 3, 2, CS, W, H, AT_IDS);
    // (3,2): 左に隣接 → HORIZONTAL
    // (2,2): 右に隣接 → HORIZONTAL（元は NONE だったので変更あり）
    const map = new Map(changes.map((c) => [`${c.x},${c.y}`, c.chipId]));
    expect(map.get('3,2')).toBe(`${CS}:${AUTOTILE_HORIZONTAL}`);
    expect(map.get('2,2')).toBe(`${CS}:${AUTOTILE_HORIZONTAL}`);
  });

  it('オートタイルを消去 → 隣接タイルのバリアントが再計算される', () => {
    // (2,2) と (3,2) に既存チップ。(3,2) を消去。
    const tiles = emptyTiles();
    tiles[2]![2] = `${CS}:${AUTOTILE_HORIZONTAL}`; // 変更前のバリアント
    tiles[2]![3] = `${CS}:${AUTOTILE_HORIZONTAL}`;
    const changes = calcAutotileChanges(tiles, 3, 2, null, W, H, AT_IDS);
    // (3,2) 消去 → chipId: ''
    // (2,2) 右が消えた → NONE
    const map = new Map(changes.map((c) => [`${c.x},${c.y}`, c.chipId]));
    expect(map.get('3,2')).toBe('');
    expect(map.get('2,2')).toBe(`${CS}:${AUTOTILE_NONE}`);
  });

  it('バリアントが変わらない隣接タイルは変更リストに含まれない', () => {
    // (2,2) に cs1:0 のみ。隣接に同チップなし → バリアントは NONE のまま。
    // 別の位置 (0,0) に配置してもその隣接 (2,2) には届かない
    const tiles = tilesWithChip(2, 2);
    // (0,0) に配置: (2,2) は range 外なので影響なし
    const changes = calcAutotileChanges(tiles, 0, 0, CS, W, H, AT_IDS);
    // (0,0): 隣接なし → NONE
    // (2,2) は確認対象外なので含まれない
    expect(changes.every((c) => !(c.x === 2 && c.y === 2))).toBe(true);
  });

  it('オートタイルでないチップセットは変更リストに含まれない', () => {
    // cs2 はオートタイルではない
    const tiles = emptyTiles();
    tiles[2]![2] = 'cs2:0';
    const changes = calcAutotileChanges(tiles, 2, 3, CS, W, H, AT_IDS);
    // cs2 は autotileChipsetIds に含まれないのでスキップ
    expect(changes.every((c) => !c.chipId.startsWith('cs2'))).toBe(true);
  });

  it('マップ端（0,0）への配置でもクラッシュしない', () => {
    const tiles = emptyTiles();
    const changes = calcAutotileChanges(tiles, 0, 0, CS, W, H, AT_IDS);
    expect(changes).toHaveLength(1);
    expect(changes[0]).toEqual({ x: 0, y: 0, chipId: `${CS}:${AUTOTILE_NONE}` });
  });

  it('マップ端（右下隅）への配置でもクラッシュしない', () => {
    const tiles = emptyTiles();
    const changes = calcAutotileChanges(tiles, W - 1, H - 1, CS, W, H, AT_IDS);
    expect(changes).toHaveLength(1);
  });

  it('上下左右すべて同チップで囲まれている場合 → FOUR', () => {
    const tiles = emptyTiles();
    tiles[1]![2] = `${CS}:0`; // 上
    tiles[3]![2] = `${CS}:0`; // 下
    tiles[2]![1] = `${CS}:0`; // 左
    tiles[2]![3] = `${CS}:0`; // 右
    const changes = calcAutotileChanges(tiles, 2, 2, CS, W, H, AT_IDS);
    const center = changes.find((c) => c.x === 2 && c.y === 2);
    expect(center?.chipId).toBe(`${CS}:${AUTOTILE_FOUR}`);
  });

  it('配置位置のチップが変化なしでも配置位置は必ず変更リストに含まれる', () => {
    // tiles に既に cs1:3 (FOUR) が置いてあって、同じバリアントになる場合でも含まれる
    const tiles = emptyTiles();
    // (2,2) を上下左右に囲む
    tiles[1]![2] = `${CS}:0`;
    tiles[3]![2] = `${CS}:0`;
    tiles[2]![1] = `${CS}:0`;
    tiles[2]![3] = `${CS}:0`;
    // 元から FOUR が置いてある（変化なし）
    tiles[2]![2] = `${CS}:${AUTOTILE_FOUR}`;
    const changes = calcAutotileChanges(tiles, 2, 2, CS, W, H, AT_IDS);
    // 配置位置は必ず含まれる
    expect(changes.some((c) => c.x === 2 && c.y === 2)).toBe(true);
  });
});
