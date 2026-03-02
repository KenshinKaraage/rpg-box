'use client';

import { Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { ActionBlockProps } from '@/features/event-editor/registry/actionBlockRegistry';
import type { CallFunctionAction } from '@/types/ui/actions/CallFunctionAction';

function cloneAction(action: CallFunctionAction): CallFunctionAction {
  return Object.assign(Object.create(Object.getPrototypeOf(action)), action);
}

export function CallFunctionBlock({ action, onChange, onDelete }: ActionBlockProps) {
  const a = action as CallFunctionAction;

  return (
    <div className="rounded-md border p-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">関数呼出</Label>
        <Button size="sm" variant="ghost" onClick={onDelete} aria-label="削除" data-testid="delete-action">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="mt-2 space-y-2">
        <div className="flex items-center gap-2">
          <Label className="w-20 shrink-0 text-xs text-muted-foreground">関数名</Label>
          <Input
            value={a.functionName}
            onChange={(e) => {
              const updated = cloneAction(a);
              updated.functionName = e.target.value;
              onChange(updated);
            }}
            placeholder="例: openMenu"
            className="h-8 text-xs"
            data-testid="function-name-input"
          />
        </div>
      </div>
    </div>
  );
}
