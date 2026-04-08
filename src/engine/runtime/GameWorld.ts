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
  /** このオブジェクトが属するレイヤーID */
  layerId: string;
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
  /** エフェクト再生の経過時間（オブジェクトID → elapsed ms） */
  private effectTimers = new Map<string, number>();
  /** 向き変更ウェイト（オブジェクトID → elapsed）。移動1歩分の時間が経つまで次のステップを待つ */
  private faceWaitTimers = new Map<string, number>();

  loadMap(map: GameMap, chipsets: Chipset[], prefabs: Prefab[]): void {
    this.currentMap = map;
    this.chipsets = chipsets;
    this.objects = [];
    this.activeController = null;
    this.routeIndices.clear();
    this.faceWaitTimers.clear();

    for (const layer of map.layers) {
      if (layer.type !== 'object' || !layer.objects) continue;
      for (const obj of layer.objects) {
        const resolved = this.resolveObject(obj, prefabs);
        const rtObj = this.createRuntimeObject(resolved, layer.id);
        this.objects.push(rtObj);
      }
    }

    // Default: first object with ControllerComponent becomes activeController
    this.activeController = this.objects.find((o) => o.components['controller'] != null) ?? null;
  }

  getCurrentMap(): GameMap | null {
    return this.currentMap;
  }

  get isEventRunning(): boolean {
    return this.eventRunning;
  }

  setEventRunning(running: boolean): void {
    this.eventRunning = running;
  }

  update(dt: number, input: InputManager): { obj: RuntimeObject; fromX: number; fromY: number }[] {
    const completions: { obj: RuntimeObject; fromX: number; fromY: number }[] = [];

    for (const obj of this.objects) {
      // 向き変更ウェイト中: 移動1歩分の時間が経つまでスキップ
      const faceWait = this.faceWaitTimers.get(obj.id);
      if (faceWait !== undefined) {
        const speed = (obj.components['movement']?.speed as number) ?? 1;
        const moveTime = 1 / (speed * 4); // advanceMovement と同じ速度計算
        const elapsed = faceWait + dt;
        if (elapsed < moveTime) {
          this.faceWaitTimers.set(obj.id, elapsed);
          continue;
        }
        this.faceWaitTimers.delete(obj.id);
      }

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

      if (this.canMove(obj, obj.gridX, obj.gridY, toX, toY)) {
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

  canMove(
    movingObj: RuntimeObject,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number
  ): boolean {
    if (!this.currentMap) return false;
    if (toX < 0 || toY < 0 || toX >= this.currentMap.width || toY >= this.currentMap.height)
      return false;

    const movingCollider = movingObj.components['collider'];
    const collideLayers: string[] | null = movingCollider
      ? ((movingCollider.collideLayers as string[]) ?? null)
      : null;

    // タイルレイヤーとの衝突判定
    // collideLayers が null（Collider なし）→ 全タイルレイヤーと衝突
    if (!this.isTilePassable(toX, toY, collideLayers)) return false;

    // オブジェクトとの衝突判定
    for (const obj of this.objects) {
      if (obj.id === movingObj.id) continue;
      // collideLayers が null → 全オブジェクトと衝突
      if (collideLayers !== null && !collideLayers.includes(obj.layerId)) continue;

      const collider = obj.components['collider'];
      if (!collider) continue;

      // 停止中: 現在位置でブロック
      if (!obj.isMoving && obj.gridX === toX && obj.gridY === toY) return false;
      // 移動中: 移動先タイルもブロック（すれ違い防止）
      if (obj.isMoving && obj.moveTargetX === toX && obj.moveTargetY === toY) return false;
    }
    return true;
  }

  getObjectAtTile(x: number, y: number): RuntimeObject | null {
    return this.objects.find((o) => o.gridX === x && o.gridY === y) ?? null;
  }

  findByName(name: string): RuntimeObject | null {
    return this.objects.find((o) => o.name === name) ?? null;
  }

  findById(id: string): RuntimeObject | null {
    return this.objects.find((o) => o.id === id) ?? null;
  }

  removeObject(id: string): void {
    this.objects = this.objects.filter((o) => o.id !== id);
    if (this.activeController?.id === id) {
      this.activeController = null;
    }
  }

  /** プレハブからオブジェクトを動的生成してワールドに追加 */
  spawnFromPrefab(prefab: Prefab, x: number, y: number): RuntimeObject | null {
    if (!this.currentMap) return null;
    // オブジェクトレイヤーを探す（最初の object レイヤー）
    const objLayer = this.currentMap.layers.find((l) => l.type === 'object');
    if (!objLayer) return null;

    const mapObj: MapObject = {
      id: `spawned_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: prefab.name,
      prefabId: prefab.id,
      components: [],
    };
    const resolved = this.resolveObject(mapObj, [prefab]);

    // Transform を上書き
    const rtObj = this.createRuntimeObject(resolved, objLayer.id);
    rtObj.gridX = x;
    rtObj.gridY = y;
    rtObj.pixelX = x * TILE_SIZE;
    rtObj.pixelY = y * TILE_SIZE;

    this.objects.push(rtObj);
    return rtObj;
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
      const steps = (movement.routeSteps as unknown[]) ?? [];
      if (steps.length === 0) return null;

      let currentIndex = this.routeIndices.get(obj.id) ?? 0;
      if (currentIndex >= steps.length) {
        const loop = (movement.routeLoop as boolean) ?? true;
        if (!loop) return null;
        currentIndex = 0;
        this.routeIndices.set(obj.id, 0);
      }

      const step = steps[currentIndex]!;
      // 新形式: { type, direction } or 旧形式: string
      const stepType =
        typeof step === 'object' && step !== null ? (step as { type: string }).type : 'move';
      const stepDir = typeof step === 'string' ? step : (step as { direction: string }).direction;

      if (stepType === 'face') {
        // 向き変更: 移動せず向きだけ変える
        // 移動と同じテンポにするため、ウェイトをセット
        obj.facing = stepDir as Direction;
        this.faceWaitTimers.set(obj.id, 0);
        this.routeIndices.set(obj.id, currentIndex + 1);
        return null;
      }

      return stepDir as Direction;
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

  // ── Movement ──

  startMove(obj: RuntimeObject, toX: number, toY: number): void {
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

  private isTilePassable(x: number, y: number, collideLayers: string[] | null): boolean {
    if (!this.currentMap) return false;

    for (const layer of this.currentMap.layers) {
      if (layer.type !== 'tile' || !layer.tiles) continue;
      // collideLayers が null → 全タイルレイヤーと衝突
      // collideLayers が配列 → 指定レイヤーのみ
      if (collideLayers !== null && !collideLayers.includes(layer.id)) continue;
      const row = layer.tiles[y];
      if (!row) continue;
      const cell = row[x];
      if (!cell) continue;

      const [chipsetId, indexStr] = cell.split(':');
      if (!chipsetId || !indexStr) continue;
      const chipset = this.chipsets.find((c) => c.id === chipsetId);
      if (!chipset) continue;
      const chip = chipset.chips.find((c) => c.index === parseInt(indexStr, 10));
      // チップのプロパティが未設定 → デフォルトで通行不可
      if (!chip) return false;
      // passable が明示的に true でなければ通行不可
      if (chip.values.passable !== true) return false;
    }
    return true;
  }

  // ── Private: Object creation ──

  private resolveObject(obj: MapObject, prefabs: Prefab[]): MapObject {
    if (!obj.prefabId) return obj;
    const prefab = prefabs.find((p) => p.id === obj.prefabId);
    if (!prefab) return obj;

    const mergedComponents: SerializedComponent[] = [...prefab.prefab.components];
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

  private createRuntimeObject(obj: MapObject, layerId: string): RuntimeObject {
    const components: Record<string, Record<string, unknown>> = {};
    for (const comp of obj.components) {
      // Component クラスインスタンスの場合は serialize() でデータ取得
      if (
        typeof (comp as unknown as { serialize: () => Record<string, unknown> }).serialize ===
        'function'
      ) {
        components[comp.type] = (
          comp as unknown as { serialize: () => Record<string, unknown> }
        ).serialize();
      } else {
        // SerializedComponent（storage types）の場合は .data を使う
        components[comp.type] =
          ((comp as unknown as { data: unknown }).data as Record<string, unknown>) ?? {};
      }
    }

    const transform = components['transform'] ?? {};
    const gx = (transform.x as number) ?? 0;
    const gy = (transform.y as number) ?? 0;

    return {
      id: obj.id,
      name: obj.name,
      components,
      layerId,
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
