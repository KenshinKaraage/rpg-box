'use client';

import { Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { ActionBlockProps } from '../../registry/actionBlockRegistry';
import type { CallTemplateAction } from '@/engine/actions/CallTemplateAction';

function cloneAction(action: CallTemplateAction): CallTemplateAction {
  return Object.assign(Object.create(Object.getPrototypeOf(action)), action);
}

export function CallTemplateActionBlock({ action, onChange, onDelete }: ActionBlockProps) {
  const callAction = action as CallTemplateAction;

  const handleTemplateIdChange = (templateId: string) => {
    const updated = cloneAction(callAction);
    updated.templateId = templateId;
    onChange(updated);
  };

  return (
    <div className="rounded-md border p-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">テンプレート呼出</Label>
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
      <div className="mt-2 space-y-2">
        <div className="flex items-center gap-2">
          <Label className="w-24 text-xs text-muted-foreground">テンプレートID</Label>
          <Input
            value={callAction.templateId}
            onChange={(e) => handleTemplateIdChange(e.target.value)}
            placeholder="テンプレートID"
            className="flex-1"
            data-testid="template-id-input"
          />
        </div>
        <p className="text-xs text-muted-foreground">引数設定は今後実装予定</p>
      </div>
    </div>
  );
}
