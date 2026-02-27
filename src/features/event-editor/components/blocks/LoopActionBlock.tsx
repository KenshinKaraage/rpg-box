'use client';

import { Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { ActionBlockProps } from '../../registry/actionBlockRegistry';
import type { LoopAction } from '@/engine/actions/LoopAction';
import type { EventAction } from '@/engine/actions/EventAction';
import { ActionBlockEditor } from '../ActionBlockEditor';

function cloneAction(action: LoopAction): LoopAction {
  const cloned = Object.assign(Object.create(Object.getPrototypeOf(action)), action);
  cloned.actions = [...action.actions];
  return cloned;
}

export function LoopActionBlock({ action, onChange, onDelete }: ActionBlockProps) {
  const loopAction = action as LoopAction;

  const handleCountChange = (value: string) => {
    const updated = cloneAction(loopAction);
    if (value === '') {
      updated.count = undefined; // infinite
    } else {
      const num = parseInt(value, 10);
      if (isNaN(num) || num < 0) return;
      updated.count = num;
    }
    onChange(updated);
  };

  const handleActionsChange = (newActions: EventAction[]) => {
    const updated = cloneAction(loopAction);
    updated.actions = newActions;
    onChange(updated);
  };

  return (
    <div className="rounded-md border p-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">ループ</Label>
        <Button size="sm" variant="ghost" onClick={onDelete} aria-label="削除">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <Label className="text-xs text-muted-foreground">回数</Label>
        <Input
          type="number"
          value={loopAction.count ?? ''}
          onChange={(e) => handleCountChange(e.target.value)}
          placeholder="∞"
          className="w-24"
          min={0}
          data-testid="loop-count-input"
        />
        <span className="text-xs text-muted-foreground">（空 = 無限ループ）</span>
      </div>

      {/* Child actions */}
      <div className="ml-4 mt-3 border-l-2 border-blue-500/30 pl-3">
        <Label className="mb-1 block text-xs text-muted-foreground">ループ内アクション</Label>
        <ActionBlockEditor actions={loopAction.actions} onChange={handleActionsChange} />
      </div>
    </div>
  );
}
