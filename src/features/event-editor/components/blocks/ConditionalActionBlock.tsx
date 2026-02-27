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
import type { ConditionalAction, Condition } from '@/engine/actions/ConditionalAction';
import type { EventAction } from '@/engine/actions/EventAction';
import { ActionBlockEditor } from '../ActionBlockEditor';

const OPERATORS = [
  { value: '==', label: '==' },
  { value: '!=', label: '!=' },
  { value: '>', label: '>' },
  { value: '<', label: '<' },
  { value: '>=', label: '>=' },
  { value: '<=', label: '<=' },
] as const;

function cloneAction(action: ConditionalAction): ConditionalAction {
  const cloned = Object.assign(Object.create(Object.getPrototypeOf(action)), action);
  cloned.condition = { ...action.condition };
  cloned.thenActions = [...action.thenActions];
  cloned.elseActions = [...action.elseActions];
  return cloned;
}

export function ConditionalActionBlock({ action, onChange, onDelete }: ActionBlockProps) {
  const condAction = action as ConditionalAction;
  const variables = useStore((state) => state.variables);

  const handleConditionChange = (updates: Partial<Condition>) => {
    const updated = cloneAction(condAction);
    updated.condition = { ...updated.condition, ...updates };
    onChange(updated);
  };

  const handleValueChange = (valueStr: string) => {
    const num = parseFloat(valueStr);
    handleConditionChange({ value: isNaN(num) ? valueStr : num });
  };

  const handleThenChange = (newActions: EventAction[]) => {
    const updated = cloneAction(condAction);
    updated.thenActions = newActions;
    onChange(updated);
  };

  const handleElseChange = (newActions: EventAction[]) => {
    const updated = cloneAction(condAction);
    updated.elseActions = newActions;
    onChange(updated);
  };

  return (
    <div className="rounded-md border p-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">条件分岐</Label>
        <Button size="sm" variant="ghost" onClick={onDelete} aria-label="削除">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Condition row */}
      <div className="mt-2 flex items-center gap-2">
        <Select
          value={condAction.condition.variableId}
          onValueChange={(val) => handleConditionChange({ variableId: val })}
        >
          <SelectTrigger className="flex-1" data-testid="condition-variable-select">
            <SelectValue placeholder="変数を選択..." />
          </SelectTrigger>
          <SelectContent>
            {variables.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.name || v.id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={condAction.condition.operator}
          onValueChange={(val) => handleConditionChange({ operator: val as Condition['operator'] })}
        >
          <SelectTrigger className="w-20" data-testid="condition-operator-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {OPERATORS.map((op) => (
              <SelectItem key={op.value} value={op.value}>
                {op.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          value={String(condAction.condition.value ?? '')}
          onChange={(e) => handleValueChange(e.target.value)}
          placeholder="値"
          className="w-24"
          data-testid="condition-value-input"
        />
      </div>

      {/* Then branch */}
      <div className="ml-4 mt-3 border-l-2 border-green-500/30 pl-3">
        <Label className="mb-1 block text-xs text-muted-foreground">Then（真の場合）</Label>
        <ActionBlockEditor actions={condAction.thenActions} onChange={handleThenChange} />
      </div>

      {/* Else branch */}
      <div className="ml-4 mt-3 border-l-2 border-red-500/30 pl-3">
        <Label className="mb-1 block text-xs text-muted-foreground">Else（偽の場合）</Label>
        <ActionBlockEditor actions={condAction.elseActions} onChange={handleElseChange} />
      </div>
    </div>
  );
}
