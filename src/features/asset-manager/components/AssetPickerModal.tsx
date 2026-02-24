'use client';

import { useState, useMemo } from 'react';
import { Folder, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { AssetReference, AssetFolder } from '@/types/asset';

interface AssetPickerModalProps {
  /** モーダルの開閉状態 */
  open: boolean;
  /** 開閉状態変更ハンドラ */
  onOpenChange: (open: boolean) => void;
  /** アセット一覧 */
  assets: AssetReference[];
  /** フォルダ一覧 */
  folders: AssetFolder[];
  /** 選択対象のアセットタイプ */
  assetType: 'image' | 'audio' | 'font';
  /** アセット選択ハンドラ */
  onSelect: (assetId: string | null) => void;
  /** 現在選択中のアセットID */
  selectedAssetId: string | null;
  /** 初期表示フォルダID */
  initialFolderId?: string;
}

const ASSET_TYPE_LABELS: Record<string, string> = {
  image: '画像',
  audio: '音声',
  font: 'フォント',
};

/**
 * アセット選択モーダル
 */
export function AssetPickerModal({
  open,
  onOpenChange,
  assets,
  folders,
  assetType,
  onSelect,
  selectedAssetId,
  initialFolderId,
}: AssetPickerModalProps) {
  // 選択中のフォルダID（nullは「すべて」）
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(initialFolderId ?? null);
  // 検索クエリ
  const [searchQuery, setSearchQuery] = useState('');
  // モーダル内での一時選択
  const [tempSelectedId, setTempSelectedId] = useState<string | null>(selectedAssetId);

  // タイプでフィルタされたアセット
  const filteredByType = useMemo(
    () => assets.filter((a) => a.type === assetType),
    [assets, assetType]
  );

  // フォルダでフィルタ
  const filteredByFolder = useMemo(
    () =>
      currentFolderId === null
        ? filteredByType
        : filteredByType.filter((a) => a.folderId === currentFolderId),
    [filteredByType, currentFolderId]
  );

  // 検索でフィルタ
  const filteredAssets = useMemo(() => {
    if (!searchQuery.trim()) return filteredByFolder;
    const query = searchQuery.toLowerCase();
    return filteredByFolder.filter((a) => a.name.toLowerCase().includes(query));
  }, [filteredByFolder, searchQuery]);

  // 対象タイプに該当するフォルダのみ表示
  const relevantFolders = useMemo(() => {
    const folderIds = new Set(filteredByType.map((a) => a.folderId).filter(Boolean));
    return folders.filter((f) => folderIds.has(f.id));
  }, [folders, filteredByType]);

  const handleSelect = () => {
    if (tempSelectedId) {
      onSelect(tempSelectedId);
      onOpenChange(false);
    }
  };

  const handleDoubleClick = (assetId: string) => {
    onSelect(assetId);
    onOpenChange(false);
  };

  const handleClear = () => {
    onSelect(null);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const title = `${ASSET_TYPE_LABELS[assetType] ?? assetType}を選択`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[600px] max-w-4xl flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="sr-only">{title}</DialogDescription>
        </DialogHeader>

        {/* 検索バー */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* メインコンテンツ */}
        <div className="flex flex-1 gap-4 overflow-hidden">
          {/* 左: フォルダリスト */}
          <div className="w-48 shrink-0 overflow-auto border-r pr-4">
            <div
              className={cn(
                'flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent',
                currentFolderId === null && 'bg-accent'
              )}
              onClick={() => setCurrentFolderId(null)}
            >
              <Folder className="h-4 w-4" />
              すべて
            </div>
            {relevantFolders.map((folder) => (
              <div
                key={folder.id}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent',
                  currentFolderId === folder.id && 'bg-accent'
                )}
                onClick={() => setCurrentFolderId(folder.id)}
              >
                <Folder className="h-4 w-4" />
                {folder.name}
              </div>
            ))}
          </div>

          {/* 右: アセットグリッド */}
          <div className="flex-1 overflow-auto">
            {filteredAssets.length === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <p>アセットがありません</p>
              </div>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-3">
                {filteredAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className={cn(
                      'cursor-pointer rounded-lg border p-2 transition-colors hover:border-primary',
                      tempSelectedId === asset.id && 'border-primary bg-accent'
                    )}
                    onClick={() => setTempSelectedId(asset.id)}
                    onDoubleClick={() => handleDoubleClick(asset.id)}
                  >
                    {/* サムネイル */}
                    <div className="aspect-square overflow-hidden rounded bg-muted">
                      {asset.type === 'image' && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={asset.data}
                          alt={asset.name}
                          className="h-full w-full object-contain"
                        />
                      )}
                      {asset.type === 'audio' && (
                        <div className="flex h-full items-center justify-center text-2xl">🎵</div>
                      )}
                      {asset.type === 'font' && (
                        <div className="flex h-full items-center justify-center text-2xl">Aa</div>
                      )}
                    </div>
                    {/* ファイル名 */}
                    <p className="mt-1 truncate text-center text-xs" title={asset.name}>
                      {asset.name}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* フッター */}
        <DialogFooter className="gap-2">
          {selectedAssetId && (
            <Button variant="outline" onClick={handleClear}>
              選択解除
            </Button>
          )}
          <Button variant="outline" onClick={handleCancel}>
            キャンセル
          </Button>
          <Button onClick={handleSelect} disabled={!tempSelectedId}>
            選択
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
