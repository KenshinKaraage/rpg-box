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
import type { CustomClass } from '@/types/customClass';

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

interface ResolvedType {
  type: string;
  classId?: string;
}

/** Extract classId from a variable's fieldType */
function getClassId(variable: Variable): string | undefined {
  return 'classId' in variable.fieldType
    ? (variable.fieldType as { classId: string }).classId
    : undefined;
}

/** Resolve the field type and optional classId of the value source */
function resolveValueSourceType(
  value: ValueSource,
  variables: Variable[],
  dataTypeFields: { id: string; type: string; classId?: string }[],
  classSubFields: { id: string; type: string }[]
): ResolvedType | null {
  switch (value.type) {
    case 'literal': {
      const v = value.value;
      if (typeof v === 'number') return { type: 'number' };
      if (typeof v === 'string') return { type: 'string' };
      if (typeof v === 'boolean') return { type: 'boolean' };
      return null;
    }
    case 'variable': {
      if (!value.variableId) return null;
      const variable = variables.find((v) => v.id === value.variableId);
      if (!variable) return null;
      return { type: variable.fieldType.type, classId: getClassId(variable) };
    }
    case 'data': {
      if (!value.fieldId) return null;
      const field = dataTypeFields.find((f) => f.id === value.fieldId);
      if (!field) return null;
      if (field.type === 'class') {
        if (!value.subFieldId) return field.classId ? null : { type: 'class' };
        const subField = classSubFields.find((sf) => sf.id === value.subFieldId);
        return subField ? { type: subField.type } : null;
      }
      return { type: field.type, classId: field.classId };
    }
    case 'random':
      return { type: 'number' };
  }
}

/** Check type mismatch including classId for class types */
function isTypeMismatch(target: ResolvedType | null, source: ResolvedType | null): boolean {
  if (!target || !source) return false;
  if (target.type !== source.type) return true;
  if (target.type === 'class' && target.classId && source.classId) {
    return target.classId !== source.classId;
  }
  return false;
}

/** Format type label for display (e.g. "class(ステータス)") */
function formatTypeLabel(
  type: string,
  classId: string | undefined,
  classes: CustomClass[]
): string {
  if (type === 'class' && classId) {
    const cls = classes.find((c) => c.id === classId);
    return cls ? `class(${cls.name})` : `class(${classId})`;
  }
  return type;
}

export function VariableOpActionBlock({ action, onChange, onDelete }: ActionBlockProps) {
  const varAction = action as VariableOpAction;
  const variables = useStore((state) => state.variables);
  const dataTypes = useStore((state) => state.dataTypes);
  const dataEntries = useStore((state) => state.dataEntries);
  const classes = useStore((state) => state.classes);

  // Target variable type (with classId)
  const targetVariable = variables.find((v) => v.id === varAction.variableId);
  const targetType = targetVariable?.fieldType.type ?? null;
  const targetClassId = targetVariable ? getClassId(targetVariable) : undefined;
  const targetResolved: ResolvedType | null = targetType
    ? { type: targetType, classId: targetClassId }
    : null;

  // Data source fields (for type resolution) — include classId for class fields
  const dataTypeIdForLookup = varAction.value.type === 'data' ? varAction.value.dataTypeId : '';
  const currentDataType = dataTypes.find((dt) => dt.id === dataTypeIdForLookup);
  const currentDataEntries = dataTypeIdForLookup ? (dataEntries[dataTypeIdForLookup] ?? []) : [];
  const dataTypeFields = useMemo(
    () =>
      (currentDataType?.fields ?? []).map((f) => ({
        id: f.id,
        name: f.name,
        type: f.type,
        classId: 'classId' in f ? (f as { classId: string }).classId : undefined,
      })),
    [currentDataType]
  );

  // Selected data field & class sub-fields
  const selectedDataFieldId = varAction.value.type === 'data' ? varAction.value.fieldId : '';
  const selectedDataField = dataTypeFields.find((f) => f.id === selectedDataFieldId);
  const selectedClass: CustomClass | undefined = selectedDataField?.classId
    ? classes.find((c) => c.id === selectedDataField.classId)
    : undefined;
  const classSubFields = useMemo(
    () => (selectedClass?.fields ?? []).map((f) => ({ id: f.id, name: f.name, type: f.type })),
    [selectedClass]
  );

  // Whether to show sub-field selector: class field selected AND target is NOT class
  const needsSubField = !!selectedClass && targetType !== 'class';

  // Value source type
  const valueSourceType = resolveValueSourceType(
    varAction.value,
    variables,
    dataTypeFields,
    classSubFields
  );

  // Type mismatch detection (including classId comparison)
  const typeMismatch = isTypeMismatch(targetResolved, valueSourceType);

  // Filter value-source variables to match target type (and classId for class types)
  const filteredVariables = useMemo(() => {
    if (!targetType) return variables;
    return variables.filter((v) => {
      if (v.fieldType.type !== targetType) return false;
      if (targetType === 'class' && targetClassId) {
        return getClassId(v) === targetClassId;
      }
      return true;
    });
  }, [variables, targetType, targetClassId]);

  // Filter data fields to match target type (and classId for class types)
  const filteredDataFields = useMemo(() => {
    if (!targetType) return dataTypeFields;
    return dataTypeFields.filter((f) => {
      if (f.type === targetType) {
        // For class types, also match classId
        if (targetType === 'class' && targetClassId && f.classId) {
          return f.classId === targetClassId;
        }
        return true;
      }
      // Show class fields if they contain sub-fields matching the target type
      if (f.classId) {
        const cls = classes.find((c) => c.id === f.classId);
        return cls?.fields.some((sf) => sf.type === targetType) ?? false;
      }
      return false;
    });
  }, [dataTypeFields, targetType, targetClassId, classes]);

  // Filter sub-fields to match target type
  const filteredSubFields = useMemo(() => {
    if (!targetType) return classSubFields;
    return classSubFields.filter((f) => f.type === targetType);
  }, [classSubFields, targetType]);

  // Whether the target variable is an array
  const isTargetArray = targetVariable?.isArray ?? false;

  // Number variables for array index selection
  const numberVariables = useMemo(
    () => variables.filter((v) => v.fieldType.type === 'number' && !v.isArray),
    [variables]
  );

  const handleVariableIdChange = (variableId: string) => {
    const updated = cloneAction(varAction);
    updated.variableId = variableId;
    // Reset arrayIndex when switching to a non-array variable
    const newVar = variables.find((v) => v.id === variableId);
    if (!newVar?.isArray) {
      updated.arrayIndex = undefined;
    } else if (!varAction.arrayIndex) {
      // Initialize arrayIndex when switching to an array variable
      updated.arrayIndex = { type: 'literal', value: 0 };
    }
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
        // Reset subFieldId when field changes
      };
    }
    onChange(updated);
  };

  const handleSubFieldChange = (subFieldId: string) => {
    const updated = cloneAction(varAction);
    if (varAction.value.type === 'data') {
      updated.value = { ...varAction.value, subFieldId };
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

  const handleArrayIndexTypeChange = (indexType: string) => {
    const updated = cloneAction(varAction);
    updated.arrayIndex =
      indexType === 'literal'
        ? { type: 'literal', value: 0 }
        : { type: 'variable', variableId: '' };
    onChange(updated);
  };

  const handleArrayIndexLiteralChange = (valueStr: string) => {
    const num = parseInt(valueStr, 10);
    const updated = cloneAction(varAction);
    updated.arrayIndex = { type: 'literal', value: isNaN(num) ? 0 : num };
    onChange(updated);
  };

  const handleArrayIndexVariableChange = (variableId: string) => {
    const updated = cloneAction(varAction);
    updated.arrayIndex = { type: 'variable', variableId };
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
            classes={classes}
          />
        </div>

        {/* Array Index (shown only for array variables) */}
        {isTargetArray && varAction.arrayIndex && (
          <div className="flex items-center gap-2">
            <Label className="w-16 text-xs text-muted-foreground">添字</Label>
            <Select value={varAction.arrayIndex.type} onValueChange={handleArrayIndexTypeChange}>
              <SelectTrigger className="w-20" data-testid="array-index-type-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="literal">直値</SelectItem>
                <SelectItem value="variable">変数</SelectItem>
              </SelectContent>
            </Select>
            {varAction.arrayIndex.type === 'literal' && (
              <Input
                type="number"
                value={String(varAction.arrayIndex.value)}
                onChange={(e) => handleArrayIndexLiteralChange(e.target.value)}
                className="w-20"
                min={0}
                data-testid="array-index-input"
              />
            )}
            {varAction.arrayIndex.type === 'variable' && (
              <VariableSelect
                value={varAction.arrayIndex.variableId}
                variables={numberVariables}
                onValueChange={handleArrayIndexVariableChange}
                testId="array-index-variable-select"
              />
            )}
          </div>
        )}

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
              classes={classes}
              emptyPlaceholder="一致する型の変数がありません"
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
              {filteredDataFields.length > 0 ? (
                <Select value={varAction.value.fieldId} onValueChange={handleDataFieldChange}>
                  <SelectTrigger className="flex-1" data-testid="value-data-field-select">
                    <SelectValue placeholder="フィールドを選択..." />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredDataFields.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        <span className="mr-2 text-xs text-muted-foreground">
                          {formatTypeLabel(f.type, f.classId, classes)}
                        </span>
                        {f.name || f.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Select disabled>
                  <SelectTrigger className="flex-1" data-testid="value-data-field-select">
                    <SelectValue placeholder="一致する型のフィールドがありません" />
                  </SelectTrigger>
                  <SelectContent />
                </Select>
              )}
            </div>
            {needsSubField && !typeMismatch && (
              <div className="flex items-center gap-2">
                <Label className="w-20 text-xs text-muted-foreground">サブフィールド</Label>
                {filteredSubFields.length > 0 ? (
                  <Select
                    value={
                      varAction.value.type === 'data' ? (varAction.value.subFieldId ?? '') : ''
                    }
                    onValueChange={handleSubFieldChange}
                  >
                    <SelectTrigger className="flex-1" data-testid="value-data-subfield-select">
                      <SelectValue placeholder="サブフィールドを選択..." />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredSubFields.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          <span className="mr-2 text-xs text-muted-foreground">{f.type}</span>
                          {f.name || f.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Select disabled>
                    <SelectTrigger className="flex-1" data-testid="value-data-subfield-select">
                      <SelectValue placeholder="一致する型のサブフィールドがありません" />
                    </SelectTrigger>
                    <SelectContent />
                  </Select>
                )}
              </div>
            )}
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
          型が一致しません（変数:{' '}
          {formatTypeLabel(targetResolved!.type, targetResolved!.classId, classes)}
          、値: {formatTypeLabel(valueSourceType!.type, valueSourceType!.classId, classes)}）
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
  classes = [],
  emptyPlaceholder,
}: {
  value: string;
  variables: Variable[];
  onValueChange: (id: string) => void;
  testId: string;
  classes?: CustomClass[];
  emptyPlaceholder?: string;
}) {
  const placeholder = emptyPlaceholder ?? '変数がありません';
  return variables.length > 0 ? (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="flex-1" data-testid={testId}>
        <SelectValue placeholder="変数を選択..." />
      </SelectTrigger>
      <SelectContent>
        {variables.map((v) => (
          <SelectItem key={v.id} value={v.id}>
            <span className="mr-2 text-xs text-muted-foreground">
              {formatTypeLabel(v.fieldType.type, getClassId(v), classes)}
              {v.isArray && '[]'}
            </span>
            {v.name || v.id}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  ) : (
    <Select disabled>
      <SelectTrigger className="flex-1" data-testid={testId}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent />
    </Select>
  );
}
