import { generateId } from '@/lib/utils';
import { createDefaultMapFields } from '@/lib/defaultMapFields';
import type { GameMap } from '@/types/map';

/**
 * デフォルト構成の新規マップを作成する。
 * タイルレイヤー + オブジェクトレイヤーを初期状態で含む。
 */
export function createDefaultMap(existingMapIds: string[]): GameMap {
  const id = generateId('map', existingMapIds);
  const tileLayerId = generateId('layer', []);
  return {
    id,
    name: '新しいマップ',
    width: 20,
    height: 15,
    layers: [
      {
        id: tileLayerId,
        name: 'レイヤー1',
        type: 'tile' as const,
        visible: true,
        chipsetIds: [],
      },
      {
        id: generateId('layer', [tileLayerId]),
        name: 'オブジェクト',
        type: 'object' as const,
        visible: true,
        chipsetIds: [],
        objects: [],
      },
    ],
    fields: createDefaultMapFields(),
    values: {},
  };
}
