'use client';

import { useMemo } from 'react';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AssetReference } from '@/types/asset';
import { getAllSupportedExtensions } from '@/types/assets';

interface AssetGridProps {
  assets: AssetReference[];
  selectedAssetId: string | null;
  onSelectAsset: (id: string) => void;
  onUpload: (files: FileList) => void;
}

/**
 * アセットグリッドコンポーネント
 */
export function AssetGrid({ assets, selectedAssetId, onSelectAsset, onUpload }: AssetGridProps) {
  // 対応拡張子をaccept属性用に取得
  const acceptExtensions = useMemo(() => getAllSupportedExtensions().join(','), []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files.length > 0) {
      onUpload(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files);
    }
    // リセットして同じファイルを再選択可能に
    e.target.value = '';
  };

  if (assets.length === 0) {
    return (
      <div
        className="flex h-full flex-col items-center justify-center gap-4 border-2 border-dashed rounded-lg p-8"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <Upload className="h-12 w-12 text-muted-foreground" />
        <div className="text-center">
          <p className="text-muted-foreground">ファイルをドラッグ&ドロップ</p>
          <p className="text-sm text-muted-foreground">または</p>
          <label className="mt-2 inline-block cursor-pointer rounded bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90">
            ファイルを選択
            <input
              type="file"
              className="hidden"
              accept={acceptExtensions}
              multiple
              onChange={handleFileSelect}
            />
          </label>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-4" onDragOver={handleDragOver} onDrop={handleDrop}>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-4">
        {assets.map((asset) => (
          <div
            key={asset.id}
            className={cn(
              'cursor-pointer rounded-lg border p-2 transition-colors hover:border-primary',
              selectedAssetId === asset.id && 'border-primary bg-accent'
            )}
            onClick={() => onSelectAsset(asset.id)}
          >
            {/* サムネイル */}
            <div className="aspect-square overflow-hidden rounded bg-muted">
              {asset.type === 'image' && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={asset.data} alt={asset.name} className="h-full w-full object-contain" />
              )}
            </div>
            {/* ファイル名 */}
            <p className="mt-2 truncate text-center text-xs" title={asset.name}>
              {asset.name}
            </p>
          </div>
        ))}

        {/* アップロードボタン */}
        <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed hover:border-primary hover:bg-accent">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <span className="mt-1 text-xs text-muted-foreground">追加</span>
          <input
            type="file"
            className="hidden"
            accept={acceptExtensions}
            multiple
            onChange={handleFileSelect}
          />
        </label>
      </div>
    </div>
  );
}
