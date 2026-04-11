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

/** 登録済みの ValueSource タイプ一覧（label 付き） */
export function getValueSourceTypes(): { value: string; label: string }[] {
  return Array.from(handlerRegistry.values()).map((h) => ({
    value: h.type,
    label: h.label,
  }));
}

/** 登録済みハンドラからデフォルト値を生成 */
export function createDefaultValueSource(type: string): ValueSource {
  const handler = handlerRegistry.get(type);
  if (!handler) throw new Error(`Unknown ValueSource type: ${type}`);
  return handler.defaultValue();
}

/** テスト用 */
export function clearValueSourceRegistry(): void {
  handlerRegistry.clear();
}
