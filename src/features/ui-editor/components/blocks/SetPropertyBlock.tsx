'use client';

import { Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useStore } from '@/stores';
import { getUIComponent } from '@/types/ui';
import { getRectTransformPropertyDefs } from '@/types/ui/UIComponent';
import type { PropertyDef } from '@/types/ui/UIComponent';
import type { ActionBlockProps } from '@/features/event-editor/registry/actionBlockRegistry';
import type { SetPropertyAction } from '@/types/ui/actions/SetPropertyAction';
import { UIObjectSelector } from '../UIObjectSelector';

function cloneAction(action: SetPropertyAction): SetPropertyAction {
  return Object.assign(Object.create(Object.getPrototypeOf(action)), action);
}

/**
 * 対象オブジェクトが持つコンポーネント一覧を取得する。
 * transform は常に含む（全オブジェクト共通）。
 */
function useTargetComponents(targetId: string): { type: string; label: string }[] {
  const selectedCanvasId = useStore((s) => s.selectedCanvasId);
  const uiCanvases = useStore((s) => s.uiCanvases);
  const canvas = uiCanvases.find((c) => c.id === selectedCanvasId);
  const obj = canvas?.objects.find((o) => o.id === targetId);

  const result: { type: string; label: string }[] = [{ type: 'transform', label: 'Transform' }];
  if (!obj) return result;

  for (const comp of obj.components) {
    const Ctor = getUIComponent(comp.type);
    if (Ctor) {
      const instance = new Ctor();
      if (instance.getPropertyDefs().length > 0) {
        result.push({ type: comp.type, label: instance.label });
      }
    }
  }

  return result;
}

/**
 * コンポーネントタイプに対応するプロパティ定義を取得する。
 */
function getPropertyDefsForComponent(componentType: string): PropertyDef[] {
  if (componentType === 'transform') {
    return getRectTransformPropertyDefs();
  }
  const Ctor = getUIComponent(componentType);
  if (!Ctor) return [];
  return new Ctor().getPropertyDefs();
}

export function SetPropertyBlock({ action, onChange, onDelete }: ActionBlockProps) {
  const a = action as SetPropertyAction;

  const components = useTargetComponents(a.targetId);
  const propertyDefs = getPropertyDefsForComponent(a.component);

  const handleChange = (field: string, value: unknown) => {
    const updated = cloneAction(a);
    (updated as unknown as Record<string, unknown>)[field] = value;
    onChange(updated);
  };

  const handleComponentChange = (comp: string) => {
    const updated = cloneAction(a);
    updated.component = comp;
    updated.property = ''; // reset property when component changes
    onChange(updated);
  };

  return (
    <div className="rounded-md border p-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">プロパティ設定</Label>
        <Button size="sm" variant="ghost" onClick={onDelete} aria-label="削除" data-testid="delete-action">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="mt-2 space-y-2">
        {/* Target object */}
        <div className="flex items-center gap-2">
          <Label className="w-20 shrink-0 text-xs text-muted-foreground">対象</Label>
          <UIObjectSelector
            value={a.targetId}
            onChange={(id) => handleChange('targetId', id)}
            className="h-7 flex-1 text-xs"
          />
        </div>

        {/* Component selection */}
        <div className="flex items-center gap-2">
          <Label className="w-20 shrink-0 text-xs text-muted-foreground">コンポーネント</Label>
          <Select
            value={a.component || 'transform'}
            onValueChange={handleComponentChange}
          >
            <SelectTrigger className="h-7 text-xs" data-testid="component-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {components.map((c) => (
                <SelectItem key={c.type} value={c.type}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Property selection */}
        <div className="flex items-center gap-2">
          <Label className="w-20 shrink-0 text-xs text-muted-foreground">プロパティ</Label>
          <Select
            value={a.property || '__none__'}
            onValueChange={(v) => handleChange('property', v === '__none__' ? '' : v)}
          >
            <SelectTrigger className="h-7 text-xs" data-testid="property-select">
              <SelectValue placeholder="選択..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">（選択なし）</SelectItem>
              {propertyDefs.map((def) => (
                <SelectItem key={def.key} value={def.key}>
                  {def.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Value input */}
        <div className="flex items-center gap-2">
          <Label className="w-20 shrink-0 text-xs text-muted-foreground">値</Label>
          <Input
            type="number"
            value={typeof a.value === 'number' ? a.value : 0}
            onChange={(e) => {
              const num = parseFloat(e.target.value);
              if (!isNaN(num)) handleChange('value', num);
            }}
            className="h-7 text-xs"
            data-testid="value-input"
          />
        </div>
      </div>
    </div>
  );
}
