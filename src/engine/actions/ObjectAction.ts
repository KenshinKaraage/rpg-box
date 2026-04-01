import type { GameContext, ObjectProxy } from '../runtime/GameContext';
import { EventAction, type EventExecuteOptions } from './EventAction';

type Direction = 'up' | 'down' | 'left' | 'right';

/** 現在位置から目的地への1歩分の方向を返す。到着済みなら null */
function nextDirection(fromX: number, fromY: number, toX: number, toY: number): Direction | null {
  const dx = toX - fromX;
  const dy = toY - fromY;
  if (dx === 0 && dy === 0) return null;
  // 距離が大きい軸を優先（単純な直線移動）
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx > 0 ? 'right' : 'left';
  }
  return dy > 0 ? 'down' : 'up';
}

export class ObjectAction extends EventAction {
  readonly type = 'object';
  operation: 'move' | 'face' | 'visible' = 'move';
  /** 対象オブジェクト名。"self" でトリガー元オブジェクト */
  targetName = '';
  /** 移動方式: teleport=即座に移動、walk=グリッド歩行 */
  moveType: 'teleport' | 'walk' = 'teleport';
  x?: number;
  y?: number;
  direction?: Direction;
  visible?: boolean;

  async execute(
    context: GameContext,
    _run: (actions: EventAction[]) => Promise<void>,
    options?: EventExecuteOptions
  ): Promise<void> {
    // オブジェクト解決: "self" はトリガー元、それ以外は名前検索
    const obj = (this.targetName === 'self'
      ? options?.selfObject
      : context.object.find(this.targetName)) as ObjectProxy | null;
    if (!obj) return;

    switch (this.operation) {
      case 'move':
        if (this.x !== undefined && this.y !== undefined) {
          if (this.moveType === 'walk') {
            await this.walkTo(obj, this.x, this.y, context);
          } else {
            obj.setPosition(this.x, this.y);
          }
        }
        break;
      case 'face':
        if (this.direction) {
          obj.setFacing(this.direction);
        }
        break;
      case 'visible':
        if (this.visible !== undefined) {
          obj.setVisible(this.visible);
        }
        break;
    }
  }

  /** moveStep を使い1歩ずつ目的地まで歩行 */
  private async walkTo(
    obj: ObjectProxy,
    targetX: number,
    targetY: number,
    context: GameContext
  ): Promise<void> {
    const MAX_STEPS = 200; // 無限ループ防止
    for (let i = 0; i < MAX_STEPS; i++) {
      // 移動中なら完了を待つ
      while (obj.isMoving()) {
        await context.waitFrames(1);
      }
      const pos = obj.getPosition();
      const dir = nextDirection(pos.x, pos.y, targetX, targetY);
      if (!dir) break; // 到着
      if (!obj.moveStep(dir)) {
        // 移動不可（障害物等）→ 諦める
        break;
      }
    }
    // 最後の1歩の完了を待つ
    while (obj.isMoving()) {
      await context.waitFrames(1);
    }
  }

  toJSON(): Record<string, unknown> {
    return {
      operation: this.operation,
      targetName: this.targetName,
      moveType: this.moveType,
      x: this.x,
      y: this.y,
      direction: this.direction,
      visible: this.visible,
    };
  }

  fromJSON(data: Record<string, unknown>): void {
    this.operation = (data.operation as ObjectAction['operation']) ?? 'move';
    this.targetName = (data.targetName as string) ?? (data.targetId as string) ?? '';
    this.moveType = (data.moveType as 'teleport' | 'walk') ?? 'teleport';
    this.x = data.x as number | undefined;
    this.y = data.y as number | undefined;
    this.direction = data.direction as 'up' | 'down' | 'left' | 'right' | undefined;
    this.visible = data.visible as boolean | undefined;
  }
}
