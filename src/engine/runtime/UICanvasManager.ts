/**
 * Game runtime UI canvas manager.
 * Loads UICanvas data, manages visibility, and renders visible canvases
 * using the shared UIRenderer from the editor (WYSIWYG).
 *
 * ScriptAPI.UI proxies call show/hide/setProperty/executeFunction on this manager.
 */

import * as twgl from 'twgl.js';
import type { EditorUIObject } from '@/stores/uiEditorSlice';
import type { SerializedAction } from '@/types/ui/components/ActionTypes';
import type { TemplateArg } from '@/types/event';
import type { NamedAnimation } from '@/types/ui/components/AnimationComponent';
import { computeTimelineDuration } from '@/types/ui/components/AnimationComponent';
import { evaluateTimeline } from '@/features/ui-editor/renderer/animationResolver';
import type { UIActionManager } from '@/types/ui/actions/UIAction';
import { UIAction } from '@/types/ui/actions/UIAction';
import { getUIAction } from '@/types/ui/actions';
import { getAction } from '@/engine/actions';
import {
  renderUIObjects,
  createRendererPrograms,
  type UIRendererContext,
} from '@/features/ui-editor/renderer/UIRenderer';

// ── Types ──

export interface UIFunctionData {
  id: string;
  name: string;
  args: TemplateArg[];
  actions: SerializedAction[];
}

export interface UICanvasData {
  id: string;
  name: string;
  objects: EditorUIObject[];
  functions?: UIFunctionData[];
}

interface CanvasState {
  data: UICanvasData;
  visible: boolean;
}

interface RuntimeAnimation {
  canvasId: string;
  objectId: string;
  animation: NamedAnimation;
  elapsed: number;
  totalDuration: number;
  loop: boolean;
  resolve: (() => void) | null;
}


export interface UICanvasRuntimeProxy {
  show(): void;
  hide(): void;
  isVisible(): boolean;
  getObject(name: string): UIObjectRuntimeProxy | null;
  setProperty(objectName: string, componentType: string, key: string, value: unknown): void;
  call(functionName: string, args?: Record<string, unknown>): Promise<void>;
  // 動的メソッド（UIFunction名）は実装レベルで追加される
  [key: string]: unknown;
}

export interface UIObjectRuntimeProxy {
  readonly id: string;
  readonly name: string;
  setProperty(componentType: string, key: string, value: unknown): void;
  x: number;
  y: number;
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  visible: boolean;
  getChild(name: string): UIObjectRuntimeProxy | null;
  getChildren(): UIObjectRuntimeProxy[];
}

/** UIObjectRuntimeProxy で直接アクセス可能な transform キー */
const TRANSFORM_KEYS = new Set([
  'x', 'y', 'width', 'height', 'scaleX', 'scaleY', 'rotation', 'visible',
]);

// ── UICanvasManager ──

export class UICanvasManager implements UIActionManager {
  private gl: WebGLRenderingContext;
  private programs: ReturnType<typeof createRendererPrograms>;
  private textureCache = new Map<string, WebGLTexture>();
  private imageSizeCache = new Map<string, { w: number; h: number }>();
  private getAssetData: (assetId: string) => string | null;
  private canvases = new Map<string, CanvasState>();
  private runningAnimations: RuntimeAnimation[] = [];
  private needsRedraw = false;

  constructor(
    gl: WebGLRenderingContext,
    getAssetData: (assetId: string) => string | null
  ) {
    this.gl = gl;
    this.programs = createRendererPrograms(gl);
    this.getAssetData = getAssetData;
  }

  /** Load all canvases from project data. */
  loadCanvases(canvases: UICanvasData[]): void {
    this.canvases.clear();
    for (const canvas of canvases) {
      // 古いデータに visible フィールドがない場合のフォールバック
      for (const obj of canvas.objects) {
        obj.transform.visible ??= true;
      }
      this.canvases.set(canvas.id, {
        data: canvas,
        visible: false,
      });
    }
  }

  showCanvas(canvasId: string): void {
    const state = this.canvases.get(canvasId);
    if (state) state.visible = true;
  }

  hideCanvas(canvasId: string): void {
    const state = this.canvases.get(canvasId);
    if (state) state.visible = false;
  }

  isCanvasVisible(canvasId: string): boolean {
    return this.canvases.get(canvasId)?.visible ?? false;
  }

  /** Find canvas by name. */
  findCanvasByName(name: string): UICanvasData | null {
    for (const state of Array.from(this.canvases.values())) {
      if (state.data.name === name) return state.data;
    }
    return null;
  }

  /** Find an object by ID within a canvas. */
  findObjectById(canvasId: string, objectId: string): EditorUIObject | null {
    const state = this.canvases.get(canvasId);
    if (!state) return null;
    return state.data.objects.find((o) => o.id === objectId) ?? null;
  }

  /** Set a property on an object's component within a canvas (by name). */
  setProperty(
    canvasId: string,
    objectName: string,
    componentType: string,
    key: string,
    value: unknown
  ): void {
    const state = this.canvases.get(canvasId);
    if (!state) return;

    const obj = state.data.objects.find((o) => o.name === objectName);
    if (!obj) return;

    if (componentType === 'transform') {
      (obj.transform as unknown as Record<string, unknown>)[key] = value;
      return;
    }

    const comp = obj.components.find((c) => c.type === componentType);
    if (comp) {
      (comp.data as Record<string, unknown>)[key] = value;
    }
  }

  /** Set a property on an object's component within a canvas (by ID). */
  setPropertyById(
    canvasId: string,
    objectId: string,
    componentType: string,
    key: string,
    value: unknown
  ): void {
    const obj = this.findObjectById(canvasId, objectId);
    if (!obj) return;

    if (componentType === 'transform') {
      (obj.transform as unknown as Record<string, unknown>)[key] = value;
      return;
    }

    const comp = obj.components.find((c) => c.type === componentType);
    if (comp) {
      (comp.data as Record<string, unknown>)[key] = value;
    }
  }

  /**
   * Play a named animation on an object.
   * Returns a promise that resolves when the animation completes.
   * For looping animations, resolves immediately (infinite loops can't be awaited).
   */
  async playAnimation(
    canvasId: string,
    objectId: string,
    animationName: string,
    options?: { wait?: boolean }
  ): Promise<void> {
    const obj = this.findObjectById(canvasId, objectId);
    if (!obj) return;

    const animComp = obj.components.find((c) => c.type === 'animation');
    if (!animComp) return;

    const animData = animComp.data as { animations?: NamedAnimation[] };
    const namedAnim = animData.animations?.find((a) => a.name === animationName);
    if (!namedAnim || namedAnim.timeline.tracks.length === 0) return;

    const totalDuration = computeTimelineDuration(
      namedAnim.timeline.tracks,
      namedAnim.timeline.loopCount,
      namedAnim.timeline.loopType
    );
    const isInfinite = !isFinite(totalDuration);

    const entry: RuntimeAnimation = {
      canvasId,
      objectId,
      animation: namedAnim,
      elapsed: 0,
      totalDuration,
      loop: isInfinite,
      resolve: null,
    };

    if (options?.wait && !isInfinite) {
      const promise = new Promise<void>((resolve) => {
        entry.resolve = resolve;
      });
      this.runningAnimations.push(entry);
      return promise;
    }

    this.runningAnimations.push(entry);
  }

  /**
   * Update all running animations. Called by GameRuntime each frame.
   */
  updateAnimations(deltaMs: number): void {
    this.runningAnimations = this.runningAnimations.filter((anim) => {
      anim.elapsed += deltaMs;

      const obj = this.findObjectById(anim.canvasId, anim.objectId);
      if (!obj) {
        anim.resolve?.();
        return false;
      }

      const values = evaluateTimeline(anim.animation.timeline, anim.elapsed, anim.loop);
      this.applyAnimatedValues(obj, values);

      if (!anim.loop && anim.elapsed >= anim.totalDuration) {
        anim.resolve?.();
        return false;
      }

      return true;
    });
  }

  /** Set visibility of an object (by ID). */
  setObjectVisibility(canvasId: string, objectId: string, visible: boolean): void {
    const obj = this.findObjectById(canvasId, objectId);
    if (!obj) return;
    obj.transform.visible = visible;
  }

  /**
   * Execute a UIFunction's action list.
   * Resolves argument placeholders and executes each action sequentially.
   */
  async executeFunction(
    canvasId: string,
    functionName: string,
    args: Record<string, unknown> = {},
    depth: number = 0
  ): Promise<void> {
    if (depth > 10) {
      console.error(`UIFunction call depth exceeded (max 10): ${functionName}`);
      return;
    }

    const state = this.canvases.get(canvasId);
    if (!state) return;

    const fn = state.data.functions?.find((f) => f.name === functionName);
    if (!fn) {
      console.warn(`UIFunction "${functionName}" not found on canvas "${state.data.name}"`);
      return;
    }

    for (const action of fn.actions) {
      await this.executeAction(canvasId, action, args, depth);
    }
  }

  /**
   * Render all visible canvases.
   * Drawn in screen-space (camera-fixed), on top of game world.
   */
  render(screenWidth: number, screenHeight: number): void {
    const gl = this.gl;

    // Screen-space ortho matrix (no camera transform)
    const matrix = twgl.m4.ortho(0, screenWidth, screenHeight, 0, -1, 1);

    const ctx: UIRendererContext = {
      gl,
      solidProgram: this.programs.solidProgram,
      texturedProgram: this.programs.texturedProgram,
      matrix,
      textureCache: this.textureCache,
      imageSizeCache: this.imageSizeCache,
      getAssetData: this.getAssetData,
      onTextureLoaded: () => {
        this.needsRedraw = true;
      },
    };

    for (const state of Array.from(this.canvases.values())) {
      if (!state.visible) continue;
      renderUIObjects(ctx, state.data.objects, screenWidth, screenHeight);
    }
  }

  /** Check if a redraw is needed (e.g. async texture loaded). */
  consumeRedrawFlag(): boolean {
    if (this.needsRedraw) {
      this.needsRedraw = false;
      return true;
    }
    return false;
  }

  /** Create ScriptAPI proxies for all canvases, keyed by canvas ID. */
  createProxies(): Record<string, UICanvasRuntimeProxy> {
    const proxies: Record<string, UICanvasRuntimeProxy> = {};

    for (const state of Array.from(this.canvases.values())) {
      const canvasId = state.data.id;

      const proxy: UICanvasRuntimeProxy = {
        show: () => this.showCanvas(canvasId),
        hide: () => this.hideCanvas(canvasId),
        isVisible: () => this.isCanvasVisible(canvasId),
        getObject: (name: string) => this.createObjectProxy(canvasId, name),
        setProperty: (objectName: string, componentType: string, key: string, value: unknown) =>
          this.setProperty(canvasId, objectName, componentType, key, value),
        call: (functionName: string, args?: Record<string, unknown>) =>
          this.executeFunction(canvasId, functionName, args ?? {}),
      };

      // UIFunction 名を動的メソッドとして追加（既存キーと衝突する場合はスキップ）
      for (const fn of state.data.functions ?? []) {
        if (fn.name in proxy) continue;
        proxy[fn.name] = async (args: Record<string, unknown> = {}) => {
          await this.executeFunction(canvasId, fn.name, args);
        };
      }

      proxies[canvasId] = proxy;
    }

    return proxies;
  }

  dispose(): void {
    this.textureCache.forEach((tex) => this.gl.deleteTexture(tex));
    this.textureCache.clear();
    this.imageSizeCache.clear();
    this.canvases.clear();
  }

  // ── Private ──

  /**
   * Deserialize and execute a single action.
   * Supports both UIAction (execute on this manager) and EventAction (self-executing).
   */
  private async executeAction(
    canvasId: string,
    action: SerializedAction,
    fnArgs: Record<string, unknown>,
    depth: number
  ): Promise<void> {
    // Try UIAction registry first, then EventAction registry
    const Ctor = getUIAction(action.type) ?? getAction(action.type);
    if (!Ctor) return;

    const instance = new Ctor();
    instance.fromJSON(action.data);

    if (instance instanceof UIAction) {
      await instance.execute(canvasId, this, fnArgs, depth);
    } else {
      // EventAction — self-executing (conditional, loop, wait, etc.)
      // GameContext is not available here; EventActions that need it (variableOp, script, etc.)
      // will need a context reference in the future.
      // For now, only structure-only actions (log) work without context.
    }
  }

  /**
   * Apply animated property values directly to an object's data.
   * Property paths: 'transform.x', 'text.content', 'image.opacity', etc.
   */
  private applyAnimatedValues(obj: EditorUIObject, values: Map<string, number | string>): void {
    values.forEach((value, path) => {
      const dotIdx = path.indexOf('.');
      if (dotIdx < 0) return;
      const compType = path.slice(0, dotIdx);
      const propKey = path.slice(dotIdx + 1);

      if (compType === 'transform') {
        (obj.transform as unknown as Record<string, unknown>)[propKey] = value;
      } else {
        const comp = obj.components.find((c) => c.type === compType);
        if (comp) {
          (comp.data as Record<string, unknown>)[propKey] = value;
        }
      }
    });
  }

  private createObjectProxy(canvasId: string, objectName: string): UIObjectRuntimeProxy | null {
    const state = this.canvases.get(canvasId);
    if (!state) return null;

    const obj = state.data.objects.find((o) => o.name === objectName);
    if (!obj) return null;

    return this.wrapObjectProxy(canvasId, obj);
  }

  private wrapObjectProxy = (canvasId: string, obj: EditorUIObject): UIObjectRuntimeProxy => {
    const state = this.canvases.get(canvasId)!;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const mgr = this;

    return new Proxy({} as UIObjectRuntimeProxy, {
      get(_target, prop: string) {
        if (prop === 'setProperty') {
          return (componentType: string, key: string, value: unknown) => {
            mgr.setPropertyById(canvasId, obj.id, componentType, key, value);
          };
        }
        if (prop === 'getChild') {
          return (name: string): UIObjectRuntimeProxy | null => {
            const child = state.data.objects.find(
              (o) => o.parentId === obj.id && o.name === name
            );
            return child ? mgr.wrapObjectProxy(canvasId, child) : null;
          };
        }
        if (prop === 'getChildren') {
          return (): UIObjectRuntimeProxy[] => {
            return state.data.objects
              .filter((o) => o.parentId === obj.id)
              .map((o) => mgr.wrapObjectProxy(canvasId, o));
          };
        }
        if (prop === 'id') return obj.id;
        if (prop === 'name') return obj.name;
        if (TRANSFORM_KEYS.has(prop)) {
          return obj.transform[prop as keyof typeof obj.transform];
        }
        return undefined;
      },
      set(_target, prop: string, value: unknown) {
        if (TRANSFORM_KEYS.has(prop)) {
          (obj.transform as unknown as Record<string, unknown>)[prop] = value;
          return true;
        }
        return false;
      },
    });
  };
}
