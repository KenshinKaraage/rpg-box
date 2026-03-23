import { UICanvasManager, type UICanvasData } from './UICanvasManager';

// Register UIAction types so executeAction can deserialize them
import '@/types/ui/actions/register';

// Mock WebGL and twgl — UICanvasManager creates shader programs in constructor
jest.mock('twgl.js', () => ({
  createProgramInfo: jest.fn(() => ({ program: {} })),
  m4: { ortho: jest.fn(() => new Float32Array(16)) },
}));

jest.mock('@/features/ui-editor/renderer/UIRenderer', () => ({
  createRendererPrograms: jest.fn(() => ({
    solidProgram: { program: {} },
    texturedProgram: { program: {} },
  })),
  renderUIObjects: jest.fn(),
}));

function mockGl(): WebGLRenderingContext {
  return {
    deleteTexture: jest.fn(),
  } as unknown as WebGLRenderingContext;
}

function makeCanvas(
  id: string,
  name: string,
  objects: UICanvasData['objects'] = [],
  functions: UICanvasData['functions'] = []
): UICanvasData {
  return { id, name, objects, functions };
}

function makeObject(id: string, name: string, components: { type: string; data: unknown }[] = []) {
  return {
    id,
    name,
    transform: { x: 0, y: 0, width: 100, height: 50, anchorX: 'left' as const, anchorY: 'top' as const, pivotX: 0, pivotY: 0, rotation: 0, scaleX: 1, scaleY: 1, visible: true },
    components,
  };
}

describe('UICanvasManager', () => {
  it('loads canvases and creates proxies by name', () => {
    const mgr = new UICanvasManager(mockGl(), () => null);
    mgr.loadCanvases([
      makeCanvas('c1', 'message'),
      makeCanvas('c2', 'menu'),
    ]);

    const proxies = mgr.createProxies();
    expect(Object.keys(proxies)).toEqual(['c1', 'c2']);
  });

  it('show/hide controls visibility', () => {
    const mgr = new UICanvasManager(mockGl(), () => null);
    mgr.loadCanvases([makeCanvas('c1', 'message')]);

    expect(mgr.isCanvasVisible('c1')).toBe(false);

    mgr.showCanvas('c1');
    expect(mgr.isCanvasVisible('c1')).toBe(true);

    mgr.hideCanvas('c1');
    expect(mgr.isCanvasVisible('c1')).toBe(false);
  });

  it('proxy show/hide works', () => {
    const mgr = new UICanvasManager(mockGl(), () => null);
    mgr.loadCanvases([makeCanvas('c1', 'message')]);

    const proxies = mgr.createProxies();
    const proxy = proxies['c1']!;

    expect(proxy.isVisible()).toBe(false);
    proxy.show();
    expect(proxy.isVisible()).toBe(true);
    proxy.hide();
    expect(proxy.isVisible()).toBe(false);
  });

  it('setProperty modifies component data', () => {
    const obj = makeObject('obj1', 'textBox', [
      { type: 'text', data: { content: 'hello' } },
    ]);
    const mgr = new UICanvasManager(mockGl(), () => null);
    mgr.loadCanvases([makeCanvas('c1', 'message', [obj])]);

    mgr.setProperty('c1', 'textBox', 'text', 'content', 'world');

    // Verify via proxy
    const proxy = mgr.createProxies()['c1']!;
    const objProxy = proxy.getObject('textBox');
    expect(objProxy).not.toBeNull();
    expect(objProxy!.id).toBe('obj1');
  });

  it('proxy setProperty modifies component data', () => {
    const obj = makeObject('obj1', 'label', [
      { type: 'text', data: { content: 'before', fontSize: 16 } },
    ]);
    const mgr = new UICanvasManager(mockGl(), () => null);
    mgr.loadCanvases([makeCanvas('c1', 'dialog', [obj])]);

    const proxy = mgr.createProxies()['c1']!;
    proxy.setProperty('label', 'text', 'content', 'after');

    // The underlying data should be mutated
    const canvas = mgr.findCanvasByName('dialog');
    const textComp = canvas!.objects[0]!.components[0]!;
    expect((textComp.data as Record<string, unknown>).content).toBe('after');
  });

  it('getObject returns null for non-existent object', () => {
    const mgr = new UICanvasManager(mockGl(), () => null);
    mgr.loadCanvases([makeCanvas('c1', 'test')]);

    const proxy = mgr.createProxies()['c1']!;
    expect(proxy.getObject('nonexistent')).toBeNull();
  });

  it('findCanvasByName returns correct canvas', () => {
    const mgr = new UICanvasManager(mockGl(), () => null);
    mgr.loadCanvases([
      makeCanvas('c1', 'message'),
      makeCanvas('c2', 'menu'),
    ]);

    expect(mgr.findCanvasByName('menu')?.id).toBe('c2');
    expect(mgr.findCanvasByName('nonexistent')).toBeNull();
  });

  // ── executeFunction ──

  it('executeFunction runs uiSetProperty actions', async () => {
    const obj = makeObject('obj1', 'label', [
      { type: 'text', data: { content: 'before' } },
    ]);
    const canvas = makeCanvas('c1', 'message', [obj], [
      {
        id: 'fn1',
        name: 'showText',
        args: [],
        actions: [
          { type: 'uiSetProperty', data: { targetId: 'obj1', component: 'text', property: 'content', value: 'after' } },
        ],
      },
    ]);
    const mgr = new UICanvasManager(mockGl(), () => null);
    mgr.loadCanvases([canvas]);

    await mgr.executeFunction('c1', 'showText');

    const data = mgr.findCanvasByName('message')!.objects[0]!.components[0]!.data as Record<string, unknown>;
    expect(data.content).toBe('after');
  });

  it('executeFunction resolves {argName} placeholders', async () => {
    const obj = makeObject('obj1', 'label', [
      { type: 'text', data: { content: '' } },
    ]);
    const canvas = makeCanvas('c1', 'msg', [obj], [
      {
        id: 'fn1',
        name: 'show',
        args: [{ id: 'text', name: 'テキスト', fieldType: { type: 'string' } as never, required: true }],
        actions: [
          { type: 'uiSetProperty', data: { targetId: 'obj1', component: 'text', property: 'content', valueSource: { source: 'arg', argId: 'text' } } },
        ],
      },
    ]);
    const mgr = new UICanvasManager(mockGl(), () => null);
    mgr.loadCanvases([canvas]);

    await mgr.executeFunction('c1', 'show', { text: 'こんにちは' });

    const data = mgr.findCanvasByName('msg')!.objects[0]!.components[0]!.data as Record<string, unknown>;
    expect(data.content).toBe('こんにちは');
  });

  it('executeFunction runs uiSetVisibility actions', async () => {
    const obj = makeObject('obj1', 'box');
    const canvas = makeCanvas('c1', 'test', [obj], [
      {
        id: 'fn1',
        name: 'hideBox',
        args: [],
        actions: [
          { type: 'uiSetVisibility', data: { targetId: 'obj1', visible: false } },
        ],
      },
    ]);
    const mgr = new UICanvasManager(mockGl(), () => null);
    mgr.loadCanvases([canvas]);

    await mgr.executeFunction('c1', 'hideBox');

    expect(mgr.findCanvasByName('test')!.objects[0]!.transform.visible).toBe(false);
  });

  it('executeFunction warns on missing function', async () => {
    const mgr = new UICanvasManager(mockGl(), () => null);
    mgr.loadCanvases([makeCanvas('c1', 'test')]);

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    await mgr.executeFunction('c1', 'nonexistent');
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('nonexistent'));
    warnSpy.mockRestore();
  });

  // ── Proxy UIFunction dynamic methods ──

  it('proxy exposes UIFunction as dynamic method', async () => {
    const obj = makeObject('obj1', 'label', [
      { type: 'text', data: { content: '' } },
    ]);
    const canvas = makeCanvas('c1', 'dialog', [obj], [
      {
        id: 'fn1',
        name: 'setText',
        args: [],
        actions: [
          { type: 'uiSetProperty', data: { targetId: 'obj1', component: 'text', property: 'content', value: 'dynamic' } },
        ],
      },
    ]);
    const mgr = new UICanvasManager(mockGl(), () => null);
    mgr.loadCanvases([canvas]);

    const proxy = mgr.createProxies()['c1']!;
    expect(typeof proxy['setText']).toBe('function');
    await (proxy['setText'] as (args?: Record<string, unknown>) => Promise<void>)();

    const data = mgr.findCanvasByName('dialog')!.objects[0]!.components[0]!.data as Record<string, unknown>;
    expect(data.content).toBe('dynamic');
  });

  it('proxy.call() invokes UIFunction by name', async () => {
    const obj = makeObject('obj1', 'label', [
      { type: 'text', data: { content: '' } },
    ]);
    const canvas = makeCanvas('c1', 'dialog', [obj], [
      {
        id: 'fn1',
        name: 'show',
        args: [],
        actions: [
          { type: 'uiSetProperty', data: { targetId: 'obj1', component: 'text', property: 'content', value: 'called' } },
        ],
      },
    ]);
    const mgr = new UICanvasManager(mockGl(), () => null);
    mgr.loadCanvases([canvas]);

    const proxy = mgr.createProxies()['c1']!;
    // "show" is a builtin name, so dynamic method is not added
    expect(typeof proxy['show']).toBe('function');
    // But call() can invoke it
    await proxy.call('show');

    const data = mgr.findCanvasByName('dialog')!.objects[0]!.components[0]!.data as Record<string, unknown>;
    expect(data.content).toBe('called');
  });

  // ── Object proxy transform access ──

  it('object proxy provides direct transform access', () => {
    const obj = makeObject('obj1', 'box');
    const mgr = new UICanvasManager(mockGl(), () => null);
    mgr.loadCanvases([makeCanvas('c1', 'test', [obj])]);

    const proxy = mgr.createProxies()['c1']!;
    const objProxy = proxy.getObject('box')!;

    expect(objProxy.x).toBe(0);
    expect(objProxy.visible).toBe(true);

    objProxy.x = 42;
    objProxy.visible = false;

    expect(objProxy.x).toBe(42);
    expect(objProxy.visible).toBe(false);
    // Verify underlying data changed
    expect(mgr.findCanvasByName('test')!.objects[0]!.transform.x).toBe(42);
    expect(mgr.findCanvasByName('test')!.objects[0]!.transform.visible).toBe(false);
  });

  // ── Object proxy child access ──

  it('object proxy getChild/getChildren works', () => {
    const parent = makeObject('p1', 'parent');
    const child1 = { ...makeObject('c1', 'child1'), parentId: 'p1' };
    const child2 = { ...makeObject('c2', 'child2'), parentId: 'p1' };
    const mgr = new UICanvasManager(mockGl(), () => null);
    mgr.loadCanvases([makeCanvas('cv1', 'test', [parent, child1, child2])]);

    const proxy = mgr.createProxies()['cv1']!;
    const parentProxy = proxy.getObject('parent')!;

    const c1 = parentProxy.getChild('child1');
    expect(c1).not.toBeNull();
    expect(c1!.id).toBe('c1');

    expect(parentProxy.getChild('nonexistent')).toBeNull();

    const children = parentProxy.getChildren();
    expect(children).toHaveLength(2);
    expect(children.map((c) => c.name)).toEqual(['child1', 'child2']);
  });
});
