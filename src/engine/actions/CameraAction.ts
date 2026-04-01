import type { GameContext } from '../runtime/GameContext';
import { EventAction } from './EventAction';

/** "#rrggbb" → [r, g, b] (0-1) */
function parseHex(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  if (isNaN(r) || isNaN(g) || isNaN(b)) return [0, 0, 0];
  return [r, g, b];
}

/** duration（フレーム数）→ ミリ秒 (60fps 前提) */
function framesToMs(frames: number): number {
  return (frames / 60) * 1000;
}

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
        context.camera.panTo(this.x ?? 0, this.y ?? 0);
        break;
      case 'zoom':
        context.camera.setZoom(this.scale ?? 1);
        break;
      case 'effect':
        await this.executeEffect(context);
        break;
      case 'reset':
        context.camera.reset();
        break;
    }
  }

  private async executeEffect(context: GameContext): Promise<void> {
    const frames = this.duration ?? 30;

    if (this.effect === 'shake') {
      context.camera.shake(this.intensity ?? 5, frames);
      return;
    }

    // flash / fadeIn / fadeOut は Tween でオーバーレイを操作
    if (!context.tween) return;
    const target = context.camera.getOverlayTarget();
    const [r, g, b] = parseHex(this.color ?? '#000000');
    const ms = framesToMs(frames);
    const alpha = Math.max(0, Math.min(1, this.intensity ?? 1));

    switch (this.effect) {
      case 'flash':
        // 色を即座にセットし、alpha→0 に tween
        context.camera.setOverlay(r, g, b, alpha);
        await context.tween.to(target, 'overlayA', 0, ms, 'easeOut');
        break;
      case 'fadeOut':
        // 色をセットし、0→alpha に tween
        context.camera.setOverlay(r, g, b, 0);
        await context.tween.to(target, 'overlayA', alpha, ms, 'easeIn');
        break;
      case 'fadeIn':
        // alpha→0 に tween
        context.camera.setOverlay(r, g, b, alpha);
        await context.tween.to(target, 'overlayA', 0, ms, 'easeOut');
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
