import type { TileRange } from './visibleTiles';
import { getAutotileQuarters } from './autotile';

export interface TileBatch {
  positions: number[];
  texcoords: number[];
  count: number;
}

/**
 * 可視タイル範囲の頂点バッファデータを生成する
 * @param tiles      tiles[y][x] = "chipsetId:chipIndex" 形式
 * @param range      可視タイル範囲
 * @param chipsetId  このバッチで描画するチップセットID
 * @param tileSize   表示タイルサイズ（スクリーンピクセル）
 * @param imgW       チップセット画像の幅
 * @param imgH       チップセット画像の高さ
 * @param srcTileW   チップセット内のネイティブタイル幅
 * @param srcTileH   チップセット内のネイティブタイル高さ
 * @param tilesPerRow チップセット1行あたりのタイル数
 * @param isAutotile オートタイルチップセットかどうか（省略時=false）
 * @param mapWidth   マップ幅（isAutotile=true のとき必須）
 * @param mapHeight  マップ高さ（isAutotile=true のとき必須）
 */
export function buildTileBatch(
  tiles: string[][],
  range: TileRange,
  chipsetId: string,
  tileSize: number,
  imgW: number,
  imgH: number,
  srcTileW: number,
  srcTileH: number,
  tilesPerRow: number,
  isAutotile = false,
  mapWidth = 0,
  mapHeight = 0
): TileBatch {
  const positions: number[] = [];
  const texcoords: number[] = [];

  const uvW = srcTileW / imgW;
  const uvH = srcTileH / imgH;

  for (let ty = range.minY; ty < range.maxY; ty++) {
    for (let tx = range.minX; tx < range.maxX; tx++) {
      const chipId = tiles[ty]?.[tx] ?? '';
      if (!chipId) continue;

      const colonIdx = chipId.indexOf(':');
      if (colonIdx === -1) continue;
      if (chipId.slice(0, colonIdx) !== chipsetId) continue;

      const chipIndex = parseInt(chipId.slice(colonIdx + 1), 10);
      if (isNaN(chipIndex)) continue;

      const sx = tx * tileSize;
      const sy = ty * tileSize;

      if (isAutotile) {
        if (mapWidth === 0 || mapHeight === 0) continue;
        const col = chipIndex % tilesPerRow;
        const { tl, tr, bl, br } = getAutotileQuarters(
          tiles,
          tx,
          ty,
          chipsetId,
          mapWidth,
          mapHeight
        );
        pushQuarter(positions, texcoords, sx, sy, tileSize, col, tl, uvW, uvH, false, false);
        pushQuarter(positions, texcoords, sx, sy, tileSize, col, tr, uvW, uvH, true, false);
        pushQuarter(positions, texcoords, sx, sy, tileSize, col, bl, uvW, uvH, false, true);
        pushQuarter(positions, texcoords, sx, sy, tileSize, col, br, uvW, uvH, true, true);
      } else {
        const ux = (chipIndex % tilesPerRow) * uvW;
        const uy = Math.floor(chipIndex / tilesPerRow) * uvH;
        // 三角形1: 左上, 右上, 左下
        positions.push(sx, sy, sx + tileSize, sy, sx, sy + tileSize);
        texcoords.push(ux, uy, ux + uvW, uy, ux, uy + uvH);
        // 三角形2: 右上, 右下, 左下
        positions.push(sx + tileSize, sy, sx + tileSize, sy + tileSize, sx, sy + tileSize);
        texcoords.push(ux + uvW, uy, ux + uvW, uy + uvH, ux, uy + uvH);
      }
    }
  }

  return { positions, texcoords, count: positions.length / 2 };
}

/**
 * クォーター1枚分（tileSize/2 × tileSize/2）の頂点データを追加する
 * @param isRight  右半分のクォーターかどうか
 * @param isBottom 下半分のクォーターかどうか
 */
function pushQuarter(
  positions: number[],
  texcoords: number[],
  sx: number,
  sy: number,
  tileSize: number,
  col: number,
  variant: number,
  uvW: number,
  uvH: number,
  isRight: boolean,
  isBottom: boolean
): void {
  const qs = tileSize / 2;
  const qx = sx + (isRight ? qs : 0);
  const qy = sy + (isBottom ? qs : 0);

  const uOff = isRight ? uvW / 2 : 0;
  const vOff = isBottom ? uvH / 2 : 0;
  const ux = col * uvW + uOff;
  const uy = variant * uvH + vOff;
  const quvW = uvW / 2;
  const quvH = uvH / 2;

  // 三角形1: 左上, 右上, 左下
  positions.push(qx, qy, qx + qs, qy, qx, qy + qs);
  texcoords.push(ux, uy, ux + quvW, uy, ux, uy + quvH);
  // 三角形2: 右上, 右下, 左下
  positions.push(qx + qs, qy, qx + qs, qy + qs, qx, qy + qs);
  texcoords.push(ux + quvW, uy, ux + quvW, uy + quvH, ux, uy + quvH);
}
