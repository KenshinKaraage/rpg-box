'use client';

/**
 * RenameFolderModal コンポーネント
 *
 * フォルダ名を変更するモーダル
 * - 現在の名前を表示
 * - 同階層の重複チェック
 */

import { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { AssetFolder } from '@/types/asset';

// =============================================================================
// 型定義
// =============================================================================

export interface RenameFolderModalProps {
  /** モーダルの開閉状態 */
  open: boolean;
  /** 開閉状態変更時のコールバック */
  onOpenChange: (open: boolean) => void;
  /** フォルダ名変更時のコールバック */
  onRenameFolder: (id: string, name: string) => void;
  /** 既存のフォルダ一覧（重複チェック用） */
  folders: AssetFolder[];
  /** 変更対象のフォルダ */
  folder: AssetFolder;
}

// =============================================================================
// RenameFolderModal コンポーネント
// =============================================================================

export function RenameFolderModal({
  open,
  onOpenChange,
  onRenameFolder,
  folders,
  folder,
}: RenameFolderModalProps) {
  const [name, setName] = useState(folder.name);
  const [error, setError] = useState<string | null>(null);

  // フォルダが変わったらリセット
  useEffect(() => {
    if (open) {
      setName(folder.name);
      setError(null);
    }
  }, [open, folder.name]);

  // 同階層の重複チェック（自分自身は除外）
  const isDuplicateName = useCallback(
    (folderName: string): boolean => {
      const siblingsAtSameLevel = folders.filter(
        (f) => f.parentId === folder.parentId && f.id !== folder.id
      );
      return siblingsAtSameLevel.some((f) => f.name.toLowerCase() === folderName.toLowerCase());
    },
    [folders, folder.parentId, folder.id]
  );

  // バリデーション
  const validate = useCallback(
    (folderName: string): string | null => {
      const trimmed = folderName.trim();
      if (!trimmed) {
        return 'フォルダ名を入力してください';
      }
      if (isDuplicateName(trimmed)) {
        return '同じ名前のフォルダが既に存在します';
      }
      return null;
    },
    [isDuplicateName]
  );

  // 変更処理
  const handleRename = useCallback(() => {
    const trimmedName = name.trim();
    const validationError = validate(trimmedName);

    if (validationError) {
      setError(validationError);
      return;
    }

    onRenameFolder(folder.id, trimmedName);
    onOpenChange(false);
  }, [name, validate, onRenameFolder, folder.id, onOpenChange]);

  // キーダウン処理（Enter で変更）
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleRename();
      }
    },
    [handleRename]
  );

  // キャンセル処理
  const handleCancel = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="フォルダ名を変更"
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={handleCancel}>
            キャンセル
          </Button>
          <Button onClick={handleRename}>変更</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="folder-name">フォルダ名</Label>
          <Input
            id="folder-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="フォルダ名を入力"
            autoFocus
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </div>
    </Modal>
  );
}
