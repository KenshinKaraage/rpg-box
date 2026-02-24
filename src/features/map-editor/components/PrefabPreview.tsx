'use client';

import type { Prefab } from '@/types/map';

interface PrefabPreviewProps {
  prefab: Prefab | null;
}

/**
 * プレハブプレビューコンポーネント（Phase 13 で本実装予定）
 *
 * Sprite コンポーネントの画像を使ってプレハブの外観を表示する。
 * 現在は仮実装のため、プレハブ名のみ表示する。
 */
export function PrefabPreview({ prefab }: PrefabPreviewProps) {
  if (!prefab) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        プレハブを選択してください
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-3">
        <h2 className="text-sm font-semibold">プレビュー</h2>
      </div>
      <div
        className="flex flex-1 items-center justify-center text-sm text-muted-foreground"
        data-testid="prefab-preview-placeholder"
      >
        {prefab.name}
      </div>
    </div>
  );
}
