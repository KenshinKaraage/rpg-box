'use client';

import { useCallback } from 'react';
import { Plus, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useStore } from '@/stores';
import { getUIComponent, getAllUIComponents } from '@/types/ui';
import { TransformEditor } from './TransformEditor';
import { ComponentListItem } from './ComponentListItem';
import type { RectTransform } from '@/types/ui/UIComponent';
import type { EditorUIObject } from '@/stores/uiEditorSlice';
import { CanvasPropertyPanel } from './CanvasPropertyPanel';

/** 親が layoutGroup/gridLayout を持ち、自身が participate !== false ならレイアウト管理下 */
function isLayoutManaged(obj: EditorUIObject, allObjects: EditorUIObject[]): boolean {
  if (!obj.parentId) return false;
  const parent = allObjects.find((o) => o.id === obj.parentId);
  if (!parent) return false;
  const hasLayout = parent.components.some(
    (c) => c.type === 'layoutGroup' || c.type === 'gridLayout'
  );
  if (!hasLayout) return false;
  const le = obj.components.find((c) => c.type === 'layoutElement');
  if (le && (le.data as Record<string, unknown>).participate === false) return false;
  return true;
}

// ──────────────────────────────────────────────
// UIPropertyPanel
// ──────────────────────────────────────────────

export function UIPropertyPanel() {
  const selectedCanvasId = useStore((s) => s.selectedCanvasId);
  const uiCanvases = useStore((s) => s.uiCanvases);
  const selectedObjectIds = useStore((s) => s.selectedObjectIds);
  const updateUIObject = useStore((s) => s.updateUIObject);
  const addUIComponent = useStore((s) => s.addUIComponent);
  const removeUIComponent = useStore((s) => s.removeUIComponent);
  const updateUIComponent = useStore((s) => s.updateUIComponent);

  const selectedCanvas = uiCanvases.find((c) => c.id === selectedCanvasId) ?? null;

  // Only show panel for single selection
  const selectedObject: EditorUIObject | null =
    selectedObjectIds.length === 1 && selectedCanvas
      ? selectedCanvas.objects.find((o) => o.id === selectedObjectIds[0]) ?? null
      : null;

  const handleTransformUpdate = useCallback(
    (updates: Partial<RectTransform>) => {
      if (!selectedCanvasId || !selectedObject) return;
      updateUIObject(selectedCanvasId, selectedObject.id, {
        transform: { ...selectedObject.transform, ...updates },
      });
    },
    [selectedCanvasId, selectedObject, updateUIObject]
  );

  const handleAddComponent = useCallback(
    (type: string) => {
      if (!selectedCanvasId || !selectedObject) return;
      const Ctor = getUIComponent(type);
      if (!Ctor) return;
      const instance = new Ctor();
      const data = instance.serialize();
      addUIComponent(selectedCanvasId, selectedObject.id, { type, data });
    },
    [selectedCanvasId, selectedObject, addUIComponent]
  );

  const handleRemoveComponent = useCallback(
    (type: string) => {
      if (!selectedCanvasId || !selectedObject) return;
      removeUIComponent(selectedCanvasId, selectedObject.id, type);
    },
    [selectedCanvasId, selectedObject, removeUIComponent]
  );

  const handleUpdateComponentData = useCallback(
    (type: string, data: unknown) => {
      if (!selectedCanvasId || !selectedObject) return;
      updateUIComponent(selectedCanvasId, selectedObject.id, type, data);
    },
    [selectedCanvasId, selectedObject, updateUIComponent]
  );

  // Components available for adding (exclude already attached)
  const attachedTypes = new Set(selectedObject?.components.map((c) => c.type) ?? []);
  const availableComponents = getAllUIComponents().filter(([type]) => !attachedTypes.has(type));

  if (!selectedObject) {
    if (selectedObjectIds.length > 1) {
      return (
        <div className="p-4 text-sm text-muted-foreground" data-testid="property-panel-empty">
          複数のオブジェクトが選択されています
        </div>
      );
    }
    if (selectedCanvas) {
      return <CanvasPropertyPanel canvas={selectedCanvas} />;
    }
    return (
      <div className="p-4 text-sm text-muted-foreground" data-testid="property-panel-empty">
        画面を選択してください
      </div>
    );
  }

  return (
    <div className="space-y-4 p-3" data-testid="property-panel">
      {/* Object name */}
      <div>
        <Label className="text-xs font-medium">名前</Label>
        <Input
          className="mt-1 h-7 text-xs"
          value={selectedObject.name}
          onChange={(e) => {
            if (!selectedCanvasId) return;
            updateUIObject(selectedCanvasId, selectedObject.id, { name: e.target.value });
          }}
        />
      </div>

      {/* Transform */}
      <div>
        <h3 className="mb-2 text-xs font-semibold">Transform</h3>
        <TransformEditor
          transform={selectedObject.transform}
          onUpdate={handleTransformUpdate}
          layoutManaged={isLayoutManaged(selectedObject, selectedCanvas?.objects ?? [])}
        />
      </div>

      {/* Components */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-xs font-semibold">コンポーネント</h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 gap-1 px-1 text-xs"
                disabled={availableComponents.length === 0}
                aria-label="コンポーネント追加"
              >
                <Plus className="h-3.5 w-3.5" />
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {availableComponents.map(([type]) => {
                const Ctor = getUIComponent(type);
                const label = Ctor ? new Ctor().label : type;
                return (
                  <DropdownMenuItem key={type} onClick={() => handleAddComponent(type)}>
                    {label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {selectedObject.components.length === 0 ? (
          <div className="py-2 text-center text-xs text-muted-foreground">
            コンポーネントなし
          </div>
        ) : (
          <div className="space-y-1">
            {selectedObject.components.map((comp) => (
              <ComponentListItem
                key={comp.type}
                component={comp}
                onRemove={() => handleRemoveComponent(comp.type)}
                onUpdateData={(data) => handleUpdateComponentData(comp.type, data)}
                onTransformUpdate={handleTransformUpdate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
