/**
 * ActionComponent は廃止されました。
 *
 * 責務は以下に分散:
 * - クリック/キー入力 → NavigationComponent + NavigationItemComponent
 * - テンプレート生成時処理 → TemplateControllerComponent.onSpawn / onApply
 * - ビジュアル操作マクロ → UIFunction
 *
 * SerializedAction / UIActionEntry は ActionTypes.ts に移動しました。
 */

// Re-export for backward compatibility during migration
export type { SerializedAction, UIActionEntry } from './ActionTypes';
