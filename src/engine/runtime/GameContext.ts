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
  /** BGM再生（ループ、フェードイン対応） */
  playBGM(assetId: string, options?: { volume?: number; loop?: boolean; fadeIn?: number }): void;
  /** BGM停止（フェードアウト対応） */
  stopBGM(fadeOut?: number): void;
  /** SE再生 */
  playSE(assetId: string, options?: { volume?: number }): void;
  /** 全停止 */
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

export interface ObjectProxy {
  /** オブジェクトID */
  readonly id: string;
  /** オブジェクト名 */
  readonly name: string;
  /** グリッド座標 */
  getPosition(): { x: number; y: number };
  /** グリッド座標を設定（即座にテレポート） */
  setPosition(x: number, y: number): void;
  /** 向き */
  getFacing(): string;
  /** 向きを変更 */
  setFacing(direction: string): void;
  /** 移動中かどうか */
  isMoving(): boolean;
  /** コンポーネントデータ取得（読み取り専用コピー） */
  getComponent(type: string): Record<string, unknown> | null;
  /** コンポーネントデータ更新（部分上書き） */
  setComponent(type: string, data: Record<string, unknown>): void;
  /** 表示/非表示（sprite.opacity で制御） */
  setVisible(visible: boolean): void;
  /** オブジェクトを破棄 */
  destroy(): void;
}

export interface ObjectAPI {
  /** 名前でオブジェクト検索 */
  find(name: string): ObjectProxy | null;
  /** IDでオブジェクト検索 */
  findById(id: string): ObjectProxy | null;
  /** 指定タイルのオブジェクト検索 */
  findAtTile(x: number, y: number): ObjectProxy | null;
  /** プレハブからオブジェクト生成 */
  create(prefabId: string, x: number, y: number): ObjectProxy | null;
  /** IDでオブジェクト破棄 */
  destroy(id: string): void;
}

export interface MapAPI {
  /** 現在のマップID */
  getCurrentId(): string | null;
  /** マップ幅（タイル数） */
  getWidth(): number;
  /** マップ高さ（タイル数） */
  getHeight(): number;
  /** タイルデータ取得 (chipsetId:chipIndex 文字列、空なら null) */
  getTile(x: number, y: number, layerId?: string): string | null;
  /** マップ切替（イベント完了後に実行） */
  changeMap(mapId: string, x?: number, y?: number): void;
}

export interface InputAPI {
  waitKey(button: GameButton): Promise<void>;
  isDown(button: GameButton): boolean;
  isJustPressed(button: GameButton): boolean;
  /** 今フレームで押された生キー一覧（e.key そのまま: "a", "Backspace", "Enter" 等） */
  getJustPressedKeys(): string[];
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
  sound: SoundAPI;
  readonly camera: CameraAPI;
  readonly save: SaveAPI;
  readonly scriptRunner: ScriptRunner;

  /** Map API — スクリプト内で Map.getCurrentId() 等で使用 */
  map: MapAPI = createStubMapAPI();

  /** Object API — スクリプト内で GameObj.find("NPC") 等で使用 */
  object: ObjectAPI = createStubObjectAPI();

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

  /** Inject Map API backed by GameWorld (called by GameRuntime). */
  setMapAPI(api: MapAPI): void {
    this.map = api;
  }

  /** Inject Object API backed by GameWorld (called by GameRuntime). */
  setObjectAPI(api: ObjectAPI): void {
    this.object = api;
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
    playBGM() { /* stub */ },
    stopBGM() { /* stub */ },
    playSE() { /* stub */ },
    stopAll() { /* stub */ },
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

function createStubObjectAPI(): ObjectAPI {
  return {
    find() { return null; },
    findById() { return null; },
    findAtTile() { return null; },
    create() { return null; },
    destroy() { /* stub */ },
  };
}

function createStubMapAPI(): MapAPI {
  return {
    getCurrentId() { return null; },
    getWidth() { return 0; },
    getHeight() { return 0; },
    getTile() { return null; },
    changeMap() { /* stub */ },
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
    getJustPressedKeys(): string[] {
      return [];
    },
  };
}
