import { GridLayoutComponent } from './GridLayoutComponent';

describe('GridLayoutComponent', () => {
  it('has type "gridLayout"', () => {
    const c = new GridLayoutComponent();
    expect(c.type).toBe('gridLayout');
  });

  it('has label "グリッドレイアウト"', () => {
    const c = new GridLayoutComponent();
    expect(c.label).toBe('グリッドレイアウト');
  });

  it('has correct default values', () => {
    const c = new GridLayoutComponent();
    expect(c.columns).toBe(2);
    expect(c.spacingX).toBe(0);
    expect(c.spacingY).toBe(0);
    expect(c.cellWidth).toBeUndefined();
    expect(c.cellHeight).toBeUndefined();
  });

  it('round-trips serialize and deserialize', () => {
    const c = new GridLayoutComponent();
    c.columns = 4;
    c.spacingX = 10;
    c.spacingY = 5;
    c.cellWidth = 64;
    c.cellHeight = 48;

    const data = c.serialize();
    const c2 = new GridLayoutComponent();
    c2.deserialize(data);

    expect(c2.columns).toBe(4);
    expect(c2.spacingX).toBe(10);
    expect(c2.spacingY).toBe(5);
    expect(c2.cellWidth).toBe(64);
    expect(c2.cellHeight).toBe(48);
  });

  it('deserialize with empty object uses defaults', () => {
    const c = new GridLayoutComponent();
    c.deserialize({});

    expect(c.columns).toBe(2);
    expect(c.spacingX).toBe(0);
    expect(c.spacingY).toBe(0);
    expect(c.cellWidth).toBeUndefined();
    expect(c.cellHeight).toBeUndefined();
  });

  it('clone creates independent copy', () => {
    const c = new GridLayoutComponent();
    c.columns = 3;
    c.cellWidth = 100;

    const cloned = c.clone();
    cloned.columns = 5;
    cloned.cellWidth = 200;

    expect(c.columns).toBe(3);
    expect(c.cellWidth).toBe(100);
    expect(cloned.columns).toBe(5);
    expect(cloned.cellWidth).toBe(200);
  });

  describe('generateRuntimeScript align()', () => {
    function makeChild(name: string, w: number, h: number, visible = true) {
      return {
        name, width: w, height: h, x: 0, y: 0, visible,
        getComponentData: () => null,
      };
    }

    function compileAlign(comp: GridLayoutComponent) {
      const script = comp.generateRuntimeScript()!;
      const children: ReturnType<typeof makeChild>[] = [];
      const self = {
        object: { width: 800, height: 600 },
        get children() { return children; },
      };
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      const fns = new Function('self', `return (${script})`)(self);
      return { fns, children };
    }

    it('arranges children in 2-column grid', () => {
      const comp = new GridLayoutComponent();
      comp.columns = 2;
      comp.spacingX = 10;
      comp.spacingY = 5;
      comp.cellWidth = 100;
      comp.cellHeight = 40;

      const { fns, children } = compileAlign(comp);
      children.push(makeChild('a', 100, 40));
      children.push(makeChild('b', 100, 40));
      children.push(makeChild('c', 100, 40));
      children.push(makeChild('d', 100, 40));

      fns.align();

      expect(children[0]!.x).toBe(0);
      expect(children[0]!.y).toBe(0);
      expect(children[1]!.x).toBe(110); // 100 + 10
      expect(children[1]!.y).toBe(0);
      expect(children[2]!.x).toBe(0);
      expect(children[2]!.y).toBe(45); // 40 + 5
      expect(children[3]!.x).toBe(110);
      expect(children[3]!.y).toBe(45);
    });

    it('skips invisible children', () => {
      const comp = new GridLayoutComponent();
      comp.columns = 2;
      comp.cellWidth = 50;
      comp.cellHeight = 50;

      const { fns, children } = compileAlign(comp);
      children.push(makeChild('template', 50, 50, false));
      children.push(makeChild('a', 50, 50));
      children.push(makeChild('b', 50, 50));
      children.push(makeChild('c', 50, 50));

      fns.align();

      expect(children[1]!.x).toBe(0);
      expect(children[1]!.y).toBe(0);
      expect(children[2]!.x).toBe(50);
      expect(children[2]!.y).toBe(0);
      expect(children[3]!.x).toBe(0);
      expect(children[3]!.y).toBe(50);
    });

    it('uses child size when cellWidth/cellHeight not set', () => {
      const comp = new GridLayoutComponent();
      comp.columns = 2;

      const { fns, children } = compileAlign(comp);
      children.push(makeChild('a', 80, 30));
      children.push(makeChild('b', 80, 30));
      children.push(makeChild('c', 80, 30));

      fns.align();

      expect(children[0]!.x).toBe(0);
      expect(children[1]!.x).toBe(80);
      expect(children[2]!.x).toBe(0);
      expect(children[2]!.y).toBe(30);
    });
  });
});
