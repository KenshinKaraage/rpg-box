import type { Component } from './components/Component';
import type { FieldType } from './fields/FieldType';

/**
 * プレハブに付与されたコンポーネントのインスタンス
 * スクリプトID とフィールドの現在値を保持する
 */
export interface PrefabComponent {
  /** コンポーネントスクリプトの ID（Script.id） */
  scriptId: string;
  /** フィールド名 → 現在値 のマップ */
  fieldValues: Record<string, unknown>;
}

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
  visible?: boolean; // エディタでの表示/非表示（省略時 = 表示）
  chipsetIds: string[]; // このレイヤーで使用するチップセットIDの配列
  tiles?: string[][]; // tiles[y][x] = "chipsetId:chipIndex" 形式
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
  autotile: boolean;
  animated: boolean;
  animFrameCount: number; // アニメーションのフレーム数（animated=true の時のみ有効）
  animIntervalMs: number; // フレーム間隔 ms（animated=true の時のみ有効）
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
  components: PrefabComponent[];
}
