'use client';

import { useState, useRef, useCallback } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Copy,
  Trash2,
  Edit2,
  Square,
  ImageIcon,
  Type,
  Pentagon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { generateId } from '@/lib/utils';
import { createDefaultRectTransform } from '@/types/ui/UIComponent';
import type { EditorUIObject, SerializedUIComponent } from '@/stores/uiEditorSlice';

// ──────────────────────────────────────────────
// Element type presets
// ──────────────────────────────────────────────

type ElementPreset = 'empty' | 'shape' | 'image' | 'text';

function getPresetComponents(preset: ElementPreset): SerializedUIComponent[] {
  switch (preset) {
    case 'empty':
      return [];
    case 'shape':
      return [{ type: 'shape', data: { shapeType: 'rect', fillColor: '#cccccc' } }];
    case 'image':
      return [{ type: 'image', data: {} }];
    case 'text':
      return [
        { type: 'text', data: { content: 'テキスト', fontSize: 16, color: '#000000' } },
      ];
  }
}

function getPresetName(preset: ElementPreset): string {
  switch (preset) {
    case 'empty':
      return '新しいオブジェクト';
    case 'shape':
      return '図形';
    case 'image':
      return '画像';
    case 'text':
      return 'テキスト';
  }
}

// ──────────────────────────────────────────────
// Props
// ──────────────────────────────────────────────

interface UIObjectTreeProps {
  objects: EditorUIObject[];
  selectedObjectIds: string[];
  canvasId: string | null;
  onSelectObjects: (ids: string[]) => void;
  onAddObject: (canvasId: string, object: EditorUIObject) => void;
  onDeleteObject: (canvasId: string, objectId: string) => void;
  onUpdateObject: (
    canvasId: string,
    objectId: string,
    updates: Partial<Pick<EditorUIObject, 'name' | 'transform'>>
  ) => void;
  onReparentObject: (canvasId: string, objectId: string, newParentId: string | undefined) => void;
}

interface TreeNodeProps {
  object: EditorUIObject;
  objects: EditorUIObject[];
  selectedIds: string[];
  expandedIds: Set<string>;
  editingId: string | null;
  dragOverId: string | null;
  depth: number;
  onSelect: (id: string, e: React.MouseEvent) => void;
  onToggleExpand: (id: string) => void;
  onStartRename: (id: string) => void;
  onFinishRename: (id: string, newName: string) => void;
  onCancelRename: () => void;
  onAddChild: (parentId: string, preset: ElementPreset) => void;
  onDuplicate: (objectId: string) => void;
  onDelete: (objectId: string) => void;
  onDragStart: (id: string) => void;
  onDragOver: (id: string, e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (targetId: string) => void;
}

// ──────────────────────────────────────────────
// TreeNode
// ──────────────────────────────────────────────

function TreeNode({
  object,
  objects,
  selectedIds,
  expandedIds,
  editingId,
  dragOverId,
  depth,
  onSelect,
  onToggleExpand,
  onStartRename,
  onFinishRename,
  onCancelRename,
  onAddChild,
  onDuplicate,
  onDelete,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
}: TreeNodeProps) {
  const children = objects.filter((o) => o.parentId === object.id);
  const hasChildren = children.length > 0;
  const isExpanded = expandedIds.has(object.id);
  const isSelected = selectedIds.includes(object.id);
  const isEditing = editingId === object.id;
  const isDragOver = dragOverId === object.id;
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onFinishRename(object.id, (e.target as HTMLInputElement).value);
    } else if (e.key === 'Escape') {
      onCancelRename();
    }
  };

  return (
    <div>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            data-testid={`tree-node-${object.id}`}
            className={cn(
              'flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-sm hover:bg-accent',
              isSelected && 'bg-accent font-medium',
              isDragOver && 'ring-2 ring-primary'
            )}
            style={{ paddingLeft: `${depth * 16 + 8}px` }}
            onClick={(e) => onSelect(object.id, e)}
            draggable={!isEditing}
            onDragStart={() => onDragStart(object.id)}
            onDragOver={(e) => onDragOver(object.id, e)}
            onDragLeave={() => onDragLeave()}
            onDrop={() => onDrop(object.id)}
          >
            {/* Expand/collapse toggle */}
            <button
              type="button"
              className="h-4 w-4 shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                if (hasChildren) onToggleExpand(object.id);
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

            {/* Icon */}
            <Square className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />

            {/* Name (editable or display) */}
            {isEditing ? (
              <Input
                ref={inputRef}
                className="h-6 px-1 text-sm"
                defaultValue={object.name}
                autoFocus
                onKeyDown={handleKeyDown}
                onBlur={(e) => onFinishRename(object.id, e.target.value)}
              />
            ) : (
              <span className="truncate">{object.name}</span>
            )}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => onAddChild(object.id, 'empty')}>
            <Square className="mr-2 h-4 w-4" />
            空オブジェクトを追加
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onAddChild(object.id, 'shape')}>
            <Pentagon className="mr-2 h-4 w-4" />
            図形を追加
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onAddChild(object.id, 'image')}>
            <ImageIcon className="mr-2 h-4 w-4" />
            画像を追加
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onAddChild(object.id, 'text')}>
            <Type className="mr-2 h-4 w-4" />
            テキストを追加
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onDuplicate(object.id)}>
            <Copy className="mr-2 h-4 w-4" />
            複製
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onStartRename(object.id)}>
            <Edit2 className="mr-2 h-4 w-4" />
            名前を変更
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={() => onDelete(object.id)}
            className="text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            削除
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {children.map((child) => (
            <TreeNode
              key={child.id}
              object={child}
              objects={objects}
              selectedIds={selectedIds}
              expandedIds={expandedIds}
              editingId={editingId}
              dragOverId={dragOverId}
              depth={depth + 1}
              onSelect={onSelect}
              onToggleExpand={onToggleExpand}
              onStartRename={onStartRename}
              onFinishRename={onFinishRename}
              onCancelRename={onCancelRename}
              onAddChild={onAddChild}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// UIObjectTree
// ──────────────────────────────────────────────

export function UIObjectTree({
  objects,
  selectedObjectIds,
  canvasId,
  onSelectObjects,
  onAddObject,
  onDeleteObject,
  onUpdateObject,
  onReparentObject,
}: UIObjectTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const dragSourceRef = useRef<string | null>(null);

  const rootObjects = objects.filter((o) => !o.parentId);

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelect = useCallback(
    (id: string, e: React.MouseEvent) => {
      if (e.metaKey || e.ctrlKey) {
        // Toggle multi-select
        const newIds = selectedObjectIds.includes(id)
          ? selectedObjectIds.filter((sid) => sid !== id)
          : [...selectedObjectIds, id];
        onSelectObjects(newIds);
      } else {
        onSelectObjects([id]);
      }
    },
    [selectedObjectIds, onSelectObjects]
  );

  const handleStartRename = useCallback((id: string) => {
    setEditingId(id);
  }, []);

  const handleFinishRename = useCallback(
    (id: string, newName: string) => {
      const trimmed = newName.trim();
      if (canvasId && trimmed) {
        onUpdateObject(canvasId, id, { name: trimmed });
      }
      setEditingId(null);
    },
    [canvasId, onUpdateObject]
  );

  const handleCancelRename = useCallback(() => {
    setEditingId(null);
  }, []);

  const handleAddChild = useCallback(
    (parentId: string, preset: ElementPreset = 'empty') => {
      if (!canvasId) return;
      const newObj: EditorUIObject = {
        id: generateId(
          'ui_obj',
          objects.map((o) => o.id)
        ),
        name: getPresetName(preset),
        parentId,
        transform: createDefaultRectTransform(),
        components: getPresetComponents(preset),
      };
      onAddObject(canvasId, newObj);
      // Expand parent to show new child
      setExpandedIds((prev) => new Set(prev).add(parentId));
    },
    [canvasId, objects, onAddObject]
  );

  const handleAddRoot = useCallback(
    (preset: ElementPreset = 'empty') => {
      if (!canvasId) return;
      const newObj: EditorUIObject = {
        id: generateId(
          'ui_obj',
          objects.map((o) => o.id)
        ),
        name: getPresetName(preset),
        transform: createDefaultRectTransform(),
        components: getPresetComponents(preset),
      };
      onAddObject(canvasId, newObj);
      onSelectObjects([newObj.id]);
    },
    [canvasId, objects, onAddObject, onSelectObjects]
  );

  const handleDuplicate = useCallback(
    (objectId: string) => {
      if (!canvasId) return;
      const source = objects.find((o) => o.id === objectId);
      if (!source) return;
      const newObj: EditorUIObject = {
        id: generateId(
          'ui_obj',
          objects.map((o) => o.id)
        ),
        name: `${source.name} (コピー)`,
        parentId: source.parentId,
        transform: { ...source.transform },
        components: source.components.map((c) => ({ ...c })),
      };
      onAddObject(canvasId, newObj);
      onSelectObjects([newObj.id]);
    },
    [canvasId, objects, onAddObject, onSelectObjects]
  );

  const handleDelete = useCallback(
    (objectId: string) => {
      if (!canvasId) return;
      onDeleteObject(canvasId, objectId);
    },
    [canvasId, onDeleteObject]
  );

  // Drag & drop for reparenting
  const handleDragStart = useCallback((id: string) => {
    dragSourceRef.current = id;
  }, []);

  const handleDragOver = useCallback((id: string, e: React.DragEvent) => {
    e.preventDefault();
    if (dragSourceRef.current && dragSourceRef.current !== id) {
      setDragOverId(id);
    }
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverId(null);
  }, []);

  const handleDrop = useCallback(
    (targetId: string) => {
      setDragOverId(null);
      const sourceId = dragSourceRef.current;
      dragSourceRef.current = null;
      if (!canvasId || !sourceId || sourceId === targetId) return;

      // Prevent dropping parent into its own descendant
      const isDescendant = (parentId: string, childId: string): boolean => {
        const child = objects.find((o) => o.id === childId);
        if (!child?.parentId) return false;
        if (child.parentId === parentId) return true;
        return isDescendant(parentId, child.parentId);
      };
      if (isDescendant(sourceId, targetId)) return;

      onReparentObject(canvasId, sourceId, targetId);
      setExpandedIds((prev) => new Set(prev).add(targetId));
    },
    [canvasId, objects, onReparentObject]
  );

  // Drop on root area to reparent to root
  const handleRootDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOverId(null);
      const sourceId = dragSourceRef.current;
      dragSourceRef.current = null;
      if (!canvasId || !sourceId) return;
      onReparentObject(canvasId, sourceId, undefined);
    },
    [canvasId, onReparentObject]
  );

  const handleRootDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  if (!canvasId) {
    return (
      <div className="p-2 text-center text-xs text-muted-foreground">
        画面を選択してください
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col" data-testid="ui-object-tree">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-2 py-1">
        <span className="text-xs font-medium">オブジェクト</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              aria-label="オブジェクト追加"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleAddRoot('empty')}>
              <Square className="mr-2 h-4 w-4" />
              空オブジェクト
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAddRoot('shape')}>
              <Pentagon className="mr-2 h-4 w-4" />
              図形
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAddRoot('image')}>
              <ImageIcon className="mr-2 h-4 w-4" />
              画像
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAddRoot('text')}>
              <Type className="mr-2 h-4 w-4" />
              テキスト
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tree */}
      <div
        className="flex-1 overflow-auto p-1"
        onDragOver={handleRootDragOver}
        onDrop={handleRootDrop}
      >
        {rootObjects.length === 0 ? (
          <div className="py-4 text-center text-xs text-muted-foreground">
            オブジェクトなし
          </div>
        ) : (
          rootObjects.map((obj) => (
            <TreeNode
              key={obj.id}
              object={obj}
              objects={objects}
              selectedIds={selectedObjectIds}
              expandedIds={expandedIds}
              editingId={editingId}
              dragOverId={dragOverId}
              depth={0}
              onSelect={handleSelect}
              onToggleExpand={handleToggleExpand}
              onStartRename={handleStartRename}
              onFinishRename={handleFinishRename}
              onCancelRename={handleCancelRename}
              onAddChild={handleAddChild}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            />
          ))
        )}
      </div>
    </div>
  );
}
