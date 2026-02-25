/** 各クォーターのバリアント値 */
export const AUTOTILE_NONE = 0; // 無: 縦も横も隣接なし
export const AUTOTILE_VERTICAL = 1; // 縦: 縦のみ隣接
export const AUTOTILE_HORIZONTAL = 2; // 横: 横のみ隣接
export const AUTOTILE_CORNER = 3; // 隅: 縦+横あり・斜めなし（内角）
export const AUTOTILE_ALL = 4; // 全: 縦+横+斜めすべてあり

export interface AutotileQuarters {
  tl: number; // 左上クォーター (0-4)
  tr: number; // 右上クォーター (0-4)
  bl: number; // 左下クォーター (0-4)
  br: number; // 右下クォーター (0-4)
}

/**
 * タイル (x, y) の4クォーターバリアントを計算する
 *
 * 各クォーターは縦・斜め・横の3方向の同チップセット隣接を確認し、
 * 0=無 / 1=縦 / 2=横 / 3=隅 / 4=全 のいずれかを返す。
 *
 * @param tiles    tiles[y][x] = "chipsetId:N" 形式（空文字は空セル）
 * @param x        対象タイルのX座標
 * @param y        対象タイルのY座標
 * @param chipsetId 対象チップセットID
 * @param mapWidth  マップ幅
 * @param mapHeight マップ高さ
 */
export function getAutotileQuarters(
  tiles: string[][],
  x: number,
  y: number,
  chipsetId: string,
  mapWidth: number,
  mapHeight: number
): AutotileQuarters {
  const prefix = chipsetId + ':';
  const isSame = (nx: number, ny: number): boolean => {
    if (nx < 0 || ny < 0 || nx >= mapWidth || ny >= mapHeight) return false;
    return (tiles[ny]?.[nx] ?? '').startsWith(prefix);
  };

  const up = isSame(x, y - 1);
  const down = isSame(x, y + 1);
  const left = isSame(x - 1, y);
  const right = isSame(x + 1, y);
  const topLeft = isSame(x - 1, y - 1);
  const topRight = isSame(x + 1, y - 1);
  const bottomLeft = isSame(x - 1, y + 1);
  const bottomRight = isSame(x + 1, y + 1);

  return {
    tl: calcQuarterVariant(up, topLeft, left),
    tr: calcQuarterVariant(up, topRight, right),
    bl: calcQuarterVariant(down, bottomLeft, left),
    br: calcQuarterVariant(down, bottomRight, right),
  };
}

function calcQuarterVariant(v: boolean, d: boolean, h: boolean): number {
  if (!v && !h) return AUTOTILE_NONE;
  if (v && !h) return AUTOTILE_VERTICAL;
  if (!v && h) return AUTOTILE_HORIZONTAL;
  if (!d) return AUTOTILE_CORNER; // v && !d && h
  return AUTOTILE_ALL; // v && d && h
}
