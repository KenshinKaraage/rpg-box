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
import { useStore } from '@/stores';
import type { ActionBlockProps } from '../../registry/actionBlockRegistry';
import type { ScriptAction } from '@/engine/actions/ScriptAction';

function cloneAction(action: ScriptAction): ScriptAction {
  return Object.assign(Object.create(Object.getPrototypeOf(action)), action);
}

export function ScriptActionBlock({ action, onChange, onDelete }: ActionBlockProps) {
  const scriptAction = action as ScriptAction;
  const scripts = useStore((s) => s.scripts);

  // イベントスクリプトのみ（internal, component は除外）
  const eventScripts = scripts.filter((s) => s.type === 'event');

  // 選択中のスクリプト
  const selectedScript = scripts.find((s) => s.id === scriptAction.scriptId);

  const handleScriptChange = (scriptId: string) => {
    const updated = cloneAction(scriptAction);
    updated.scriptId = scriptId === '__none__' ? '' : scriptId;
    // スクリプト変更時に引数をリセット
    updated.args = {};
    onChange(updated);
  };

  const handleArgChange = (argId: string, value: string) => {
    const updated = cloneAction(scriptAction);
    updated.args = { ...updated.args, [argId]: value };
    onChange(updated);
  };

  return (
    <div className="rounded-md border p-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">スクリプト</Label>
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
        {/* スクリプト選択ドロップダウン */}
        <div className="flex items-center gap-2">
          <Label className="w-24 shrink-0 text-xs text-muted-foreground">スクリプト</Label>
          <Select
            value={scriptAction.scriptId || '__none__'}
            onValueChange={handleScriptChange}
          >
            <SelectTrigger className="h-7 flex-1 text-xs" data-testid="script-select">
              <SelectValue placeholder="スクリプトを選択..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">（選択なし）</SelectItem>
              {eventScripts.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 引数入力フォーム */}
        {selectedScript && selectedScript.args.length > 0 && (
          <div className="space-y-1 rounded border border-dashed p-2">
            <Label className="text-[10px] text-muted-foreground">引数</Label>
            {selectedScript.args.map((arg) => (
              <div key={arg.id} className="flex items-center gap-1">
                <Label className="w-20 shrink-0 truncate text-[10px]" title={`${arg.name} (${arg.fieldType})`}>
                  {arg.name}
                </Label>
                <Input
                  className="h-6 flex-1 text-[10px]"
                  placeholder={arg.fieldType}
                  value={String(scriptAction.args[arg.id] ?? '')}
                  onChange={(e) => handleArgChange(arg.id, e.target.value)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
