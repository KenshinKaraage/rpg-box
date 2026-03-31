/**
 * RuntimeObject → ObjectProxy 変換ファクトリ
 *
 * エンジン内部の RuntimeObject を、スクリプトから安全に操作できる
 * ObjectProxy インターフェースにラップする。
 */

import type { ObjectProxy } from './GameContext';
import type { RuntimeObject, Direction } from './GameWorld';
import type { GameWorld } from './GameWorld';

const TILE_SIZE = 32;

export function createObjectProxy(obj: RuntimeObject, world: GameWorld): ObjectProxy {
  return {
    id: obj.id,
    name: obj.name,
    getPosition: () => ({ x: obj.gridX, y: obj.gridY }),
    setPosition: (x, y) => {
      obj.gridX = x;
      obj.gridY = y;
      obj.pixelX = x * TILE_SIZE;
      obj.pixelY = y * TILE_SIZE;
      obj.isMoving = false;
      obj.moveProgress = 0;
    },
    getFacing: () => obj.facing,
    setFacing: (dir) => { obj.facing = dir as Direction; },
    isMoving: () => obj.isMoving,
    getComponent: (type) => {
      const comp = obj.components[type];
      return comp ? { ...comp } : null;
    },
    setComponent: (type, data) => {
      if (!obj.components[type]) obj.components[type] = {};
      Object.assign(obj.components[type]!, data);
    },
    setVisible: (visible) => {
      if (!obj.components['sprite']) obj.components['sprite'] = {};
      obj.components['sprite']!.opacity = visible ? 1 : 0;
    },
    destroy: () => { world.removeObject(obj.id); },
  };
}
