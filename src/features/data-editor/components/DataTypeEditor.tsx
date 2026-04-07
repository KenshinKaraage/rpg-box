'use client';

import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NAME_FIELD_ID, type DataType } from '@/types/data';
import type { FieldType } from '@/types/fields/FieldType';
import type { FieldConfigContext } from '@/types/fields/FieldType';
import { createFieldTypeInstance } from '@/types/fields';
import { generateId } from '@/lib/utils';
import { FieldRow } from './FieldRow';
import { FieldTypeSelector } from './FieldTypeSelector';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFieldType = FieldType<any>;

interface DataTypeEditorProps {
  dataType: DataType;
  onAddField: (typeId: string, field: AnyFieldType) => void;
  onReplaceField: (typeId: string, fieldId: string, newField: AnyFieldType) => void;
  onDeleteField: (typeId: string, fieldId: string) => void;
  configContext?: FieldConfigContext;
}

export function DataTypeEditor({
  dataType,
  onAddField,
  onReplaceField,
  onDeleteField,
  configContext,
}: DataTypeEditorProps) {
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());
  const [fieldSelectorOpen, setFieldSelectorOpen] = useState(false);

  // configContext に allFields を追加（各フィールドの renderConfig で利用）
  const enrichedContext = useMemo<FieldConfigContext | undefined>(() => {
    const allFields = dataType.fields.map((f) => ({ id: f.id, name: f.name }));
    return configContext ? { ...configContext, allFields } : { allFields };
  }, [configContext, dataType.fields]);

  const handleAddField = (type: string) => {
    const newField = createFieldTypeInstance(type);
    if (!newField) return;
    newField.id = generateId(
      'field',
      dataType.fields.map((f) => f.id)
    );
    newField.name = '新しいフィールド';
    onAddField(dataType.id, newField);
  };

  const handleFieldIdChange = (fieldId: string, newId: string) => {
    const field = dataType.fields.find((f) => f.id === fieldId);
    if (!field) return;
    const newField = createFieldTypeInstance(field.type);
    if (!newField) return;
    Object.assign(newField, field, { id: newId });
    onReplaceField(dataType.id, fieldId, newField);
  };

  const handleFieldNameChange = (fieldId: string, name: string) => {
    const field = dataType.fields.find((f) => f.id === fieldId);
    if (!field) return;
    const newField = createFieldTypeInstance(field.type);
    if (!newField) return;
    Object.assign(newField, field, { name });
    onReplaceField(dataType.id, fieldId, newField);
  };

  const handleFieldTypeChange = (fieldId: string, type: string) => {
    const field = dataType.fields.find((f) => f.id === fieldId);
    if (!field) return;
    const newField = createFieldTypeInstance(type);
    if (!newField) return;
    newField.id = field.id;
    newField.name = field.name;
    onReplaceField(dataType.id, fieldId, newField);
  };

  const handleConfigChange = (fieldId: string, updates: Record<string, unknown>) => {
    const field = dataType.fields.find((f) => f.id === fieldId);
    if (!field) return;
    const newField = createFieldTypeInstance(field.type);
    if (!newField) return;
    Object.assign(newField, field, updates);
    onReplaceField(dataType.id, fieldId, newField);

    // visibilityMap が変更された場合、他フィールドの displayCondition を同期
    if ('visibilityMap' in updates) {
      const vMap = updates.visibilityMap as Record<string, string[]> | undefined;
      for (const sibling of dataType.fields) {
        if (sibling.id === fieldId) continue;
        // この select フィールドの visibilityMap に含まれるか探す
        let newCondition: { fieldId: string; value: unknown } | undefined;
        if (vMap) {
          for (const [optValue, fieldIds] of Object.entries(vMap)) {
            if (fieldIds.includes(sibling.id)) {
              newCondition = { fieldId, value: optValue };
              break;
            }
          }
        }
        // 現在の displayCondition と異なる場合のみ更新
        const current = sibling.displayCondition;
        const same =
          current?.fieldId === newCondition?.fieldId && current?.value === newCondition?.value;
        if (!same) {
          const updatedSibling = createFieldTypeInstance(sibling.type);
          if (!updatedSibling) continue;
          Object.assign(updatedSibling, sibling, { displayCondition: newCondition });
          onReplaceField(dataType.id, sibling.id, updatedSibling);
        }
      }
    }
  };

  const toggleExpand = (fieldId: string) => {
    setExpandedFields((prev) => {
      const next = new Set(prev);
      if (next.has(fieldId)) {
        next.delete(fieldId);
      } else {
        next.add(fieldId);
      }
      return next;
    });
  };

  return (
    <div className="flex h-full flex-col">
      {/* ヘッダー */}
      <div className="border-b px-5 py-4">
        <h3 className="text-sm font-bold">フィールド編集</h3>
      </div>

      {/* フィールド一覧 */}
      <div className="flex-1 overflow-auto p-3">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-bold">フィールド一覧</h3>
          <Button
            size="sm"
            variant="outline"
            className="border-primary text-primary"
            onClick={() => setFieldSelectorOpen(true)}
          >
            <Plus className="mr-1 h-4 w-4" />
            追加
          </Button>
        </div>

        {dataType.fields.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed p-6 text-center text-sm text-muted-foreground">
            フィールドがありません
          </div>
        ) : (
          <div className="space-y-2">
            {dataType.fields.map((field) => (
              <FieldRow
                key={field.id}
                field={field}
                isExpanded={expandedFields.has(field.id)}
                onToggleExpand={() => toggleExpand(field.id)}
                onIdChange={(newId) => handleFieldIdChange(field.id, newId)}
                onNameChange={(name) => handleFieldNameChange(field.id, name)}
                onTypeChange={(type) => handleFieldTypeChange(field.id, type)}
                onConfigChange={(updates) => handleConfigChange(field.id, updates)}
                onDelete={() => onDeleteField(dataType.id, field.id)}
                undeletable={field.id === NAME_FIELD_ID}
                configContext={enrichedContext}
              />
            ))}
          </div>
        )}
      </div>

      <FieldTypeSelector
        open={fieldSelectorOpen}
        onOpenChange={setFieldSelectorOpen}
        onSelect={handleAddField}
      />
    </div>
  );
}
