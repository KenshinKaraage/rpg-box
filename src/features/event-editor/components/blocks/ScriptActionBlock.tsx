'use client';

import { useMemo, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
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
import { ScriptPickerModal } from '../ScriptPickerModal';
import type { ActionBlockProps } from '../../registry/actionBlockRegistry';
import type { ScriptAction, ScriptResultTarget } from '@/engine/actions/ScriptAction';
import type { ScriptArg } from '@/types/script';

function cloneAction(action: ScriptAction): ScriptAction {
  return Object.assign(Object.create(Object.getPrototypeOf(action)), action);
}

export function ScriptActionBlock({ action, onChange, onDelete }: ActionBlockProps) {
  const scriptAction = action as ScriptAction;
  const scripts = useStore((s) => s.scripts);
  const variables = useStore((s) => s.variables);
  const [pickerOpen, setPickerOpen] = useState(false);

  const eventScripts = scripts.filter((s) => s.type === 'event');
  const selectedScript = scripts.find((s) => s.id === scriptAction.scriptId);
  const hasReturns = selectedScript && selectedScript.returns.length > 0;

  const handleScriptChange = (scriptId: string) => {
    const updated = cloneAction(scriptAction);
    updated.scriptId = scriptId === '__none__' ? '' : scriptId;
    updated.args = {};
    updated.resultTarget = undefined;
    onChange(updated);
  };

  const handleArgChange = (argId: string, value: unknown) => {
    const updated = cloneAction(scriptAction);
    updated.args = { ...updated.args, [argId]: value };
    onChange(updated);
  };

  const handleResultTargetChange = (target: ScriptResultTarget | undefined) => {
    const updated = cloneAction(scriptAction);
    updated.resultTarget = target;
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
          <Button
            variant="outline"
            size="sm"
            className="h-7 flex-1 justify-start text-xs font-normal"
            onClick={() => setPickerOpen(true)}
            data-testid="script-select"
          >
            {selectedScript ? selectedScript.name : '（選択なし）'}
          </Button>
          <ScriptPickerModal
            open={pickerOpen}
            onOpenChange={setPickerOpen}
            scripts={eventScripts}
            onSelect={handleScriptChange}
          />
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

        {/* 返り値代入先 */}
        {hasReturns && (
          <div className="space-y-1 rounded border border-dashed p-2">
            <Label className="text-[10px] text-muted-foreground">返り値の代入先</Label>
            <div className="flex items-center gap-1">
              <Select
                value={scriptAction.resultTarget?.type ?? '__none__'}
                onValueChange={(v) => {
                  if (v === '__none__') {
                    handleResultTargetChange(undefined);
                  } else {
                    handleResultTargetChange({
                      type: v as 'game' | 'object',
                      variableName: scriptAction.resultTarget?.variableName ?? '',
                    });
                  }
                }}
              >
                <SelectTrigger className="h-6 w-24 text-[10px]">
                  <SelectValue placeholder="なし" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">なし</SelectItem>
                  <SelectItem value="game">ゲーム変数</SelectItem>
                  <SelectItem value="object">オブジェクト変数</SelectItem>
                </SelectContent>
              </Select>
              {scriptAction.resultTarget?.type === 'object' && (
                <Input
                  className="h-6 w-24 text-[10px]"
                  placeholder="オブジェクト名"
                  value={scriptAction.resultTarget.objectName ?? ''}
                  onChange={(e) => handleResultTargetChange({
                    ...scriptAction.resultTarget!,
                    objectName: e.target.value,
                  })}
                />
              )}
              {scriptAction.resultTarget?.type === 'game' && (
                <Select
                  value={scriptAction.resultTarget.variableName || '__none__'}
                  onValueChange={(v) => handleResultTargetChange({
                    ...scriptAction.resultTarget!,
                    variableName: v === '__none__' ? '' : v,
                  })}
                >
                  <SelectTrigger className="h-6 flex-1 text-[10px]">
                    <SelectValue placeholder="変数を選択..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">（選択なし）</SelectItem>
                    {variables.map((v) => (
                      <SelectItem key={v.id} value={v.name}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {scriptAction.resultTarget?.type === 'object' && (
                <ResultObjectVariableSelect
                  objectName={scriptAction.resultTarget.objectName ?? ''}
                  value={scriptAction.resultTarget.variableName ?? ''}
                  onValueChange={(v) => handleResultTargetChange({
                    ...scriptAction.resultTarget!,
                    variableName: v,
                  })}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** 引数1行: ラベル + fieldType に応じた入力UI */
function ArgFieldRow({ arg, value, onChange }: { arg: ScriptArg; value: unknown; onChange: (v: unknown) => void }) {
  if (arg.isArray) {
    return <ArrayArgField arg={arg} value={value} onChange={onChange} />;
  }

  const Renderer = getArgField(arg.fieldType);

  return (
    <div className="flex items-center gap-1">
      <Label className="w-20 shrink-0 truncate text-[10px]" title={`${arg.name} (${arg.fieldType})`}>
        {arg.name}
      </Label>
      {Renderer ? (
        <Renderer value={value} onChange={onChange} placeholder={arg.fieldType} referenceTypeId={arg.referenceTypeId} />
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

/** 配列引数: リスト形式で追加/削除 */
function ArrayArgField({ arg, value, onChange }: { arg: ScriptArg; value: unknown; onChange: (v: unknown) => void }) {
  const items = Array.isArray(value) ? value : [];
  const Renderer = getArgField(arg.fieldType);

  const handleAdd = () => {
    const defaultVal = arg.fieldType === 'number' ? 0 : arg.fieldType === 'boolean' ? false : '';
    onChange([...items, defaultVal]);
  };

  const handleRemove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, v: unknown) => {
    const updated = [...items];
    updated[index] = v;
    onChange(updated);
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label className="truncate text-[10px]" title={`${arg.name} (${arg.fieldType}[])`}>
          {arg.name}[]
        </Label>
        <Button size="sm" variant="ghost" className="h-5 px-1" onClick={handleAdd}>
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-1 pl-2">
          <span className="w-4 shrink-0 text-right text-[9px] text-muted-foreground">{i}</span>
          {Renderer ? (
            <Renderer value={item} onChange={(v: unknown) => handleItemChange(i, v)} placeholder={arg.fieldType} referenceTypeId={arg.referenceTypeId} />
          ) : (
            <Input
              className="h-6 flex-1 text-[10px]"
              placeholder={arg.fieldType}
              value={String(item ?? '')}
              onChange={(e) => handleItemChange(i, e.target.value)}
            />
          )}
          <Button size="sm" variant="ghost" className="h-5 w-5 shrink-0 p-0" onClick={() => handleRemove(i)}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}
      {items.length === 0 && (
        <div className="pl-2 text-[9px] text-muted-foreground">（空の配列）</div>
      )}
    </div>
  );
}

/** オブジェクト変数ドロップダウン（マップオブジェクトの VariablesComponent から取得） */
function ResultObjectVariableSelect({
  objectName,
  value,
  onValueChange,
}: {
  objectName: string;
  value: string;
  onValueChange: (name: string) => void;
}) {
  const maps = useStore((s) => s.maps);

  const objVars = useMemo(() => {
    if (!objectName) return [];
    for (const map of maps) {
      for (const layer of map.layers) {
        if (layer.type !== 'object' || !layer.objects) continue;
        const obj = layer.objects.find((o) => o.name === objectName);
        if (!obj) continue;
        const varsComp = obj.components.find((c) => c.type === 'variables');
        if (!varsComp) continue;
        const data = typeof (varsComp as unknown as { serialize?: () => unknown }).serialize === 'function'
          ? (varsComp as unknown as { serialize: () => Record<string, unknown> }).serialize()
          : (varsComp as unknown as { data: Record<string, unknown> }).data ?? {};
        const variables = data.variables as Record<string, unknown> | undefined;
        if (!variables) return [];
        return Object.entries(variables).map(([name, v]) => {
          const isNew = v && typeof v === 'object' && 'fieldType' in (v as Record<string, unknown>);
          const fieldType = isNew ? (v as Record<string, unknown>).fieldType as string : typeof v;
          return { name, fieldType };
        });
      }
    }
    return [];
  }, [maps, objectName]);

  return objVars.length > 0 ? (
    <Select value={value || '__none__'} onValueChange={(v) => onValueChange(v === '__none__' ? '' : v)}>
      <SelectTrigger className="h-6 flex-1 text-[10px]">
        <SelectValue placeholder="変数を選択..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__">（選択なし）</SelectItem>
        {objVars.map((v) => (
          <SelectItem key={v.name} value={v.name}>
            <span className="mr-1 text-[9px] text-muted-foreground">{v.fieldType}</span>
            {v.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  ) : (
    <Input
      className="h-6 flex-1 text-[10px]"
      placeholder="変数名"
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
    />
  );
}
