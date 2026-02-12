'use client';

/**
 * CreateFolderModal コンポーネント
 *
 * 新規フォルダを作成するモーダル
 * - フォルダ名入力
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

export interface CreateFolderModalProps {
  /** モーダルの開閉状態 */
  open: boolean;
  /** 開閉状態変更時のコールバック */
  onOpenChange: (open: boolean) => void;
  /** フォルダ作成時のコールバック */
  onCreateFolder: (name: string, parentId?: string) => void;
  /** 既存のフォルダ一覧（重複チェック用） */
  folders: AssetFolder[];
  /** 親フォルダID（サブフォルダ作成時） */
  parentId?: string;
}

// =============================================================================
// CreateFolderModal コンポーネント
// =============================================================================

export function CreateFolderModal({
  open,
  onOpenChange,
  onCreateFolder,
  folders,
  parentId,
}: CreateFolderModalProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  // モーダルが開くたびにリセット
  useEffect(() => {
    if (open) {
      setName('');
      setError(null);
    }
  }, [open]);

  // 同階層の重複チェック
  const isDuplicateName = useCallback(
    (folderName: string): boolean => {
      const siblingsAtSameLevel = folders.filter((f) => f.parentId === parentId);
      return siblingsAtSameLevel.some((f) => f.name.toLowerCase() === folderName.toLowerCase());
    },
    [folders, parentId]
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

  // 作成処理
  const handleCreate = useCallback(() => {
    const trimmedName = name.trim();
    const validationError = validate(trimmedName);

    if (validationError) {
      setError(validationError);
      return;
    }

    onCreateFolder(trimmedName, parentId);
    onOpenChange(false);
  }, [name, validate, onCreateFolder, parentId, onOpenChange]);

  // キーダウン処理（Enter で作成）
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleCreate();
      }
    },
    [handleCreate]
  );

  // キャンセル処理
  const handleCancel = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="新規フォルダ"
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={handleCancel}>
            キャンセル
          </Button>
          <Button onClick={handleCreate}>作成</Button>
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
