import type { ReactNode } from 'react';

// ──────────────────────────────────────────────
// Property Definition (for editor introspection)
// ──────────────────────────────────────────────

/**
 * コンポーネントの編集可能プロパティ定義
 *
 * 各 UIComponent は getPropertyDefs() でこの配列を返し、
 * エディタ UI はこれを使ってフォームを動的に生成する。
 */
export type PropertyDef = {
  key: string;
  label: string;
} & (
  | { type: 'number'; min?: number; max?: number; step?: number }
  | { type: 'boolean' }
  | { type: 'select'; options: { value: string; label: string }[] }
  | { type: 'color' }
  | { type: 'colorAlpha' }
  | { type: 'assetImage' }
  | { type: 'text'; placeholder?: string }
  | { type: 'textarea'; placeholder?: string }
);

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
  /** 表示/非表示 */
  visible: boolean;
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
 * アニメーション可能なプロパティ定義
 * 各 UIComponent は getAnimatablePropertyDefs() でこの配列を返し、
 * エディタがトラックのプロパティドロップダウンを動的に生成する。
 */
export interface AnimatablePropertyDef {
  /** プロパティキー（serialize/deserialize で使うキー名） */
  key: string;
  /** UI表示用ラベル */
  label: string;
  /** 値の種別 */
  valueType: 'number' | 'color';
}

/**
 * RectTransform のアニメーション可能なプロパティ定義を返す。
 * Transform はコンポーネントではなく UIObject の一部なので独立した関数として提供する。
 */
export function getRectTransformAnimatablePropertyDefs(): AnimatablePropertyDef[] {
  return [
    { key: 'x', label: 'X座標', valueType: 'number' },
    { key: 'y', label: 'Y座標', valueType: 'number' },
    { key: 'scaleX', label: 'スケールX', valueType: 'number' },
    { key: 'scaleY', label: 'スケールY', valueType: 'number' },
    { key: 'rotation', label: '回転', valueType: 'number' },
  ];
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
 *   readonly label = 'Image';
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
   * UI 表示用ラベル（エディタのコンポーネント一覧に表示される名前）
   */
  abstract readonly label: string;

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
   * 編集可能なプロパティの定義一覧を返す。
   * エディタがこのコンポーネントのプロパティフォームを動的に生成するために使用する。
   * カスタムエディタを持つコンポーネント（Action, TemplateController等）は空配列を返す。
   */
  getPropertyDefs(): PropertyDef[] {
    return [];
  }

  /**
   * アニメーション可能なプロパティの定義一覧を返す。
   * エディタがトラックのプロパティドロップダウンを動的に生成するために使用する。
   */
  getAnimatablePropertyDefs(): AnimatablePropertyDef[] {
    return [];
  }

  /**
   * プロパティパネルUIをレンダリング
   * エディタでコンポーネントのプロパティを編集するためのUI
   * @returns Reactノード
   */
  renderPropertyPanel(): ReactNode {
    return null;
  }

  /**
   * ランタイムスクリプトを生成する。
   *
   * 非ビジュアル系コンポーネント（Navigation 等）がオーバーライドし、
   * プロパティに基づいたライフサイクル関数を含む JS コードを返す。
   *
   * 標準ライフサイクル: onShow(), onHide(), onUpdate(dt), onInput(button)
   * 独自関数も定義可能（例: getResult()）
   *
   * ビジュアル系コンポーネントは null（デフォルト）を返す。
   * UICanvasManager がコンパイル・実行を担当する。
   */
  generateRuntimeScript(): string | null {
    return null;
  }
}

/**
 * RectTransform の編集可能プロパティ定義を返す。
 * Transform はコンポーネントではなく UIObject の一部なので独立した関数として提供する。
 */
export function getRectTransformPropertyDefs(): PropertyDef[] {
  return [
    { key: 'x', label: '位置X', type: 'number' },
    { key: 'y', label: '位置Y', type: 'number' },
    { key: 'width', label: '幅', type: 'number', min: 0 },
    { key: 'height', label: '高さ', type: 'number', min: 0 },
    { key: 'rotation', label: '回転', type: 'number' },
    { key: 'scaleX', label: 'スケールX', type: 'number', step: 0.1 },
    { key: 'scaleY', label: 'スケールY', type: 'number', step: 0.1 },
    { key: 'pivotX', label: 'ピボットX', type: 'number', min: 0, max: 1, step: 0.1 },
    { key: 'pivotY', label: 'ピボットY', type: 'number', min: 0, max: 1, step: 0.1 },
  ];
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
    visible: true,
  };
}
