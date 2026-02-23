/**
 * マップのデフォルトフィールド
 *
 * 新規マップ作成時にあらかじめ設定されるフィールド
 */
import { AudioFieldType, ImageFieldType } from '@/types/fields';
import type { FieldType } from '@/types/fields/FieldType';

/**
 * マップのデフォルトフィールドを作成
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createDefaultMapFields(): FieldType<any>[] {
  const bgmField = new AudioFieldType();
  bgmField.id = 'bgm';
  bgmField.name = 'BGM';

  const backgroundImageField = new ImageFieldType();
  backgroundImageField.id = 'background_image';
  backgroundImageField.name = '背景画像';

  return [bgmField, backgroundImageField];
}
