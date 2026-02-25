import { screenToTile, tileToScreen } from './coordTransform';

describe('screenToTile', () => {
  it('ズーム1・オフセット0でタイル座標を返す', () => {
    expect(screenToTile(64, 32, { x: 0, y: 0, zoom: 1 }, 32)).toEqual({ tx: 2, ty: 1 });
  });

  it('ズーム2でタイル座標を返す', () => {
    expect(screenToTile(128, 64, { x: 0, y: 0, zoom: 2 }, 32)).toEqual({ tx: 2, ty: 1 });
  });

  it('オフセットを考慮する', () => {
    // viewport.x=32 → (96+32)/(32*1)=4, (64+32)/(32*1)=3
    expect(screenToTile(96, 64, { x: 32, y: 32, zoom: 1 }, 32)).toEqual({ tx: 4, ty: 3 });
  });
});

describe('tileToScreen', () => {
  it('タイル座標をスクリーン座標に変換する', () => {
    expect(tileToScreen(2, 1, { x: 0, y: 0, zoom: 1 }, 32)).toEqual({ sx: 64, sy: 32 });
  });

  it('ズーム2を考慮する', () => {
    expect(tileToScreen(2, 1, { x: 0, y: 0, zoom: 2 }, 32)).toEqual({ sx: 128, sy: 64 });
  });
});
