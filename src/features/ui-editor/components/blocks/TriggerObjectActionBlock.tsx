'use client';

import { Trash2 } from 'lucide-react';
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
import type { ActionBlockProps } from '@/features/event-editor/registry/actionBlockRegistry';
import type { TriggerObjectActionAction } from '@/types/ui/actions/TriggerObjectActionAction';
import { UIObjectSelector } from '../UIObjectSelector';

function cloneAction(action: TriggerObjectActionAction): TriggerObjectActionAction {
  return Object.assign(Object.create(Object.getPrototypeOf(action)), action);
}

export function TriggerObjectActionBlock({ action, onChange, onDelete }: ActionBlockProps) {
  const a = action as TriggerObjectActionAction;

  const selectedCanvasId = useStore((s) => s.selectedCanvasId);
  const uiCanvases = useStore((s) => s.uiCanvases);
  const canvas = uiCanvases.find((c) => c.id === selectedCanvasId);
  const objects = canvas?.objects ?? [];

  // Find action entries on the target object's ActionComponent
  const targetObj = objects.find((o) => o.id === a.targetId);
  const actionEntries: string[] = [];
  if (targetObj) {
    for (const comp of targetObj.components) {
      if (comp.type === 'action') {
        const data = comp.data as { actions?: Array<{ name: string }> } | undefined;
        if (data?.actions) {
          for (const entry of data.actions) {
            actionEntries.push(entry.name);
          }
        }
      }
    }
  }

  return (
    <div className="rounded-md border p-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">アクション発火</Label>
        <Button size="sm" variant="ghost" onClick={onDelete} aria-label="削除" data-testid="delete-action">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="mt-2 space-y-2">
        <div className="flex items-center gap-2">
          <Label className="w-20 shrink-0 text-xs text-muted-foreground">対象</Label>
          <UIObjectSelector
            value={a.targetId}
            showSelf={false}
            onChange={(id) => {
              const updated = cloneAction(a);
              updated.targetId = id;
              updated.actionEntryName = '';
              onChange(updated);
            }}
            className="h-7 flex-1 text-xs"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label className="w-20 shrink-0 text-xs text-muted-foreground">エントリ</Label>
          <Select
            value={a.actionEntryName || '__none__'}
            onValueChange={(v) => {
              const updated = cloneAction(a);
              updated.actionEntryName = v === '__none__' ? '' : v;
              onChange(updated);
            }}
          >
            <SelectTrigger className="h-7 flex-1 text-xs" data-testid="action-entry-select">
              <SelectValue placeholder="選択..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">（選択なし）</SelectItem>
              {actionEntries.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
