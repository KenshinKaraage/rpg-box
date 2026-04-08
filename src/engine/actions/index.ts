import { EventAction } from './EventAction';

export { EventAction };

type EventActionConstructor = new () => EventAction;

const actionRegistry = new Map<string, EventActionConstructor>();

export function registerAction(type: string, actionClass: EventActionConstructor): void {
  if (actionRegistry.has(type)) {
    console.warn(`EventAction "${type}" is already registered. Overwriting.`);
  }
  actionRegistry.set(type, actionClass);
}

export function getAction(type: string): EventActionConstructor | undefined {
  return actionRegistry.get(type);
}

export function getAllActions(): [string, EventActionConstructor][] {
  return Array.from(actionRegistry.entries());
}

export function getActionNames(): string[] {
  return Array.from(actionRegistry.keys());
}

export function clearActionRegistry(): void {
  actionRegistry.clear();
}

/**
 * Deserialize an array of serialized actions ({ type, data }) into EventAction instances.
 */
export function deserializeActions(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items: any[]
): EventAction[] {
  return items.map((item) => {
    // Already a class instance
    if (typeof item.fromJSON === 'function') return item;
    const ActionClass = actionRegistry.get(item.type);
    if (!ActionClass) throw new Error(`Unknown action type: ${item.type}`);
    const action = new ActionClass();
    action.fromJSON(item.data ?? item);
    return action;
  });
}
