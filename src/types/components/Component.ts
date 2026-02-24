import type { ReactNode } from 'react';
import type { GameContext } from '@/engine/runtime/GameContext';

export interface ComponentPanelProps {
  onChange: (updates: Record<string, unknown>) => void;
}

/**
 * コンポーネントの基底抽象クラス
 *
 * マップオブジェクトに付与できる機能単位。
 * Transform、Sprite、Collider等の各コンポーネントはこのクラスを継承して実装する。
 *
 * ライフサイクルメソッド（onCreate, onUpdate, onDestroy, onEnable, onDisable）は
 * デフォルトでno-op。サブクラスで必要に応じてオーバーライドする。
 *
 * @example
 * ```typescript
 * class TransformComponent extends Component {
 *   readonly type = 'transform';
 *   x: number = 0;
 *   y: number = 0;
 *   rotation: number = 0;
 *
 *   serialize(): Record<string, unknown> {
 *     return { x: this.x, y: this.y, rotation: this.rotation };
 *   }
 *
 *   deserialize(data: Record<string, unknown>): void {
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
 *   onCreate(context: GameContext): void {
 *     // 初期化処理
 *   }
 *
 *   onUpdate(context: GameContext, deltaTime: number): void {
 *     // 毎フレーム更新処理
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
   * UI 表示用ラベル（エディタのコンポーネント一覧に表示される名前）
   */
  abstract readonly label: string;

  /**
   * コンポーネントをシリアライズ（保存用の形式に変換）
   * @returns シリアライズされたデータ
   */
  abstract serialize(): Record<string, unknown>;

  /**
   * データをデシリアライズ（保存形式から復元）
   * @param data デシリアライズするデータ
   */
  abstract deserialize(data: Record<string, unknown>): void;

  /**
   * コンポーネントの複製を作成
   * @returns 複製されたコンポーネント
   */
  abstract clone(): Component;

  /**
   * プロパティパネルを描画（エディタ用）
   * @param props パネルの props（onChange コールバック）
   * @returns React ノード
   */
  renderPropertyPanel(_props: ComponentPanelProps): ReactNode {
    return null;
  }

  /**
   * コンポーネント生成時に呼ばれるライフサイクルメソッド
   */
  onCreate(_context: GameContext): void {}

  /**
   * 毎フレーム呼ばれる更新ライフサイクルメソッド
   */
  onUpdate(_context: GameContext, _deltaTime: number): void {}

  /**
   * コンポーネント破棄時に呼ばれるライフサイクルメソッド
   */
  onDestroy(_context: GameContext): void {}

  /**
   * コンポーネント有効化時に呼ばれるライフサイクルメソッド
   */
  onEnable(_context: GameContext): void {}

  /**
   * コンポーネント無効化時に呼ばれるライフサイクルメソッド
   */
  onDisable(_context: GameContext): void {}
}
