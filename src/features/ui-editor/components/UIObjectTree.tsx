'use client';

import { useState, useCallback } from 'react';
import {
  Plus,
  Copy,
  Trash2,
  Edit2,
  Square,
  ImageIcon,
  Type,
  Pentagon,
  Circle,
  Minus,
  Hexagon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { generateId } from '@/lib/utils';
import { createDefaultRectTransform } from '@/types/ui/UIComponent';
import { DraggableTree } from '@/components/common/DraggableTree';
import type { TreeNode } from '@/components/common/DraggableTree';

import type { EditorUIObject, SerializedUIComponent } from '@/stores/uiEditorSlice';

// ──────────────────────────────────────────────
// Element type presets (declarative)
// ──────────────────────────────────────────────

interface ElementPresetDef {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  components: SerializedUIComponent[];
}

interface ElementPresetGroup {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children: ElementPresetDef[];
}

type ElementPresetEntry = ElementPresetDef | ElementPresetGroup;

function isGroup(entry: ElementPresetEntry): entry is ElementPresetGroup {
  return 'children' in entry;
}

const ELEMENT_PRESETS: ElementPresetEntry[] = [
  {
    key: 'empty',
    label: '空オブジェクト',
    icon: Square,
    components: [],
  },
  {
    key: 'shape',
    label: '図形',
    icon: Pentagon,
    children: [
      {
        key: 'shape_rect',
        label: '矩形',
        icon: Square,
        components: [{ type: 'shape', data: { shapeType: 'rectangle', fillColor: '#cccccc' } }],
      },
      {
        key: 'shape_ellipse',
        label: '楕円',
        icon: Circle,
        components: [{ type: 'shape', data: { shapeType: 'ellipse', fillColor: '#cccccc' } }],
      },
      {
        key: 'shape_polygon',
        label: 'ポリゴン',
        icon: Pentagon,
        components: [{ type: 'shape', data: { shapeType: 'polygon', fillColor: '#cccccc', vertices: [{ x: 0.5, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }] } }],
      },
      {
        key: 'shape_polygon_regular',
        label: '正多角形',
        icon: Hexagon,
        components: [{ type: 'shape', data: { shapeType: 'polygon_regular', fillColor: '#cccccc', sides: 6 } }],
      },
    ],
  },
  {
    key: 'line',
    label: '線',
    icon: Minus,
    components: [{ type: 'line', data: { strokeColor: '#000000', strokeWidth: 2, vertices: [{ x: 0, y: 0 }, { x: 1, y: 1 }] } }],
  },
  {
    key: 'image',
    label: '画像',
    icon: ImageIcon,
    components: [{ type: 'image', data: {} }],
  },
  {
    key: 'text',
    label: 'テキスト',
    icon: Type,
    components: [{ type: 'text', data: { content: 'テキスト', fontSize: 16, color: '#000000' } }],
  },
];

/** プリセットを key で検索（グループ内も探索） */
function findPreset(key: string): ElementPresetDef | undefined {
  for (const entry of ELEMENT_PRESETS) {
    if (isGroup(entry)) {
      const found = entry.children.find((c) => c.key === key);
      if (found) return found;
    } else if (entry.key === key) {
      return entry;
    }
  }
  return undefined;
}

// ──────────────────────────────────────────────
// Context menu items (shared between root-add and per-node)
// ──────────────────────────────────────────────

function PresetContextMenuItems({
  onAdd,
}: {
  onAdd: (presetKey: string) => void;
}) {
  return (
    <>
      {ELEMENT_PRESETS.map((entry) =>
        isGroup(entry) ? (
          <ContextMenuSub key={entry.key}>
            <ContextMenuSubTrigger>
              <entry.icon className="mr-2 h-4 w-4" />
              {entry.label}を追加
            </ContextMenuSubTrigger>
            <ContextMenuSubContent>
              {entry.children.map((child) => (
                <ContextMenuItem key={child.key} onClick={() => onAdd(child.key)}>
                  <child.icon className="mr-2 h-4 w-4" />
                  {child.label}
                </ContextMenuItem>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>
        ) : (
          <ContextMenuItem key={entry.key} onClick={() => onAdd(entry.key)}>
            <entry.icon className="mr-2 h-4 w-4" />
            {entry.label}を追加
          </ContextMenuItem>
        )
      )}
    </>
  );
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
  const [editingId, setEditingId] = useState<string | null>(null);

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
    (parentId: string, presetKey: string) => {
      if (!canvasId) return;
      const preset = findPreset(presetKey);
      if (!preset) return;
      const newObj: EditorUIObject = {
        id: generateId(
          'ui_obj',
          objects.map((o) => o.id)
        ),
        name: preset.label,
        parentId,
        transform: createDefaultRectTransform(),
        components: preset.components,
      };
      onAddObject(canvasId, newObj);
    },
    [canvasId, objects, onAddObject]
  );

  const handleAddRoot = useCallback(
    (presetKey: string) => {
      if (!canvasId) return;
      const preset = findPreset(presetKey);
      if (!preset) return;
      const newObj: EditorUIObject = {
        id: generateId(
          'ui_obj',
          objects.map((o) => o.id)
        ),
        name: preset.label,
        transform: createDefaultRectTransform(),
        components: preset.components,
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

  const handleMove = useCallback(
    (id: string, newParentId: string | undefined, _index: number) => {
      if (!canvasId) return;
      onReparentObject(canvasId, id, newParentId);
    },
    [canvasId, onReparentObject]
  );

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
            {ELEMENT_PRESETS.map((entry) =>
              isGroup(entry) ? (
                <DropdownMenuSub key={entry.key}>
                  <DropdownMenuSubTrigger>
                    <entry.icon className="mr-2 h-4 w-4" />
                    {entry.label}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {entry.children.map((child) => (
                      <DropdownMenuItem key={child.key} onClick={() => handleAddRoot(child.key)}>
                        <child.icon className="mr-2 h-4 w-4" />
                        {child.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              ) : (
                <DropdownMenuItem key={entry.key} onClick={() => handleAddRoot(entry.key)}>
                  <entry.icon className="mr-2 h-4 w-4" />
                  {entry.label}
                </DropdownMenuItem>
              )
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-auto p-1">
        {objects.length === 0 ? (
          <div className="py-4 text-center text-xs text-muted-foreground">
            オブジェクトなし
          </div>
        ) : (
          <DraggableTree
            nodes={objects as unknown as TreeNode[]}
            selectedIds={selectedObjectIds}
            onSelect={onSelectObjects}
            onMove={handleMove}
            renderNode={(node) => {
              const obj = node as unknown as EditorUIObject;
              const isEditing = editingId === obj.id;

              return (
                <ContextMenu>
                  <ContextMenuTrigger asChild>
                    <div className="flex flex-1 items-center gap-2 min-w-0">
                      <Square className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      {isEditing ? (
                        <Input
                          className="h-6 px-1 text-sm"
                          defaultValue={obj.name}
                          autoFocus
                          onPointerDown={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleFinishRename(obj.id, (e.target as HTMLInputElement).value);
                            } else if (e.key === 'Escape') {
                              handleCancelRename();
                            }
                          }}
                          onBlur={(e) => handleFinishRename(obj.id, e.target.value)}
                        />
                      ) : (
                        <span className="truncate">{obj.name}</span>
                      )}
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <PresetContextMenuItems onAdd={(key) => handleAddChild(obj.id, key)} />
                    <ContextMenuItem onClick={() => handleDuplicate(obj.id)}>
                      <Copy className="mr-2 h-4 w-4" />
                      複製
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => handleStartRename(obj.id)}>
                      <Edit2 className="mr-2 h-4 w-4" />
                      名前を変更
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem
                      onClick={() => handleDelete(obj.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      削除
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              );
            }}
          />
        )}
      </div>
    </div>
  );
}
