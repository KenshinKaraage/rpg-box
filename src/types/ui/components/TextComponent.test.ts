import { TextComponent } from './TextComponent';

describe('TextComponent', () => {
  it('has type "text"', () => {
    const c = new TextComponent();
    expect(c.type).toBe('text');
  });

  it('has label "テキスト"', () => {
    const c = new TextComponent();
    expect(c.label).toBe('テキスト');
  });

  it('has correct default values', () => {
    const c = new TextComponent();
    expect(c.content).toBe('');
    expect(c.fontSize).toBe(16);
    expect(c.fontId).toBeUndefined();
    expect(c.color).toBe('#000000');
    expect(c.align).toBe('left');
    expect(c.verticalAlign).toBe('top');
    expect(c.lineHeight).toBe(1.2);
  });

  it('round-trips serialize and deserialize', () => {
    const c = new TextComponent();
    c.content = 'Hello World';
    c.fontSize = 24;
    c.fontId = 'font_gothic';
    c.color = '#ffffff';
    c.align = 'center';
    c.verticalAlign = 'middle';
    c.lineHeight = 1.5;

    const data = c.serialize();
    const c2 = new TextComponent();
    c2.deserialize(data);

    expect(c2.content).toBe('Hello World');
    expect(c2.fontSize).toBe(24);
    expect(c2.fontId).toBe('font_gothic');
    expect(c2.color).toBe('#ffffff');
    expect(c2.align).toBe('center');
    expect(c2.verticalAlign).toBe('middle');
    expect(c2.lineHeight).toBe(1.5);
  });

  it('deserialize with empty object falls back to defaults', () => {
    const c = new TextComponent();
    c.deserialize({});

    expect(c.content).toBe('');
    expect(c.fontSize).toBe(16);
    expect(c.fontId).toBeUndefined();
    expect(c.color).toBe('#000000');
    expect(c.align).toBe('left');
    expect(c.verticalAlign).toBe('top');
    expect(c.lineHeight).toBe(1.2);
  });

  it('clone creates independent copy', () => {
    const c = new TextComponent();
    c.content = 'Original';
    c.fontSize = 24;
    c.color = '#ff0000';

    const cloned = c.clone();
    cloned.content = 'Cloned';
    cloned.fontSize = 32;

    expect(c.content).toBe('Original');
    expect(c.fontSize).toBe(24);
    expect(cloned.content).toBe('Cloned');
    expect(cloned.fontSize).toBe(32);
  });
});
