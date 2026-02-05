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
} from './registry';

// 組み込みアセットタイプ
import { ImageAssetType } from './ImageAssetType';
export { ImageAssetType };
export type { ImageMetadata } from './ImageAssetType';

import { registerAssetType } from './registry';
registerAssetType('image', ImageAssetType);
