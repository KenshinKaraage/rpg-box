/**
 * UIエディタスライス
 *
 * UICanvas、UIObject、UIFunction、UITemplate、エディタ状態の管理
 */
import type { RectTransform } from '@/types/ui/UIComponent';
import type { SerializedAction } from '@/types/ui';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface SerializedUIComponent {
  type: string;
  data: unknown;
}

export interface EditorUIObject {
  id: string;
  name: string;
  parentId?: string;
  transform: RectTransform;
  components: SerializedUIComponent[];
}

export interface TemplateArg {
  id: string;
  name: string;
  fieldType: string;
  defaultValue: unknown;
}

export interface EditorUIFunction {
  id: string;
  name: string;
  args: TemplateArg[];
  actions: SerializedAction[];
}

export interface EditorUICanvas {
  id: string;
  name: string;
  objects: EditorUIObject[];
  functions: EditorUIFunction[];
}

export interface EditorUITemplate {
  id: string;
  name: string;
  rootObject: EditorUIObject;
}

export interface UIEditorViewport {
  x: number;
  y: number;
  zoom: number;
}

export type LeftPanelMode = 'canvasList' | 'elements' | 'templates' | 'functions';

// ──────────────────────────────────────────────
// Slice interface
// ──────────────────────────────────────────────

export interface UIEditorSlice {
  // Data
  uiCanvases: EditorUICanvas[];
  uiTemplates: EditorUITemplate[];

  // Editor state
  selectedCanvasId: string | null;
  selectedObjectIds: string[];
  uiEditorViewport: UIEditorViewport;
  showUIGrid: boolean;
  uiGridSize: number;
  snapToGrid: boolean;
  leftPanelMode: LeftPanelMode;

  // Canvas CRUD
  addUICanvas: (canvas: EditorUICanvas) => void;
  updateUICanvas: (id: string, updates: Partial<Pick<EditorUICanvas, 'name'>>) => void;
  deleteUICanvas: (id: string) => void;
  selectUICanvas: (id: string | null) => void;

  // Object CRUD
  addUIObject: (canvasId: string, object: EditorUIObject) => void;
  updateUIObject: (
    canvasId: string,
    objectId: string,
    updates: Partial<Pick<EditorUIObject, 'name' | 'transform'>>
  ) => void;
  deleteUIObject: (canvasId: string, objectId: string) => void;
  reparentUIObject: (canvasId: string, objectId: string, newParentId: string | undefined) => void;

  // Component operations
  addUIComponent: (canvasId: string, objectId: string, component: SerializedUIComponent) => void;
  removeUIComponent: (canvasId: string, objectId: string, componentType: string) => void;
  updateUIComponent: (
    canvasId: string,
    objectId: string,
    componentType: string,
    data: unknown
  ) => void;

  // Function CRUD
  addUIFunction: (canvasId: string, fn: EditorUIFunction) => void;
  updateUIFunction: (
    canvasId: string,
    functionId: string,
    updates: Partial<Pick<EditorUIFunction, 'name' | 'args' | 'actions'>>
  ) => void;
  deleteUIFunction: (canvasId: string, functionId: string) => void;

  // Template CRUD
  addUITemplate: (template: EditorUITemplate) => void;
  updateUITemplate: (
    id: string,
    updates: Partial<Pick<EditorUITemplate, 'name' | 'rootObject'>>
  ) => void;
  deleteUITemplate: (id: string) => void;

  // Editor state
  selectUIObjects: (ids: string[]) => void;
  setUIEditorViewport: (v: Partial<UIEditorViewport>) => void;
  toggleUIGrid: () => void;
  setUIGridSize: (size: number) => void;
  toggleSnapToGrid: () => void;
  setLeftPanelMode: (mode: LeftPanelMode) => void;
}

// ──────────────────────────────────────────────
// Helper
// ──────────────────────────────────────────────

function findCanvas<T extends UIEditorSlice>(state: T, canvasId: string) {
  return state.uiCanvases.find((c) => c.id === canvasId);
}

function findObject(canvas: EditorUICanvas, objectId: string) {
  return canvas.objects.find((o) => o.id === objectId);
}

// ──────────────────────────────────────────────
// Slice factory
// ──────────────────────────────────────────────

export const createUIEditorSlice = <T extends UIEditorSlice>(
  set: (fn: (state: T) => void) => void,
  _get: () => T
): UIEditorSlice => ({
  // Data
  uiCanvases: [],
  uiTemplates: [],

  // Editor state
  selectedCanvasId: null,
  selectedObjectIds: [],
  uiEditorViewport: { x: 0, y: 0, zoom: 1 },
  showUIGrid: true,
  uiGridSize: 16,
  snapToGrid: false,
  leftPanelMode: 'canvasList',

  // ── Canvas CRUD ──

  addUICanvas: (canvas) =>
    set((s) => {
      s.uiCanvases.push(canvas);
    }),

  updateUICanvas: (id, updates) =>
    set((s) => {
      const canvas = findCanvas(s, id);
      if (canvas) Object.assign(canvas, updates);
    }),

  deleteUICanvas: (id) =>
    set((s) => {
      s.uiCanvases = s.uiCanvases.filter((c) => c.id !== id);
      if (s.selectedCanvasId === id) {
        s.selectedCanvasId = null;
        s.selectedObjectIds = [];
      }
    }),

  selectUICanvas: (id) =>
    set((s) => {
      s.selectedCanvasId = id;
      s.selectedObjectIds = [];
    }),

  // ── Object CRUD ──

  addUIObject: (canvasId, object) =>
    set((s) => {
      const canvas = findCanvas(s, canvasId);
      if (canvas) canvas.objects.push(object);
    }),

  updateUIObject: (canvasId, objectId, updates) =>
    set((s) => {
      const canvas = findCanvas(s, canvasId);
      if (!canvas) return;
      const obj = findObject(canvas, objectId);
      if (obj) {
        if (updates.name !== undefined) obj.name = updates.name;
        if (updates.transform !== undefined) Object.assign(obj.transform, updates.transform);
      }
    }),

  deleteUIObject: (canvasId, objectId) =>
    set((s) => {
      const canvas = findCanvas(s, canvasId);
      if (!canvas) return;
      // Delete children recursively
      const idsToDelete = new Set<string>();
      const collectChildren = (parentId: string) => {
        idsToDelete.add(parentId);
        canvas.objects
          .filter((o) => o.parentId === parentId)
          .forEach((o) => collectChildren(o.id));
      };
      collectChildren(objectId);
      canvas.objects = canvas.objects.filter((o) => !idsToDelete.has(o.id));
      s.selectedObjectIds = s.selectedObjectIds.filter((id) => !idsToDelete.has(id));
    }),

  reparentUIObject: (canvasId, objectId, newParentId) =>
    set((s) => {
      const canvas = findCanvas(s, canvasId);
      if (!canvas) return;
      const obj = findObject(canvas, objectId);
      if (obj) obj.parentId = newParentId;
    }),

  // ── Component operations ──

  addUIComponent: (canvasId, objectId, component) =>
    set((s) => {
      const canvas = findCanvas(s, canvasId);
      if (!canvas) return;
      const obj = findObject(canvas, objectId);
      if (obj) obj.components.push(component);
    }),

  removeUIComponent: (canvasId, objectId, componentType) =>
    set((s) => {
      const canvas = findCanvas(s, canvasId);
      if (!canvas) return;
      const obj = findObject(canvas, objectId);
      if (obj) {
        obj.components = obj.components.filter((c) => c.type !== componentType);
      }
    }),

  updateUIComponent: (canvasId, objectId, componentType, data) =>
    set((s) => {
      const canvas = findCanvas(s, canvasId);
      if (!canvas) return;
      const obj = findObject(canvas, objectId);
      if (!obj) return;
      const comp = obj.components.find((c) => c.type === componentType);
      if (comp) comp.data = data;
    }),

  // ── Function CRUD ──

  addUIFunction: (canvasId, fn) =>
    set((s) => {
      const canvas = findCanvas(s, canvasId);
      if (canvas) canvas.functions.push(fn);
    }),

  updateUIFunction: (canvasId, functionId, updates) =>
    set((s) => {
      const canvas = findCanvas(s, canvasId);
      if (!canvas) return;
      const fn = canvas.functions.find((f) => f.id === functionId);
      if (fn) Object.assign(fn, updates);
    }),

  deleteUIFunction: (canvasId, functionId) =>
    set((s) => {
      const canvas = findCanvas(s, canvasId);
      if (!canvas) return;
      canvas.functions = canvas.functions.filter((f) => f.id !== functionId);
    }),

  // ── Template CRUD ──

  addUITemplate: (template) =>
    set((s) => {
      s.uiTemplates.push(template);
    }),

  updateUITemplate: (id, updates) =>
    set((s) => {
      const tmpl = s.uiTemplates.find((t) => t.id === id);
      if (tmpl) Object.assign(tmpl, updates);
    }),

  deleteUITemplate: (id) =>
    set((s) => {
      s.uiTemplates = s.uiTemplates.filter((t) => t.id !== id);
    }),

  // ── Editor state ──

  selectUIObjects: (ids) =>
    set((s) => {
      s.selectedObjectIds = ids;
    }),

  setUIEditorViewport: (v) =>
    set((s) => {
      Object.assign(s.uiEditorViewport, v);
    }),

  toggleUIGrid: () =>
    set((s) => {
      s.showUIGrid = !s.showUIGrid;
    }),

  setUIGridSize: (size) =>
    set((s) => {
      s.uiGridSize = size;
    }),

  toggleSnapToGrid: () =>
    set((s) => {
      s.snapToGrid = !s.snapToGrid;
    }),

  setLeftPanelMode: (mode) =>
    set((s) => {
      s.leftPanelMode = mode;
    }),
});
