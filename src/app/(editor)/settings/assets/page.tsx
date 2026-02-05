'use client';

import { useCallback } from 'react';
import { useStore } from '@/stores';
import { AssetFolderTree } from '@/features/asset-manager/components/AssetFolderTree';
import { AssetGrid } from '@/features/asset-manager/components/AssetGrid';
import { AssetPreview } from '@/features/asset-manager/components/AssetPreview';
import { createAssetTypeInstance } from '@/types/assets';
import type { AssetReference, AssetFolder } from '@/types/asset';

/**
 * アセット管理ページ
 */
export default function AssetsPage() {
  // ストアから状態とアクションを取得
  const assetFolders = useStore((state) => state.assetFolders);
  const selectedAssetId = useStore((state) => state.selectedAssetId);
  const selectedFolderId = useStore((state) => state.selectedFolderId);
  const addAsset = useStore((state) => state.addAsset);
  const updateAsset = useStore((state) => state.updateAsset);
  const deleteAsset = useStore((state) => state.deleteAsset);
  const selectAsset = useStore((state) => state.selectAsset);
  const addFolder = useStore((state) => state.addFolder);
  const updateFolder = useStore((state) => state.updateFolder);
  const deleteFolder = useStore((state) => state.deleteFolder);
  const selectFolder = useStore((state) => state.selectFolder);

  // 選択中のアセット（リアクティブ）
  const selectedAsset = useStore((state) =>
    state.selectedAssetId
      ? (state.assets.find((a) => a.id === state.selectedAssetId) ?? null)
      : null
  );

  // 選択中のフォルダのアセット一覧（リアクティブセレクタで assets の変更を検知）
  const filteredAssets = useStore((state) =>
    selectedFolderId === null
      ? state.assets // 「すべてのアセット」選択時は全件表示
      : state.assets.filter((a) => a.folderId === selectedFolderId)
  );

  // 選択中のアセットのフォルダ名を取得
  const selectedAssetFolderName = selectedAsset?.folderId
    ? assetFolders.find((f) => f.id === selectedAsset.folderId)?.name
    : undefined;

  // フォルダ追加
  const handleAddFolder = useCallback(
    (parentId?: string) => {
      const name = window.prompt('新しいフォルダ名', '新規フォルダ');
      if (name) {
        const folder: AssetFolder = {
          id: `folder_${Date.now()}`,
          name,
          parentId,
        };
        addFolder(folder);
      }
    },
    [addFolder]
  );

  // フォルダ名変更
  const handleRenameFolder = useCallback(
    (id: string, name: string) => {
      updateFolder(id, { name });
    },
    [updateFolder]
  );

  // アセット名変更
  const handleRenameAsset = useCallback(
    (id: string, name: string) => {
      updateAsset(id, { name });
    },
    [updateAsset]
  );

  // ファイルアップロード
  const handleUpload = useCallback(
    async (files: FileList) => {
      for (const file of Array.from(files)) {
        // ファイルタイプを判定
        const extension = '.' + (file.name.split('.').pop()?.toLowerCase() ?? '');
        const assetType = 'image'; // デフォルト（将来的に拡張子から判定）

        // 画像アセットタイプのインスタンスを取得
        const assetTypeInstance = createAssetTypeInstance(assetType);
        if (!assetTypeInstance) {
          console.error(`Unknown asset type: ${assetType}`);
          continue;
        }

        // 対応拡張子かチェック
        if (!assetTypeInstance.extensions.includes(extension)) {
          console.warn(`Unsupported file type: ${extension}`);
          continue;
        }

        // バリデーション
        const validation = assetTypeInstance.validate(file);
        if (!validation.valid) {
          console.warn(validation.message);
          continue;
        }

        // ファイルをBase64に変換
        const data = await fileToBase64(file);

        // メタデータを抽出
        const metadata = await assetTypeInstance.extractMetadata(file);

        // アセットを追加
        const asset: AssetReference = {
          id: `asset_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          type: assetType,
          folderId: selectedFolderId ?? undefined,
          data,
          metadata,
        };
        addAsset(asset);
      }
    },
    [addAsset, selectedFolderId]
  );

  return (
    <div className="flex h-full">
      {/* 左: フォルダツリー */}
      <div className="w-52 shrink-0 border-r">
        <AssetFolderTree
          folders={assetFolders}
          selectedFolderId={selectedFolderId}
          onSelectFolder={selectFolder}
          onAddFolder={handleAddFolder}
          onRenameFolder={handleRenameFolder}
          onDeleteFolder={deleteFolder}
        />
      </div>

      {/* 中央: グリッド */}
      <div className="flex-1 border-r">
        <AssetGrid
          assets={filteredAssets}
          selectedAssetId={selectedAssetId}
          onSelectAsset={selectAsset}
          onUpload={handleUpload}
        />
      </div>

      {/* 右: プレビュー（幅固定300px） */}
      <div className="h-full w-[300px] min-w-[300px] max-w-[300px] shrink-0 overflow-hidden">
        <AssetPreview
          asset={selectedAsset}
          folderName={selectedAssetFolderName}
          onRename={handleRenameAsset}
          onDelete={deleteAsset}
        />
      </div>
    </div>
  );
}

/**
 * ファイルをBase64 Data URLに変換
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as string'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
