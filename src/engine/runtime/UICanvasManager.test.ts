import { UICanvasManager, type UICanvasData } from './UICanvasManager';

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

function makeCanvas(id: string, name: string, objects: UICanvasData['objects'] = []): UICanvasData {
  return { id, name, objects };
}

function makeObject(id: string, name: string, components: { type: string; data: unknown }[] = []) {
  return {
    id,
    name,
    transform: { x: 0, y: 0, width: 100, height: 50, anchorX: 'left' as const, anchorY: 'top' as const, pivotX: 0, pivotY: 0, rotation: 0, scaleX: 1, scaleY: 1 },
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
    expect(Object.keys(proxies)).toEqual(['message', 'menu']);
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
    const proxy = proxies['message']!;

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
    const proxy = mgr.createProxies()['message']!;
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

    const proxy = mgr.createProxies()['dialog']!;
    proxy.setProperty('label', 'text', 'content', 'after');

    // The underlying data should be mutated
    const canvas = mgr.findCanvasByName('dialog');
    const textComp = canvas!.objects[0]!.components[0]!;
    expect((textComp.data as Record<string, unknown>).content).toBe('after');
  });

  it('getObject returns null for non-existent object', () => {
    const mgr = new UICanvasManager(mockGl(), () => null);
    mgr.loadCanvases([makeCanvas('c1', 'test')]);

    const proxy = mgr.createProxies()['test']!;
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
});
