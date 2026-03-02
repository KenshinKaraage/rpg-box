'use client';

import { Trash2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import type { ActionBlockProps } from '@/features/event-editor/registry/actionBlockRegistry';
import type { PlayAnimationAction } from '@/types/ui/actions/PlayAnimationAction';
import { UIObjectSelector } from '../UIObjectSelector';

function cloneAction(action: PlayAnimationAction): PlayAnimationAction {
  return Object.assign(Object.create(Object.getPrototypeOf(action)), action);
}

export function PlayAnimationBlock({ action, onChange, onDelete }: ActionBlockProps) {
  const a = action as PlayAnimationAction;

  return (
    <div className="rounded-md border p-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">アニメーション再生</Label>
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
            id="autoplay-checkbox"
            checked={a.autoPlay}
            onCheckedChange={(checked) => {
              const updated = cloneAction(a);
              updated.autoPlay = checked === true;
              onChange(updated);
            }}
            data-testid="autoplay-checkbox"
          />
          <Label htmlFor="autoplay-checkbox" className="text-xs">自動再生</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="loop-checkbox"
            checked={a.loop}
            onCheckedChange={(checked) => {
              const updated = cloneAction(a);
              updated.loop = checked === true;
              onChange(updated);
            }}
            data-testid="loop-checkbox"
          />
          <Label htmlFor="loop-checkbox" className="text-xs">ループ</Label>
        </div>
      </div>
    </div>
  );
}
