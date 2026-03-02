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
import type { ActionBlockProps } from '@/features/event-editor/registry/actionBlockRegistry';
import type { NavigateAction } from '@/types/ui/actions/NavigateAction';

function cloneAction(action: NavigateAction): NavigateAction {
  return Object.assign(Object.create(Object.getPrototypeOf(action)), action);
}

export function NavigateBlock({ action, onChange, onDelete }: ActionBlockProps) {
  const a = action as NavigateAction;

  return (
    <div className="rounded-md border p-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">キャンバス遷移</Label>
        <Button size="sm" variant="ghost" onClick={onDelete} aria-label="削除" data-testid="delete-action">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="mt-2 space-y-2">
        <div className="flex items-center gap-2">
          <Label className="w-20 shrink-0 text-xs text-muted-foreground">キャンバスID</Label>
          <Input
            value={a.canvasId}
            onChange={(e) => {
              const updated = cloneAction(a);
              updated.canvasId = e.target.value;
              onChange(updated);
            }}
            placeholder="遷移先キャンバスID"
            className="h-8 text-xs"
            data-testid="canvas-id-input"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label className="w-20 shrink-0 text-xs text-muted-foreground">遷移効果</Label>
          <Select
            value={a.transition}
            onValueChange={(value) => {
              const updated = cloneAction(a);
              updated.transition = value as 'none' | 'fade' | 'slide';
              onChange(updated);
            }}
          >
            <SelectTrigger className="h-8 text-xs" data-testid="transition-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">なし</SelectItem>
              <SelectItem value="fade">フェード</SelectItem>
              <SelectItem value="slide">スライド</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
