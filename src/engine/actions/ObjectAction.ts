import type { GameContext } from '../runtime/GameContext';
import { EventAction, type EventExecuteOptions } from './EventAction';

export class ObjectAction extends EventAction {
  readonly type = 'object';
  operation: 'move' | 'face' | 'visible' = 'move';
  /** 対象オブジェクト名。"self" でトリガー元オブジェクト */
  targetName = '';
  x?: number;
  y?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  visible?: boolean;

  async execute(
    context: GameContext,
    _run: (actions: EventAction[]) => Promise<void>,
    options?: EventExecuteOptions
  ): Promise<void> {
    // オブジェクト解決: "self" はトリガー元、それ以外は名前検索
    const obj = this.targetName === 'self'
      ? options?.selfObject as { setPosition?: (x: number, y: number) => void; setFacing?: (d: string) => void; setVisible?: (v: boolean) => void } | null
      : context.object.find(this.targetName);
    if (!obj) return;

    switch (this.operation) {
      case 'move':
        if (this.x !== undefined && this.y !== undefined) {
          (obj as { setPosition: (x: number, y: number) => void }).setPosition(this.x, this.y);
        }
        break;
      case 'face':
        if (this.direction) {
          (obj as { setFacing: (d: string) => void }).setFacing(this.direction);
        }
        break;
      case 'visible':
        if (this.visible !== undefined) {
          (obj as { setVisible: (v: boolean) => void }).setVisible(this.visible);
        }
        break;
    }
  }

  toJSON(): Record<string, unknown> {
    return {
      operation: this.operation,
      targetName: this.targetName,
      x: this.x,
      y: this.y,
      direction: this.direction,
      visible: this.visible,
    };
  }

  fromJSON(data: Record<string, unknown>): void {
    this.operation = (data.operation as ObjectAction['operation']) ?? 'move';
    this.targetName = (data.targetName as string) ?? (data.targetId as string) ?? '';
    this.x = data.x as number | undefined;
    this.y = data.y as number | undefined;
    this.direction = data.direction as 'up' | 'down' | 'left' | 'right' | undefined;
    this.visible = data.visible as boolean | undefined;
  }
}
