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

  loadMap(map: GameMap, chipsets: Chipset[], prefabs: Prefab[]): void {
    this.currentMap = map;
    this.chipsets = chipsets;
    this.objects = [];
    this.activeController = null;

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
        }
        continue;
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
      }
    }
    return completions;
  }

  canMove(fromX: number, fromY: number, toX: number, toY: number): boolean {
    if (!this.currentMap) return false;
    if (toX < 0 || toY < 0 || toX >= this.currentMap.width || toY >= this.currentMap.height) return false;
    if (!this.isTilePassable(toX, toY)) return false;

    for (const obj of this.objects) {
      if (obj.gridX === toX && obj.gridY === toY && !obj.isMoving) {
        const collider = obj.components['collider'];
        if (collider && !collider.passable) return false;
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
    if (movement && movement.pattern === 'random') {
      if (this.eventRunning && (movement.stopOnEvent ?? true)) return null;
      if (Math.random() > 0.005) return null;
      const dirs: Direction[] = ['up', 'down', 'left', 'right'];
      return dirs[Math.floor(Math.random() * dirs.length)]!;
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
      components[comp.type] = (comp.data as Record<string, unknown>) ?? {};
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
