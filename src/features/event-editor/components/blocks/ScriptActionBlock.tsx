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
import { getArgField } from '../arg-fields';
import '../arg-fields/register';
import type { ActionBlockProps } from '../../registry/actionBlockRegistry';
import type { ScriptAction } from '@/engine/actions/ScriptAction';
import type { ScriptArg } from '@/types/script';

function cloneAction(action: ScriptAction): ScriptAction {
  return Object.assign(Object.create(Object.getPrototypeOf(action)), action);
}

export function ScriptActionBlock({ action, onChange, onDelete }: ActionBlockProps) {
  const scriptAction = action as ScriptAction;
  const scripts = useStore((s) => s.scripts);

  const eventScripts = scripts.filter((s) => s.type === 'event');
  const selectedScript = scripts.find((s) => s.id === scriptAction.scriptId);

  const handleScriptChange = (scriptId: string) => {
    const updated = cloneAction(scriptAction);
    updated.scriptId = scriptId === '__none__' ? '' : scriptId;
    updated.args = {};
    onChange(updated);
  };

  const handleArgChange = (argId: string, value: unknown) => {
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

        {selectedScript && selectedScript.args.length > 0 && (
          <div className="space-y-1 rounded border border-dashed p-2">
            <Label className="text-[10px] text-muted-foreground">引数</Label>
            {selectedScript.args.map((arg) => (
              <ArgFieldRow
                key={arg.id}
                arg={arg}
                value={scriptAction.args[arg.id]}
                onChange={(v) => handleArgChange(arg.id, v)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** 引数1行: ラベル + fieldType に応じた入力UI */
function ArgFieldRow({ arg, value, onChange }: { arg: ScriptArg; value: unknown; onChange: (v: unknown) => void }) {
  const Renderer = getArgField(arg.fieldType);

  return (
    <div className="flex items-center gap-1">
      <Label className="w-20 shrink-0 truncate text-[10px]" title={`${arg.name} (${arg.fieldType})`}>
        {arg.name}
      </Label>
      {Renderer ? (
        <Renderer value={value} onChange={onChange} placeholder={arg.fieldType} />
      ) : (
        <Input
          className="h-6 flex-1 text-[10px]"
          placeholder={arg.fieldType}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}
