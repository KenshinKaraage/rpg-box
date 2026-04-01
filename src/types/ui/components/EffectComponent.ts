import { UIComponent, type PropertyDef } from '../UIComponent';

export class EffectComponent extends UIComponent {
  readonly type = 'effect';
  readonly label = 'エフェクト';

  /** スプライトシートのアセットID */
  effectId = '';
  /** 1フレームの幅（px） */
  frameWidth = 0;
  /** 1フレームの高さ（px） */
  frameHeight = 0;
  /** フレーム数 */
  frameCount = 1;
  /** フレーム間隔（ms） */
  intervalMs = 100;
  /** ループ再生 */
  loop = false;
  /** 再生完了時の動作 */
  onComplete: 'hide' | 'none' = 'hide';

  /** ランタイム用: 現在の切り出し領域（generateRuntimeScript が更新） */
  cropX = 0;
  cropY = 0;
  cropW = 0;
  cropH = 0;

  getPropertyDefs(): PropertyDef[] {
    return [
      { key: 'effectId', label: 'エフェクト画像', type: 'assetImage' },
      { key: 'frameWidth', label: 'フレーム幅', type: 'number', min: 0 },
      { key: 'frameHeight', label: 'フレーム高さ', type: 'number', min: 0 },
      { key: 'frameCount', label: 'フレーム数', type: 'number', min: 1 },
      { key: 'intervalMs', label: '間隔(ms)', type: 'number', min: 1 },
      { key: 'loop', label: 'ループ', type: 'boolean' },
      {
        key: 'onComplete',
        label: '完了時',
        type: 'select',
        options: [
          { value: 'hide', label: '非表示' },
          { value: 'none', label: '何もしない' },
        ],
      },
    ];
  }

  serialize(): unknown {
    return {
      effectId: this.effectId,
      frameWidth: this.frameWidth,
      frameHeight: this.frameHeight,
      frameCount: this.frameCount,
      intervalMs: this.intervalMs,
      loop: this.loop,
      onComplete: this.onComplete,
      cropX: this.cropX,
      cropY: this.cropY,
      cropW: this.cropW,
      cropH: this.cropH,
    };
  }

  deserialize(data: unknown): void {
    const d = data as Record<string, unknown>;
    this.effectId = (d.effectId as string) ?? '';
    this.frameWidth = (d.frameWidth as number) ?? 0;
    this.frameHeight = (d.frameHeight as number) ?? 0;
    this.frameCount = (d.frameCount as number) ?? 1;
    this.intervalMs = (d.intervalMs as number) ?? 100;
    this.loop = (d.loop as boolean) ?? false;
    this.onComplete = (d.onComplete as 'hide' | 'none') ?? 'hide';
    this.cropX = (d.cropX as number) ?? 0;
    this.cropY = (d.cropY as number) ?? 0;
    this.cropW = (d.cropW as number) ?? 0;
    this.cropH = (d.cropH as number) ?? 0;
  }

  clone(): EffectComponent {
    const c = new EffectComponent();
    c.effectId = this.effectId;
    c.frameWidth = this.frameWidth;
    c.frameHeight = this.frameHeight;
    c.frameCount = this.frameCount;
    c.intervalMs = this.intervalMs;
    c.loop = this.loop;
    c.onComplete = this.onComplete;
    c.cropX = this.cropX;
    c.cropY = this.cropY;
    c.cropW = this.cropW;
    c.cropH = this.cropH;
    return c;
  }

  generateRuntimeScript(): string {
    const fw = this.frameWidth;
    const fh = this.frameHeight;
    const count = this.frameCount;
    const interval = this.intervalMs;
    const loop = this.loop;
    const onComplete = JSON.stringify(this.onComplete);

    return `({
  onShow() {
    self.state.elapsed = 0;
    self.state.frame = -1;
    self.state.finished = false;
    self.state._resolve = null;
    this._setFrame(0);
  },

  onUpdate(dt) {
    if (self.state.finished) return;

    self.state.elapsed += dt * 1000;
    const newFrame = Math.floor(self.state.elapsed / ${interval});

    if (!${loop} && newFrame >= ${count}) {
      self.state.finished = true;
      this._setFrame(${count} - 1);
      if (${onComplete} === "hide") {
        self.object.visible = false;
      }
      if (self.state._resolve) {
        self.state._resolve();
        self.state._resolve = null;
      }
      return;
    }

    const frame = ${loop} ? newFrame % ${count} : Math.min(newFrame, ${count} - 1);
    if (frame !== self.state.frame) {
      this._setFrame(frame);
    }
  },

  async play() {
    this.reset();
    if (${loop}) return; // ループ再生は完了を待たない
    return new Promise((resolve) => {
      self.state._resolve = resolve;
    });
  },

  _setFrame(frame) {
    self.state.frame = frame;
    self.object.setProperty("effect", "cropX", frame * ${fw});
    self.object.setProperty("effect", "cropY", 0);
    self.object.setProperty("effect", "cropW", ${fw});
    self.object.setProperty("effect", "cropH", ${fh});
  },

  isFinished() {
    return !!self.state.finished;
  },

  reset() {
    self.state.elapsed = 0;
    self.state.frame = -1;
    self.state.finished = false;
    if (self.state._resolve) {
      self.state._resolve();
      self.state._resolve = null;
    }
    self.object.visible = true;
    this._setFrame(0);
  }
})`;
  }
}
