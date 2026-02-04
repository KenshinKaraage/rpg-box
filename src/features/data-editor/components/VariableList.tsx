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
import type { Variable } from '@/types/variable';

interface VariableListProps {
  variables: Variable[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

/**
 * 変数の型を表示用文字列に変換
 */
function getTypeLabel(variable: Variable): string {
  const baseType = variable.fieldType.label;
  return variable.isArray ? `${baseType}[]` : baseType;
}

/**
 * 変数一覧コンポーネント
 */
export function VariableList({
  variables,
  selectedId,
  onSelect,
  onAdd,
  onDelete,
  onDuplicate,
}: VariableListProps) {
  return (
    <div className="flex h-full flex-col">
      {/* ヘッダー */}
      <div className="flex items-center justify-between border-b p-3">
        <h2 className="text-sm font-semibold">変数一覧</h2>
        <Button size="sm" variant="outline" onClick={onAdd} data-testid="add-variable-button">
          <Plus className="mr-1 h-4 w-4" />
          追加
        </Button>
      </div>

      {/* リスト */}
      <div className="flex-1 overflow-auto">
        {variables.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">変数がありません</div>
        ) : (
          <ul className="divide-y" data-testid="variable-list">
            {variables.map((variable) => (
              <ContextMenu key={variable.id}>
                <ContextMenuTrigger asChild>
                  <li
                    className={cn(
                      'cursor-pointer px-3 py-2 hover:bg-accent',
                      selectedId === variable.id && 'bg-accent'
                    )}
                    onClick={() => onSelect(variable.id)}
                    data-testid={`variable-item-${variable.id}`}
                  >
                    <div className="font-medium">{variable.name}</div>
                    <div className="text-xs text-muted-foreground">{getTypeLabel(variable)}</div>
                  </li>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem onClick={() => onDuplicate(variable.id)}>
                    <Copy className="mr-2 h-4 w-4" />
                    複製
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={() => onDelete(variable.id)}
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
