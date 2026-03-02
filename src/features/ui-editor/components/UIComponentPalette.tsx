'use client';

import { useCallback } from 'react';
import { useStore } from '@/stores';
import { getUIComponent, getAllUIComponents } from '@/types/ui';
import { cn } from '@/lib/utils';

// ──────────────────────────────────────────────
// UIComponentPalette
// ──────────────────────────────────────────────

export function UIComponentPalette() {
  const selectedCanvasId = useStore((s) => s.selectedCanvasId);
  const uiCanvases = useStore((s) => s.uiCanvases);
  const selectedObjectIds = useStore((s) => s.selectedObjectIds);
  const addUIComponent = useStore((s) => s.addUIComponent);

  const selectedCanvas = uiCanvases.find((c) => c.id === selectedCanvasId) ?? null;
  const selectedObject =
    selectedObjectIds.length === 1 && selectedCanvas
      ? selectedCanvas.objects.find((o) => o.id === selectedObjectIds[0]) ?? null
      : null;

  const attachedTypes = new Set(selectedObject?.components.map((c) => c.type) ?? []);

  const handleAdd = useCallback(
    (type: string) => {
      if (!selectedCanvasId || !selectedObject) return;
      const Ctor = getUIComponent(type);
      if (!Ctor) return;
      const instance = new Ctor();
      addUIComponent(selectedCanvasId, selectedObject.id, {
        type,
        data: instance.serialize(),
      });
    },
    [selectedCanvasId, selectedObject, addUIComponent]
  );

  // Get all registered components dynamically from the registry
  const allComponents = getAllUIComponents();

  if (!selectedObject) {
    return (
      <div className="p-3 text-xs text-muted-foreground" data-testid="component-palette-empty">
        オブジェクトを選択するとコンポーネントを追加できます
      </div>
    );
  }

  return (
    <div className="p-2" data-testid="component-palette">
      <div className="grid grid-cols-2 gap-1">
        {allComponents.map(([type, Ctor]) => {
          const isAttached = attachedTypes.has(type);
          const label = new Ctor().label;
          return (
            <button
              key={type}
              type="button"
              className={cn(
                'rounded border px-2 py-1 text-left text-xs transition-colors',
                isAttached
                  ? 'border-primary/30 bg-primary/10 text-primary'
                  : 'border-border hover:bg-accent'
              )}
              disabled={isAttached}
              onClick={() => handleAdd(type)}
              data-testid={`palette-item-${type}`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
