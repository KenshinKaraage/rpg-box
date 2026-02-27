'use client';

import { useMemo } from 'react';
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
import type {
  ConditionalAction,
  Condition,
  ConditionOperand,
} from '@/engine/actions/ConditionalAction';
import type { EventAction } from '@/engine/actions/EventAction';
import type { Variable } from '@/types/variable';
import { ActionBlockEditor } from '../ActionBlockEditor';

const ALL_OPERATORS = [
  { value: '==', label: '==' },
  { value: '!=', label: '!=' },
  { value: '>', label: '>' },
  { value: '<', label: '<' },
  { value: '>=', label: '>=' },
  { value: '<=', label: '<=' },
] as const;

const EQUALITY_ONLY_OPERATORS = [
  { value: '==', label: '==' },
  { value: '!=', label: '!=' },
] as const;

const OPERAND_TYPES = [
  { value: 'literal', label: '値' },
  { value: 'variable', label: '変数' },
] as const;

function cloneAction(action: ConditionalAction): ConditionalAction {
  const cloned = Object.assign(Object.create(Object.getPrototypeOf(action)), action);
  cloned.condition = { ...action.condition };
  cloned.thenActions = [...action.thenActions];
  cloned.elseActions = [...action.elseActions];
  return cloned;
}

/** Resolve the field type string of an operand */
function resolveOperandType(operand: ConditionOperand, variables: Variable[]): string | null {
  if (operand.type === 'variable') {
    if (!operand.variableId) return null;
    const v = variables.find((v) => v.id === operand.variableId);
    return v?.fieldType.type ?? null;
  }
  // literal
  const val = operand.value;
  if (typeof val === 'number') return 'number';
  if (typeof val === 'string') return 'string';
  if (typeof val === 'boolean') return 'boolean';
  return null;
}

/** Check if a field type supports numeric comparison operators (>, <, >=, <=) */
function isNumericType(fieldType: string | null): boolean {
  return fieldType === 'number';
}

export function ConditionalActionBlock({ action, onChange, onDelete }: ActionBlockProps) {
  const condAction = action as ConditionalAction;
  const variables = useStore((state) => state.variables);

  const leftType = resolveOperandType(condAction.condition.left, variables);
  const rightType = resolveOperandType(condAction.condition.right, variables);

  // The "resolved type" for filtering: use whichever side has a determined type
  const resolvedType = leftType ?? rightType;

  // Filter variables by resolved type for each side
  const leftVariables = useMemo(() => {
    if (!rightType) return variables;
    return variables.filter((v) => v.fieldType.type === rightType);
  }, [variables, rightType]);

  const rightVariables = useMemo(() => {
    if (!leftType) return variables;
    return variables.filter((v) => v.fieldType.type === leftType);
  }, [variables, leftType]);

  // Operators: number allows all, others only == / !=
  const operators =
    isNumericType(resolvedType) || !resolvedType ? ALL_OPERATORS : EQUALITY_ONLY_OPERATORS;

  // Type mismatch detection
  const typeMismatch = leftType && rightType && leftType !== rightType;

  // If current operator is not valid for the resolved type, it's also a problem
  const operatorInvalid =
    !isNumericType(resolvedType) &&
    resolvedType !== null &&
    !['==', '!='].includes(condAction.condition.operator);

  const handleConditionChange = (updates: Partial<Condition>) => {
    const updated = cloneAction(condAction);
    updated.condition = { ...updated.condition, ...updates };
    onChange(updated);
  };

  const handleLeftTypeChange = (operandType: string) => {
    const newLeft: ConditionOperand =
      operandType === 'variable'
        ? { type: 'variable', variableId: '' }
        : { type: 'literal', value: 0 };
    handleConditionChange({ left: newLeft });
  };

  const handleRightTypeChange = (operandType: string) => {
    const newRight: ConditionOperand =
      operandType === 'variable'
        ? { type: 'variable', variableId: '' }
        : { type: 'literal', value: 0 };
    handleConditionChange({ right: newRight });
  };

  const handleLeftVariableChange = (variableId: string) => {
    handleConditionChange({ left: { type: 'variable', variableId } });
  };

  const handleRightVariableChange = (variableId: string) => {
    handleConditionChange({ right: { type: 'variable', variableId } });
  };

  const handleLeftLiteralChange = (valueStr: string) => {
    const num = parseFloat(valueStr);
    handleConditionChange({
      left: { type: 'literal', value: isNaN(num) ? valueStr : num },
    });
  };

  const handleRightLiteralChange = (valueStr: string) => {
    const num = parseFloat(valueStr);
    handleConditionChange({
      right: { type: 'literal', value: isNaN(num) ? valueStr : num },
    });
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
      <div className="mt-2 space-y-2">
        {/* Left operand */}
        <div className="flex items-center gap-2">
          <Select value={condAction.condition.left.type} onValueChange={handleLeftTypeChange}>
            <SelectTrigger className="w-20" data-testid="left-type-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OPERAND_TYPES.map((ot) => (
                <SelectItem key={ot.value} value={ot.value}>
                  {ot.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {condAction.condition.left.type === 'variable' ? (
            <VariableSelect
              value={condAction.condition.left.variableId}
              variables={leftVariables}
              onValueChange={handleLeftVariableChange}
              testId="left-variable-select"
            />
          ) : (
            <Input
              value={String(condAction.condition.left.value ?? '')}
              onChange={(e) => handleLeftLiteralChange(e.target.value)}
              placeholder="値"
              className="flex-1"
              data-testid="left-literal-input"
            />
          )}
        </div>

        {/* Operator */}
        <div className="flex items-center gap-2">
          <Select
            value={condAction.condition.operator}
            onValueChange={(val) =>
              handleConditionChange({ operator: val as Condition['operator'] })
            }
          >
            <SelectTrigger className="w-20" data-testid="condition-operator-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {operators.map((op) => (
                <SelectItem key={op.value} value={op.value}>
                  {op.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Right operand */}
        <div className="flex items-center gap-2">
          <Select value={condAction.condition.right.type} onValueChange={handleRightTypeChange}>
            <SelectTrigger className="w-20" data-testid="right-type-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OPERAND_TYPES.map((ot) => (
                <SelectItem key={ot.value} value={ot.value}>
                  {ot.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {condAction.condition.right.type === 'variable' ? (
            <VariableSelect
              value={condAction.condition.right.variableId}
              variables={rightVariables}
              onValueChange={handleRightVariableChange}
              testId="right-variable-select"
            />
          ) : (
            <Input
              value={String(condAction.condition.right.value ?? '')}
              onChange={(e) => handleRightLiteralChange(e.target.value)}
              placeholder="値"
              className="flex-1"
              data-testid="right-literal-input"
            />
          )}
        </div>
      </div>

      {/* Type mismatch error */}
      {typeMismatch && (
        <p className="mt-2 text-xs text-destructive" data-testid="type-mismatch-error">
          型が一致しません（左辺: {leftType}、右辺: {rightType}）
        </p>
      )}
      {operatorInvalid && !typeMismatch && (
        <p className="mt-2 text-xs text-destructive" data-testid="operator-invalid-error">
          {resolvedType} 型では演算子 {condAction.condition.operator} は使用できません
        </p>
      )}

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

/** Inline variable select with type labels */
function VariableSelect({
  value,
  variables,
  onValueChange,
  testId,
}: {
  value: string;
  variables: Variable[];
  onValueChange: (id: string) => void;
  testId: string;
}) {
  return variables.length > 0 ? (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="flex-1" data-testid={testId}>
        <SelectValue placeholder="変数を選択..." />
      </SelectTrigger>
      <SelectContent>
        {variables.map((v) => (
          <SelectItem key={v.id} value={v.id}>
            <span className="mr-2 text-xs text-muted-foreground">{v.fieldType.type}</span>
            {v.name || v.id}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  ) : (
    <Select disabled>
      <SelectTrigger className="flex-1" data-testid={testId}>
        <SelectValue placeholder="変数がありません" />
      </SelectTrigger>
      <SelectContent />
    </Select>
  );
}
