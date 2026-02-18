import { ObjectCanvasComponent } from './ObjectCanvasComponent';

describe('ObjectCanvasComponent', () => {
  it('has type "objectCanvas"', () => {
    const c = new ObjectCanvasComponent();
    expect(c.type).toBe('objectCanvas');
  });

  it('has correct default values', () => {
    const c = new ObjectCanvasComponent();
    expect(c.offsetX).toBe(0);
    expect(c.offsetY).toBe(0);
    expect(c.elements).toEqual([]);
  });

  it('round-trips serialize and deserialize', () => {
    const c = new ObjectCanvasComponent();
    c.offsetX = 10;
    c.offsetY = -5;
    c.elements = [
      { id: 'e1', type: 'text', data: { content: 'hello' } },
      { id: 'e2', type: 'rect', data: { width: 100 } },
    ];

    const data = c.serialize();
    const c2 = new ObjectCanvasComponent();
    c2.deserialize(data);

    expect(c2.offsetX).toBe(10);
    expect(c2.offsetY).toBe(-5);
    expect(c2.elements).toEqual([
      { id: 'e1', type: 'text', data: { content: 'hello' } },
      { id: 'e2', type: 'rect', data: { width: 100 } },
    ]);
  });

  it('deserialize with missing props uses defaults', () => {
    const c = new ObjectCanvasComponent();
    c.deserialize({});

    expect(c.offsetX).toBe(0);
    expect(c.offsetY).toBe(0);
    expect(c.elements).toEqual([]);
  });

  it('clone creates independent copy', () => {
    const c = new ObjectCanvasComponent();
    c.elements = [{ id: 'e1', type: 'text', data: { content: 'hello' } }];

    const cloned = c.clone();
    cloned.elements[0]!.data['content'] = 'changed';

    expect(c.elements[0]!.data['content']).toBe('hello');
    expect(cloned.elements[0]!.data['content']).toBe('changed');
  });
});
