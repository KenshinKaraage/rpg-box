'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { NAME_FIELD_ID, type DataType } from '@/types/data';
import type { FieldType } from '@/types/fields/FieldType';
import type { FieldConfigContext } from '@/types/fields/FieldType';
import { createFieldTypeInstance } from '@/types/fields';
import { generateId } from '@/lib/utils';
import { FieldRow } from './FieldRow';

const dataTypeSchema = z.object({
  name: z.string().min(1, 'データ型名は必須です').max(50, '50文字以内で入力してください'),
  description: z.string().max(200, '200文字以内で入力してください').optional(),
});

type DataTypeFormData = z.infer<typeof dataTypeSchema>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFieldType = FieldType<any>;

interface DataTypeEditorProps {
  dataType: DataType | null;
  existingIds: string[];
  onUpdateDataType: (id: string, updates: Partial<DataType>) => void;
  onAddField: (typeId: string, field: AnyFieldType) => void;
  onReplaceField: (typeId: string, fieldId: string, newField: AnyFieldType) => void;
  onDeleteField: (typeId: string, fieldId: string) => void;
  onReorderFields: (typeId: string, fromIndex: number, toIndex: number) => void;
  configContext?: FieldConfigContext;
}

export function DataTypeEditor({
  dataType,
  onUpdateDataType,
  onAddField,
  onReplaceField,
  onDeleteField,
  configContext,
}: DataTypeEditorProps) {
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());

  const defaultValues: DataTypeFormData = dataType
    ? {
        name: dataType.name,
        description: dataType.description ?? '',
      }
    : {
        name: '',
        description: '',
      };

  const {
    register,
    formState: { errors },
  } = useForm<DataTypeFormData>({
    resolver: zodResolver(dataTypeSchema),
    defaultValues,
  });

  if (!dataType) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        データ型を選択してください
      </div>
    );
  }

  const handleAddField = () => {
    const newField = createFieldTypeInstance('number');
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
      {/* データ型基本情報 */}
      <div className="space-y-4 border-b p-4">
        <h3 className="text-sm font-semibold">データ型設定</h3>

        <div className="space-y-2">
          <Label htmlFor="dataTypeId">データ型ID</Label>
          <Input
            id="dataTypeId"
            defaultValue={dataType.id}
            onBlur={(e) => {
              const newId = e.target.value.trim();
              if (newId && newId !== dataType.id) {
                onUpdateDataType(dataType.id, { id: newId } as Partial<DataType>);
              }
            }}
            placeholder="データ型ID"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">データ型名</Label>
          <Input
            id="name"
            {...register('name')}
            onChange={(e) => {
              register('name').onChange(e);
              onUpdateDataType(dataType.id, { name: e.target.value });
            }}
            placeholder="データ型名を入力"
          />
          {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">説明（オプション）</Label>
          <Textarea
            id="description"
            {...register('description')}
            onChange={(e) => {
              register('description').onChange(e);
              onUpdateDataType(dataType.id, { description: e.target.value });
            }}
            placeholder="データ型の説明"
            rows={2}
          />
        </div>
      </div>

      {/* フィールド一覧 */}
      <div className="flex-1 overflow-auto p-4">
        <div className="mb-3 flex items-center justify-between">
          <Label>フィールド一覧</Label>
          <Button size="sm" variant="outline" onClick={handleAddField}>
            <Plus className="mr-1 h-4 w-4" />
            フィールド追加
          </Button>
        </div>

        {dataType.fields.length === 0 ? (
          <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
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
                configContext={configContext}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
