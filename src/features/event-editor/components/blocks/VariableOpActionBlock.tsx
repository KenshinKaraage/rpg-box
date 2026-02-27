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
import type { ActionBlockProps } from '../../registry/actionBlockRegistry';
import type { VariableOpAction } from '@/engine/actions/VariableOpAction';

const OPERATIONS = [
  { value: 'set', label: '代入' },
  { value: 'add', label: '加算' },
  { value: 'subtract', label: '減算' },
  { value: 'multiply', label: '乗算' },
  { value: 'divide', label: '除算' },
] as const;

function cloneAction(action: VariableOpAction): VariableOpAction {
  return Object.assign(Object.create(Object.getPrototypeOf(action)), action);
}

export function VariableOpActionBlock({ action, onChange, onDelete }: ActionBlockProps) {
  const varAction = action as VariableOpAction;

  const handleVariableIdChange = (variableId: string) => {
    const updated = cloneAction(varAction);
    updated.variableId = variableId;
    onChange(updated);
  };

  const handleOperationChange = (operation: string) => {
    const updated = cloneAction(varAction);
    updated.operation = operation as VariableOpAction['operation'];
    onChange(updated);
  };

  const handleValueChange = (valueStr: string) => {
    const num = parseFloat(valueStr);
    const updated = cloneAction(varAction);
    updated.value = { type: 'literal', value: isNaN(num) ? valueStr : num };
    onChange(updated);
  };

  // Get literal value as string for display
  const literalValue = varAction.value.type === 'literal' ? String(varAction.value.value) : '';

  return (
    <div className="rounded-md border p-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">変数操作</Label>
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
          <Label className="w-16 text-xs text-muted-foreground">変数ID</Label>
          <Input
            value={varAction.variableId}
            onChange={(e) => handleVariableIdChange(e.target.value)}
            placeholder="変数ID"
            className="flex-1"
            data-testid="variable-id-input"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label className="w-16 text-xs text-muted-foreground">演算</Label>
          <Select value={varAction.operation} onValueChange={handleOperationChange}>
            <SelectTrigger className="w-32" data-testid="operation-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OPERATIONS.map((op) => (
                <SelectItem key={op.value} value={op.value}>
                  {op.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label className="w-16 text-xs text-muted-foreground">値</Label>
          <Input
            value={literalValue}
            onChange={(e) => handleValueChange(e.target.value)}
            placeholder="値"
            className="flex-1"
            data-testid="value-input"
          />
        </div>
      </div>
    </div>
  );
}
