import { Component } from './Component';

export { Component };

type ComponentConstructor = new () => Component;

/**
 * コンポーネントのレジストリ
 * カスタムコンポーネントを登録・取得するためのマップ
 */
const componentRegistry = new Map<string, ComponentConstructor>();

/**
 * コンポーネントをレジストリに登録
 *
 * @param type コンポーネントタイプの識別子
 * @param componentClass コンポーネントのコンストラクタ
 *
 * @example
 * ```typescript
 * registerComponent('transform', TransformComponent);
 * registerComponent('sprite', SpriteComponent);
 * ```
 */
export function registerComponent(type: string, componentClass: ComponentConstructor): void {
  if (componentRegistry.has(type)) {
    console.warn(`Component "${type}" is already registered. Overwriting.`);
  }
  componentRegistry.set(type, componentClass);
}

/**
 * レジストリからコンポーネントを取得
 *
 * @param type コンポーネントタイプの識別子
 * @returns コンポーネントのコンストラクタ、存在しない場合はundefined
 *
 * @example
 * ```typescript
 * const Transform = getComponent('transform');
 * if (Transform) {
 *   const component = new Transform();
 * }
 * ```
 */
export function getComponent(type: string): ComponentConstructor | undefined {
  return componentRegistry.get(type);
}

/**
 * 登録されている全てのコンポーネントを取得
 *
 * @returns コンポーネントの識別子とコンストラクタのペア配列
 */
export function getAllComponents(): [string, ComponentConstructor][] {
  return Array.from(componentRegistry.entries());
}

/**
 * 登録されているコンポーネントの識別子一覧を取得
 *
 * @returns コンポーネントの識別子配列
 */
export function getComponentNames(): string[] {
  return Array.from(componentRegistry.keys());
}

/**
 * レジストリをクリア（テスト用）
 */
export function clearComponentRegistry(): void {
  componentRegistry.clear();
}

export { TransformComponent } from './TransformComponent';
export { SpriteComponent } from './SpriteComponent';
export { ColliderComponent } from './ColliderComponent';
export { MovementComponent } from './MovementComponent';
export { VariablesComponent } from './VariablesComponent';
export { ControllerComponent } from './ControllerComponent';
export { EffectComponent } from './EffectComponent';
export { ObjectCanvasComponent } from './ObjectCanvasComponent';
export { TalkTriggerComponent } from './triggers/TalkTriggerComponent';
export { TouchTriggerComponent } from './triggers/TouchTriggerComponent';
export { StepTriggerComponent } from './triggers/StepTriggerComponent';
export { AutoTriggerComponent } from './triggers/AutoTriggerComponent';
export { InputTriggerComponent } from './triggers/InputTriggerComponent';
