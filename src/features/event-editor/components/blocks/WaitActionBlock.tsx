'use client';

import { Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { ActionBlockProps } from '../../registry/actionBlockRegistry';
import type { WaitAction } from '@/engine/actions/WaitAction';

export function WaitActionBlock({ action, onChange, onDelete }: ActionBlockProps) {
  const waitAction = action as WaitAction;

  const handleFramesChange = (value: string) => {
    const frames = parseInt(value, 10);
    if (isNaN(frames) || frames < 0) return;
    const updated = Object.assign(Object.create(Object.getPrototypeOf(waitAction)), waitAction);
    updated.frames = frames;
    onChange(updated);
  };

  return (
    <div className="rounded-md border p-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">ウェイト</Label>
        <Button
          size="sm"
          variant="ghost"
          onClick={onDelete}
          aria-label="削除"
          data-testid="delete-action"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <Label className="text-xs text-muted-foreground">フレーム数</Label>
        <Input
          type="number"
          value={waitAction.frames}
          onChange={(e) => handleFramesChange(e.target.value)}
          min={0}
          className="w-24"
          data-testid="wait-frames-input"
        />
      </div>
    </div>
  );
}
