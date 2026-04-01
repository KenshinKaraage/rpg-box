import { UIComponent, type PropertyDef } from '../UIComponent';

export class ContentFitComponent extends UIComponent {
  readonly type = 'contentFit';
  readonly label = 'コンテンツフィット';

  /** 水平方向にフィットするか */
  fitWidth = false;
  /** 垂直方向にフィットするか */
  fitHeight = true;
  /** 内側の余白（フィット後のサイズに加算） */
  paddingTop = 0;
  paddingBottom = 0;
  paddingLeft = 0;
  paddingRight = 0;

  getPropertyDefs(): PropertyDef[] {
    return [
      { key: 'fitWidth', label: '幅フィット', type: 'boolean' },
      { key: 'fitHeight', label: '高さフィット', type: 'boolean' },
      { key: 'paddingTop', label: '上余白', type: 'number', min: 0 },
      { key: 'paddingBottom', label: '下余白', type: 'number', min: 0 },
      { key: 'paddingLeft', label: '左余白', type: 'number', min: 0 },
      { key: 'paddingRight', label: '右余白', type: 'number', min: 0 },
    ];
  }

  serialize(): Record<string, unknown> {
    return {
      fitWidth: this.fitWidth,
      fitHeight: this.fitHeight,
      paddingTop: this.paddingTop,
      paddingBottom: this.paddingBottom,
      paddingLeft: this.paddingLeft,
      paddingRight: this.paddingRight,
    };
  }

  deserialize(data: Record<string, unknown>): void {
    this.fitWidth = (data.fitWidth as boolean) ?? false;
    this.fitHeight = (data.fitHeight as boolean) ?? true;
    this.paddingTop = (data.paddingTop as number) ?? 0;
    this.paddingBottom = (data.paddingBottom as number) ?? 0;
    this.paddingLeft = (data.paddingLeft as number) ?? 0;
    this.paddingRight = (data.paddingRight as number) ?? 0;
  }

  clone(): ContentFitComponent {
    const c = new ContentFitComponent();
    c.fitWidth = this.fitWidth;
    c.fitHeight = this.fitHeight;
    c.paddingTop = this.paddingTop;
    c.paddingBottom = this.paddingBottom;
    c.paddingLeft = this.paddingLeft;
    c.paddingRight = this.paddingRight;
    return c;
  }

  generateRuntimeScript(): string {
    const fw = this.fitWidth;
    const fh = this.fitHeight;
    const pt = this.paddingTop;
    const pb = this.paddingBottom;
    const pl = this.paddingLeft;
    const pr = this.paddingRight;

    return `({
  fit() {
    const fitWidth = ${fw};
    const fitHeight = ${fh};

    // layoutGroup があればそのパディングを参照、なければ自身のパディングを使用
    const lg = self.object.getComponentData && self.object.getComponentData("layoutGroup");
    const padTop = (lg && lg.paddingTop) || ${pt};
    const padBottom = (lg && lg.paddingBottom) || ${pb};
    const padLeft = (lg && lg.paddingLeft) || ${pl};
    const padRight = (lg && lg.paddingRight) || ${pr};

    let maxRight = 0;
    let maxBottom = 0;

    for (const child of self.children) {
      if (!child.visible) continue;
      if (fitWidth) {
        const right = child.x + child.width;
        if (right > maxRight) maxRight = right;
      }
      if (fitHeight) {
        const bottom = child.y + child.height;
        if (bottom > maxBottom) maxBottom = bottom;
      }
    }

    if (fitWidth) self.object.width = maxRight + padRight;
    if (fitHeight) self.object.height = maxBottom + padBottom;
  }
})`;
  }
}
