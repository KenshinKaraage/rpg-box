/**
 * GameRuntime — entry point that wires all subsystems together.
 *
 * Lifecycle: construct → start → (update/render loop) → stop
 */

import type { ProjectData } from '@/lib/storage/types';
import '@/engine/actions/register';
import '@/engine/values/register';
import { getAction } from '@/engine/actions/index';
import { EventRunner } from '@/engine/event/EventRunner';
import { ScriptRunner } from '@/engine/core/ScriptRunner';
import { GameContext } from './GameContext';
import { GameLoop } from './GameLoop';
import { InputManager } from './InputManager';
import { Camera } from './Camera';
import { GameWorld } from './GameWorld';
import { TriggerSystem } from './TriggerSystem';
import { MapRenderer } from './MapRenderer';
import { SpriteRenderer } from '@/engine/rendering/SpriteRenderer';
import { UICanvasManager, type UICanvasData } from './UICanvasManager';
import * as twgl from 'twgl.js';

// ── Constants ──

const TILE_SIZE = 32;

// ── Frame wait tracking ──

interface FrameWaiter {
  remaining: number;
  resolve: () => void;
}

// ── GameRuntime ──

export class GameRuntime {
  private gl: WebGLRenderingContext;
  private projectData: ProjectData;

  private gameLoop: GameLoop;
  private input: InputManager;
  private camera: Camera;
  private world: GameWorld;
  private triggerSystem: TriggerSystem;
  private mapRenderer: MapRenderer;
  private spriteRenderer: SpriteRenderer;
  private uiCanvasManager: UICanvasManager;

  private canvas: HTMLCanvasElement;

  /** Pending frame-wait promises (ticked each update). */
  private frameWaiters: FrameWaiter[] = [];

  /** True while an event is being executed (blocks new triggers). */
  private eventRunning = false;

  /** Shared context for all event/script execution (persists variable state). */
  private context: GameContext | null = null;
  private sharedScriptRunner: ScriptRunner | null = null;

  constructor(canvas: HTMLCanvasElement, projectData: ProjectData) {
    const gl = canvas.getContext('webgl');
    if (!gl) throw new Error('WebGL not supported');

    this.canvas = canvas;
    this.gl = gl;
    this.projectData = projectData;

    // WebGL setup
    gl.clearColor(0, 0, 0, 1);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Subsystems
    this.input = new InputManager();
    this.camera = new Camera(
      canvas.width,
      canvas.height,
      // Will be set when map loads
      canvas.width,
      canvas.height
    );
    this.world = new GameWorld();
    this.triggerSystem = new TriggerSystem();
    this.mapRenderer = new MapRenderer(gl);
    this.spriteRenderer = new SpriteRenderer(gl);
    this.uiCanvasManager = new UICanvasManager(gl, (imageId) => {
      const asset = projectData.assets.find((a) => a.id === imageId);
      return (asset?.data as string) ?? null;
    });

    // Game loop
    this.gameLoop = new GameLoop({
      update: (dt) => this.update(dt),
      render: () => this.render(),
    });
  }

  async start(): Promise<void> {
    const { projectData } = this;
    const settings = projectData.gameSettings;

    // Attach input to canvas
    this.canvas.tabIndex = 0;
    this.input.attach(this.canvas);
    this.canvas.focus();

    // Load UI canvases
    this.uiCanvasManager.loadCanvases(
      projectData.uiCanvases as unknown as UICanvasData[]
    );

    // Load start map
    await this.loadMap(settings.startMapId);

    // Warn if no player object found
    if (!this.world.activeController) {
      console.warn(
        '[GameRuntime] No object with ControllerComponent found on start map. ' +
        'Player movement will not work. Place an object with ControllerComponent on the map.'
      );
    }

    // Build persistent GameContext (shared across all events)
    const engineData = this.buildEngineProjectData();
    this.sharedScriptRunner = new ScriptRunner(this.projectData.scripts);
    this.context = new GameContext(engineData, this.sharedScriptRunner);
    this.context.setRuntimeCallbacks({ waitFrames: this.createWaitFrames() });

    // Camera follows active controller
    this.camera.followTarget(() => {
      const ctrl = this.world.activeController;
      if (!ctrl) return null;
      return { x: ctrl.pixelX + TILE_SIZE / 2, y: ctrl.pixelY + TILE_SIZE / 2 };
    });

    // Start game loop
    this.gameLoop.start();
  }

  stop(): void {
    this.gameLoop.stop();
    this.input.detach();
    this.mapRenderer.dispose();
    this.spriteRenderer.dispose();
    this.uiCanvasManager.dispose();
    // Resolve any pending frame waiters
    for (const waiter of this.frameWaiters) {
      waiter.resolve();
    }
    this.frameWaiters.length = 0;
  }

  /** Get UI canvas proxies for ScriptAPI. */
  getUIProxies(): Record<string, ReturnType<UICanvasManager['createProxies']>[string]> {
    return this.uiCanvasManager.createProxies();
  }

  /**
   * Create a RuntimeCallbacks-compatible waitFrames function.
   * Returns a Promise that resolves after N game loop update ticks.
   */
  createWaitFrames(): (frames: number) => Promise<void> {
    return (frames: number) => {
      if (frames <= 0) return Promise.resolve();
      return new Promise<void>((resolve) => {
        this.frameWaiters.push({ remaining: frames, resolve });
      });
    };
  }

  // ── Private: Map loading ──

  private async loadMap(mapId: string): Promise<void> {
    const { projectData } = this;
    const map = projectData.maps.find((m) => m.id === mapId);
    if (!map) {
      console.warn(`[GameRuntime] Map not found: ${mapId}`);
      return;
    }

    // Load map into world
    this.world.loadMap(map, projectData.chipsets, projectData.prefabs);

    // Update camera bounds
    this.camera.setMapSize(map.width * TILE_SIZE, map.height * TILE_SIZE);

    // Load tile textures
    await this.mapRenderer.loadTextures(projectData.chipsets, (imageId) => {
      const asset = projectData.assets.find((a) => a.id === imageId);
      return (asset?.data as string) ?? null;
    });

    // Load sprite textures for objects with SpriteComponent
    for (const obj of this.world.objects) {
      const sprite = obj.components['sprite'];
      if (sprite?.imageId && !this.spriteRenderer.hasTexture(sprite.imageId as string)) {
        const asset = projectData.assets.find((a) => a.id === sprite.imageId);
        if (asset?.data) {
          await this.spriteRenderer.loadTexture(sprite.imageId as string, asset.data as string);
        }
      }
    }

    // Reset trigger system for new map
    this.triggerSystem.reset();
  }

  // ── Private: Update ──

  private update(dt: number): void {
    this.input.update();

    // Tick frame waiters
    this.tickFrameWaiters();

    // World update — returns objects that finished a grid move this frame
    const completions = this.world.update(dt, this.input);

    // Notify trigger system of completed moves
    for (const { obj, fromX, fromY } of completions) {
      this.triggerSystem.notifyMoveCompleted(obj, fromX, fromY);
    }

    // Trigger evaluation (skip while an event is already running)
    if (!this.eventRunning) {
      const triggerResult = this.triggerSystem.update(this.world, this.input);
      if (triggerResult) {
        this.executeTriggeredEvent(triggerResult.eventId);
      }
    }

    // Camera update
    this.camera.update();
  }

  /** Decrement frame waiters and resolve those that reach 0. */
  private tickFrameWaiters(): void {
    let i = 0;
    while (i < this.frameWaiters.length) {
      const waiter = this.frameWaiters[i]!;
      waiter.remaining--;
      if (waiter.remaining <= 0) {
        waiter.resolve();
        // Remove by swapping with last element (O(1))
        this.frameWaiters[i] = this.frameWaiters[this.frameWaiters.length - 1]!;
        this.frameWaiters.pop();
      } else {
        i++;
      }
    }
  }

  // ── Private: Event execution ──

  /**
   * Find an event template by ID, deserialize its actions, and run them.
   * Runs asynchronously — the game loop continues (for waitFrames support).
   */
  private executeTriggeredEvent(eventId: string): void {
    const template = this.projectData.eventTemplates.find((t) => t.id === eventId);
    if (!template) {
      console.warn(`[GameRuntime] Event template not found: ${eventId}`);
      return;
    }

    if (!template.actions || template.actions.length === 0) return;

    // Deserialize actions
    const actions = template.actions.map((a) => {
      const ActionClass = getAction(a.type);
      if (!ActionClass) throw new Error(`Unknown action type: ${a.type}`);
      const action = new ActionClass();
      action.fromJSON(a.data as Record<string, unknown>);
      return action;
    });

    if (!this.context) {
      console.error('[GameRuntime] GameContext not initialized');
      return;
    }

    // Run asynchronously using the shared context
    this.eventRunning = true;
    this.world.setEventRunning(true);
    const eventRunner = new EventRunner();
    eventRunner
      .run(actions, this.context)
      .catch((err) => {
        console.error(`[GameRuntime] Event error (${eventId}):`, err);
      })
      .finally(() => {
        this.eventRunning = false;
        this.world.setEventRunning(false);
      });
  }

  private buildEngineProjectData() {
    return {
      scripts: this.projectData.scripts,
      variables: this.projectData.variables.map((v) => ({
        id: v.id,
        name: v.name,
        type: v.fieldType.type,
        defaultValue: v.initialValue,
      })),
      classes: this.projectData.classes?.map((c) => ({
        id: c.id,
        name: c.name,
        fields: c.fields?.map((f) => ({ id: f.id, fieldType: f.type })) ?? [],
      })) ?? [],
      dataTypes: this.projectData.dataTypes?.map((dt) => ({ id: dt.id, name: dt.name })) ?? [],
      dataEntries: this.projectData.dataEntries ?? {},
    };
  }

  // ── Private: Render ──

  private render(): void {
    const gl = this.gl;
    const canvas = this.canvas;

    // Canvas size is set by TestPlayOverlay from gameSettings.resolution.
    // Do NOT call twgl.resizeCanvasToDisplaySize — it overrides the
    // configured resolution with the CSS display size.
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const map = this.world.getCurrentMap();
    if (!map) return;

    const viewport = this.camera.getViewport();
    // Convert camera center to top-left for renderer
    const halfW = canvas.width / (2 * viewport.zoom);
    const halfH = canvas.height / (2 * viewport.zoom);
    const renderViewport = {
      x: (viewport.x - halfW) * viewport.zoom,
      y: (viewport.y - halfH) * viewport.zoom,
      zoom: viewport.zoom,
    };

    // 1. Tile layers
    this.mapRenderer.render(
      map,
      this.projectData.chipsets,
      renderViewport,
      canvas.width,
      canvas.height
    );

    // 2. Sprite objects (Y-sorted)
    const z = viewport.zoom;
    const spriteMatrix = twgl.m4.ortho(
      renderViewport.x / z,
      (renderViewport.x + canvas.width) / z,
      (renderViewport.y + canvas.height) / z,
      renderViewport.y / z,
      -1,
      1
    );
    this.spriteRenderer.render(this.world.objects, spriteMatrix);

    // 3. UI canvases (screen-space, on top of everything)
    this.uiCanvasManager.render(canvas.width, canvas.height);
  }
}
