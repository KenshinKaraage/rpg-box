import type { GameContext } from '../runtime/GameContext';
import type { ValueSource, ValueSourceHandler } from './types';

const handlerRegistry = new Map<string, ValueSourceHandler>();

export function registerValueSourceHandler(handler: ValueSourceHandler): void {
  if (handlerRegistry.has(handler.type)) {
    console.warn(`ValueSourceHandler "${handler.type}" is already registered. Overwriting.`);
  }
  handlerRegistry.set(handler.type, handler);
}

export function getValueSourceHandler(type: string): ValueSourceHandler | undefined {
  return handlerRegistry.get(type);
}

export function resolveValue(source: ValueSource, context: GameContext): unknown {
  const handler = handlerRegistry.get(source.type);
  if (!handler) {
    throw new Error(`Unknown ValueSource type: ${source.type}`);
  }
  return handler.resolve(source, context);
}

/** テスト用 */
export function clearValueSourceRegistry(): void {
  handlerRegistry.clear();
}
