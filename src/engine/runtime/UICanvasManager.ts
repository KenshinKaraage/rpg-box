/**
 * Game runtime UI canvas manager.
 * Loads UICanvas data, manages visibility, and renders visible canvases
 * using the shared UIRenderer from the editor (WYSIWYG).
 *
 * ScriptAPI.UI proxies call show/hide/setProperty on this manager.
 */

import * as twgl from 'twgl.js';
import type { EditorUIObject } from '@/stores/uiEditorSlice';
import {
  renderUIObjects,
  createRendererPrograms,
  type UIRendererContext,
} from '@/features/ui-editor/renderer/UIRenderer';

// ── Types ──

export interface UICanvasData {
  id: string;
  name: string;
  objects: EditorUIObject[];
}

interface CanvasState {
  data: UICanvasData;
  visible: boolean;
}

export interface UICanvasProxy {
  show(): void;
  hide(): void;
  isVisible(): boolean;
  getObject(name: string): UIObjectProxy | null;
  setProperty(objectName: string, componentType: string, key: string, value: unknown): void;
}

export interface UIObjectProxy {
  id: string;
  name: string;
  setProperty(componentType: string, key: string, value: unknown): void;
}

// ── UICanvasManager ──

export class UICanvasManager {
  private gl: WebGLRenderingContext;
  private programs: ReturnType<typeof createRendererPrograms>;
  private textureCache = new Map<string, WebGLTexture>();
  private imageSizeCache = new Map<string, { w: number; h: number }>();
  private getAssetData: (assetId: string) => string | null;
  private canvases = new Map<string, CanvasState>();
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

  /** Set a property on an object's component within a canvas. */
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

    const comp = obj.components.find((c) => c.type === componentType);
    if (comp) {
      (comp.data as Record<string, unknown>)[key] = value;
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

  /** Create ScriptAPI proxies for all canvases, keyed by canvas name. */
  createProxies(): Record<string, UICanvasProxy> {
    const proxies: Record<string, UICanvasProxy> = {};

    for (const state of Array.from(this.canvases.values())) {
      const canvasId = state.data.id;
      const canvasName = state.data.name;

      proxies[canvasName] = {
        show: () => this.showCanvas(canvasId),
        hide: () => this.hideCanvas(canvasId),
        isVisible: () => this.isCanvasVisible(canvasId),
        getObject: (name: string) => this.createObjectProxy(canvasId, name),
        setProperty: (objectName: string, componentType: string, key: string, value: unknown) =>
          this.setProperty(canvasId, objectName, componentType, key, value),
      };
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

  private createObjectProxy(canvasId: string, objectName: string): UIObjectProxy | null {
    const state = this.canvases.get(canvasId);
    if (!state) return null;

    const obj = state.data.objects.find((o) => o.name === objectName);
    if (!obj) return null;

    return {
      id: obj.id,
      name: obj.name,
      setProperty: (componentType: string, key: string, value: unknown) => {
        this.setProperty(canvasId, objectName, componentType, key, value);
      },
    };
  }
}
