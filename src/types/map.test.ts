import type { GameMap, MapLayer, MapObject, Chipset, ChipProperty, Prefab } from './map';
import { TransformComponent } from './components/TransformComponent';
import { SpriteComponent } from './components/SpriteComponent';

describe('Map type definitions', () => {
  it('creates a GameMap with tile and object layers', () => {
    const tileLayer: MapLayer = {
      id: 'layer-1',
      name: '地面',
      type: 'tile',
      chipsetIds: [],
      tiles: [
        ['chip-1', 'chip-2', 'chip-3'],
        ['chip-1', 'chip-1', 'chip-2'],
      ],
    };

    const transform = new TransformComponent();
    transform.x = 5;
    transform.y = 3;

    const sprite = new SpriteComponent();

    const mapObject: MapObject = {
      id: 'obj-1',
      name: '宝箱',
      components: [transform, sprite],
    };

    const objectLayer: MapLayer = {
      id: 'layer-2',
      name: 'オブジェクト',
      type: 'object',
      chipsetIds: [],
      objects: [mapObject],
    };

    const gameMap: GameMap = {
      id: 'map-1',
      name: 'フィールド',
      width: 20,
      height: 15,
      layers: [tileLayer, objectLayer],
      fields: [],
      values: {},
    };

    expect(gameMap.id).toBe('map-1');
    expect(gameMap.width).toBe(20);
    expect(gameMap.height).toBe(15);
    expect(gameMap.layers).toHaveLength(2);
    expect(gameMap.layers[0]!.type).toBe('tile');
    expect(gameMap.layers[0]!.tiles![0]![0]).toBe('chip-1');
    expect(gameMap.layers[1]!.type).toBe('object');
    expect(gameMap.layers[1]!.objects![0]!.name).toBe('宝箱');
    expect(gameMap.fields).toEqual([]);
    expect(gameMap.values).toEqual({});
  });

  it('creates a Chipset with ChipProperties using values', () => {
    const chips: ChipProperty[] = [
      { index: 0, values: { passable: true } },
      { index: 1, values: { passable: false, footstepType: 'grass' } },
      { index: 2, values: { passable: true, footstepType: 'stone' } },
    ];

    const chipset: Chipset = {
      id: 'chipset-1',
      name: '草原チップセット',
      imageId: 'img-grassland',
      tileWidth: 32,
      tileHeight: 32,
      fields: [],
      chips,
    };

    expect(chipset.id).toBe('chipset-1');
    expect(chipset.tileWidth).toBe(32);
    expect(chipset.chips).toHaveLength(3);
    expect(chipset.chips[1]!.values.passable).toBe(false);
    expect(chipset.chips[1]!.values.footstepType).toBe('grass');
    expect(chipset.fields).toEqual([]);
  });

  it('creates a Prefab with components', () => {
    const transform = new TransformComponent();
    const sprite = new SpriteComponent();

    const prefab: Prefab = {
      id: 'prefab-1',
      name: '村人',
      components: [transform, sprite],
    };

    expect(prefab.id).toBe('prefab-1');
    expect(prefab.components).toHaveLength(2);
    expect(prefab.components[0]!.type).toBe('transform');
  });

  it('creates a MapObject with prefabId and overrides', () => {
    const mapObject: MapObject = {
      id: 'obj-2',
      name: '村人A',
      prefabId: 'prefab-1',
      components: [],
      overrides: {
        'transform.x': 10,
        'transform.y': 5,
        'sprite.imageId': 'img-villager-a',
      },
    };

    expect(mapObject.prefabId).toBe('prefab-1');
    expect(mapObject.overrides!['transform.x']).toBe(10);
  });
});
