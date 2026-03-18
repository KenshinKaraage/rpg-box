/**
 * Component-driven map object management.
 * All objects are processed uniformly — ControllerComponent provides input-driven
 * movement, MovementComponent provides autonomous movement. No special "player"
 * code path; activeController is just a reference for camera/triggers.
 */

import type { GameMap, Chipset, Prefab, MapObject, SerializedComponent } from '@/lib/storage/types';
import type { InputManager } from './InputManager';

// ── Constants ──

const TILE_SIZE = 32;

// ── Types ──

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface RuntimeObject {
  id: string;
  name: string;
  components: Record<string, Record<string, unknown>>; // type → serialized data
  gridX: number;
  gridY: number;
  pixelX: number;
  pixelY: number;
  facing: Direction;
  isMoving: boolean;
  moveProgress: number;
  moveTargetX: number;
  moveTargetY: number;
}

// ── Direction helpers ──

const DIR_DELTA: Record<Direction, { dx: number; dy: number }> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

// ── GameWorld ──

export class GameWorld {
  objects: RuntimeObject[] = [];

  /** Object currently used for camera follow and trigger evaluation. */
  activeController: RuntimeObject | null = null;

  private currentMap: GameMap | null = null;
  private chipsets: Chipset[] = [];
  private eventRunning = false;
  /** ルート移動の現在ステップインデックス（オブジェクトID → index） */
  private routeIndices = new Map<string, number>();

  loadMap(map: GameMap, chipsets: Chipset[], prefabs: Prefab[]): void {
    this.currentMap = map;
    this.chipsets = chipsets;
    this.objects = [];
    this.activeController = null;
    this.routeIndices.clear();

    for (const layer of map.layers) {
      if (layer.type !== 'object' || !layer.objects) continue;
      for (const obj of layer.objects) {
        const resolved = this.resolveObject(obj, prefabs);
        const rtObj = this.createRuntimeObject(resolved);
        this.objects.push(rtObj);
      }
    }

    // Default: first object with ControllerComponent becomes activeController
    this.activeController = this.objects.find((o) => o.components['controller'] != null) ?? null;
  }

  getCurrentMap(): GameMap | null {
    return this.currentMap;
  }

  setEventRunning(running: boolean): void {
    this.eventRunning = running;
  }

  update(dt: number, input: InputManager): { obj: RuntimeObject; fromX: number; fromY: number }[] {
    const completions: { obj: RuntimeObject; fromX: number; fromY: number }[] = [];

    for (const obj of this.objects) {
      if (obj.isMoving) {
        const fromX = obj.gridX;
        const fromY = obj.gridY;
        this.advanceMovement(obj, dt);
        if (!obj.isMoving) {
          completions.push({ obj, fromX, fromY });
          // 到着フレームで即次の移動を開始（入力が続いていれば隙間なし）
          // ↓ fallthrough して方向判定へ
        } else {
          continue;
        }
      }

      // Determine direction from component
      const dir = this.resolveDirection(obj, input);
      if (!dir) continue;

      obj.facing = dir;
      const delta = DIR_DELTA[dir];
      const toX = obj.gridX + delta.dx;
      const toY = obj.gridY + delta.dy;

      if (this.canMove(obj.gridX, obj.gridY, toX, toY)) {
        this.startMove(obj, toX, toY);
        // ルート移動の場合、移動成功後にインデックスを進める
        const movement = obj.components['movement'];
        if (movement?.pattern === 'route') {
          const idx = this.routeIndices.get(obj.id) ?? 0;
          this.routeIndices.set(obj.id, idx + 1);
        }
      }
    }
    return completions;
  }

  canMove(fromX: number, fromY: number, toX: number, toY: number): boolean {
    if (!this.currentMap) return false;
    if (toX < 0 || toY < 0 || toX >= this.currentMap.width || toY >= this.currentMap.height) return false;
    if (!this.isTilePassable(toX, toY)) return false;

    for (const obj of this.objects) {
      const collider = obj.components['collider'];
      if (collider && !collider.passable) {
        // 停止中: 現在位置でブロック
        if (!obj.isMoving && obj.gridX === toX && obj.gridY === toY) return false;
        // 移動中: 移動先タイルもブロック（すれ違い防止）
        if (obj.isMoving && obj.moveTargetX === toX && obj.moveTargetY === toY) return false;
      }
    }
    return true;
  }

  getObjectAtTile(x: number, y: number): RuntimeObject | null {
    return this.objects.find((o) => o.gridX === x && o.gridY === y) ?? null;
  }

  // ── Private: Direction resolution ──

  private resolveDirection(obj: RuntimeObject, input: InputManager): Direction | null {
    const controller = obj.components['controller'];
    if (controller) {
      if (this.eventRunning) return null;
      if (!controller.inputEnabled) return null;
      return this.getInputDirection(input);
    }

    const movement = obj.components['movement'];
    if (!movement) return null;
    if (this.eventRunning && (movement.stopOnEvent ?? true)) return null;

    if (movement.pattern === 'random') {
      const activeness = (movement.activeness as number) ?? 3;
      const chance = 0.001 + (activeness - 1) * 0.0016;
      if (Math.random() > chance) return null;
      const dirs: Direction[] = ['up', 'down', 'left', 'right'];
      return dirs[Math.floor(Math.random() * dirs.length)]!;
    }

    if (movement.pattern === 'route') {
      const steps = (movement.routeSteps as Direction[]) ?? [];
      if (steps.length === 0) return null;

      let currentIndex = this.routeIndices.get(obj.id) ?? 0;
      if (currentIndex >= steps.length) {
        const loop = (movement.routeLoop as boolean) ?? true;
        if (!loop) return null;
        currentIndex = 0;
        this.routeIndices.set(obj.id, 0);
      }

      // インデックスは進めない。移動成功後に advanceRouteIndex() で進める
      return steps[currentIndex]!;
    }

    return null;
  }

  private getInputDirection(input: InputManager): Direction | null {
    if (input.isDown('up')) return 'up';
    if (input.isDown('down')) return 'down';
    if (input.isDown('left')) return 'left';
    if (input.isDown('right')) return 'right';
    return null;
  }

  // ── Private: Movement ──

  private startMove(obj: RuntimeObject, toX: number, toY: number): void {
    obj.isMoving = true;
    obj.moveProgress = 0;
    obj.moveTargetX = toX;
    obj.moveTargetY = toY;
  }

  private advanceMovement(obj: RuntimeObject, dt: number): void {
    const speed = this.getMoveSpeed(obj);
    obj.moveProgress += speed * dt;

    if (obj.moveProgress >= 1) {
      obj.gridX = obj.moveTargetX;
      obj.gridY = obj.moveTargetY;
      obj.pixelX = obj.gridX * TILE_SIZE;
      obj.pixelY = obj.gridY * TILE_SIZE;
      obj.isMoving = false;
      obj.moveProgress = 0;
    } else {
      const dx = obj.moveTargetX - obj.gridX;
      const dy = obj.moveTargetY - obj.gridY;
      obj.pixelX = (obj.gridX + dx * obj.moveProgress) * TILE_SIZE;
      obj.pixelY = (obj.gridY + dy * obj.moveProgress) * TILE_SIZE;
    }
  }

  private getMoveSpeed(obj: RuntimeObject): number {
    const controller = obj.components['controller'];
    if (controller) return (controller.moveSpeed as number) ?? 4;
    const movement = obj.components['movement'];
    if (movement) return (movement.speed as number) ?? 2;
    return 4;
  }

  // ── Private: Tile passability ──

  private isTilePassable(x: number, y: number): boolean {
    if (!this.currentMap) return false;

    for (const layer of this.currentMap.layers) {
      if (layer.type !== 'tile' || !layer.tiles) continue;
      const row = layer.tiles[y];
      if (!row) continue;
      const cell = row[x];
      if (!cell) continue;

      const [chipsetId, indexStr] = cell.split(':');
      if (!chipsetId || !indexStr) continue;
      const chipset = this.chipsets.find((c) => c.id === chipsetId);
      if (!chipset) continue;
      const chip = chipset.chips.find((c) => c.index === parseInt(indexStr, 10));
      if (!chip) continue;

      if (chip.values.passable === false) return false;
    }
    return true;
  }

  // ── Private: Object creation ──

  private resolveObject(obj: MapObject, prefabs: Prefab[]): MapObject {
    if (!obj.prefabId) return obj;
    const prefab = prefabs.find((p) => p.id === obj.prefabId);
    if (!prefab) return obj;

    const mergedComponents: SerializedComponent[] = [
      ...prefab.components.map((pc) => ({ type: pc.scriptId ?? '', data: pc.fieldValues ?? {} })),
    ];
    for (const oc of obj.components) {
      const idx = mergedComponents.findIndex((c) => c.type === oc.type);
      if (idx >= 0) {
        mergedComponents[idx] = oc;
      } else {
        mergedComponents.push(oc);
      }
    }
    return { ...obj, components: mergedComponents };
  }

  private createRuntimeObject(obj: MapObject): RuntimeObject {
    const components: Record<string, Record<string, unknown>> = {};
    for (const comp of obj.components) {
      // Component クラスインスタンスの場合は serialize() でデータ取得
      if (typeof (comp as unknown as { serialize: () => Record<string, unknown> }).serialize === 'function') {
        components[comp.type] = (comp as unknown as { serialize: () => Record<string, unknown> }).serialize();
      } else {
        // SerializedComponent（storage types）の場合は .data を使う
        components[comp.type] = ((comp as unknown as { data: unknown }).data as Record<string, unknown>) ?? {};
      }
    }

    const transform = components['transform'] ?? {};
    const gx = (transform.x as number) ?? 0;
    const gy = (transform.y as number) ?? 0;

    return {
      id: obj.id,
      name: obj.name,
      components,
      gridX: gx,
      gridY: gy,
      pixelX: gx * TILE_SIZE,
      pixelY: gy * TILE_SIZE,
      facing: 'down',
      isMoving: false,
      moveProgress: 0,
      moveTargetX: gx,
      moveTargetY: gy,
    };
  }
}
