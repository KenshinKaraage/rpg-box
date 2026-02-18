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
