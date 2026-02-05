'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderPlus, Trash2, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { cn } from '@/lib/utils';
import type { AssetFolder } from '@/types/asset';

interface AssetFolderTreeProps {
  folders: AssetFolder[];
  selectedFolderId: string | null;
  onSelectFolder: (id: string | null) => void;
  onAddFolder: (parentId?: string) => void;
  onRenameFolder: (id: string, name: string) => void;
  onDeleteFolder: (id: string) => void;
}

interface FolderNodeProps {
  folder: AssetFolder;
  folders: AssetFolder[];
  selectedFolderId: string | null;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onSelectFolder: (id: string) => void;
  onAddFolder: (parentId: string) => void;
  onRenameFolder: (id: string, name: string) => void;
  onDeleteFolder: (id: string) => void;
  depth: number;
}

/**
 * フォルダノードコンポーネント
 */
function FolderNode({
  folder,
  folders,
  selectedFolderId,
  expandedIds,
  onToggleExpand,
  onSelectFolder,
  onAddFolder,
  onRenameFolder,
  onDeleteFolder,
  depth,
}: FolderNodeProps) {
  const children = folders.filter((f) => f.parentId === folder.id);
  const hasChildren = children.length > 0;
  const isExpanded = expandedIds.has(folder.id);
  const isSelected = selectedFolderId === folder.id;

  const handleRename = () => {
    const newName = window.prompt('新しいフォルダ名', folder.name);
    if (newName && newName !== folder.name) {
      onRenameFolder(folder.id, newName);
    }
  };

  return (
    <div>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className={cn(
              'flex cursor-pointer items-center gap-1 rounded px-2 py-1 hover:bg-accent',
              isSelected && 'bg-accent'
            )}
            style={{ paddingLeft: `${depth * 16 + 8}px` }}
            onClick={() => onSelectFolder(folder.id)}
          >
            <button
              type="button"
              className="h-4 w-4 shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                if (hasChildren) {
                  onToggleExpand(folder.id);
                }
              }}
            >
              {hasChildren ? (
                isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )
              ) : null}
            </button>
            <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate text-sm">{folder.name}</span>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => onAddFolder(folder.id)}>
            <FolderPlus className="mr-2 h-4 w-4" />
            サブフォルダを追加
          </ContextMenuItem>
          <ContextMenuItem onClick={handleRename}>
            <Edit2 className="mr-2 h-4 w-4" />
            名前を変更
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onDeleteFolder(folder.id)} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            削除
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* 子フォルダ */}
      {hasChildren && isExpanded && (
        <div>
          {children.map((child) => (
            <FolderNode
              key={child.id}
              folder={child}
              folders={folders}
              selectedFolderId={selectedFolderId}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
              onSelectFolder={onSelectFolder}
              onAddFolder={onAddFolder}
              onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * アセットフォルダツリーコンポーネント
 */
export function AssetFolderTree({
  folders,
  selectedFolderId,
  onSelectFolder,
  onAddFolder,
  onRenameFolder,
  onDeleteFolder,
}: AssetFolderTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const handleToggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // ルートフォルダ（parentIdがundefined）
  const rootFolders = folders.filter((f) => !f.parentId);

  return (
    <div className="flex h-full flex-col">
      {/* ヘッダー */}
      <div className="flex items-center justify-between border-b p-2">
        <span className="text-sm font-medium">フォルダ</span>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0"
          onClick={() => onAddFolder()}
          title="新規フォルダ"
        >
          <FolderPlus className="h-4 w-4" />
        </Button>
      </div>

      {/* ツリー */}
      <div className="flex-1 overflow-auto p-2">
        {/* ルート（すべてのアセット） */}
        <div
          className={cn(
            'flex cursor-pointer items-center gap-1 rounded px-2 py-1 hover:bg-accent',
            selectedFolderId === null && 'bg-accent'
          )}
          onClick={() => onSelectFolder(null)}
        >
          <Folder className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">すべてのアセット</span>
        </div>

        {/* フォルダ一覧 */}
        {rootFolders.map((folder) => (
          <FolderNode
            key={folder.id}
            folder={folder}
            folders={folders}
            selectedFolderId={selectedFolderId}
            expandedIds={expandedIds}
            onToggleExpand={handleToggleExpand}
            onSelectFolder={onSelectFolder}
            onAddFolder={onAddFolder}
            onRenameFolder={onRenameFolder}
            onDeleteFolder={onDeleteFolder}
            depth={0}
          />
        ))}
      </div>
    </div>
  );
}
