'use client';

import { useId } from 'react';
import { Trash2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useStore } from '@/stores';
import type { ActionBlockProps } from '@/features/event-editor/registry/actionBlockRegistry';
import type { PlayAnimationAction } from '@/types/ui/actions/PlayAnimationAction';
import type { NamedAnimation } from '@/types/ui/components/AnimationComponent';
import { UIObjectSelector } from '../UIObjectSelector';

function cloneAction(action: PlayAnimationAction): PlayAnimationAction {
  return Object.assign(Object.create(Object.getPrototypeOf(action)), action);
}

export function PlayAnimationBlock({ action, onChange, onDelete }: ActionBlockProps) {
  const uid = useId();
  const a = action as PlayAnimationAction;

  const selectedCanvasId = useStore((s) => s.selectedCanvasId);
  const uiCanvases = useStore((s) => s.uiCanvases);
  const canvas = uiCanvases.find((c) => c.id === selectedCanvasId);
  const objects = canvas?.objects ?? [];

  // Find animation names on target object's AnimationComponent
  const targetObj = objects.find((o) => o.id === a.targetId);
  const animationNames: string[] = [];
  if (targetObj) {
    for (const comp of targetObj.components) {
      if (comp.type === 'animation') {
        const data = comp.data as { animations?: NamedAnimation[] } | undefined;
        if (data?.animations) {
          for (const anim of data.animations) {
            animationNames.push(anim.name);
          }
        }
      }
    }
  }

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
              updated.animationName = '';
              onChange(updated);
            }}
            className="h-7 flex-1 text-xs"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label className="w-20 shrink-0 text-xs text-muted-foreground">アニメーション</Label>
          <Select
            value={a.animationName || '__none__'}
            onValueChange={(v) => {
              const updated = cloneAction(a);
              updated.animationName = v === '__none__' ? '' : v;
              onChange(updated);
            }}
          >
            <SelectTrigger className="h-7 flex-1 text-xs" data-testid="animation-name-select">
              <SelectValue placeholder="選択..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">（選択なし）</SelectItem>
              {animationNames.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id={`${uid}-autoplay`}
            checked={a.autoPlay}
            onCheckedChange={(checked) => {
              const updated = cloneAction(a);
              updated.autoPlay = checked === true;
              onChange(updated);
            }}
            data-testid={`${uid}-autoplay`}
          />
          <Label htmlFor={`${uid}-autoplay`} className="text-xs">自動再生</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id={`${uid}-loop`}
            checked={a.loop}
            onCheckedChange={(checked) => {
              const updated = cloneAction(a);
              updated.loop = checked === true;
              onChange(updated);
            }}
            data-testid={`${uid}-loop`}
          />
          <Label htmlFor={`${uid}-loop`} className="text-xs">ループ</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id={`${uid}-wait`}
            checked={a.wait}
            onCheckedChange={(checked) => {
              const updated = cloneAction(a);
              updated.wait = checked === true;
              onChange(updated);
            }}
            data-testid={`${uid}-wait`}
          />
          <Label htmlFor={`${uid}-wait`} className="text-xs">完了を待つ</Label>
        </div>
      </div>
    </div>
  );
}
