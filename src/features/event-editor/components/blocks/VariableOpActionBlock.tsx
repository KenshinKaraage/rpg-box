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
import type { VariableOpAction } from '@/engine/actions/VariableOpAction';
import type { ValueSource } from '@/engine/values/types';

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

export function VariableOpActionBlock({ action, onChange, onDelete }: ActionBlockProps) {
  const varAction = action as VariableOpAction;
  const variables = useStore((state) => state.variables);
  const dataTypes = useStore((state) => state.dataTypes);
  const dataEntries = useStore((state) => state.dataEntries);

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

  // Get data type fields and entries for the data source sub-editor
  const dataTypeIdForLookup = varAction.value.type === 'data' ? varAction.value.dataTypeId : '';
  const currentDataType = dataTypes.find((dt) => dt.id === dataTypeIdForLookup);
  const currentDataEntries = dataTypeIdForLookup ? (dataEntries[dataTypeIdForLookup] ?? []) : [];

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
          {variables.length > 0 ? (
            <Select value={varAction.variableId} onValueChange={handleVariableIdChange}>
              <SelectTrigger className="flex-1" data-testid="variable-id-select">
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
          ) : (
            <Select disabled>
              <SelectTrigger className="flex-1" data-testid="variable-id-select">
                <SelectValue placeholder="変数を選択..." />
              </SelectTrigger>
              <SelectContent />
            </Select>
          )}
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
            {variables.length > 0 ? (
              <Select value={varAction.value.variableId} onValueChange={handleVariableValueChange}>
                <SelectTrigger className="flex-1" data-testid="value-variable-select">
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
            ) : (
              <Select disabled>
                <SelectTrigger className="flex-1" data-testid="value-variable-select">
                  <SelectValue placeholder="変数を選択..." />
                </SelectTrigger>
                <SelectContent />
              </Select>
            )}
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
                  {currentDataType?.fields.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
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
    </div>
  );
}
