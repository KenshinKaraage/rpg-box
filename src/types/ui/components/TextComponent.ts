import { UIComponent } from '../UIComponent';

export class TextComponent extends UIComponent {
  readonly type = 'text';
  readonly label = 'テキスト';

  content = '';
  fontSize = 16;
  fontId?: string;
  color = '#000000';
  align: 'left' | 'center' | 'right' = 'left';
  verticalAlign: 'top' | 'middle' | 'bottom' = 'top';
  lineHeight = 1.2;

  serialize(): unknown {
    return {
      content: this.content,
      fontSize: this.fontSize,
      fontId: this.fontId,
      color: this.color,
      align: this.align,
      verticalAlign: this.verticalAlign,
      lineHeight: this.lineHeight,
    };
  }

  deserialize(data: unknown): void {
    const d = data as Record<string, unknown>;
    this.content = (d.content as string) ?? '';
    this.fontSize = (d.fontSize as number) ?? 16;
    this.fontId = d.fontId as string | undefined;
    this.color = (d.color as string) ?? '#000000';
    this.align = (d.align as 'left' | 'center' | 'right') ?? 'left';
    this.verticalAlign = (d.verticalAlign as 'top' | 'middle' | 'bottom') ?? 'top';
    this.lineHeight = (d.lineHeight as number) ?? 1.2;
  }

  clone(): TextComponent {
    const c = new TextComponent();
    c.content = this.content;
    c.fontSize = this.fontSize;
    c.fontId = this.fontId;
    c.color = this.color;
    c.align = this.align;
    c.verticalAlign = this.verticalAlign;
    c.lineHeight = this.lineHeight;
    return c;
  }
}
