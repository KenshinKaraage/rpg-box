'use client';

import { useStore } from '@/stores';
import type { Prefab } from '@/types/map';
import type { SpriteComponent } from '@/types/components/SpriteComponent';
import { SpriteThumbnail } from './SpriteThumbnail';
import { Square } from 'lucide-react';

interface PrefabPreviewProps {
  prefab: Prefab | null;
}

/**
 * プレハブプレビューコンポーネント
 *
 * SpriteComponent の画像を使ってプレハブの外観を表示する。
 */
export function PrefabPreview({ prefab }: PrefabPreviewProps) {
  const assets = useStore((s) => s.assets);

  if (!prefab) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        プレハブを選択してください
      </div>
    );
  }

  const sprite = prefab.prefab.components.find((c) => c.type === 'sprite') as
    | SpriteComponent
    | undefined;
  const asset = sprite?.imageId ? assets.find((a) => a.id === sprite.imageId) : null;
  const src = asset?.data as string | undefined;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-3">
        <h2 className="text-sm font-semibold">プレビュー</h2>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-4">
        {src ? (
          <SpriteThumbnail
            src={src}
            fw={sprite?.frameWidth || 0}
            fh={sprite?.frameHeight || 0}
            size={96}
          />
        ) : (
          <Square className="text-muted-foreground" style={{ width: 96, height: 96 }} />
        )}
        <p className="text-sm font-medium">{prefab.name}</p>
        <p className="text-xs text-muted-foreground">
          コンポーネント: {prefab.prefab.components.length}個
        </p>
      </div>
    </div>
  );
}
