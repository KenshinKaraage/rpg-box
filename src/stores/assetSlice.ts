/**
 * アセットスライス
 */
import type { AssetReference, AssetFolder } from '@/types/asset';

export interface AssetSlice {
  /** アセット一覧 */
  assets: AssetReference[];

  /** フォルダ一覧 */
  assetFolders: AssetFolder[];

  /** 選択中のアセットID */
  selectedAssetId: string | null;

  /** 選択中のフォルダID */
  selectedFolderId: string | null;

  /** アセットを追加 */
  addAsset: (asset: AssetReference) => void;

  /** アセットを更新 */
  updateAsset: (id: string, updates: Partial<AssetReference>) => void;

  /** アセットを削除 */
  deleteAsset: (id: string) => void;

  /** アセットを選択 */
  selectAsset: (id: string | null) => void;

  /** フォルダを追加 */
  addFolder: (folder: AssetFolder) => void;

  /** フォルダを更新 */
  updateFolder: (id: string, updates: Partial<AssetFolder>) => void;

  /** フォルダを削除 */
  deleteFolder: (id: string) => void;

  /** フォルダを選択 */
  selectFolder: (id: string | null) => void;

  /** 指定フォルダ内のアセットを取得 */
  getAssetsByFolder: (folderId: string | undefined) => AssetReference[];

  /** 子フォルダを取得 */
  getChildFolders: (parentId: string | undefined) => AssetFolder[];
}

export const createAssetSlice = <T extends AssetSlice>(
  set: (fn: (state: T) => void) => void,
  get: () => T
): AssetSlice => ({
  assets: [],
  assetFolders: [],
  selectedAssetId: null,
  selectedFolderId: null,

  addAsset: (asset: AssetReference) =>
    set((state) => {
      state.assets.push(asset);
    }),

  updateAsset: (id: string, updates: Partial<AssetReference>) =>
    set((state) => {
      const index = state.assets.findIndex((a) => a.id === id);
      if (index !== -1) {
        state.assets[index] = { ...state.assets[index], ...updates } as AssetReference;
      }
    }),

  deleteAsset: (id: string) =>
    set((state) => {
      state.assets = state.assets.filter((a) => a.id !== id);
      if (state.selectedAssetId === id) {
        state.selectedAssetId = null;
      }
    }),

  selectAsset: (id: string | null) =>
    set((state) => {
      state.selectedAssetId = id;
    }),

  addFolder: (folder: AssetFolder) =>
    set((state) => {
      state.assetFolders.push(folder);
    }),

  updateFolder: (id: string, updates: Partial<AssetFolder>) =>
    set((state) => {
      const index = state.assetFolders.findIndex((f) => f.id === id);
      if (index !== -1) {
        state.assetFolders[index] = { ...state.assetFolders[index], ...updates } as AssetFolder;
      }
    }),

  deleteFolder: (id: string) =>
    set((state) => {
      // フォルダ内のアセットをルートに移動
      state.assets.forEach((asset) => {
        if (asset.folderId === id) {
          asset.folderId = undefined;
        }
      });
      // フォルダを削除
      state.assetFolders = state.assetFolders.filter((f) => f.id !== id);
      if (state.selectedFolderId === id) {
        state.selectedFolderId = null;
      }
    }),

  selectFolder: (id: string | null) =>
    set((state) => {
      state.selectedFolderId = id;
    }),

  getAssetsByFolder: (folderId: string | undefined) => {
    return get().assets.filter((a) => a.folderId === folderId);
  },

  getChildFolders: (parentId: string | undefined) => {
    return get().assetFolders.filter((f) => f.parentId === parentId);
  },
});
