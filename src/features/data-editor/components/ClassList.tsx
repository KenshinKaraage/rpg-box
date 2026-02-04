'use client';

import { Plus, Trash2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { cn } from '@/lib/utils';
import type { CustomClass } from '@/types/customClass';

interface ClassListProps {
  classes: CustomClass[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

/**
 * クラス一覧コンポーネント
 */
export function ClassList({
  classes,
  selectedId,
  onSelect,
  onAdd,
  onDelete,
  onDuplicate,
}: ClassListProps) {
  return (
    <div className="flex h-full flex-col">
      {/* ヘッダー */}
      <div className="flex items-center justify-between border-b p-3">
        <h2 className="text-sm font-semibold">クラス一覧</h2>
        <Button size="sm" variant="outline" onClick={onAdd} data-testid="add-class-button">
          <Plus className="mr-1 h-4 w-4" />
          追加
        </Button>
      </div>

      {/* リスト */}
      <div className="flex-1 overflow-auto">
        {classes.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">クラスがありません</div>
        ) : (
          <ul className="divide-y" data-testid="class-list">
            {classes.map((customClass) => (
              <ContextMenu key={customClass.id}>
                <ContextMenuTrigger asChild>
                  <li
                    className={cn(
                      'cursor-pointer px-3 py-2 hover:bg-accent',
                      selectedId === customClass.id && 'bg-accent'
                    )}
                    onClick={() => onSelect(customClass.id)}
                    data-testid={`class-item-${customClass.id}`}
                  >
                    <div className="font-medium">{customClass.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {customClass.fields.length} フィールド
                    </div>
                  </li>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem onClick={() => onDuplicate(customClass.id)}>
                    <Copy className="mr-2 h-4 w-4" />
                    複製
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={() => onDelete(customClass.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    削除
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
