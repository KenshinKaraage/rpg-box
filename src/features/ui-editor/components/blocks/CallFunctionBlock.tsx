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
import type { CallFunctionAction } from '@/types/ui/actions/CallFunctionAction';

function cloneAction(action: CallFunctionAction): CallFunctionAction {
  return Object.assign(Object.create(Object.getPrototypeOf(action)), action);
}

export function CallFunctionBlock({ action, onChange, onDelete }: ActionBlockProps) {
  const a = action as CallFunctionAction;

  const selectedCanvasId = useStore((s) => s.selectedCanvasId);
  const uiCanvases = useStore((s) => s.uiCanvases);
  const canvas = uiCanvases.find((c) => c.id === selectedCanvasId);
  const functions = canvas?.functions ?? [];

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
          <Label className="w-20 shrink-0 text-xs text-muted-foreground">関数</Label>
          <Select
            value={a.functionName || '__none__'}
            onValueChange={(v) => {
              const updated = cloneAction(a);
              updated.functionName = v === '__none__' ? '' : v;
              onChange(updated);
            }}
          >
            <SelectTrigger className="h-7 text-xs" data-testid="function-name-select">
              <SelectValue placeholder="選択..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">（選択なし）</SelectItem>
              {functions.map((fn) => (
                <SelectItem key={fn.id} value={fn.name}>
                  {fn.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
