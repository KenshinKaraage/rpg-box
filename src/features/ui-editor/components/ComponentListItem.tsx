'use client';

import { useMemo, useState } from 'react';
import { Maximize2, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStore } from '@/stores';
import { getUIComponent } from '@/types/ui';
import { ActionComponentEditor } from './ActionComponentEditor';
import { ComponentPropertyEditor } from './ComponentPropertyEditor';
import type { RectTransform } from '@/types/ui/UIComponent';
import type { UIActionEntry } from '@/types/ui/components/ActionComponent';
import type { SerializedUIComponent } from '@/stores/uiEditorSlice';

// ──────────────────────────────────────────────
// Component list item
// ──────────────────────────────────────────────

interface ComponentListItemProps {
  component: SerializedUIComponent;
  onRemove: () => void;
  onUpdateData: (data: unknown) => void;
  onTransformUpdate?: (updates: Partial<RectTransform>) => void;
}

export function ComponentListItem({ component, onRemove, onUpdateData, onTransformUpdate }: ComponentListItemProps) {
  const [expanded, setExpanded] = useState(false);

  // Get label and property defs from registry
  const Ctor = getUIComponent(component.type);
  const instance = Ctor ? new Ctor() : null;
  const label = instance ? instance.label : component.type;
  const hasEditor = component.type === 'action' || (instance != null && instance.getPropertyDefs().length > 0);

  const compData = (component.data ?? {}) as Record<string, unknown>;

  return (
    <div data-testid={`component-item-${component.type}`}>
      <div className="flex items-center justify-between rounded px-2 py-1 hover:bg-accent">
        <div className="flex items-center gap-1">
          {hasEditor ? (
            <Button
              size="sm"
              variant="ghost"
              className="h-5 w-5 p-0"
              onClick={() => setExpanded(!expanded)}
              aria-label={expanded ? '閉じる' : '開く'}
            >
              {expanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
          ) : null}
          <span className="text-xs">{label}</span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-5 w-5 p-0"
          onClick={onRemove}
          aria-label={`${label}を削除`}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
      {expanded && component.type === 'action' && (
        <div className="px-2 pb-2">
          <ActionComponentEditor
            actions={(compData.actions as UIActionEntry[]) ?? []}
            onChange={(actions) => onUpdateData({ actions })}
          />
        </div>
      )}
      {expanded && component.type !== 'action' && instance != null && instance.getPropertyDefs().length > 0 && (
        <ComponentPropertyEditor
          componentType={component.type}
          data={compData}
          onChange={(updated) => onUpdateData(updated)}
        />
      )}
      {expanded && component.type === 'image' && onTransformUpdate && (
        <ImageNativeSizeButton
          imageId={compData.imageId as string | undefined}
          onTransformUpdate={onTransformUpdate}
        />
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Native size button for image component
// ──────────────────────────────────────────────

function ImageNativeSizeButton({
  imageId,
  onTransformUpdate,
}: {
  imageId: string | undefined;
  onTransformUpdate: (updates: Partial<RectTransform>) => void;
}) {
  const assets = useStore((s) => s.assets);
  const asset = useMemo(
    () => (imageId ? assets.find((a) => a.id === imageId) : undefined),
    [imageId, assets]
  );

  if (!asset?.data) return null;

  const handleClick = () => {
    const img = new Image();
    img.src = asset.data as string;
    // If already loaded (cached), use dimensions immediately
    if (img.naturalWidth > 0) {
      onTransformUpdate({ width: img.naturalWidth, height: img.naturalHeight });
      return;
    }
    img.onload = () => {
      onTransformUpdate({ width: img.naturalWidth, height: img.naturalHeight });
    };
  };

  return (
    <div className="px-2 pb-2">
      <Button
        size="sm"
        variant="outline"
        className="h-7 w-full gap-1 text-xs"
        onClick={handleClick}
      >
        <Maximize2 className="h-3 w-3" />
        ネイティブサイズに設定
      </Button>
    </div>
  );
}
