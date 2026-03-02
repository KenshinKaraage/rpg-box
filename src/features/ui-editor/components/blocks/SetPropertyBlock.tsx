'use client';

import { Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { ActionBlockProps } from '@/features/event-editor/registry/actionBlockRegistry';
import type { SetPropertyAction } from '@/types/ui/actions/SetPropertyAction';

function cloneAction(action: SetPropertyAction): SetPropertyAction {
  return Object.assign(Object.create(Object.getPrototypeOf(action)), action);
}

export function SetPropertyBlock({ action, onChange, onDelete }: ActionBlockProps) {
  const a = action as SetPropertyAction;

  const handleChange = (field: keyof SetPropertyAction, value: unknown) => {
    const updated = cloneAction(a);
    (updated as unknown as Record<string, unknown>)[field] = value;
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
        <div className="flex items-center gap-2">
          <Label className="w-20 shrink-0 text-xs text-muted-foreground">対象ID</Label>
          <Input
            value={a.targetId}
            onChange={(e) => handleChange('targetId', e.target.value)}
            placeholder="空=自身"
            className="h-8 text-xs"
            data-testid="target-id-input"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label className="w-20 shrink-0 text-xs text-muted-foreground">プロパティ</Label>
          <Input
            value={a.property}
            onChange={(e) => handleChange('property', e.target.value)}
            placeholder="例: transform.x"
            className="h-8 text-xs"
            data-testid="property-input"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label className="w-20 shrink-0 text-xs text-muted-foreground">値</Label>
          <Input
            value={String(a.value)}
            onChange={(e) => {
              const num = Number(e.target.value);
              handleChange('value', isNaN(num) ? e.target.value : num);
            }}
            className="h-8 text-xs"
            data-testid="value-input"
          />
        </div>
      </div>
    </div>
  );
}
