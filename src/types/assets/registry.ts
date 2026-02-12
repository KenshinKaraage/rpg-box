/**
 * アセットタイプレジストリ
 *
 * FieldTypeレジストリと同じパターン
 * - registerAssetType() で登録
 * - createAssetTypeInstance() でインスタンス生成
 */

import type { AssetType } from './AssetType';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AssetTypeConstructor = new () => AssetType<any>;

/**
 * アセットタイプレジストリ
 */
const assetTypeRegistry = new Map<string, AssetTypeConstructor>();

/**
 * アセットタイプを登録
 * @param type タイプ識別子
 * @param AssetClass アセットタイプクラス
 */
export function registerAssetType(type: string, AssetClass: AssetTypeConstructor): void {
  if (assetTypeRegistry.has(type)) {
    console.warn(`AssetType "${type}" is already registered. Overwriting.`);
  }
  assetTypeRegistry.set(type, AssetClass);
}

/**
 * アセットタイプクラスを取得
 * @param type タイプ識別子
 * @returns アセットタイプクラス（未登録の場合undefined）
 */
export function getAssetType(type: string): AssetTypeConstructor | undefined {
  return assetTypeRegistry.get(type);
}

/**
 * 全てのアセットタイプを取得
 * @returns [タイプ識別子, クラス] のペア配列
 */
export function getAllAssetTypes(): Array<[string, AssetTypeConstructor]> {
  return Array.from(assetTypeRegistry.entries());
}

/**
 * 全てのアセットタイプ名を取得
 * @returns タイプ識別子の配列
 */
export function getAssetTypeNames(): string[] {
  return Array.from(assetTypeRegistry.keys());
}

/**
 * レジストリをクリア（テスト用）
 */
export function clearAssetTypeRegistry(): void {
  assetTypeRegistry.clear();
}

/**
 * アセットタイプのインスタンスを生成
 * @param type タイプ識別子
 * @returns インスタンス（未登録の場合undefined）
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createAssetTypeInstance(type: string): AssetType<any> | undefined {
  const AssetClass = assetTypeRegistry.get(type);
  if (!AssetClass) {
    return undefined;
  }
  return new AssetClass();
}

/**
 * ドロップダウン用オプションを取得
 * @returns { type, label } の配列
 */
export function getAssetTypeOptions(): Array<{ type: string; label: string }> {
  return Array.from(assetTypeRegistry.entries()).map(([type, AssetClass]) => {
    const instance = new AssetClass();
    return { type, label: instance.label };
  });
}

/**
 * 拡張子からアセットタイプを取得
 * @param extension 拡張子（例: '.png', '.mp3'）
 * @returns タイプ識別子（未対応の場合undefined）
 */
export function getAssetTypeByExtension(extension: string): string | undefined {
  const ext = extension.toLowerCase();
  const entries = Array.from(assetTypeRegistry.entries());
  for (const [type, AssetClass] of entries) {
    const instance = new AssetClass();
    if (instance.extensions.includes(ext)) {
      return type;
    }
  }
  return undefined;
}

/**
 * 全ての対応拡張子を取得
 * @returns 拡張子の配列（例: ['.png', '.jpg', '.mp3', ...]）
 */
export function getAllSupportedExtensions(): string[] {
  const extensions: string[] = [];
  const entries = Array.from(assetTypeRegistry.entries());
  for (const [, AssetClass] of entries) {
    const instance = new AssetClass();
    extensions.push(...instance.extensions);
  }
  return extensions;
}
