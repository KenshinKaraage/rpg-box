'use client';

import { Edit2, Folder, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AssetReference } from '@/types/asset';

interface AssetPreviewProps {
  asset: AssetReference | null;
  folderName?: string;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

/**
 * 秒数をMM:SS形式にフォーマット
 */
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * ファイルサイズを読みやすい形式にフォーマット
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * アセットプレビューコンポーネント
 */
export function AssetPreview({ asset, folderName, onRename, onDelete }: AssetPreviewProps) {
  if (!asset) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <p>アセットを選択してください</p>
      </div>
    );
  }

  const handleRename = () => {
    const newName = window.prompt('新しい名前', asset.name);
    if (newName && newName !== asset.name) {
      onRename(asset.id, newName);
    }
  };

  const handleDelete = () => {
    onDelete(asset.id);
  };

  // メタデータ
  const metadata = asset.metadata as
    | { fileSize?: number; width?: number; height?: number; duration?: number }
    | undefined;
  const fileSize = metadata?.fileSize ?? 0;
  const width = metadata?.width;
  const height = metadata?.height;
  const duration = metadata?.duration;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      {/* プレビュー領域 */}
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-muted/30 p-4">
        {asset.type === 'image' && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={asset.data}
            alt={asset.name}
            className="h-auto max-h-full w-auto object-contain"
            style={{ maxWidth: 'calc(100% - 32px)' }}
          />
        )}
        {asset.type === 'audio' && (
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-3xl">
              🎵
            </div>
            {duration !== undefined && (
              <span className="text-sm text-muted-foreground">{formatDuration(duration)}</span>
            )}
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <audio src={asset.data} controls className="w-full max-w-xs" />
          </div>
        )}
      </div>

      {/* 情報領域 */}
      <div className="border-t p-4">
        {/* ファイル名 */}
        <h3 className="truncate text-sm font-medium" title={asset.name}>
          {asset.name}
        </h3>

        {/* メタデータ */}
        <div className="mt-2 space-y-1 text-xs text-muted-foreground">
          {width !== undefined && height !== undefined && (
            <p>
              解像度: {width} × {height}
            </p>
          )}
          {duration !== undefined && <p>再生時間: {formatDuration(duration)}</p>}
          {fileSize > 0 && <p>サイズ: {formatFileSize(fileSize)}</p>}
          {folderName && (
            <p className="flex items-center gap-1">
              <Folder className="h-3 w-3" />
              {folderName}
            </p>
          )}
        </div>

        {/* アクションボタン */}
        <div className="mt-4 flex gap-2">
          <Button size="sm" variant="outline" className="flex-1" onClick={handleRename}>
            <Edit2 className="mr-1 h-3 w-3" />
            名前を変更
          </Button>
          <Button size="sm" variant="destructive" className="flex-1" onClick={handleDelete}>
            <Trash2 className="mr-1 h-3 w-3" />
            削除
          </Button>
        </div>
      </div>
    </div>
  );
}
