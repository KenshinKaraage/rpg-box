'use client';

import { useCallback, useMemo, useState } from 'react';
import { Type, X } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useStore } from '@/stores';
import { AssetPickerModal } from '@/features/asset-manager/components/AssetPickerModal';
import type { FieldRendererProps } from './types';

export function FontField({ def, value, onChange }: FieldRendererProps) {
  const [isOpen, setIsOpen] = useState(false);
  const assets = useStore((s) => s.assets);
  const assetFolders = useStore((s) => s.assetFolders);
  const assetValue = value as string | undefined;

  const selectedAsset = useMemo(
    () => (assetValue ? assets.find((a) => a.id === assetValue) : undefined),
    [assetValue, assets]
  );

  const handleSelect = useCallback(
    (assetId: string | null) => {
      onChange(assetId ?? undefined);
      setIsOpen(false);
    },
    [onChange]
  );

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Label className="w-24 shrink-0 text-xs text-muted-foreground">{def.label}</Label>
        <div className="flex flex-1 items-center gap-1">
          {selectedAsset ? (
            <>
              <Type className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate text-xs">{selectedAsset.name}</span>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 shrink-0 p-0"
                onClick={() => onChange(undefined)}
                aria-label="クリア"
              >
                <X className="h-3 w-3" />
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="h-7 flex-1 text-xs"
              onClick={() => setIsOpen(true)}
            >
              フォントを選択...
            </Button>
          )}
          {selectedAsset && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 shrink-0 text-xs"
              onClick={() => setIsOpen(true)}
            >
              変更
            </Button>
          )}
        </div>
      </div>
      <AssetPickerModal
        open={isOpen}
        onOpenChange={setIsOpen}
        assets={assets}
        folders={assetFolders}
        assetType="font"
        onSelect={handleSelect}
        selectedAssetId={assetValue ?? null}
      />
    </div>
  );
}
