'use client';

import { useCallback, useMemo, useState } from 'react';
import { useStore } from '@/stores';
import { AssetFolderTree } from '@/features/asset-manager/components/AssetFolderTree';
import { AssetGrid } from '@/features/asset-manager/components/AssetGrid';
import { AssetPreview } from '@/features/asset-manager/components/AssetPreview';
import { CreateFolderModal } from '@/features/asset-manager/components/CreateFolderModal';
import { RenameFolderModal } from '@/features/asset-manager/components/RenameFolderModal';
import { DeleteFolderConfirm } from '@/features/asset-manager/components/DeleteFolderConfirm';
import { createAssetTypeInstance, getAssetTypeByExtension } from '@/types/assets';
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

  // アセット一覧を取得
  const assets = useStore((state) => state.assets);

  // モーダル状態
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [createFolderParentId, setCreateFolderParentId] = useState<string | undefined>(undefined);
  const [renameFolderOpen, setRenameFolderOpen] = useState(false);
  const [renameFolderTarget, setRenameFolderTarget] = useState<AssetFolder | null>(null);
  const [deleteFolderOpen, setDeleteFolderOpen] = useState(false);
  const [deleteFolderTarget, setDeleteFolderTarget] = useState<AssetFolder | null>(null);

  // 選択中のアセット
  const selectedAsset = useMemo(
    () => (selectedAssetId ? (assets.find((a) => a.id === selectedAssetId) ?? null) : null),
    [assets, selectedAssetId]
  );

  // 選択中のフォルダのアセット一覧
  const filteredAssets = useMemo(
    () =>
      selectedFolderId === null ? assets : assets.filter((a) => a.folderId === selectedFolderId),
    [assets, selectedFolderId]
  );

  // 選択中のアセットのフォルダ名を取得
  const selectedAssetFolderName = selectedAsset?.folderId
    ? assetFolders.find((f) => f.id === selectedAsset.folderId)?.name
    : undefined;

  // フォルダ追加モーダルを開く
  const handleAddFolder = useCallback((parentId?: string) => {
    setCreateFolderParentId(parentId);
    setCreateFolderOpen(true);
  }, []);

  // フォルダ作成
  const handleCreateFolder = useCallback(
    (name: string, parentId?: string) => {
      const folder: AssetFolder = {
        id: `folder_${Date.now()}`,
        name,
        parentId,
      };
      addFolder(folder);
    },
    [addFolder]
  );

  // フォルダ名変更モーダルを開く
  const handleRenameFolder = useCallback(
    (id: string) => {
      const folder = assetFolders.find((f) => f.id === id);
      if (folder) {
        setRenameFolderTarget(folder);
        setRenameFolderOpen(true);
      }
    },
    [assetFolders]
  );

  // フォルダ名変更を実行
  const handleRenameFolderConfirm = useCallback(
    (id: string, name: string) => {
      updateFolder(id, { name });
    },
    [updateFolder]
  );

  // フォルダ削除確認モーダルを開く
  const handleDeleteFolder = useCallback(
    (id: string) => {
      const folder = assetFolders.find((f) => f.id === id);
      if (folder) {
        setDeleteFolderTarget(folder);
        setDeleteFolderOpen(true);
      }
    },
    [assetFolders]
  );

  // フォルダ削除を実行
  const handleDeleteFolderConfirm = useCallback(
    (id: string) => {
      deleteFolder(id);
    },
    [deleteFolder]
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
        const assetType = getAssetTypeByExtension(extension);

        // 未対応の拡張子
        if (!assetType) {
          console.warn(`Unsupported file type: ${extension}`);
          continue;
        }

        // アセットタイプのインスタンスを取得
        const assetTypeInstance = createAssetTypeInstance(assetType);
        if (!assetTypeInstance) {
          console.error(`Unknown asset type: ${assetType}`);
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
          onDeleteFolder={handleDeleteFolder}
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

      {/* フォルダ作成モーダル */}
      <CreateFolderModal
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
        onCreateFolder={handleCreateFolder}
        folders={assetFolders}
        parentId={createFolderParentId}
      />

      {/* フォルダ名変更モーダル */}
      {renameFolderTarget && (
        <RenameFolderModal
          open={renameFolderOpen}
          onOpenChange={setRenameFolderOpen}
          onRenameFolder={handleRenameFolderConfirm}
          folders={assetFolders}
          folder={renameFolderTarget}
        />
      )}

      {/* フォルダ削除確認モーダル */}
      {deleteFolderTarget && (
        <DeleteFolderConfirm
          open={deleteFolderOpen}
          onOpenChange={setDeleteFolderOpen}
          onDeleteFolder={handleDeleteFolderConfirm}
          folders={assetFolders}
          assets={assets}
          folder={deleteFolderTarget}
        />
      )}
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
