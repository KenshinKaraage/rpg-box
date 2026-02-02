import type { ReactNode } from 'react';

/**
 * UIオブジェクトの矩形変換情報
 * 位置、サイズ、アンカー、ピボット、回転、スケールを定義
 */
export interface RectTransform {
  /** X座標 */
  x: number;
  /** Y座標 */
  y: number;
  /** 幅 */
  width: number;
  /** 高さ */
  height: number;
  /** 水平方向のアンカー */
  anchorX: 'left' | 'center' | 'right';
  /** 垂直方向のアンカー */
  anchorY: 'top' | 'center' | 'bottom';
  /** ピボットX（0-1） */
  pivotX: number;
  /** ピボットY（0-1） */
  pivotY: number;
  /** 回転角度（度） */
  rotation: number;
  /** X方向のスケール */
  scaleX: number;
  /** Y方向のスケール */
  scaleY: number;
}

/**
 * UIオブジェクトのインターフェース
 * 画面上に配置されるUI要素を表現する
 */
export interface UIObject {
  /** オブジェクトID */
  id: string;
  /** オブジェクト名 */
  name: string;
  /** 親オブジェクトID（階層構造用、ルートの場合はundefined） */
  parentId?: string;
  /** 矩形変換情報（必須） */
  transform: RectTransform;
  /** アタッチされたコンポーネント配列 */
  components: UIComponent[];
}

/**
 * UIコンポーネントの基底抽象クラス
 *
 * UIオブジェクトに付与できる機能単位。
 * Image、Text、Button等の各コンポーネントはこのクラスを継承して実装する。
 *
 * @example
 * ```typescript
 * class ImageUIComponent extends UIComponent {
 *   readonly type = 'image';
 *   imageId?: string;
 *   color: string = '#ffffff';
 *
 *   serialize(): unknown {
 *     return { imageId: this.imageId, color: this.color };
 *   }
 *
 *   deserialize(data: unknown): void {
 *     const d = data as { imageId?: string; color: string };
 *     this.imageId = d.imageId;
 *     this.color = d.color;
 *   }
 *
 *   clone(): ImageUIComponent {
 *     const c = new ImageUIComponent();
 *     c.imageId = this.imageId;
 *     c.color = this.color;
 *     return c;
 *   }
 *
 *   renderPropertyPanel(): ReactNode {
 *     // プロパティパネルのUI
 *   }
 * }
 * ```
 */
export abstract class UIComponent {
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
  abstract clone(): UIComponent;

  /**
   * プロパティパネルUIをレンダリング
   * エディタでコンポーネントのプロパティを編集するためのUI
   * @returns Reactノード
   */
  abstract renderPropertyPanel(): ReactNode;
}

/**
 * RectTransformのデフォルト値を生成
 * @returns デフォルトのRectTransform
 */
export function createDefaultRectTransform(): RectTransform {
  return {
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    anchorX: 'left',
    anchorY: 'top',
    pivotX: 0.5,
    pivotY: 0.5,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
  };
}
