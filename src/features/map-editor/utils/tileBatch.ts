import type { TileRange } from './visibleTiles';

export interface TileBatch {
  positions: number[];
  texcoords: number[];
  count: number;
}

/**
 * 可視タイル範囲の頂点バッファデータを生成する
 * @param tiles tiles[y][x] = "chipsetId:chipIndex" 形式
 * @param range 可視タイル範囲
 * @param tileSize 表示タイルサイズ（スクリーンピクセル）
 * @param imgW チップセット画像の幅
 * @param imgH チップセット画像の高さ
 * @param srcTileW チップセット内のネイティブタイル幅
 * @param srcTileH チップセット内のネイティブタイル高さ
 * @param tilesPerRow チップセット1行あたりのタイル数
 */
export function buildTileBatch(
  tiles: string[][],
  range: TileRange,
  tileSize: number,
  imgW: number,
  imgH: number,
  srcTileW: number,
  srcTileH: number,
  tilesPerRow: number
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
      const chipIndex = parseInt(chipId.slice(colonIdx + 1), 10);
      if (isNaN(chipIndex)) continue;

      // スクリーン座標（ビューポート変換はシェーダーの u_matrix で行う）
      const sx = tx * tileSize;
      const sy = ty * tileSize;

      // UV座標
      const ux = (chipIndex % tilesPerRow) * uvW;
      const uy = Math.floor(chipIndex / tilesPerRow) * uvH;

      // 2三角形（時計回り）
      // 三角形1: 左上, 右上, 左下
      positions.push(sx, sy, sx + tileSize, sy, sx, sy + tileSize);
      texcoords.push(ux, uy, ux + uvW, uy, ux, uy + uvH);
      // 三角形2: 右上, 右下, 左下
      positions.push(sx + tileSize, sy, sx + tileSize, sy + tileSize, sx, sy + tileSize);
      texcoords.push(ux + uvW, uy, ux + uvW, uy + uvH, ux, uy + uvH);
    }
  }

  return { positions, texcoords, count: positions.length / 2 };
}
