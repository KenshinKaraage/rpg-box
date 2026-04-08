'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { CustomClass } from '@/types/customClass';
import type { FieldType } from '@/types/fields/FieldType';
import type { FieldConfigContext } from '@/types/fields/FieldType';
import { createFieldTypeInstance } from '@/types/fields';
import { generateId } from '@/lib/utils';
import { FieldRow } from './FieldRow';

const classSchema = z.object({
  name: z.string().min(1, 'クラス名は必須です').max(50, '50文字以内で入力してください'),
  description: z.string().max(200, '200文字以内で入力してください').optional(),
});

type ClassFormData = z.infer<typeof classSchema>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFieldType = FieldType<any>;

interface ClassEditorProps {
  customClass: CustomClass | null;
  onUpdateClass: (id: string, updates: Partial<CustomClass>) => void;
  onAddField: (classId: string, field: AnyFieldType) => void;
  onReplaceField: (classId: string, fieldId: string, newField: AnyFieldType) => void;
  onDeleteField: (classId: string, fieldId: string) => void;
  onReorderFields: (classId: string, fromIndex: number, toIndex: number) => void;
  configContext?: FieldConfigContext;
}

export function ClassEditor({
  customClass,
  onUpdateClass,
  onAddField,
  onReplaceField,
  onDeleteField,
  configContext,
}: ClassEditorProps) {
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());

  const enrichedContext = useMemo<FieldConfigContext | undefined>(() => {
    if (!customClass) return configContext;
    const allFields = customClass.fields.map((f) => ({ id: f.id, name: f.name }));
    return configContext ? { ...configContext, allFields } : { allFields };
  }, [configContext, customClass]);

  const defaultValues: ClassFormData = customClass
    ? {
        name: customClass.name,
        description: customClass.description ?? '',
      }
    : {
        name: '',
        description: '',
      };

  const {
    register,
    formState: { errors },
  } = useForm<ClassFormData>({
    resolver: zodResolver(classSchema),
    defaultValues,
  });

  if (!customClass) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        クラスを選択してください
      </div>
    );
  }

  const handleAddField = () => {
    const newField = createFieldTypeInstance('number');
    if (!newField) return;
    newField.id = generateId(
      'field',
      customClass.fields.map((f) => f.id)
    );
    newField.name = '新しいフィールド';
    onAddField(customClass.id, newField);
  };

  const handleFieldIdChange = (fieldId: string, newId: string) => {
    const field = customClass.fields.find((f) => f.id === fieldId);
    if (!field) return;
    const newField = createFieldTypeInstance(field.type);
    if (!newField) return;
    Object.assign(newField, field, { id: newId });
    onReplaceField(customClass.id, fieldId, newField);
  };

  const handleFieldNameChange = (fieldId: string, name: string) => {
    const field = customClass.fields.find((f) => f.id === fieldId);
    if (!field) return;
    const newField = createFieldTypeInstance(field.type);
    if (!newField) return;
    Object.assign(newField, field, { name });
    onReplaceField(customClass.id, fieldId, newField);
  };

  const handleFieldTypeChange = (fieldId: string, type: string) => {
    const field = customClass.fields.find((f) => f.id === fieldId);
    if (!field) return;
    const newField = createFieldTypeInstance(type);
    if (!newField) return;
    newField.id = field.id;
    newField.name = field.name;
    onReplaceField(customClass.id, fieldId, newField);
  };

  const handleConfigChange = (fieldId: string, updates: Record<string, unknown>) => {
    const field = customClass.fields.find((f) => f.id === fieldId);
    if (!field) return;
    const newField = createFieldTypeInstance(field.type);
    if (!newField) return;
    Object.assign(newField, field, updates);
    onReplaceField(customClass.id, fieldId, newField);

    // visibilityMap 変更時に兄弟フィールドの displayCondition を同期
    if ('visibilityMap' in updates) {
      const vMap = updates.visibilityMap as Record<string, string[]> | undefined;
      for (const sibling of customClass.fields) {
        if (sibling.id === fieldId) continue;
        let newCondition: { fieldId: string; value: unknown } | undefined;
        if (vMap) {
          for (const [optValue, fieldIds] of Object.entries(vMap)) {
            if (fieldIds.includes(sibling.id)) {
              newCondition = { fieldId, value: optValue };
              break;
            }
          }
        }
        const current = sibling.displayCondition;
        const same =
          current?.fieldId === newCondition?.fieldId && current?.value === newCondition?.value;
        if (!same) {
          const updatedSibling = createFieldTypeInstance(sibling.type);
          if (!updatedSibling) continue;
          Object.assign(updatedSibling, sibling, { displayCondition: newCondition });
          onReplaceField(customClass.id, sibling.id, updatedSibling);
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
      {/* クラス基本情報 */}
      <div className="space-y-4 border-b p-4">
        <div className="space-y-2">
          <Label htmlFor="classId">クラスID</Label>
          <Input
            id="classId"
            defaultValue={customClass.id}
            onBlur={(e) => {
              const newId = e.target.value.trim();
              if (newId && newId !== customClass.id) {
                onUpdateClass(customClass.id, { id: newId } as Partial<CustomClass>);
              }
            }}
            placeholder="クラスID"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">クラス名</Label>
          <Input
            id="name"
            {...register('name')}
            onChange={(e) => {
              register('name').onChange(e);
              onUpdateClass(customClass.id, { name: e.target.value });
            }}
            placeholder="クラス名を入力"
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
              onUpdateClass(customClass.id, { description: e.target.value });
            }}
            placeholder="クラスの説明"
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

        {customClass.fields.length === 0 ? (
          <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
            フィールドがありません
          </div>
        ) : (
          <div className="space-y-2">
            {customClass.fields.map((field) => (
              <FieldRow
                key={field.id}
                field={field}
                isExpanded={expandedFields.has(field.id)}
                onToggleExpand={() => toggleExpand(field.id)}
                onIdChange={(newId) => handleFieldIdChange(field.id, newId)}
                onNameChange={(name) => handleFieldNameChange(field.id, name)}
                onTypeChange={(type) => handleFieldTypeChange(field.id, type)}
                onConfigChange={(updates) => handleConfigChange(field.id, updates)}
                onDelete={() => onDeleteField(customClass.id, field.id)}
                configContext={enrichedContext}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
