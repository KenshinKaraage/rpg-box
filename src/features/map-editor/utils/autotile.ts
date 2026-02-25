/**
 * オートタイルのバリアントインデックス
 * チップセット画像の上から順に対応する
 */
export const AUTOTILE_NONE = 0; // なし: 隣接なし
export const AUTOTILE_VERTICAL = 1; // 縦:   上または下のみ
export const AUTOTILE_HORIZONTAL = 2; // 横:   左または右のみ
export const AUTOTILE_FOUR = 3; // 四隅: 上下左右すべて
export const AUTOTILE_ALL = 4; // 全:   縦横混在（四隅以外）

/**
 * 4方向の隣接状態からオートタイルのバリアントインデックスを返す
 */
export function getAutotileVariant(
  hasTop: boolean,
  hasBottom: boolean,
  hasLeft: boolean,
  hasRight: boolean
): number {
  const hasV = hasTop || hasBottom;
  const hasH = hasLeft || hasRight;
  if (!hasV && !hasH) return AUTOTILE_NONE;
  if (hasV && !hasH) return AUTOTILE_VERTICAL;
  if (!hasV && hasH) return AUTOTILE_HORIZONTAL;
  if (hasTop && hasBottom && hasLeft && hasRight) return AUTOTILE_FOUR;
  return AUTOTILE_ALL;
}

/**
 * オートタイルを配置・消去したときの全タイル変更リストを返す
 *
 * - 配置位置と4方向隣接のバリアントを再計算
 * - autotileChipsetIds に含まれないチップセットの隣接タイルは変更しない
 *
 * @param tiles    現在のタイルデータ (変更しない)
 * @param paintX   配置・消去するX座標
 * @param paintY   配置・消去するY座標
 * @param chipsetId 配置するチップセットID。null のとき消去
 * @param mapWidth  マップ幅
 * @param mapHeight マップ高さ
 * @param autotileChipsetIds オートタイルとして扱うチップセットIDセット
 */
export function calcAutotileChanges(
  tiles: string[][],
  paintX: number,
  paintY: number,
  chipsetId: string | null,
  mapWidth: number,
  mapHeight: number,
  autotileChipsetIds: Set<string>
): Array<{ x: number; y: number; chipId: string }> {
  // 作業コピー（tiles は変更しない）
  const work: string[][] = Array.from({ length: mapHeight }, (_, i) =>
    tiles[i] ? [...tiles[i]!] : Array<string>(mapWidth).fill('')
  );

  // 配置または消去を作業コピーに先行適用
  work[paintY]![paintX] = chipsetId ? `${chipsetId}:0` : '';

  const changes: Array<{ x: number; y: number; chipId: string }> = [];

  const toCheck = [
    [paintX, paintY],
    [paintX, paintY - 1],
    [paintX, paintY + 1],
    [paintX - 1, paintY],
    [paintX + 1, paintY],
  ] as const;

  for (const [cx, cy] of toCheck) {
    if (cx < 0 || cy < 0 || cx >= mapWidth || cy >= mapHeight) continue;
    const isPaintTarget = cx === paintX && cy === paintY;
    const cell = work[cy]?.[cx] ?? '';

    if (!cell) {
      // 消去位置: 空になったことを記録
      if (isPaintTarget && !chipsetId) {
        const prev = tiles[cy]?.[cx] ?? '';
        if (prev !== '') changes.push({ x: cx, y: cy, chipId: '' });
      }
      continue;
    }

    const colonIdx = cell.indexOf(':');
    if (colonIdx === -1) continue;
    const cellChipset = cell.slice(0, colonIdx);

    // オートタイルでない隣接タイルは変更しない
    if (!autotileChipsetIds.has(cellChipset)) continue;

    const isSame = (nx: number, ny: number): boolean => {
      if (nx < 0 || ny < 0 || nx >= mapWidth || ny >= mapHeight) return false;
      return (work[ny]?.[nx] ?? '').startsWith(cellChipset + ':');
    };

    const variant = getAutotileVariant(
      isSame(cx, cy - 1),
      isSame(cx, cy + 1),
      isSame(cx - 1, cy),
      isSame(cx + 1, cy)
    );

    const newChipId = `${cellChipset}:${variant}`;
    work[cy]![cx] = newChipId;

    const orig = tiles[cy]?.[cx] ?? '';
    // 配置位置は必ず記録、隣接は変化があるときのみ記録
    if (isPaintTarget || newChipId !== orig) {
      changes.push({ x: cx, y: cy, chipId: newChipId });
    }
  }

  return changes;
}
