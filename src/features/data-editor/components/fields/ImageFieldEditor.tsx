'use client';

import { useState, useMemo } from 'react';
import { ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStore } from '@/stores';
import { AssetPickerModal } from '@/features/asset-manager';

interface ImageFieldEditorProps {
  /** 選択中のアセットID */
  value: string | null;
  /** 値変更ハンドラ */
  onChange: (value: string | null) => void;
  /** 初期表示フォルダID */
  initialFolderId?: string;
}

/**
 * 画像フィールドエディタ
 * アセットから画像を選択するためのフィールドエディタ
 */
export function ImageFieldEditor({ value, onChange, initialFolderId }: ImageFieldEditorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ストアからアセットとフォルダを取得
  const assets = useStore((state) => state.assets);
  const assetFolders = useStore((state) => state.assetFolders);

  // 選択中のアセットを取得
  const selectedAsset = useMemo(
    () => (value ? assets.find((a) => a.id === value) : null),
    [assets, value]
  );

  const handleSelect = (assetId: string | null) => {
    onChange(assetId);
    setIsModalOpen(false);
  };

  const handleClear = () => {
    onChange(null);
  };

  // 未選択状態
  if (!value) {
    return (
      <>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded border border-dashed px-4 py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary"
        >
          <ImageIcon className="h-4 w-4" />
          画像を選択...
        </button>

        <AssetPickerModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          assets={assets}
          folders={assetFolders}
          assetType="image"
          onSelect={handleSelect}
          selectedAssetId={value}
          initialFolderId={initialFolderId}
        />
      </>
    );
  }

  // アセットが見つからない場合
  if (!selectedAsset) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex h-12 w-12 items-center justify-center rounded border bg-muted text-xs text-muted-foreground">
          No Image
        </div>
        <div className="flex-1">
          <p className="text-sm text-destructive">アセットが見つかりません</p>
          <p className="text-xs text-muted-foreground">ID: {value}</p>
        </div>
        <Button size="sm" variant="ghost" onClick={handleClear}>
          <X className="h-4 w-4" />
          <span className="sr-only">クリア</span>
        </Button>
      </div>
    );
  }

  // 選択済み状態
  return (
    <>
      <div className="space-y-2">
        {/* プレビュー */}
        <div
          className="flex items-center justify-center overflow-hidden rounded border bg-muted/30 p-2"
          style={{ maxHeight: '160px' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selectedAsset.data}
            alt={selectedAsset.name}
            className="h-auto max-h-[144px] w-auto object-contain"
          />
        </div>

        {/* ファイル名 + アクションボタン */}
        <div className="flex items-center gap-2">
          <p className="min-w-0 flex-1 truncate text-sm" title={selectedAsset.name}>
            {selectedAsset.name}
          </p>
          <Button size="sm" variant="outline" onClick={() => setIsModalOpen(true)}>
            変更
          </Button>
          <Button size="sm" variant="ghost" onClick={handleClear} title="選択解除">
            <X className="h-4 w-4" />
            <span className="sr-only">クリア</span>
          </Button>
        </div>
      </div>

      <AssetPickerModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        assets={assets}
        folders={assetFolders}
        assetType="image"
        onSelect={handleSelect}
        selectedAssetId={value}
        initialFolderId={initialFolderId}
      />
    </>
  );
}
