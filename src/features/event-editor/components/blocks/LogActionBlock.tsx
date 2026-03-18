'use client';

import { Trash2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ActionBlockProps } from '../../registry/actionBlockRegistry';
import type { LogAction } from '@/engine/actions/LogAction';

export function LogActionBlock({ action, onChange, onDelete }: ActionBlockProps) {
  const log = action as LogAction;

  return (
    <div className="rounded-md border bg-muted/30 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm font-medium">
          <MessageSquare className="h-4 w-4 text-blue-500" />
          ログ出力
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onDelete} aria-label="削除">
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">メッセージ</Label>
        <Input
          className="h-7 text-xs"
          value={log.message}
          onChange={(e) => {
            const updated = Object.create(Object.getPrototypeOf(log));
            Object.assign(updated, log);
            updated.message = e.target.value;
            onChange(updated);
          }}
          placeholder="console.log に出力するメッセージ"
        />
      </div>
    </div>
  );
}
