import { getVisibleTileRange } from './visibleTiles';

describe('getVisibleTileRange', () => {
  const viewport = { x: 0, y: 0, zoom: 1 };
  const canvasSize = { w: 320, h: 160 };
  const mapSize = { w: 20, h: 15 };
  const tileSize = 32;

  it('ズーム1でキャンバスに収まるタイル範囲を返す', () => {
    const r = getVisibleTileRange(viewport, canvasSize, mapSize, tileSize);
    expect(r.minX).toBe(0);
    expect(r.minY).toBe(0);
    expect(r.maxX).toBe(10); // 320/32 = 10
    expect(r.maxY).toBe(5); // 160/32 = 5
  });

  it('マップ範囲を超えない', () => {
    const r = getVisibleTileRange(viewport, { w: 9999, h: 9999 }, mapSize, tileSize);
    expect(r.maxX).toBe(20);
    expect(r.maxY).toBe(15);
  });

  it('パン済みの場合にオフセットを反映する', () => {
    const r = getVisibleTileRange({ x: 64, y: 32, zoom: 1 }, canvasSize, mapSize, tileSize);
    expect(r.minX).toBe(2);
    expect(r.minY).toBe(1);
  });
});
