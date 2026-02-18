import type { GameContext } from '../runtime/GameContext';
import { EventAction } from './EventAction';

export class CameraAction extends EventAction {
  readonly type = 'camera';
  operation: 'zoom' | 'pan' | 'effect' | 'reset' = 'pan';
  scale?: number;
  x?: number;
  y?: number;
  duration?: number;
  effect?: 'shake' | 'flash' | 'fadeIn' | 'fadeOut';
  intensity?: number;
  color?: string;

  async execute(
    context: GameContext,
    _run: (actions: EventAction[]) => Promise<void>
  ): Promise<void> {
    switch (this.operation) {
      case 'pan':
        context.camera.moveTo(this.x ?? 0, this.y ?? 0);
        break;
      case 'effect':
        if (this.effect === 'shake') {
          context.camera.shake(this.intensity ?? 5, this.duration ?? 30);
        }
        break;
      case 'zoom':
      case 'reset':
        break;
    }
  }

  toJSON(): Record<string, unknown> {
    return {
      operation: this.operation,
      scale: this.scale,
      x: this.x,
      y: this.y,
      duration: this.duration,
      effect: this.effect,
      intensity: this.intensity,
      color: this.color,
    };
  }

  fromJSON(data: Record<string, unknown>): void {
    this.operation = data.operation as CameraAction['operation'];
    this.scale = data.scale as number | undefined;
    this.x = data.x as number | undefined;
    this.y = data.y as number | undefined;
    this.duration = data.duration as number | undefined;
    this.effect = data.effect as CameraAction['effect'];
    this.intensity = data.intensity as number | undefined;
    this.color = data.color as string | undefined;
  }
}
