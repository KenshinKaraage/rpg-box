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
 * UIAction 基底クラス
 *
 * EventAction とは別系統のアクション基底クラス。
 * UIプロパティの操作やアニメーション発動など UI 固有の操作を定義する。
 *
 * execute() は持たない — 実行は UI ランタイムが担当する。
 */
export abstract class UIAction implements EditableAction {
  abstract readonly type: string;

  /** Serialize to JSON for saving */
  abstract toJSON(): Record<string, unknown>;

  /** Restore properties from JSON */
  abstract fromJSON(data: Record<string, unknown>): void;
}
