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

  /** Serialize to JSON for saving */
  abstract toJSON(): Record<string, unknown>;

  /** Restore properties from JSON */
  abstract fromJSON(data: Record<string, unknown>): void;
}
