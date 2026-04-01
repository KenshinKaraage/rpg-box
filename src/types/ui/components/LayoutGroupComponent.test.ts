import { LayoutGroupComponent } from './LayoutGroupComponent';

describe('LayoutGroupComponent', () => {
  it('has type "layoutGroup"', () => {
    const c = new LayoutGroupComponent();
    expect(c.type).toBe('layoutGroup');
  });

  it('has label "レイアウトグループ"', () => {
    const c = new LayoutGroupComponent();
    expect(c.label).toBe('レイアウトグループ');
  });

  it('has correct default values', () => {
    const c = new LayoutGroupComponent();
    expect(c.direction).toBe('vertical');
    expect(c.spacing).toBe(0);
    expect(c.alignment).toBe('start');
    expect(c.reverseOrder).toBe(false);
  });

  it('round-trips serialize and deserialize', () => {
    const c = new LayoutGroupComponent();
    c.direction = 'horizontal';
    c.spacing = 8;
    c.alignment = 'center';
    c.reverseOrder = true;

    const data = c.serialize();
    const c2 = new LayoutGroupComponent();
    c2.deserialize(data);

    expect(c2.direction).toBe('horizontal');
    expect(c2.spacing).toBe(8);
    expect(c2.alignment).toBe('center');
    expect(c2.reverseOrder).toBe(true);
  });

  it('deserialize with empty object uses defaults', () => {
    const c = new LayoutGroupComponent();
    c.deserialize({});

    expect(c.direction).toBe('vertical');
    expect(c.spacing).toBe(0);
    expect(c.alignment).toBe('start');
    expect(c.reverseOrder).toBe(false);
  });

  it('clone creates independent copy', () => {
    const c = new LayoutGroupComponent();
    c.direction = 'horizontal';
    c.spacing = 12;

    const cloned = c.clone();
    cloned.direction = 'vertical';
    cloned.spacing = 0;

    expect(c.direction).toBe('horizontal');
    expect(c.spacing).toBe(12);
    expect(cloned.direction).toBe('vertical');
    expect(cloned.spacing).toBe(0);
  });

  describe('generateRuntimeScript align()', () => {
    function makeChild(name: string, w: number, h: number, visible = true) {
      return {
        name, width: w, height: h, x: 0, y: 0, visible,
        getComponentData: () => null,
      };
    }

    function compileAlign(comp: LayoutGroupComponent) {
      const script = comp.generateRuntimeScript()!;
      const children: ReturnType<typeof makeChild>[] = [];
      const self = {
        object: { width: 400, height: 400 },
        get children() { return children; },
      };
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      const fns = new Function('self', `return (${script})`)(self);
      return { fns, children };
    }

    it('aligns children vertically with padding', () => {
      const comp = new LayoutGroupComponent();
      comp.direction = 'vertical';
      comp.spacing = 5;
      comp.paddingTop = 10;
      comp.paddingLeft = 20;

      const { fns, children } = compileAlign(comp);
      children.push(makeChild('a', 100, 40));
      children.push(makeChild('b', 100, 60));

      fns.align();

      expect(children[0]!.x).toBe(20);
      expect(children[0]!.y).toBe(10);
      expect(children[1]!.x).toBe(20);
      expect(children[1]!.y).toBe(55); // 10 + 40 + 5
    });

    it('skips invisible children (template source)', () => {
      const comp = new LayoutGroupComponent();
      comp.direction = 'vertical';
      comp.spacing = 0;

      const { fns, children } = compileAlign(comp);
      children.push(makeChild('template', 100, 40, false)); // テンプレート元: 非表示
      children.push(makeChild('clone1', 100, 40));
      children.push(makeChild('clone2', 100, 40));

      fns.align();

      // template はスキップ、位置は変わらない
      expect(children[0]!.y).toBe(0); // 変更なし
      // clone1 は 0 から
      expect(children[1]!.y).toBe(0);
      // clone2 は 40 から
      expect(children[2]!.y).toBe(40);
    });

    it('dynamically added children are included in align', () => {
      const comp = new LayoutGroupComponent();
      comp.direction = 'vertical';
      comp.spacing = 4;
      comp.paddingTop = 8;

      const { fns, children } = compileAlign(comp);

      // 初期: 空
      fns.align();

      // クローン追加をシミュレート
      children.push(makeChild('member1', 200, 48));
      children.push(makeChild('member2', 200, 48));
      children.push(makeChild('member3', 200, 48));

      fns.align();

      expect(children[0]!.y).toBe(8);   // paddingTop
      expect(children[1]!.y).toBe(60);  // 8 + 48 + 4
      expect(children[2]!.y).toBe(112); // 60 + 48 + 4
    });
  });
});
