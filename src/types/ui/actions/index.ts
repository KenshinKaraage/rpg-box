import { UIAction } from './UIAction';

export { UIAction };
export type { EditableAction } from './UIAction';

type UIActionConstructor = new () => UIAction;

const uiActionRegistry = new Map<string, UIActionConstructor>();

export function registerUIAction(type: string, actionClass: UIActionConstructor): void {
  if (uiActionRegistry.has(type)) {
    console.warn(`UIAction "${type}" is already registered. Overwriting.`);
  }
  uiActionRegistry.set(type, actionClass);
}

export function getUIAction(type: string): UIActionConstructor | undefined {
  return uiActionRegistry.get(type);
}

export function getAllUIActions(): [string, UIActionConstructor][] {
  return Array.from(uiActionRegistry.entries());
}

export function getUIActionNames(): string[] {
  return Array.from(uiActionRegistry.keys());
}

export function clearUIActionRegistry(): void {
  uiActionRegistry.clear();
}
