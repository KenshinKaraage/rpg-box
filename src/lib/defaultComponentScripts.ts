/**
 * デフォルトコンポーネントスクリプト
 *
 * 登録済みの全 Component クラスを Script (type: 'component') に変換して返す。
 * プロジェクト作成時にスクリプト一覧へシードするために使用する。
 */
import { getAllComponents } from '@/types/components';
import '@/types/components/register';
import { componentClassToScript } from './componentScriptUtils';
import type { Script } from '@/types/script';

/**
 * ビルトインコンポーネントスクリプト一覧を取得する
 *
 * getAllComponents() で登録済みの全コンポーネントを Script に変換する。
 * カスタムコンポーネントを registerComponent() で追加済みの場合も自動で含まれる。
 */
export function getDefaultComponentScripts(): Script[] {
  return getAllComponents().map(([, Cls]) => componentClassToScript(Cls));
}
