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
import type { VariableOpAction } from '@/engine/actions/VariableOpAction';
import type { ValueSource } from '@/engine/values/types';
import type { Variable } from '@/types/variable';

const OPERATIONS = [
  { value: 'set', label: '代入' },
  { value: 'add', label: '加算' },
  { value: 'subtract', label: '減算' },
  { value: 'multiply', label: '乗算' },
  { value: 'divide', label: '除算' },
] as const;

const VALUE_SOURCE_TYPES = [
  { value: 'literal', label: '直値' },
  { value: 'variable', label: '変数' },
  { value: 'data', label: 'データ参照' },
  { value: 'random', label: 'ランダム' },
] as const;

function cloneAction(action: VariableOpAction): VariableOpAction {
  return Object.assign(Object.create(Object.getPrototypeOf(action)), action);
}

function createDefaultValueSource(type: ValueSource['type']): ValueSource {
  switch (type) {
    case 'literal':
      return { type: 'literal', value: 0 };
    case 'variable':
      return { type: 'variable', variableId: '' };
    case 'data':
      return { type: 'data', dataTypeId: '', entryId: '', fieldId: '' };
    case 'random':
      return { type: 'random', min: 0, max: 100 };
  }
}

/** Resolve the field type string of the value source */
function resolveValueSourceType(
  value: ValueSource,
  variables: Variable[],
  dataTypeFields: { id: string; type: string }[]
): string | null {
  switch (value.type) {
    case 'literal': {
      const v = value.value;
      if (typeof v === 'number') return 'number';
      if (typeof v === 'string') return 'string';
      if (typeof v === 'boolean') return 'boolean';
      return null;
    }
    case 'variable': {
      if (!value.variableId) return null;
      const variable = variables.find((v) => v.id === value.variableId);
      return variable?.fieldType.type ?? null;
    }
    case 'data': {
      if (!value.fieldId) return null;
      const field = dataTypeFields.find((f) => f.id === value.fieldId);
      return field?.type ?? null;
    }
    case 'random':
      return 'number';
  }
}

export function VariableOpActionBlock({ action, onChange, onDelete }: ActionBlockProps) {
  const varAction = action as VariableOpAction;
  const variables = useStore((state) => state.variables);
  const dataTypes = useStore((state) => state.dataTypes);
  const dataEntries = useStore((state) => state.dataEntries);

  // Target variable type
  const targetVariable = variables.find((v) => v.id === varAction.variableId);
  const targetType = targetVariable?.fieldType.type ?? null;

  // Data source fields (for type resolution)
  const dataTypeIdForLookup = varAction.value.type === 'data' ? varAction.value.dataTypeId : '';
  const currentDataType = dataTypes.find((dt) => dt.id === dataTypeIdForLookup);
  const currentDataEntries = dataTypeIdForLookup ? (dataEntries[dataTypeIdForLookup] ?? []) : [];
  const dataTypeFields = useMemo(
    () => (currentDataType?.fields ?? []).map((f) => ({ id: f.id, name: f.name, type: f.type })),
    [currentDataType]
  );

  // Value source type
  const valueSourceType = resolveValueSourceType(varAction.value, variables, dataTypeFields);

  // Type mismatch detection
  const typeMismatch = targetType && valueSourceType && targetType !== valueSourceType;

  // Filter value-source variables to match target type
  const filteredVariables = useMemo(() => {
    if (!targetType) return variables;
    return variables.filter((v) => v.fieldType.type === targetType);
  }, [variables, targetType]);

  // Filter data fields to match target type
  const filteredDataFields = useMemo(() => {
    if (!targetType) return dataTypeFields;
    return dataTypeFields.filter((f) => f.type === targetType);
  }, [dataTypeFields, targetType]);

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

  const handleValueSourceTypeChange = (sourceType: string) => {
    const updated = cloneAction(varAction);
    updated.value = createDefaultValueSource(sourceType as ValueSource['type']);
    onChange(updated);
  };

  const handleLiteralValueChange = (valueStr: string) => {
    const num = parseFloat(valueStr);
    const updated = cloneAction(varAction);
    updated.value = { type: 'literal', value: isNaN(num) ? valueStr : num };
    onChange(updated);
  };

  const handleVariableValueChange = (variableId: string) => {
    const updated = cloneAction(varAction);
    updated.value = { type: 'variable', variableId };
    onChange(updated);
  };

  const handleDataTypeChange = (dataTypeId: string) => {
    const updated = cloneAction(varAction);
    updated.value = { type: 'data', dataTypeId, entryId: '', fieldId: '' };
    onChange(updated);
  };

  const handleDataEntryChange = (entryId: string) => {
    const updated = cloneAction(varAction);
    if (varAction.value.type === 'data') {
      updated.value = {
        type: 'data',
        dataTypeId: varAction.value.dataTypeId,
        entryId,
        fieldId: varAction.value.fieldId,
      };
    }
    onChange(updated);
  };

  const handleDataFieldChange = (fieldId: string) => {
    const updated = cloneAction(varAction);
    if (varAction.value.type === 'data') {
      updated.value = {
        type: 'data',
        dataTypeId: varAction.value.dataTypeId,
        entryId: varAction.value.entryId,
        fieldId,
      };
    }
    onChange(updated);
  };

  const handleRandomMinChange = (minStr: string) => {
    const min = parseFloat(minStr);
    const updated = cloneAction(varAction);
    if (varAction.value.type === 'random') {
      updated.value = { type: 'random', min: isNaN(min) ? 0 : min, max: varAction.value.max };
    }
    onChange(updated);
  };

  const handleRandomMaxChange = (maxStr: string) => {
    const max = parseFloat(maxStr);
    const updated = cloneAction(varAction);
    if (varAction.value.type === 'random') {
      updated.value = { type: 'random', min: varAction.value.min, max: isNaN(max) ? 0 : max };
    }
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
        {/* Variable ID Select */}
        <div className="flex items-center gap-2">
          <Label className="w-16 text-xs text-muted-foreground">変数</Label>
          <VariableSelect
            value={varAction.variableId}
            variables={variables}
            onValueChange={handleVariableIdChange}
            testId="variable-id-select"
          />
        </div>

        {/* Operation Select */}
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

        {/* Value Source Type Select */}
        <div className="flex items-center gap-2">
          <Label className="w-16 text-xs text-muted-foreground">値</Label>
          <Select value={varAction.value.type} onValueChange={handleValueSourceTypeChange}>
            <SelectTrigger className="w-32" data-testid="value-source-type-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VALUE_SOURCE_TYPES.map((vst) => (
                <SelectItem key={vst.value} value={vst.value}>
                  {vst.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Value Source Sub-Editor */}
        {varAction.value.type === 'literal' && (
          <div className="flex items-center gap-2 pl-18">
            <Input
              value={literalValue}
              onChange={(e) => handleLiteralValueChange(e.target.value)}
              placeholder="値"
              className="flex-1"
              data-testid="value-input"
            />
          </div>
        )}

        {varAction.value.type === 'variable' && (
          <div className="flex items-center gap-2 pl-18">
            <VariableSelect
              value={varAction.value.variableId}
              variables={filteredVariables}
              onValueChange={handleVariableValueChange}
              testId="value-variable-select"
            />
          </div>
        )}

        {varAction.value.type === 'data' && (
          <div className="space-y-2 pl-18">
            <div className="flex items-center gap-2">
              <Label className="w-20 text-xs text-muted-foreground">データ型</Label>
              <Select value={varAction.value.dataTypeId} onValueChange={handleDataTypeChange}>
                <SelectTrigger className="flex-1" data-testid="value-data-type-select">
                  <SelectValue placeholder="データ型を選択..." />
                </SelectTrigger>
                <SelectContent>
                  {dataTypes.map((dt) => (
                    <SelectItem key={dt.id} value={dt.id}>
                      {dt.name || dt.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-20 text-xs text-muted-foreground">エントリ</Label>
              <Select value={varAction.value.entryId} onValueChange={handleDataEntryChange}>
                <SelectTrigger className="flex-1" data-testid="value-data-entry-select">
                  <SelectValue placeholder="エントリを選択..." />
                </SelectTrigger>
                <SelectContent>
                  {currentDataEntries.map((entry) => (
                    <SelectItem key={entry.id} value={entry.id}>
                      {(entry.values['name'] as string) || entry.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-20 text-xs text-muted-foreground">フィールド</Label>
              <Select value={varAction.value.fieldId} onValueChange={handleDataFieldChange}>
                <SelectTrigger className="flex-1" data-testid="value-data-field-select">
                  <SelectValue placeholder="フィールドを選択..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredDataFields.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      <span className="mr-2 text-xs text-muted-foreground">{f.type}</span>
                      {f.name || f.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {varAction.value.type === 'random' && (
          <div className="flex items-center gap-2 pl-18">
            <Label className="text-xs text-muted-foreground">最小</Label>
            <Input
              type="number"
              value={String(varAction.value.min)}
              onChange={(e) => handleRandomMinChange(e.target.value)}
              className="w-20"
              data-testid="value-random-min"
            />
            <Label className="text-xs text-muted-foreground">最大</Label>
            <Input
              type="number"
              value={String(varAction.value.max)}
              onChange={(e) => handleRandomMaxChange(e.target.value)}
              className="w-20"
              data-testid="value-random-max"
            />
          </div>
        )}
      </div>

      {/* Type mismatch error */}
      {typeMismatch && (
        <p className="mt-2 text-xs text-destructive" data-testid="type-mismatch-error">
          型が一致しません（変数: {targetType}、値: {valueSourceType}）
        </p>
      )}
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
