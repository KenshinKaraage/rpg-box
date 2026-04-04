'use client';

import { useCallback, useMemo } from 'react';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { DraggableTree } from '@/components/common/DraggableTree';
import type { TreeNode } from '@/components/common/DraggableTree';
import { cn } from '@/lib/utils';
import type { Script } from '@/types/script';
import { getScriptIcon } from './IconPicker';

interface ScriptListProps {
  /** All scripts to display (flat array with parentId) */
  scripts: Script[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onAddInternal: (parentId: string) => void;
  onMove: (id: string, newParentId: string | undefined, index: number) => void;
  title: string;
}

export function ScriptList({
  scripts,
  selectedId,
  onSelect,
  onAdd,
  onDelete,
  onAddInternal,
  onMove,
  title,
}: ScriptListProps) {
  // Convert Script[] to TreeNode[] for DraggableTree
  const nodes: TreeNode[] = useMemo(
    () =>
      scripts.map((s) => ({
        id: s.id,
        parentId: s.parentId,
        _script: s,
      })),
    [scripts]
  );

  const selectedIds = useMemo(
    () => (selectedId ? [selectedId] : []),
    [selectedId]
  );

  const handleSelect = useCallback(
    (ids: string[]) => {
      if (ids[0]) onSelect(ids[0]);
    },
    [onSelect]
  );

  const renderNode = useCallback(
    (node: TreeNode) => {
      const script = node._script as Script;
      const Icon = getScriptIcon(script.icon);
      return (
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div
              className={cn(
                'flex flex-1 cursor-pointer items-center gap-1 py-1.5'
              )}
              data-testid={`script-item-${script.id}`}
            >
              <Icon
                className="h-4 w-4 shrink-0"
                style={script.color ? { color: script.color } : undefined}
              />
              <span
                className={cn(
                  'truncate text-sm',
                  script.type !== 'internal' && 'font-semibold',
                  script.type === 'internal' && 'text-muted-foreground'
                )}
                style={script.color ? { color: script.color } : undefined}
              >
                {script.name}
              </span>
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onClick={() => onAddInternal(script.id)}>
              内部スクリプト追加
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => onDelete(script.id)}
              className="text-destructive"
            >
              削除
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );
    },
    [onAddInternal, onDelete]
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b p-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        <Button size="sm" variant="outline" onClick={onAdd}>
          <Plus className="mr-1 h-4 w-4" />
          追加
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        {scripts.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            スクリプトがありません
          </div>
        ) : (
          <div data-testid="script-list">
            <DraggableTree
              nodes={nodes}
              renderNode={renderNode}
              onMove={onMove}
              onSelect={handleSelect}
              selectedIds={selectedIds}
            />
          </div>
        )}
      </div>
    </div>
  );
}
