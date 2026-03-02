import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
  createUIEditorSlice,
  UIEditorSlice,
  EditorUICanvas,
  EditorUIObject,
  EditorUIFunction,
  EditorUITemplate,
} from './uiEditorSlice';
import { createDefaultRectTransform } from '@/types/ui/UIComponent';

function createTestStore() {
  return create<UIEditorSlice>()(
    immer((set, get) => ({
      ...createUIEditorSlice(set, get),
    }))
  );
}

function makeCanvas(overrides: Partial<EditorUICanvas> = {}): EditorUICanvas {
  return {
    id: 'canvas_1',
    name: 'テストキャンバス',
    objects: [],
    functions: [],
    ...overrides,
  };
}

function makeObject(overrides: Partial<EditorUIObject> = {}): EditorUIObject {
  return {
    id: 'obj_1',
    name: 'テストオブジェクト',
    transform: createDefaultRectTransform(),
    components: [],
    ...overrides,
  };
}

function makeFunction(overrides: Partial<EditorUIFunction> = {}): EditorUIFunction {
  return {
    id: 'fn_1',
    name: 'テストファンクション',
    args: [],
    actions: [],
    ...overrides,
  };
}

function makeTemplate(overrides: Partial<EditorUITemplate> = {}): EditorUITemplate {
  return {
    id: 'tmpl_1',
    name: 'テストテンプレート',
    objects: [makeObject()],
    ...overrides,
  };
}

// ────────────────────────────────────────────────
// Canvas CRUD
// ────────────────────────────────────────────────

describe('UIEditorSlice — Canvas CRUD', () => {
  it('adds a canvas', () => {
    const store = createTestStore();
    store.getState().addUICanvas(makeCanvas());
    expect(store.getState().uiCanvases).toHaveLength(1);
    expect(store.getState().uiCanvases[0]!.name).toBe('テストキャンバス');
  });

  it('updates a canvas name', () => {
    const store = createTestStore();
    store.getState().addUICanvas(makeCanvas());
    store.getState().updateUICanvas('canvas_1', { name: '更新済み' });
    expect(store.getState().uiCanvases[0]!.name).toBe('更新済み');
  });

  it('deletes a canvas', () => {
    const store = createTestStore();
    store.getState().addUICanvas(makeCanvas());
    store.getState().deleteUICanvas('canvas_1');
    expect(store.getState().uiCanvases).toHaveLength(0);
  });

  it('clears selection when deleting selected canvas', () => {
    const store = createTestStore();
    store.getState().addUICanvas(makeCanvas());
    store.getState().selectUICanvas('canvas_1');
    store.getState().selectUIObjects(['obj_1']);
    store.getState().deleteUICanvas('canvas_1');
    expect(store.getState().selectedCanvasId).toBeNull();
    expect(store.getState().selectedObjectIds).toEqual([]);
  });

  it('selects a canvas and clears object selection', () => {
    const store = createTestStore();
    store.getState().selectUIObjects(['obj_1']);
    store.getState().selectUICanvas('canvas_1');
    expect(store.getState().selectedCanvasId).toBe('canvas_1');
    expect(store.getState().selectedObjectIds).toEqual([]);
  });
});

// ────────────────────────────────────────────────
// Object CRUD
// ────────────────────────────────────────────────

describe('UIEditorSlice — Object CRUD', () => {
  it('adds an object to a canvas', () => {
    const store = createTestStore();
    store.getState().addUICanvas(makeCanvas());
    store.getState().addUIObject('canvas_1', makeObject());
    expect(store.getState().uiCanvases[0]!.objects).toHaveLength(1);
  });

  it('updates object name', () => {
    const store = createTestStore();
    store.getState().addUICanvas(makeCanvas());
    store.getState().addUIObject('canvas_1', makeObject());
    store.getState().updateUIObject('canvas_1', 'obj_1', { name: '更新名' });
    expect(store.getState().uiCanvases[0]!.objects[0]!.name).toBe('更新名');
  });

  it('updates object transform', () => {
    const store = createTestStore();
    store.getState().addUICanvas(makeCanvas());
    store.getState().addUIObject('canvas_1', makeObject());
    store.getState().updateUIObject('canvas_1', 'obj_1', {
      transform: { ...createDefaultRectTransform(), x: 50, y: 100 },
    });
    const obj = store.getState().uiCanvases[0]!.objects[0]!;
    expect(obj.transform.x).toBe(50);
    expect(obj.transform.y).toBe(100);
  });

  it('deletes an object and its children', () => {
    const store = createTestStore();
    store.getState().addUICanvas(makeCanvas());
    store.getState().addUIObject('canvas_1', makeObject({ id: 'parent' }));
    store.getState().addUIObject('canvas_1', makeObject({ id: 'child', parentId: 'parent' }));
    store.getState().addUIObject('canvas_1', makeObject({ id: 'grandchild', parentId: 'child' }));
    store.getState().addUIObject('canvas_1', makeObject({ id: 'sibling' }));

    store.getState().deleteUIObject('canvas_1', 'parent');

    const objects = store.getState().uiCanvases[0]!.objects;
    expect(objects).toHaveLength(1);
    expect(objects[0]!.id).toBe('sibling');
  });

  it('clears deleted object from selection', () => {
    const store = createTestStore();
    store.getState().addUICanvas(makeCanvas());
    store.getState().addUIObject('canvas_1', makeObject({ id: 'obj_a' }));
    store.getState().addUIObject('canvas_1', makeObject({ id: 'obj_b' }));
    store.getState().selectUIObjects(['obj_a', 'obj_b']);

    store.getState().deleteUIObject('canvas_1', 'obj_a');
    expect(store.getState().selectedObjectIds).toEqual(['obj_b']);
  });

  it('reparents an object', () => {
    const store = createTestStore();
    store.getState().addUICanvas(makeCanvas());
    store.getState().addUIObject('canvas_1', makeObject({ id: 'obj_a' }));
    store.getState().addUIObject('canvas_1', makeObject({ id: 'obj_b' }));

    store.getState().reparentUIObject('canvas_1', 'obj_b', 'obj_a');
    expect(store.getState().uiCanvases[0]!.objects[1]!.parentId).toBe('obj_a');
  });

  it('reparents to root (undefined)', () => {
    const store = createTestStore();
    store.getState().addUICanvas(makeCanvas());
    store.getState().addUIObject('canvas_1', makeObject({ id: 'obj_a', parentId: 'parent' }));

    store.getState().reparentUIObject('canvas_1', 'obj_a', undefined);
    expect(store.getState().uiCanvases[0]!.objects[0]!.parentId).toBeUndefined();
  });
});

// ────────────────────────────────────────────────
// Component operations
// ────────────────────────────────────────────────

describe('UIEditorSlice — Component operations', () => {
  it('adds a component to an object', () => {
    const store = createTestStore();
    store.getState().addUICanvas(makeCanvas());
    store.getState().addUIObject('canvas_1', makeObject());

    store.getState().addUIComponent('canvas_1', 'obj_1', { type: 'image', data: { imageId: 'img_1' } });
    expect(store.getState().uiCanvases[0]!.objects[0]!.components).toHaveLength(1);
    expect(store.getState().uiCanvases[0]!.objects[0]!.components[0]!.type).toBe('image');
  });

  it('removes a component by type', () => {
    const store = createTestStore();
    store.getState().addUICanvas(makeCanvas());
    store.getState().addUIObject(
      'canvas_1',
      makeObject({
        components: [
          { type: 'image', data: {} },
          { type: 'text', data: {} },
        ],
      })
    );

    store.getState().removeUIComponent('canvas_1', 'obj_1', 'image');
    const comps = store.getState().uiCanvases[0]!.objects[0]!.components;
    expect(comps).toHaveLength(1);
    expect(comps[0]!.type).toBe('text');
  });

  it('updates component data', () => {
    const store = createTestStore();
    store.getState().addUICanvas(makeCanvas());
    store.getState().addUIObject(
      'canvas_1',
      makeObject({ components: [{ type: 'text', data: { content: 'hello' } }] })
    );

    store.getState().updateUIComponent('canvas_1', 'obj_1', 'text', { content: 'updated' });
    const comp = store.getState().uiCanvases[0]!.objects[0]!.components[0]!;
    expect((comp.data as Record<string, unknown>).content).toBe('updated');
  });
});

// ────────────────────────────────────────────────
// Function CRUD
// ────────────────────────────────────────────────

describe('UIEditorSlice — Function CRUD', () => {
  it('adds a function to a canvas', () => {
    const store = createTestStore();
    store.getState().addUICanvas(makeCanvas());
    store.getState().addUIFunction('canvas_1', makeFunction());
    expect(store.getState().uiCanvases[0]!.functions).toHaveLength(1);
  });

  it('updates a function', () => {
    const store = createTestStore();
    store.getState().addUICanvas(makeCanvas());
    store.getState().addUIFunction('canvas_1', makeFunction());
    store.getState().updateUIFunction('canvas_1', 'fn_1', { name: '更新済みファンクション' });
    expect(store.getState().uiCanvases[0]!.functions[0]!.name).toBe('更新済みファンクション');
  });

  it('deletes a function', () => {
    const store = createTestStore();
    store.getState().addUICanvas(makeCanvas());
    store.getState().addUIFunction('canvas_1', makeFunction());
    store.getState().deleteUIFunction('canvas_1', 'fn_1');
    expect(store.getState().uiCanvases[0]!.functions).toHaveLength(0);
  });

  it('updates function actions', () => {
    const store = createTestStore();
    store.getState().addUICanvas(makeCanvas());
    store.getState().addUIFunction('canvas_1', makeFunction());
    const actions = [{ type: 'showMessage', data: { text: 'hello' } }];
    store.getState().updateUIFunction('canvas_1', 'fn_1', { actions });
    expect(store.getState().uiCanvases[0]!.functions[0]!.actions).toEqual(actions);
  });
});

// ────────────────────────────────────────────────
// Template CRUD
// ────────────────────────────────────────────────

describe('UIEditorSlice — Template CRUD', () => {
  it('adds a template', () => {
    const store = createTestStore();
    store.getState().addUITemplate(makeTemplate());
    expect(store.getState().uiTemplates).toHaveLength(1);
  });

  it('updates a template', () => {
    const store = createTestStore();
    store.getState().addUITemplate(makeTemplate());
    store.getState().updateUITemplate('tmpl_1', { name: '更新テンプレート' });
    expect(store.getState().uiTemplates[0]!.name).toBe('更新テンプレート');
  });

  it('deletes a template', () => {
    const store = createTestStore();
    store.getState().addUITemplate(makeTemplate());
    store.getState().deleteUITemplate('tmpl_1');
    expect(store.getState().uiTemplates).toHaveLength(0);
  });
});

// ────────────────────────────────────────────────
// Editor state
// ────────────────────────────────────────────────

describe('UIEditorSlice — Editor state', () => {
  it('selects multiple objects', () => {
    const store = createTestStore();
    store.getState().selectUIObjects(['a', 'b', 'c']);
    expect(store.getState().selectedObjectIds).toEqual(['a', 'b', 'c']);
  });

  it('sets viewport partially', () => {
    const store = createTestStore();
    store.getState().setUIEditorViewport({ zoom: 2 });
    expect(store.getState().uiEditorViewport).toEqual({ x: 0, y: 0, zoom: 2 });
  });

  it('toggles grid', () => {
    const store = createTestStore();
    expect(store.getState().showUIGrid).toBe(true);
    store.getState().toggleUIGrid();
    expect(store.getState().showUIGrid).toBe(false);
  });

  it('sets grid size', () => {
    const store = createTestStore();
    store.getState().setUIGridSize(32);
    expect(store.getState().uiGridSize).toBe(32);
  });

  it('toggles snap to grid', () => {
    const store = createTestStore();
    expect(store.getState().snapToGrid).toBe(false);
    store.getState().toggleSnapToGrid();
    expect(store.getState().snapToGrid).toBe(true);
  });

  it('sets left panel mode', () => {
    const store = createTestStore();
    expect(store.getState().leftPanelMode).toBe('canvasList');
    store.getState().setLeftPanelMode('functions');
    expect(store.getState().leftPanelMode).toBe('functions');
  });

  it('has correct default values', () => {
    const store = createTestStore();
    const state = store.getState();
    expect(state.uiCanvases).toEqual([]);
    expect(state.uiTemplates).toEqual([]);
    expect(state.selectedCanvasId).toBeNull();
    expect(state.selectedObjectIds).toEqual([]);
    expect(state.uiEditorViewport).toEqual({ x: 0, y: 0, zoom: 1 });
    expect(state.showUIGrid).toBe(true);
    expect(state.uiGridSize).toBe(16);
    expect(state.snapToGrid).toBe(false);
    expect(state.leftPanelMode).toBe('canvasList');
  });
});

// ────────────────────────────────────────────────
// Edge cases
// ────────────────────────────────────────────────

describe('UIEditorSlice — Edge cases', () => {
  it('ignores update on nonexistent canvas', () => {
    const store = createTestStore();
    store.getState().updateUICanvas('nonexistent', { name: 'x' });
    expect(store.getState().uiCanvases).toHaveLength(0);
  });

  it('ignores addObject on nonexistent canvas', () => {
    const store = createTestStore();
    store.getState().addUIObject('nonexistent', makeObject());
    expect(store.getState().uiCanvases).toHaveLength(0);
  });

  it('ignores updateObject on nonexistent object', () => {
    const store = createTestStore();
    store.getState().addUICanvas(makeCanvas());
    store.getState().updateUIObject('canvas_1', 'nonexistent', { name: 'x' });
    // No error thrown
    expect(store.getState().uiCanvases[0]!.objects).toHaveLength(0);
  });

  it('ignores addComponent on nonexistent object', () => {
    const store = createTestStore();
    store.getState().addUICanvas(makeCanvas());
    store.getState().addUIComponent('canvas_1', 'nonexistent', { type: 'image', data: {} });
    expect(store.getState().uiCanvases[0]!.objects).toHaveLength(0);
  });

  it('ignores deleteFunction on nonexistent canvas', () => {
    const store = createTestStore();
    store.getState().deleteUIFunction('nonexistent', 'fn_1');
    // No error thrown
    expect(store.getState().uiCanvases).toHaveLength(0);
  });
});
