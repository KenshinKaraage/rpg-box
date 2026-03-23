import { UIAction, type UIActionManager } from './UIAction';

/**
 * UIオブジェクトの AnimationComponent を発動するアクション
 *
 * 対象オブジェクトに AnimationComponent が付いている前提で動作する。
 */
export class PlayAnimationAction extends UIAction {
  readonly type = 'uiPlayAnimation';

  targetId: string = '';
  /** Name of the animation to play (from AnimationComponent.animations) */
  animationName: string = '';
  autoPlay: boolean = true;
  loop: boolean = false;
  /** If true, subsequent actions wait for this animation to finish before executing */
  wait: boolean = false;

  async execute(canvasId: string, manager: UIActionManager): Promise<void> {
    if (!this.targetId || !this.animationName) return;
    await manager.playAnimation(canvasId, this.targetId, this.animationName, { wait: this.wait });
  }

  toJSON(): Record<string, unknown> {
    return {
      targetId: this.targetId,
      animationName: this.animationName,
      autoPlay: this.autoPlay,
      loop: this.loop,
      wait: this.wait,
    };
  }

  fromJSON(data: Record<string, unknown>): void {
    this.targetId = (data.targetId as string) ?? '';
    this.animationName = (data.animationName as string) ?? '';
    this.autoPlay = (data.autoPlay as boolean) ?? true;
    this.loop = (data.loop as boolean) ?? false;
    this.wait = (data.wait as boolean) ?? false;
  }
}
