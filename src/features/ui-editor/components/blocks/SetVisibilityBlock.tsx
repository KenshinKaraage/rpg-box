'use client';

import { useId } from 'react';
import { Trash2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import type { ActionBlockProps } from '@/features/event-editor/registry/actionBlockRegistry';
import type { SetVisibilityAction } from '@/types/ui/actions/SetVisibilityAction';
import { UIObjectSelector } from '../UIObjectSelector';

function cloneAction(action: SetVisibilityAction): SetVisibilityAction {
  return Object.assign(Object.create(Object.getPrototypeOf(action)), action);
}

export function SetVisibilityBlock({ action, onChange, onDelete }: ActionBlockProps) {
  const uid = useId();
  const a = action as SetVisibilityAction;

  return (
    <div className="rounded-md border p-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">表示切替</Label>
        <Button size="sm" variant="ghost" onClick={onDelete} aria-label="削除" data-testid="delete-action">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="mt-2 space-y-2">
        <div className="flex items-center gap-2">
          <Label className="w-20 shrink-0 text-xs text-muted-foreground">対象</Label>
          <UIObjectSelector
            value={a.targetId}
            onChange={(id) => {
              const updated = cloneAction(a);
              updated.targetId = id;
              onChange(updated);
            }}
            className="h-7 flex-1 text-xs"
          />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id={`${uid}-visible`}
            checked={a.visible}
            onCheckedChange={(checked) => {
              const updated = cloneAction(a);
              updated.visible = checked === true;
              onChange(updated);
            }}
            data-testid={`${uid}-visible`}
          />
          <Label htmlFor={`${uid}-visible`} className="text-xs">表示する</Label>
        </div>
      </div>
    </div>
  );
}
