/**
 * アセットタイプモジュール
 */

// 基底クラス
export { AssetType } from './AssetType';
export type { ValidationResult, BaseAssetMetadata } from './AssetType';

// レジストリ関数
export {
  registerAssetType,
  getAssetType,
  getAllAssetTypes,
  getAssetTypeNames,
  clearAssetTypeRegistry,
  createAssetTypeInstance,
  getAssetTypeOptions,
  getAssetTypeByExtension,
  getAllSupportedExtensions,
} from './registry';

// 組み込みアセットタイプ
import { ImageAssetType } from './ImageAssetType';
import { AudioAssetType } from './AudioAssetType';
import { FontAssetType } from './FontAssetType';

export { ImageAssetType, AudioAssetType, FontAssetType };
export type { ImageMetadata } from './ImageAssetType';
export type { AudioMetadata } from './AudioAssetType';
export type { FontMetadata } from './FontAssetType';

// レジストリに登録
import { registerAssetType } from './registry';
registerAssetType('image', ImageAssetType);
registerAssetType('audio', AudioAssetType);
registerAssetType('font', FontAssetType);
