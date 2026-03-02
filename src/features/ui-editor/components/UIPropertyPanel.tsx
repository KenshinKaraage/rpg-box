'use client';

import { useState, useCallback } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useStore } from '@/stores';
import { getUIComponent, getAllUIComponents } from '@/types/ui';
import { AnchorPresets } from './AnchorPresets';
import { ActionComponentEditor } from './ActionComponentEditor';
import { ComponentPropertyEditor, hasPropertySchema } from './ComponentPropertyEditor';
import type { RectTransform } from '@/types/ui/UIComponent';
import type { UIActionEntry } from '@/types/ui/components/ActionComponent';
import type { EditorUIObject, SerializedUIComponent } from '@/stores/uiEditorSlice';

// ──────────────────────────────────────────────
// Number input helper
// ──────────────────────────────────────────────

function NumberField({
  label,
  value,
  onChange,
  step = 1,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center gap-1">
      <Label className="w-8 shrink-0 text-xs text-muted-foreground">{label}</Label>
      <Input
        type="number"
        className="h-7 px-1 text-xs"
        value={value}
        step={step}
        min={min}
        max={max}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (!isNaN(v)) onChange(v);
        }}
      />
    </div>
  );
}

// ──────────────────────────────────────────────
// RectTransform Editor
// ──────────────────────────────────────────────

function TransformEditor({
  transform,
  onUpdate,
}: {
  transform: RectTransform;
  onUpdate: (updates: Partial<RectTransform>) => void;
}) {
  return (
    <div className="space-y-3" data-testid="transform-editor">
      {/* Position */}
      <fieldset>
        <legend className="mb-1 text-xs font-medium">位置</legend>
        <div className="grid grid-cols-2 gap-2">
          <NumberField label="X" value={transform.x} onChange={(v) => onUpdate({ x: v })} />
          <NumberField label="Y" value={transform.y} onChange={(v) => onUpdate({ y: v })} />
        </div>
      </fieldset>

      {/* Size */}
      <fieldset>
        <legend className="mb-1 text-xs font-medium">サイズ</legend>
        <div className="grid grid-cols-2 gap-2">
          <NumberField
            label="W"
            value={transform.width}
            onChange={(v) => onUpdate({ width: v })}
            min={0}
          />
          <NumberField
            label="H"
            value={transform.height}
            onChange={(v) => onUpdate({ height: v })}
            min={0}
          />
        </div>
      </fieldset>

      {/* Anchor */}
      <fieldset>
        <legend className="mb-1 text-xs font-medium">アンカー</legend>
        <div className="flex items-start gap-3">
          <AnchorPresets
            anchorX={transform.anchorX}
            anchorY={transform.anchorY}
            onUpdate={onUpdate}
          />
          <div className="grid flex-1 grid-cols-1 gap-2">
            <div className="flex items-center gap-1">
              <Label className="w-8 shrink-0 text-xs text-muted-foreground">X</Label>
              <Select
                value={transform.anchorX}
                onValueChange={(v) => onUpdate({ anchorX: v as RectTransform['anchorX'] })}
              >
                <SelectTrigger className="h-7 text-xs" aria-label="アンカーX">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">左</SelectItem>
                  <SelectItem value="center">中央</SelectItem>
                  <SelectItem value="right">右</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-1">
              <Label className="w-8 shrink-0 text-xs text-muted-foreground">Y</Label>
              <Select
                value={transform.anchorY}
                onValueChange={(v) => onUpdate({ anchorY: v as RectTransform['anchorY'] })}
              >
                <SelectTrigger className="h-7 text-xs" aria-label="アンカーY">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top">上</SelectItem>
                  <SelectItem value="center">中央</SelectItem>
                  <SelectItem value="bottom">下</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </fieldset>

      {/* Pivot */}
      <fieldset>
        <legend className="mb-1 text-xs font-medium">ピボット</legend>
        <div className="grid grid-cols-2 gap-2">
          <NumberField
            label="X"
            value={transform.pivotX}
            onChange={(v) => onUpdate({ pivotX: v })}
            step={0.1}
            min={0}
            max={1}
          />
          <NumberField
            label="Y"
            value={transform.pivotY}
            onChange={(v) => onUpdate({ pivotY: v })}
            step={0.1}
            min={0}
            max={1}
          />
        </div>
      </fieldset>

      {/* Rotation & Scale */}
      <fieldset>
        <legend className="mb-1 text-xs font-medium">回転・スケール</legend>
        <div className="grid grid-cols-3 gap-2">
          <NumberField
            label="R"
            value={transform.rotation}
            onChange={(v) => onUpdate({ rotation: v })}
            step={1}
          />
          <NumberField
            label="SX"
            value={transform.scaleX}
            onChange={(v) => onUpdate({ scaleX: v })}
            step={0.1}
          />
          <NumberField
            label="SY"
            value={transform.scaleY}
            onChange={(v) => onUpdate({ scaleY: v })}
            step={0.1}
          />
        </div>
      </fieldset>
    </div>
  );
}

// ──────────────────────────────────────────────
// Component list item
// ──────────────────────────────────────────────

function ComponentListItem({
  component,
  onRemove,
  onUpdateData,
}: {
  component: SerializedUIComponent;
  onRemove: () => void;
  onUpdateData: (data: unknown) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  // Get label from registry
  const Ctor = getUIComponent(component.type);
  const label = Ctor ? new Ctor().label : component.type;
  const hasEditor = component.type === 'action' || hasPropertySchema(component.type);

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
      {expanded && component.type !== 'action' && hasPropertySchema(component.type) && (
        <ComponentPropertyEditor
          componentType={component.type}
          data={compData}
          onChange={(updated) => onUpdateData(updated)}
        />
      )}
    </div>
  );
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
    return (
      <div className="p-4 text-sm text-muted-foreground" data-testid="property-panel-empty">
        {selectedObjectIds.length > 1
          ? '複数のオブジェクトが選択されています'
          : 'オブジェクトを選択してください'}
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
        <TransformEditor transform={selectedObject.transform} onUpdate={handleTransformUpdate} />
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
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
