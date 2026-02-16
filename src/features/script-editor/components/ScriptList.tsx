'use client';

import { Plus, ChevronRight, ChevronDown } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { cn } from '@/lib/utils';
import type { Script } from '@/types/script';

interface ScriptListProps {
  scripts: Script[];
  internalScriptsMap: Record<string, Script[]>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onAddInternal: (parentId: string) => void;
  title: string;
}

const EMPTY_CHILDREN: Script[] = [];

function ScriptTreeItem({
  script,
  internalScriptsMap,
  selectedId,
  onSelect,
  onDelete,
  onAddInternal,
  depth,
}: {
  script: Script;
  internalScriptsMap: Record<string, Script[]>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onAddInternal: (parentId: string) => void;
  depth: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const children = internalScriptsMap[script.id] ?? EMPTY_CHILDREN;
  const hasChildren = children.length > 0;

  return (
    <li>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className={cn(
              'flex cursor-pointer items-center gap-1 px-3 py-1.5 hover:bg-accent',
              selectedId === script.id && 'bg-accent'
            )}
            style={{ paddingLeft: `${depth * 16 + 12}px` }}
            onClick={() => onSelect(script.id)}
            data-testid={`script-item-${script.id}`}
          >
            {hasChildren ? (
              <button
                className="shrink-0 p-0.5"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(!expanded);
                }}
              >
                {expanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </button>
            ) : (
              <span className="w-4 shrink-0" />
            )}
            <span className="truncate text-sm">{script.name}</span>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => onAddInternal(script.id)}>
            内部スクリプト追加
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onDelete(script.id)} className="text-destructive">
            削除
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      {hasChildren && expanded && (
        <ul>
          {children.map((child) => (
            <ScriptTreeItem
              key={child.id}
              script={child}
              internalScriptsMap={internalScriptsMap}
              selectedId={selectedId}
              onSelect={onSelect}
              onDelete={onDelete}
              onAddInternal={onAddInternal}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function ScriptList({
  scripts,
  internalScriptsMap,
  selectedId,
  onSelect,
  onAdd,
  onDelete,
  onAddInternal,
  title,
}: ScriptListProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b p-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        <Button size="sm" variant="outline" onClick={onAdd}>
          <Plus className="mr-1 h-4 w-4" />
          追加
        </Button>
      </div>
      <div className="flex-1 overflow-auto">
        {scripts.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            スクリプトがありません
          </div>
        ) : (
          <ul data-testid="script-list">
            {scripts.map((script) => (
              <ScriptTreeItem
                key={script.id}
                script={script}
                internalScriptsMap={internalScriptsMap}
                selectedId={selectedId}
                onSelect={onSelect}
                onDelete={onDelete}
                onAddInternal={onAddInternal}
                depth={0}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
