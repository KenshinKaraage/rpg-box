/**
 * アセット参照とフォルダの型定義
 */

/**
 * アセット参照
 * 画像・音声・フォントなどのアセットを参照
 */
export interface AssetReference {
  /** 一意識別子 */
  id: string;
  /** アセット名（ファイル名） */
  name: string;
  /** アセットタイプ識別子（'image', 'audio', 'font' など） */
  type: string;
  /** 所属フォルダID（ルートの場合はundefined） */
  folderId?: string;
  /** データ（Base64 data URL） */
  data: string;
  /** メタデータ（タイプごとに異なる） */
  metadata: unknown;
}

/**
 * アセットフォルダ
 */
export interface AssetFolder {
  /** 一意識別子 */
  id: string;
  /** フォルダ名 */
  name: string;
  /** 親フォルダID（ルートの場合はundefined） */
  parentId?: string;
}

/**
 * 新しいアセットフォルダを作成
 */
export function createAssetFolder(id: string, name: string, parentId?: string): AssetFolder {
  return {
    id,
    name,
    parentId,
  };
}
