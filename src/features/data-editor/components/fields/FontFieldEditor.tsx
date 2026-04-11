'use client';

import { useState, useMemo } from 'react';
import { Type, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStore } from '@/stores';
import { AssetPickerModal } from '@/features/asset-manager';

interface FontFieldEditorProps {
  value: string | null;
  onChange: (value: string | null) => void;
}

export function FontFieldEditor({ value, onChange }: FontFieldEditorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const assets = useStore((state) => state.assets);
  const assetFolders = useStore((state) => state.assetFolders);

  const selectedAsset = useMemo(
    () => (value ? assets.find((a) => a.id === value) : null),
    [assets, value]
  );

  const handleSelect = (assetId: string | null) => {
    onChange(assetId);
    setIsModalOpen(false);
  };

  if (!value) {
    return (
      <>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded border border-dashed px-4 py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary"
        >
          <Type className="h-4 w-4" />
          フォントを選択...
        </button>
        <AssetPickerModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          assets={assets}
          folders={assetFolders}
          assetType="font"
          onSelect={handleSelect}
          selectedAssetId={value}
        />
      </>
    );
  }

  if (!selectedAsset) {
    return (
      <div className="flex items-center gap-2">
        <Type className="h-4 w-4 text-muted-foreground" />
        <p className="flex-1 text-sm text-destructive">アセットが見つかりません</p>
        <Button size="sm" variant="ghost" onClick={() => onChange(null)}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Type className="h-4 w-4 text-muted-foreground" />
        <p className="min-w-0 flex-1 truncate text-sm" title={selectedAsset.name}>
          {selectedAsset.name}
        </p>
        <Button size="sm" variant="outline" onClick={() => setIsModalOpen(true)}>
          変更
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onChange(null)} title="選択解除">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <AssetPickerModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        assets={assets}
        folders={assetFolders}
        assetType="font"
        onSelect={handleSelect}
        selectedAssetId={value}
      />
    </>
  );
}
