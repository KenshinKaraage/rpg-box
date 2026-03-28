/**
 * GameContext - Assembles all runtime API instances into a single context object
 *
 * Takes EngineProjectData and creates VariableAPI, DataAPI, ScriptAPI,
 * and stub APIs (Sound, Camera, Save) for script execution.
 */

import type { ScriptRunner } from '../core/ScriptRunner';
import type { EngineProjectData } from '../types';
import type { UICanvasRuntimeProxy } from './UICanvasManager';
import type { GameButton } from './InputManager';

// =============================================================================
// Runtime Extension Types (set by GameRuntime for action integration)
// =============================================================================

export interface MapChangeRequest {
  mapId: string;
  x: number;
  y: number;
}

export interface RuntimeCallbacks {
  /** Wait for N frames (returns a Promise resolved by the game loop). */
  waitFrames: (frames: number) => Promise<void>;
}

// =============================================================================
// API Interfaces
// =============================================================================

export interface VariableAPI {
  get(name: string): unknown;
  set(name: string, value: unknown): void;
  getAll(): Record<string, unknown>;
  /** Proxy: Variable["name"] で直接アクセス可能 */
  [key: string]: unknown;
}

export interface DataAPI {
  [typeId: string]: unknown;
}

export interface GameScriptAPI {
  getVar(name: string): unknown;
  setVar(name: string, value: unknown): void;
  showMessage(message: string): Promise<void>;
  showChoice(choices: string[]): Promise<number>;
  showNumberInput(prompt: string): Promise<number>;
  showTextInput(prompt: string): Promise<string>;
  waitFrames(frames: number): Promise<void>;
}

export interface SoundAPI {
  play(id: string): void;
  stop(id: string): void;
  stopAll(): void;
}

export interface CameraAPI {
  moveTo(x: number, y: number): void;
  shake(intensity: number, duration: number): void;
}

export interface SaveAPI {
  save(slotId: string): void;
  load(slotId: string): void;
}

export interface InputAPI {
  waitKey(button: GameButton): Promise<void>;
  isDown(button: GameButton): boolean;
  isJustPressed(button: GameButton): boolean;
}

export interface NextActionInfo {
  type: string;
  scriptId?: string;
}

export interface CurrentEventInfo {
  nextAction: NextActionInfo | null;
}

// =============================================================================
// Context Overrides
// =============================================================================

export interface ContextOverrides {
  variables?: Record<string, unknown>;
}

// =============================================================================
// GameContext
// =============================================================================

export class GameContext {
  readonly scriptAPI: GameScriptAPI;
  readonly data: DataAPI;
  readonly variable: VariableAPI;
  readonly sound: SoundAPI;
  readonly camera: CameraAPI;
  readonly save: SaveAPI;
  readonly scriptRunner: ScriptRunner;

  /** UI canvas proxies — スクリプト内で UI["canvasName"].functionName() として使用 */
  ui: Record<string, UICanvasRuntimeProxy> = {};

  /** Input API — スクリプト内で Input.waitKey("confirm") として使用 */
  input: InputAPI = createStubInputAPI();

  /** 現在実行中のイベントの次のアクション情報 */
  currentEvent: CurrentEventInfo = { nextAction: null };

  /** Set by MapAction, consumed by GameRuntime after event execution. */
  pendingMapChange: MapChangeRequest | null = null;

  private runtimeCallbacks: RuntimeCallbacks | null = null;

  constructor(
    projectData: EngineProjectData,
    scriptRunner: ScriptRunner,
    overrides?: ContextOverrides
  ) {
    this.scriptRunner = scriptRunner;
    this.variable = createVariableAPI(projectData, overrides);
    this.data = createDataAPI(projectData);
    this.scriptAPI = createScriptAPI(this.variable, this);
    this.sound = createSoundAPI();
    this.camera = createCameraAPI();
    this.save = createSaveAPI();
  }

  /** Inject UI proxies (called by GameRuntime after UICanvasManager setup). */
  setUIProxies(proxies: Record<string, UICanvasRuntimeProxy>): void {
    this.ui = proxies;
  }

  /** Inject Input API backed by a real InputManager (called by GameRuntime). */
  setInputAPI(api: InputAPI): void {
    this.input = api;
  }

  /** Set next action info (called by EventRunner each iteration). */
  setNextAction(next: NextActionInfo | null): void {
    this.currentEvent = { nextAction: next };
  }

  /** Inject runtime callbacks (called by GameRuntime after construction). */
  setRuntimeCallbacks(callbacks: RuntimeCallbacks): void {
    this.runtimeCallbacks = callbacks;
  }

  /** Wait for N frames. Resolves when the game loop has ticked N times. */
  async waitFrames(frames: number): Promise<void> {
    if (this.runtimeCallbacks) {
      await this.runtimeCallbacks.waitFrames(frames);
    }
  }
}

// =============================================================================
// Factory Functions
// =============================================================================

function createVariableAPI(
  projectData: EngineProjectData,
  overrides?: ContextOverrides
): VariableAPI {
  const store: Record<string, unknown> = {};

  // Initialize from defaults (structuredClone to unfreeze Immer proxies)
  for (const v of projectData.variables) {
    store[v.name] = v.defaultValue !== undefined ? structuredClone(v.defaultValue) : undefined;
  }

  // Apply overrides
  if (overrides?.variables) {
    for (const [name, value] of Object.entries(overrides.variables)) {
      store[name] = value;
    }
  }

  const api: VariableAPI = {
    get(name: string): unknown {
      return store[name];
    },
    set(name: string, value: unknown): void {
      store[name] = value;
    },
    getAll(): Record<string, unknown> {
      return { ...store };
    },
  };

  // Proxy: Variable["gold"] で直接アクセス可能にする
  // get/set/getAll メソッドも引き続き使用可能
  return new Proxy(api, {
    get(target, prop: string) {
      if (prop in target) return (target as Record<string, unknown>)[prop];
      return store[prop];
    },
    set(_target, prop: string, value: unknown) {
      store[prop] = value;
      return true;
    },
  });
}

function createDataAPI(projectData: EngineProjectData): DataAPI {
  const api: DataAPI = {};

  for (const [typeId, entries] of Object.entries(projectData.dataEntries)) {
    const arr = entries.map((e) => ({ id: e.id, ...e.values }));
    const byId = Object.fromEntries(arr.map((e) => [e.id, e]));
    api[typeId] = Object.assign(arr, byId);
  }

  return api;
}

function createScriptAPI(variableAPI: VariableAPI, ctx: GameContext): GameScriptAPI {
  return {
    getVar(name: string): unknown {
      return variableAPI.get(name);
    },
    setVar(name: string, value: unknown): void {
      variableAPI.set(name, value);
    },
    async showMessage(_message: string): Promise<void> {
      // Stub: no-op
    },
    async showChoice(_choices: string[]): Promise<number> {
      // Stub: returns first choice index
      return 0;
    },
    async showNumberInput(_prompt: string): Promise<number> {
      // Stub: returns 0
      return 0;
    },
    async showTextInput(_prompt: string): Promise<string> {
      // Stub: returns empty string
      return '';
    },
    async waitFrames(frames: number): Promise<void> {
      await ctx.waitFrames(frames);
    },
  };
}

function createSoundAPI(): SoundAPI {
  return {
    play(_id: string): void {
      // Stub
    },
    stop(_id: string): void {
      // Stub
    },
    stopAll(): void {
      // Stub
    },
  };
}

function createCameraAPI(): CameraAPI {
  return {
    moveTo(_x: number, _y: number): void {
      // Stub
    },
    shake(_intensity: number, _duration: number): void {
      // Stub
    },
  };
}

function createSaveAPI(): SaveAPI {
  return {
    save(_slotId: string): void {
      // Stub
    },
    load(_slotId: string): void {
      // Stub
    },
  };
}

function createStubInputAPI(): InputAPI {
  return {
    async waitKey(_button: GameButton): Promise<void> {
      // Stub: resolves immediately
    },
    isDown(_button: GameButton): boolean {
      return false;
    },
    isJustPressed(_button: GameButton): boolean {
      return false;
    },
  };
}
