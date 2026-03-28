import type { GameContext } from '../runtime/GameContext';
import { EventAction } from './EventAction';

export class AudioAction extends EventAction {
  readonly type = 'audio';
  operation: 'playBGM' | 'stopBGM' | 'playSE' = 'playBGM';
  audioId?: string;
  volume?: number;
  fadeIn?: number;
  fadeOut?: number;
  pitch?: number;

  async execute(
    context: GameContext,
    _run: (actions: EventAction[]) => Promise<void>
  ): Promise<void> {
    switch (this.operation) {
      case 'playBGM':
        if (this.audioId) {
          context.sound.playBGM(this.audioId, {
            volume: this.volume,
            loop: true,
            fadeIn: this.fadeIn,
          });
        }
        break;
      case 'playSE':
        if (this.audioId) {
          context.sound.playSE(this.audioId, { volume: this.volume });
        }
        break;
      case 'stopBGM':
        context.sound.stopBGM(this.fadeOut);
        break;
    }
  }

  toJSON(): Record<string, unknown> {
    return {
      operation: this.operation,
      audioId: this.audioId,
      volume: this.volume,
      fadeIn: this.fadeIn,
      fadeOut: this.fadeOut,
      pitch: this.pitch,
    };
  }

  fromJSON(data: Record<string, unknown>): void {
    this.operation = data.operation as AudioAction['operation'];
    this.audioId = data.audioId as string | undefined;
    this.volume = data.volume as number | undefined;
    this.fadeIn = data.fadeIn as number | undefined;
    this.fadeOut = data.fadeOut as number | undefined;
    this.pitch = data.pitch as number | undefined;
  }
}
