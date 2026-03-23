/**
 * EditableAction — UIAction と EventAction の共通インターフェース
 *
 * ActionBlockEditor はこのインターフェースで動作する。
 * TypeScriptの構造的部分型により、EventAction も暗黙的にこれを満たす。
 */
export interface EditableAction {
  readonly type: string;
  toJSON(): Record<string, unknown>;
  fromJSON(data: Record<string, unknown>): void;
}

/**
 * UIAction の execute に渡されるマネージャーインターフェース。
 * UICanvasManager が実装する。循環参照を避けるためインターフェースで定義。
 */
export interface UIActionManager {
  setPropertyById(canvasId: string, objectId: string, componentType: string, key: string, value: unknown): void;
  setObjectVisibility(canvasId: string, objectId: string, visible: boolean): void;
  playAnimation(canvasId: string, objectId: string, animationName: string, options?: { wait?: boolean }): Promise<void>;
  executeFunction(canvasId: string, functionName: string, args: Record<string, unknown>, depth?: number): Promise<void>;
  showCanvas(canvasId: string): void;
}

/**
 * UIAction 基底クラス
 *
 * EventAction とは別系統のアクション基底クラス。
 * UIプロパティの操作やアニメーション発動など UI 固有の操作を定義する。
 */
export abstract class UIAction implements EditableAction {
  abstract readonly type: string;

  /** Execute the action at runtime. */
  abstract execute(canvasId: string, manager: UIActionManager, fnArgs: Record<string, unknown>, depth: number): Promise<void>;

  /** Serialize to JSON for saving */
  abstract toJSON(): Record<string, unknown>;

  /** Restore properties from JSON */
  abstract fromJSON(data: Record<string, unknown>): void;
}
