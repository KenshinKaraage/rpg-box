/**
 * ゲームエンジン共通型定義
 *
 * エディタとiframe間のpostMessage通信、エンジン初期化設定の型を定義。
 * エディタ側（React）とエンジン側（React非依存）の両方で使用する。
 */

import type { Script } from '@/types/script';

// =============================================================================
// プロジェクトデータ（エンジンに渡す最小限のサブセット）
// =============================================================================

/**
 * エンジンが必要とするプロジェクトデータのサブセット
 */
export interface EngineProjectData {
  scripts: Script[];
  variables: EngineVariable[];
  dataTypes: EngineDataType[];
  dataEntries: Record<string, EngineDataEntry[]>;
}

export interface EngineVariable {
  id: string;
  name: string;
  type: string;
  defaultValue?: unknown;
}

export interface EngineDataType {
  id: string;
  name: string;
}

export interface EngineDataEntry {
  id: string;
  typeId: string;
  values: Record<string, unknown>;
}

// =============================================================================
// エンジン起動設定
// =============================================================================

export interface ObjectPlacement {
  prefabId: string;
  x: number;
  y: number;
  rotation?: number;
  variables?: Record<string, unknown>;
}

export interface EngineStartConfig {
  mode: 'full' | 'script';
  projectData: EngineProjectData;
}

export interface FullModeConfig extends EngineStartConfig {
  mode: 'full';
  startSettings: {
    mapId: string;
    position: { x: number; y: number };
    variables?: Record<string, unknown>;
  };
  debugOptions?: {
    showObjectVars: boolean;
    showCollision: boolean;
    showFPS: boolean;
  };
}

export interface ScriptModeConfig extends EngineStartConfig {
  mode: 'script';
  scriptId: string;
  args: Record<string, unknown>;
  testSettings?: {
    mapId?: string;
    objects?: ObjectPlacement[];
    variables?: Record<string, unknown>;
  };
}

// =============================================================================
// テスト設定パターン
// =============================================================================

export interface TestPattern {
  id: string;
  name: string;
  type: 'script' | 'full';
  config: ScriptModeConfig | FullModeConfig;
}

// =============================================================================
// postMessage 通信プロトコル
// =============================================================================

export type EditorMessage =
  | { type: 'start'; config: FullModeConfig | ScriptModeConfig }
  | { type: 'stop' }
  | { type: 'pause' }
  | { type: 'resume' };

export type EngineMessage =
  | { type: 'ready' }
  | { type: 'log'; level: 'info' | 'warn' | 'error'; message: string }
  | { type: 'script-result'; value: unknown }
  | { type: 'script-error'; error: string; stack?: string }
  | { type: 'state-update'; variables: Record<string, unknown> };
