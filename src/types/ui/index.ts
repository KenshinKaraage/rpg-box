import { UIComponent, createDefaultRectTransform } from './UIComponent';

export { UIComponent, createDefaultRectTransform };
export type { UIObject, RectTransform } from './UIComponent';

type UIComponentConstructor = new () => UIComponent;

/**
 * UIコンポーネントのレジストリ
 * カスタムUIコンポーネントを登録・取得するためのマップ
 */
const uiComponentRegistry = new Map<string, UIComponentConstructor>();

/**
 * UIコンポーネントをレジストリに登録
 *
 * @param type コンポーネントタイプの識別子
 * @param componentClass コンポーネントのコンストラクタ
 *
 * @example
 * ```typescript
 * registerUIComponent('image', ImageUIComponent);
 * registerUIComponent('text', TextUIComponent);
 * ```
 */
export function registerUIComponent(type: string, componentClass: UIComponentConstructor): void {
  if (uiComponentRegistry.has(type)) {
    console.warn(`UIComponent "${type}" is already registered. Overwriting.`);
  }
  uiComponentRegistry.set(type, componentClass);
}

/**
 * レジストリからUIコンポーネントを取得
 *
 * @param type コンポーネントタイプの識別子
 * @returns コンポーネントのコンストラクタ、存在しない場合はundefined
 *
 * @example
 * ```typescript
 * const Image = getUIComponent('image');
 * if (Image) {
 *   const component = new Image();
 * }
 * ```
 */
export function getUIComponent(type: string): UIComponentConstructor | undefined {
  return uiComponentRegistry.get(type);
}

/**
 * 登録されている全てのUIコンポーネントを取得
 *
 * @returns コンポーネントの識別子とコンストラクタのペア配列
 */
export function getAllUIComponents(): [string, UIComponentConstructor][] {
  return Array.from(uiComponentRegistry.entries());
}

/**
 * 登録されているUIコンポーネントの識別子一覧を取得
 *
 * @returns コンポーネントの識別子配列
 */
export function getUIComponentNames(): string[] {
  return Array.from(uiComponentRegistry.keys());
}

/**
 * レジストリをクリア（テスト用）
 */
export function clearUIComponentRegistry(): void {
  uiComponentRegistry.clear();
}
