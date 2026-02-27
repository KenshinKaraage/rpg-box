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
import type { EventTemplate } from '@/types/event';

interface EventTemplateListProps {
  templates: EventTemplate[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

/**
 * イベントテンプレート一覧コンポーネント
 */
export function EventTemplateList({
  templates,
  selectedId,
  onSelect,
  onAdd,
  onDelete,
  onDuplicate,
}: EventTemplateListProps) {
  return (
    <div className="flex h-full flex-col">
      {/* ヘッダー */}
      <div className="flex items-center justify-between border-b p-3">
        <h2 className="text-sm font-semibold">テンプレート一覧</h2>
        <Button size="sm" variant="outline" onClick={onAdd} data-testid="add-template-button">
          <Plus className="mr-1 h-4 w-4" />
          追加
        </Button>
      </div>

      {/* リスト */}
      <div className="flex-1 overflow-auto">
        {templates.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            テンプレートがありません
          </div>
        ) : (
          <ul className="divide-y" data-testid="template-list">
            {templates.map((template) => (
              <ContextMenu key={template.id}>
                <ContextMenuTrigger asChild>
                  <li
                    className={cn(
                      'cursor-pointer px-3 py-2 hover:bg-accent',
                      selectedId === template.id && 'bg-accent'
                    )}
                    onClick={() => onSelect(template.id)}
                    data-testid={`template-item-${template.id}`}
                  >
                    <div className="font-medium">{template.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {template.actions.length} アクション
                    </div>
                  </li>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem onClick={() => onDuplicate(template.id)}>
                    <Copy className="mr-2 h-4 w-4" />
                    複製
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={() => onDelete(template.id)}
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
