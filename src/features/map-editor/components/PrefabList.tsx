'use client';

import { Plus, Trash2, Copy, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { cn } from '@/lib/utils';
import { useStore } from '@/stores';
import type { Prefab } from '@/types/map';
import type { SpriteComponent } from '@/types/components/SpriteComponent';
import { EMPTY_OBJECT_PREFAB_ID } from '@/stores/mapEditorSlice';

interface PrefabListProps {
  prefabs: Prefab[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  /** 配置用に選択中のプレハブID */
  placementSelectedId?: string | null;
  /** 配置用プレハブ選択コールバック */
  onSelectForPlacement?: (id: string | null) => void;
}

/**
 * プレハブ一覧コンポーネント
 *
 * onSelectForPlacement が渡された場合、配置モードUIを表示する。
 * クリックで配置用に選択、再クリックで選択解除。
 */
export function PrefabList({
  prefabs,
  selectedId,
  onSelect,
  onAdd,
  onDelete,
  onDuplicate,
  placementSelectedId,
  onSelectForPlacement,
}: PrefabListProps) {
  const isPlacementMode = !!onSelectForPlacement;
  const assets = useStore((s) => s.assets);

  const handleItemClick = (id: string) => {
    if (isPlacementMode) {
      // 配置モード: トグル選択
      onSelectForPlacement(placementSelectedId === id ? null : id);
    } else {
      onSelect(id);
    }
  };

  const getItemHighlight = (id: string) => {
    if (isPlacementMode) {
      return placementSelectedId === id;
    }
    return selectedId === id;
  };

  return (
    <div className="flex h-full flex-col">
      {/* ヘッダー */}
      <div className="flex items-center justify-between border-b p-3">
        <h2 className="text-sm font-semibold">プレハブ一覧</h2>
        <Button size="sm" variant="outline" onClick={onAdd} data-testid="add-prefab-button">
          <Plus className="mr-1 h-4 w-4" />
          追加
        </Button>
      </div>

      {/* リスト */}
      <div className="flex-1 overflow-auto">
        <ul className="divide-y" data-testid="prefab-list">
          {/* 空オブジェクト（配置モード時のみ表示） */}
          {isPlacementMode && (
            <li
              className={cn(
                'cursor-pointer px-3 py-2 hover:bg-accent',
                getItemHighlight(EMPTY_OBJECT_PREFAB_ID) && 'bg-accent'
              )}
              onClick={() => handleItemClick(EMPTY_OBJECT_PREFAB_ID)}
              data-testid="prefab-item-empty"
            >
              <div className="flex items-center gap-2 font-medium">
                <Square className="h-4 w-4 text-muted-foreground" />
                空オブジェクト
              </div>
              <div className="text-xs text-muted-foreground">Transform のみ</div>
            </li>
          )}

          {prefabs.map((prefab) => (
            <ContextMenu key={prefab.id}>
              <ContextMenuTrigger asChild>
                <li
                  className={cn(
                    'cursor-pointer px-3 py-2 hover:bg-accent',
                    getItemHighlight(prefab.id) && 'bg-accent'
                  )}
                  draggable={isPlacementMode}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/rpg-prefab-id', prefab.id);
                    e.dataTransfer.effectAllowed = 'copy';
                    // スプライトの1フレーム目を32x32で切り出してドラッグイメージに
                    const sprite = prefab.prefab.components.find((c) => c.type === 'sprite') as SpriteComponent | undefined;
                    if (sprite?.imageId) {
                      const asset = assets.find((a) => a.id === sprite.imageId);
                      if (asset?.data) {
                        const img = new Image();
                        img.src = asset.data as string;
                        const canvas = document.createElement('canvas');
                        canvas.width = 32;
                        canvas.height = 32;
                        const ctx2d = canvas.getContext('2d');
                        if (ctx2d) {
                          img.onload = () => {
                            const fw = sprite.frameWidth || img.width;
                            const fh = sprite.frameHeight || img.height;
                            ctx2d.drawImage(img, 0, 0, fw, fh, 0, 0, 32, 32);
                          };
                          // 画像が既にキャッシュされていれば即座に描画
                          if (img.complete) {
                            const fw = sprite.frameWidth || img.width;
                            const fh = sprite.frameHeight || img.height;
                            ctx2d.drawImage(img, 0, 0, fw, fh, 0, 0, 32, 32);
                          }
                        }
                        e.dataTransfer.setDragImage(canvas, 16, 16);
                      }
                    }
                  }}
                  onClick={() => handleItemClick(prefab.id)}
                  data-testid={`prefab-item-${prefab.id}`}
                >
                  <div className="font-medium">{prefab.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {prefab.prefab.components.length} コンポーネント
                  </div>
                </li>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem onClick={() => onDuplicate(prefab.id)}>
                  <Copy className="mr-2 h-4 w-4" />
                  複製
                </ContextMenuItem>
                <ContextMenuItem onClick={() => onDelete(prefab.id)} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  削除
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          ))}
        </ul>

        {prefabs.length === 0 && !isPlacementMode && (
          <div className="p-4 text-center text-sm text-muted-foreground">プレハブがありません</div>
        )}
      </div>
    </div>
  );
}
