export { EventAction } from './EventAction';
export type {
  EventContext,
  GameObjectRef,
  AutoWalkPattern,
  CameraController,
  AudioController,
  ScriptAPI,
} from './EventAction';

type EventActionConstructor = new () => EventAction;

/**
 * イベントアクションのレジストリ
 * カスタムアクションを登録・取得するためのマップ
 */
const actionRegistry = new Map<string, EventActionConstructor>();

/**
 * イベントアクションをレジストリに登録
 *
 * @param type アクションタイプの識別子
 * @param actionClass アクションのコンストラクタ
 *
 * @example
 * ```typescript
 * registerAction('message', MessageAction);
 * registerAction('choice', ChoiceAction);
 * ```
 */
export function registerAction(type: string, actionClass: EventActionConstructor): void {
  if (actionRegistry.has(type)) {
    console.warn(`EventAction "${type}" is already registered. Overwriting.`);
  }
  actionRegistry.set(type, actionClass);
}

/**
 * レジストリからイベントアクションを取得
 *
 * @param type アクションタイプの識別子
 * @returns アクションのコンストラクタ、存在しない場合はundefined
 *
 * @example
 * ```typescript
 * const Message = getAction('message');
 * if (Message) {
 *   const action = new Message();
 * }
 * ```
 */
export function getAction(type: string): EventActionConstructor | undefined {
  return actionRegistry.get(type);
}

/**
 * 登録されている全てのイベントアクションを取得
 *
 * @returns アクションの識別子とコンストラクタのペア配列
 */
export function getAllActions(): [string, EventActionConstructor][] {
  return Array.from(actionRegistry.entries());
}

/**
 * 登録されているアクションの識別子一覧を取得
 *
 * @returns アクションの識別子配列
 */
export function getActionNames(): string[] {
  return Array.from(actionRegistry.keys());
}

/**
 * レジストリをクリア（テスト用）
 */
export function clearActionRegistry(): void {
  actionRegistry.clear();
}
