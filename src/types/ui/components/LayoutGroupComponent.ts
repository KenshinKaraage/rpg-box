import { UIComponent, type PropertyDef, type EditorActionContext } from '../UIComponent';

interface LayoutChild {
  id: string;
  transform: { width: number; height: number };
  components: { type: string; data: unknown }[];
}

interface LayoutElementData {
  participate?: boolean;
  space?: number;
}

function getLayoutElement(child: LayoutChild): LayoutElementData | null {
  const comp = child.components.find((c) => c.type === 'layoutElement');
  return comp ? (comp.data as LayoutElementData) : null;
}

function resolveAlignment(
  alignment: 'start' | 'center' | 'end',
  childSize: number,
  parentSize: number
): number {
  switch (alignment) {
    case 'center':
      return (parentSize - childSize) / 2;
    case 'end':
      return parentSize - childSize;
    default:
      return 0;
  }
}

export class LayoutGroupComponent extends UIComponent {
  readonly type = 'layoutGroup';
  readonly label = 'レイアウトグループ';

  direction: 'horizontal' | 'vertical' = 'vertical';
  spacing = 0;
  paddingTop = 0;
  paddingBottom = 0;
  paddingLeft = 0;
  paddingRight = 0;
  alignment: 'start' | 'center' | 'end' = 'start';
  reverseOrder = false;

  getPropertyDefs(): PropertyDef[] {
    return [
      {
        key: 'direction',
        label: '方向',
        type: 'select',
        options: [
          { value: 'vertical', label: '垂直' },
          { value: 'horizontal', label: '水平' },
        ],
      },
      { key: 'spacing', label: '間隔', type: 'number', min: 0 },
      { key: 'paddingTop', label: '上余白', type: 'number', min: 0 },
      { key: 'paddingBottom', label: '下余白', type: 'number', min: 0 },
      { key: 'paddingLeft', label: '左余白', type: 'number', min: 0 },
      { key: 'paddingRight', label: '右余白', type: 'number', min: 0 },
      {
        key: 'alignment',
        label: '配置',
        type: 'select',
        options: [
          { value: 'start', label: '先頭' },
          { value: 'center', label: '中央' },
          { value: 'end', label: '末尾' },
        ],
      },
      { key: 'reverseOrder', label: '逆順', type: 'boolean' },
    ];
  }

  getEditorActions() {
    return [{ label: '子オブジェクトを整列', icon: 'align', key: 'align' }];
  }

  private static align(context: EditorActionContext): Map<string, { x: number; y: number }> {
    return LayoutGroupComponent.alignChildren(
      context.children,
      context.componentData,
      context.parentTransform.width,
      context.parentTransform.height
    );
  }

  static executeEditorAction(
    key: string,
    context: EditorActionContext
  ): Map<string, { x: number; y: number }> | null {
    if (key === 'align') return LayoutGroupComponent.align(context);
    return null;
  }

  static onAttach(context: EditorActionContext): Map<string, { x: number; y: number }> | null {
    return LayoutGroupComponent.align(context);
  }

  static onPropertyChange(
    context: EditorActionContext
  ): Map<string, { x: number; y: number }> | null {
    return LayoutGroupComponent.align(context);
  }

  /**
   * 子オブジェクトの配置を計算する（エディタ・layoutResolver 共用）
   */
  static alignChildren(
    children: LayoutChild[],
    data: Record<string, unknown>,
    parentWidth: number,
    parentHeight: number
  ): Map<string, { x: number; y: number }> {
    const result = new Map<string, { x: number; y: number }>();
    const direction = (data.direction as string) ?? 'vertical';
    const spacing = (data.spacing as number) ?? 0;
    const padTop = (data.paddingTop as number) ?? 0;
    const padBottom = (data.paddingBottom as number) ?? 0;
    const padLeft = (data.paddingLeft as number) ?? 0;
    const padRight = (data.paddingRight as number) ?? 0;
    const alignment = (data.alignment as 'start' | 'center' | 'end') ?? 'start';
    const reverse = (data.reverseOrder as boolean) ?? false;

    const innerWidth = parentWidth - padLeft - padRight;
    const innerHeight = parentHeight - padTop - padBottom;
    const ordered = reverse ? [...children].reverse() : children;
    let cursor = direction === 'vertical' ? padTop : padLeft;

    for (const child of ordered) {
      const le = getLayoutElement(child);
      if (le && le.participate === false) continue;

      const w = child.transform.width;
      const h = child.transform.height;
      const extraSpace = le?.space ?? 0;

      let x: number;
      let y: number;

      if (direction === 'vertical') {
        y = cursor;
        x = padLeft + resolveAlignment(alignment, w, innerWidth);
        cursor += h + spacing + extraSpace;
      } else {
        x = cursor;
        y = padTop + resolveAlignment(alignment, h, innerHeight);
        cursor += w + spacing + extraSpace;
      }

      result.set(child.id, { x, y });
    }

    return result;
  }

  serialize(): Record<string, unknown> {
    return {
      direction: this.direction,
      spacing: this.spacing,
      paddingTop: this.paddingTop,
      paddingBottom: this.paddingBottom,
      paddingLeft: this.paddingLeft,
      paddingRight: this.paddingRight,
      alignment: this.alignment,
      reverseOrder: this.reverseOrder,
    };
  }

  deserialize(data: Record<string, unknown>): void {
    this.direction = (data.direction as 'horizontal' | 'vertical') ?? 'vertical';
    this.spacing = (data.spacing as number) ?? 0;
    this.paddingTop = (data.paddingTop as number) ?? 0;
    this.paddingBottom = (data.paddingBottom as number) ?? 0;
    this.paddingLeft = (data.paddingLeft as number) ?? 0;
    this.paddingRight = (data.paddingRight as number) ?? 0;
    this.alignment = (data.alignment as 'start' | 'center' | 'end') ?? 'start';
    this.reverseOrder = (data.reverseOrder as boolean) ?? false;
  }

  generateRuntimeScript(): string | null {
    const dir = JSON.stringify(this.direction);
    const spacing = this.spacing;
    const padTop = this.paddingTop;
    const padLeft = this.paddingLeft;
    const padRight = this.paddingRight;
    const padBottom = this.paddingBottom;
    const alignment = JSON.stringify(this.alignment);
    const reverse = this.reverseOrder;

    return `({
  align() {
    const direction = ${dir};
    const spacing = ${spacing};
    const padTop = ${padTop};
    const padLeft = ${padLeft};
    const padRight = ${padRight};
    const padBottom = ${padBottom};
    const alignment = ${alignment};
    const reverse = ${reverse};

    const parentW = self.object.width;
    const parentH = self.object.height;
    const innerW = parentW - padLeft - padRight;
    const innerH = parentH - padTop - padBottom;

    const children = reverse ? [...self.children].reverse() : self.children;
    let cursor = direction === "vertical" ? padTop : padLeft;

    for (const child of children) {
      // 非表示の子はスキップ（テンプレート元など）
      if (!child.visible) continue;
      const le = child.getComponentData && child.getComponentData("layoutElement");
      if (le && le.participate === false) continue;

      const w = child.width;
      const h = child.height;
      const extra = (le && le.space) || 0;

      if (direction === "vertical") {
        child.y = cursor;
        if (alignment === "center") child.x = padLeft + (innerW - w) / 2;
        else if (alignment === "end") child.x = padLeft + innerW - w;
        else child.x = padLeft;
        cursor += h + spacing + extra;
      } else {
        child.x = cursor;
        if (alignment === "center") child.y = padTop + (innerH - h) / 2;
        else if (alignment === "end") child.y = padTop + innerH - h;
        else child.y = padTop;
        cursor += w + spacing + extra;
      }
    }
  }
})`;
  }

  clone(): LayoutGroupComponent {
    const c = new LayoutGroupComponent();
    c.direction = this.direction;
    c.spacing = this.spacing;
    c.paddingTop = this.paddingTop;
    c.paddingBottom = this.paddingBottom;
    c.paddingLeft = this.paddingLeft;
    c.paddingRight = this.paddingRight;
    c.alignment = this.alignment;
    c.reverseOrder = this.reverseOrder;
    return c;
  }
}
