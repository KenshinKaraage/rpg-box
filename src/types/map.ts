import type { Component } from './components/Component';

export interface GameMap {
  id: string;
  name: string;
  width: number; // 20-999
  height: number; // 15-999
  layers: MapLayer[];
  bgmId?: string;
  backgroundImageId?: string;
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
  chips: ChipProperty[];
}

export interface ChipProperty {
  index: number;
  passable: boolean;
  footstepType?: string;
}

export interface Prefab {
  id: string;
  name: string;
  components: Component[];
}
