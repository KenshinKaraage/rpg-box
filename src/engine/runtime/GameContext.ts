/**
 * GameContext - Assembles all runtime API instances into a single context object
 *
 * Takes EngineProjectData and creates VariableAPI, DataAPI, ScriptAPI,
 * and stub APIs (Sound, Camera, Save) for script execution.
 */

import type { ScriptRunner } from '../core/ScriptRunner';
import type { EngineProjectData } from '../types';

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
    this.scriptAPI = createScriptAPI(this.variable);
    this.sound = createSoundAPI();
    this.camera = createCameraAPI();
    this.save = createSaveAPI();
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

  // Initialize from defaults
  for (const v of projectData.variables) {
    store[v.name] = v.defaultValue;
  }

  // Apply overrides
  if (overrides?.variables) {
    for (const [name, value] of Object.entries(overrides.variables)) {
      store[name] = value;
    }
  }

  return {
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
}

function createDataAPI(projectData: EngineProjectData): DataAPI {
  const api: DataAPI = {};

  for (const [typeId, entries] of Object.entries(projectData.dataEntries)) {
    // Build array of entry objects (id + values merged)
    const arr: Record<string, unknown>[] = entries.map((e) => ({
      id: e.id,
      ...e.values,
    }));

    // Add ID-based access on the array itself
    for (const entry of arr) {
      (arr as Record<string, unknown>)[entry['id'] as string] = entry;
    }

    api[typeId] = arr;
  }

  return api;
}

function createScriptAPI(variableAPI: VariableAPI): GameScriptAPI {
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
