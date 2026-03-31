'use client';

import { useMemo } from 'react';
import { Plus, Trash2 } from 'lucide-react';
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
import { ActionBlockEditor } from '../ActionBlockEditor';
import type { ActionBlockProps } from '../../registry/actionBlockRegistry';
import type { SwitchAction } from '@/engine/actions/SwitchAction';
import type { ConditionOperand } from '@/engine/actions/ConditionalAction';
import type { EventAction } from '@/engine/actions/EventAction';
import type { EditableAction } from '@/types/ui/actions/UIAction';

function cloneAction(action: SwitchAction): SwitchAction {
  return Object.assign(Object.create(Object.getPrototypeOf(action)), {
    ...action,
    cases: action.cases.map((c) => ({ ...c, actions: [...c.actions] })),
    defaultActions: [...action.defaultActions],
  });
}

export function SwitchActionBlock({ action, onChange, onDelete }: ActionBlockProps) {
  const switchAction = action as SwitchAction;
  const variables = useStore((s) => s.variables);
  const maps = useStore((s) => s.maps);

  const isObject = switchAction.operand.type === 'objectVariable';
  const objectName = isObject ? (switchAction.operand as { objectName: string }).objectName : '';

  // オブジェクト変数リスト
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
        const vars = data.variables as Record<string, unknown> | undefined;
        if (!vars) return [];
        return Object.entries(vars).map(([name, v]) => {
          const isNew = v && typeof v === 'object' && 'fieldType' in (v as Record<string, unknown>);
          const fieldType = isNew ? (v as Record<string, unknown>).fieldType as string : typeof v;
          return { name, fieldType };
        });
      }
    }
    return [];
  }, [maps, objectName]);

  const handleScopeChange = (scope: string) => {
    const updated = cloneAction(switchAction);
    updated.operand = scope === 'object'
      ? { type: 'objectVariable', objectName: '', variableName: '' }
      : { type: 'variable', variableId: '' };
    onChange(updated);
  };

  const handleOperandChange = (operand: ConditionOperand) => {
    const updated = cloneAction(switchAction);
    updated.operand = operand;
    onChange(updated);
  };

  const handleAddCase = () => {
    const updated = cloneAction(switchAction);
    updated.cases = [...updated.cases, { value: updated.cases.length, actions: [] }];
    onChange(updated);
  };

  const handleCaseValueChange = (index: number, rawValue: string) => {
    const updated = cloneAction(switchAction);
    const num = parseFloat(rawValue);
    updated.cases[index] = {
      ...updated.cases[index]!,
      value: isNaN(num) ? rawValue : num,
    };
    onChange(updated);
  };

  const handleCaseActionsChange = (index: number, actions: EditableAction[]) => {
    const updated = cloneAction(switchAction);
    updated.cases[index] = { ...updated.cases[index]!, actions: actions as EventAction[] };
    onChange(updated);
  };

  const handleDeleteCase = (index: number) => {
    const updated = cloneAction(switchAction);
    updated.cases = updated.cases.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleDefaultActionsChange = (actions: EditableAction[]) => {
    const updated = cloneAction(switchAction);
    updated.defaultActions = actions as EventAction[];
    onChange(updated);
  };

  return (
    <div className="rounded-md border p-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">スイッチ</Label>
        <Button size="sm" variant="ghost" onClick={onDelete} aria-label="削除">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-2 space-y-2">
        {/* 対象変数 */}
        <div className="flex items-center gap-1">
          <Select value={isObject ? 'object' : 'game'} onValueChange={handleScopeChange}>
            <SelectTrigger className="h-7 w-24 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="game">ゲーム変数</SelectItem>
              <SelectItem value="object">OBJ変数</SelectItem>
            </SelectContent>
          </Select>

          {isObject ? (
            <>
              <Input
                className="h-7 w-20 text-xs"
                placeholder="OBJ名"
                value={objectName}
                onChange={(e) => handleOperandChange({
                  type: 'objectVariable',
                  objectName: e.target.value,
                  variableName: switchAction.operand.type === 'objectVariable' ? switchAction.operand.variableName : '',
                })}
              />
              {objVars.length > 0 ? (
                <Select
                  value={switchAction.operand.type === 'objectVariable' ? switchAction.operand.variableName : ''}
                  onValueChange={(v) => handleOperandChange({
                    type: 'objectVariable',
                    objectName,
                    variableName: v,
                  })}
                >
                  <SelectTrigger className="h-7 flex-1 text-xs">
                    <SelectValue placeholder="変数..." />
                  </SelectTrigger>
                  <SelectContent>
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
                  className="h-7 flex-1 text-xs"
                  placeholder="変数名"
                  value={switchAction.operand.type === 'objectVariable' ? switchAction.operand.variableName : ''}
                  onChange={(e) => handleOperandChange({
                    type: 'objectVariable',
                    objectName,
                    variableName: e.target.value,
                  })}
                />
              )}
            </>
          ) : (
            <Select
              value={switchAction.operand.type === 'variable' ? switchAction.operand.variableId : ''}
              onValueChange={(v) => handleOperandChange({ type: 'variable', variableId: v })}
            >
              <SelectTrigger className="h-7 flex-1 text-xs">
                <SelectValue placeholder="変数を選択..." />
              </SelectTrigger>
              <SelectContent>
                {variables.map((v) => (
                  <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* ケース一覧 */}
        {switchAction.cases.map((c, i) => (
          <div key={i} className="rounded border border-dashed p-2">
            <div className="flex items-center gap-1">
              <Label className="text-[10px] text-muted-foreground">値 =</Label>
              <Input
                className="h-6 w-16 text-[10px]"
                value={String(c.value ?? '')}
                onChange={(e) => handleCaseValueChange(i, e.target.value)}
              />
              <span className="flex-1" />
              <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={() => handleDeleteCase(i)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
            <div className="mt-1 pl-2 border-l-2 border-primary/30">
              <ActionBlockEditor actions={c.actions as EditableAction[]} onChange={(a) => handleCaseActionsChange(i, a)} />
            </div>
          </div>
        ))}

        <Button size="sm" variant="outline" className="w-full text-xs" onClick={handleAddCase}>
          <Plus className="mr-1 h-3 w-3" />ケース追加
        </Button>

        {/* デフォルト */}
        <div className="rounded border border-dashed p-2">
          <Label className="text-[10px] text-muted-foreground">それ以外</Label>
          <div className="mt-1 pl-2 border-l-2 border-muted-foreground/30">
            <ActionBlockEditor actions={switchAction.defaultActions as EditableAction[]} onChange={handleDefaultActionsChange} />
          </div>
        </div>
      </div>
    </div>
  );
}
