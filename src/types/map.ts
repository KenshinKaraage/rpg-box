import type { Component } from './components/Component';
import type { FieldType } from './fields/FieldType';

export interface GameMap {
  id: string;
  name: string;
  width: number; // 20-999
  height: number; // 15-999
  layers: MapLayer[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fields: FieldType<any>[];
  values: Record<string, unknown>;
}

export interface MapLayer {
  id: string;
  name: string;
  type: 'tile' | 'object';
  tiles?: string[][]; // tiles[y][x] = chipId
  objects?: MapObject[];
}

export interface MapObject {
  id: string;
  name: string;
  prefabId?: string;
  components: Component[];
  overrides?: Record<string, unknown>;
}

export interface Chipset {
  id: string;
  name: string;
  imageId: string;
  tileWidth: number;
  tileHeight: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fields: FieldType<any>[];
  chips: ChipProperty[];
}

export interface ChipProperty {
  index: number;
  values: Record<string, unknown>;
}

export interface Prefab {
  id: string;
  name: string;
  components: Component[];
}
