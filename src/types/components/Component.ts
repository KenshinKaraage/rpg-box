import type { ReactNode } from 'react';

/**
 * コンポーネントの基底抽象クラス
 *
 * マップオブジェクトに付与できる機能単位。
 * Transform、Sprite、Collider等の各コンポーネントはこのクラスを継承して実装する。
 *
 * @example
 * ```typescript
 * class TransformComponent extends Component {
 *   readonly type = 'transform';
 *   x: number = 0;
 *   y: number = 0;
 *   rotation: number = 0;
 *
 *   serialize(): unknown {
 *     return { x: this.x, y: this.y, rotation: this.rotation };
 *   }
 *
 *   deserialize(data: unknown): void {
 *     const d = data as { x: number; y: number; rotation: number };
 *     this.x = d.x;
 *     this.y = d.y;
 *     this.rotation = d.rotation;
 *   }
 *
 *   clone(): TransformComponent {
 *     const c = new TransformComponent();
 *     c.x = this.x;
 *     c.y = this.y;
 *     c.rotation = this.rotation;
 *     return c;
 *   }
 *
 *   renderPropertyPanel(): ReactNode {
 *     // プロパティパネルのUI
 *   }
 * }
 * ```
 */
export abstract class Component {
  /**
   * コンポーネントタイプの識別子
   * 各サブクラスで固有の値を定義する
   */
  abstract readonly type: string;

  /**
   * コンポーネントをシリアライズ（保存用の形式に変換）
   * @returns シリアライズされたデータ
   */
  abstract serialize(): unknown;

  /**
   * データをデシリアライズ（保存形式から復元）
   * @param data デシリアライズするデータ
   */
  abstract deserialize(data: unknown): void;

  /**
   * コンポーネントの複製を作成
   * @returns 複製されたコンポーネント
   */
  abstract clone(): Component;

  /**
   * プロパティパネルUIをレンダリング
   * エディタでコンポーネントのプロパティを編集するためのUI
   * @returns Reactノード
   */
  abstract renderPropertyPanel(): ReactNode;
}
