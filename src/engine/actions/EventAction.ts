import type { GameContext } from '../runtime/GameContext';

/**
 * EventAction base class (runtime only, no UI methods)
 *
 * Each action type extends this to implement execute(), toJSON(), fromJSON().
 * Editor UI for actions lives separately in src/features/event-editor/.
 */
/** イベント実行時のオプション（トリガー元オブジェクト等） */
export interface EventExecuteOptions {
  /** トリガー元オブジェクトの ObjectProxy */
  selfObject?: unknown;
}

export abstract class EventAction {
  abstract readonly type: string;

  /**
   * Execute the action.
   * @param context Game context (state & API access)
   * @param run Callback to execute child actions (for Conditional, Loop, etc.)
   * @param options Optional: trigger object reference etc.
   */
  abstract execute(
    context: GameContext,
    run: (actions: EventAction[]) => Promise<void>,
    options?: EventExecuteOptions
  ): Promise<void>;

  /** Serialize action-specific data (subclass override) */
  protected abstract serializeData(): Record<string, unknown>;

  /** Serialize to JSON for saving — always includes `type` */
  toJSON(): Record<string, unknown> {
    return { type: this.type, ...this.serializeData() };
  }

  /** Restore properties from JSON */
  abstract fromJSON(data: Record<string, unknown>): void;
}
