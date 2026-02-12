'use client';

/**
 * DeleteFolderConfirm コンポーネント
 *
 * フォルダ削除の確認ダイアログ
 * - 中身がある場合は警告を表示
 * - サブフォルダとアセットの数を表示
 */

import { useMemo, useCallback } from 'react';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import type { AssetFolder, AssetReference } from '@/types/asset';

// =============================================================================
// 型定義
// =============================================================================

export interface DeleteFolderConfirmProps {
  /** ダイアログの開閉状態 */
  open: boolean;
  /** 開閉状態変更時のコールバック */
  onOpenChange: (open: boolean) => void;
  /** フォルダ削除時のコールバック */
  onDeleteFolder: (id: string) => void;
  /** 既存のフォルダ一覧（サブフォルダ数カウント用） */
  folders: AssetFolder[];
  /** 既存のアセット一覧（アセット数カウント用） */
  assets: AssetReference[];
  /** 削除対象のフォルダ */
  folder: AssetFolder;
}

// =============================================================================
// DeleteFolderConfirm コンポーネント
// =============================================================================

export function DeleteFolderConfirm({
  open,
  onOpenChange,
  onDeleteFolder,
  folders,
  assets,
  folder,
}: DeleteFolderConfirmProps) {
  // サブフォルダ数をカウント（再帰的に全ての子孫をカウント）
  const subFolderCount = useMemo(() => {
    const countDescendants = (parentId: string): number => {
      const children = folders.filter((f) => f.parentId === parentId);
      return children.reduce((sum, child) => sum + 1 + countDescendants(child.id), 0);
    };
    return countDescendants(folder.id);
  }, [folders, folder.id]);

  // このフォルダとサブフォルダ内のアセット数をカウント
  const assetCount = useMemo(() => {
    const getAllFolderIds = (parentId: string): string[] => {
      const children = folders.filter((f) => f.parentId === parentId);
      return children.reduce(
        (ids, child) => [...ids, child.id, ...getAllFolderIds(child.id)],
        [] as string[]
      );
    };
    const folderIds = new Set([folder.id, ...getAllFolderIds(folder.id)]);
    return assets.filter((a) => a.folderId && folderIds.has(a.folderId)).length;
  }, [folders, assets, folder.id]);

  // 警告メッセージを生成
  const warningParts: string[] = [];
  if (assetCount > 0) {
    warningParts.push(`${assetCount}件のアセット`);
  }
  if (subFolderCount > 0) {
    warningParts.push(`${subFolderCount}件のサブフォルダ`);
  }

  const hasContents = assetCount > 0 || subFolderCount > 0;

  const message = hasContents
    ? `「${folder.name}」フォルダを削除しますか？\n\nこのフォルダには${warningParts.join('と')}が含まれています。含まれるアセットも削除されます。`
    : `「${folder.name}」フォルダを削除しますか？`;

  // 確認処理
  const handleConfirm = useCallback(() => {
    onDeleteFolder(folder.id);
    onOpenChange(false);
  }, [onDeleteFolder, folder.id, onOpenChange]);

  // キャンセル処理
  const handleCancel = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  return (
    <ConfirmDialog
      open={open}
      title="フォルダを削除"
      message={message}
      variant={hasContents ? 'danger' : 'warning'}
      confirmText="削除"
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );
}
