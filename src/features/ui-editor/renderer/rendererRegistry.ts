/**
 * コンポーネントレンダラーのレジストリ
 *
 * 各コンポーネントタイプに対応する描画関数を登録し、
 * UIRenderer が汎用的にディスパッチできるようにする。
 */
import type { WorldRect } from './transformResolver';
import type { UIRendererContext } from './UIRenderer';

/** コンポーネント描画関数の型 */
export type ComponentRenderFn = (
  ctx: UIRendererContext,
  data: unknown,
  rect: WorldRect,
  gl: WebGLRenderingContext
) => void;

const registry = new Map<string, ComponentRenderFn>();

export function registerComponentRenderer(type: string, fn: ComponentRenderFn): void {
  registry.set(type, fn);
}

export function getComponentRenderer(type: string): ComponentRenderFn | undefined {
  return registry.get(type);
}

/** レジストリに描画関数が登録されているか（= ビジュアルコンポーネントか） */
export function isVisualComponent(type: string): boolean {
  return registry.has(type);
}
