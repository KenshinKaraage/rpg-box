'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { FieldSet } from '@/types/fieldSet';
import { createFieldTypeInstance, getFieldTypeOptions } from '@/types/fields';

/**
 * フィールドセット名バリデーションスキーマ
 */
const fieldSetSchema = z.object({
  name: z.string().min(1, 'フィールドセット名は必須です').max(50, '50文字以内で入力してください'),
  description: z.string().max(200, '200文字以内で入力してください').optional(),
});

type FieldSetFormData = z.infer<typeof fieldSetSchema>;

interface FieldSetEditorProps {
  fieldSet: FieldSet | null;
  onUpdate: (id: string, updates: Partial<FieldSet>) => void;
}

/**
 * フィールドセットエディタコンポーネント
 */
export function FieldSetEditor({ fieldSet, onUpdate }: FieldSetEditorProps) {
  const defaultValues: FieldSetFormData = fieldSet
    ? {
        name: fieldSet.name,
        description: fieldSet.description ?? '',
      }
    : {
        name: '',
        description: '',
      };

  const {
    register,
    formState: { errors },
  } = useForm<FieldSetFormData>({
    resolver: zodResolver(fieldSetSchema),
    defaultValues,
  });

  if (!fieldSet) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        フィールドセットを選択してください
      </div>
    );
  }

  const handleAddField = () => {
    const newField = createFieldTypeInstance('number');
    if (!newField) return;
    newField.id = `field_${Date.now()}`;
    newField.name = '新しいフィールド';
    onUpdate(fieldSet.id, { fields: [...fieldSet.fields, newField] });
  };

  const handleDeleteField = (fieldId: string) => {
    onUpdate(fieldSet.id, {
      fields: fieldSet.fields.filter((f) => f.id !== fieldId),
    });
  };

  const handleFieldNameChange = (fieldId: string, name: string) => {
    const updatedFields = fieldSet.fields.map((f) => {
      if (f.id === fieldId) {
        f.name = name;
      }
      return f;
    });
    onUpdate(fieldSet.id, { fields: updatedFields });
  };

  const handleFieldTypeChange = (fieldId: string, type: string) => {
    const updatedFields = fieldSet.fields.map((f) => {
      if (f.id === fieldId) {
        const newField = createFieldTypeInstance(type);
        if (!newField) return f;
        newField.id = f.id;
        newField.name = f.name;
        newField.required = f.required;
        return newField;
      }
      return f;
    });
    onUpdate(fieldSet.id, { fields: updatedFields });
  };

  return (
    <div className="flex h-full flex-col">
      {/* 基本情報 */}
      <div className="space-y-4 border-b p-4">
        {/* フィールドセットID（読み取り専用） */}
        <div className="space-y-2">
          <Label>フィールドセットID</Label>
          <Input value={fieldSet.id} disabled className="bg-muted" />
        </div>

        {/* フィールドセット名 */}
        <div className="space-y-2">
          <Label htmlFor="name">フィールドセット名</Label>
          <Input
            id="name"
            {...register('name')}
            onChange={(e) => {
              register('name').onChange(e);
              onUpdate(fieldSet.id, { name: e.target.value });
            }}
            placeholder="フィールドセット名を入力"
          />
          {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
        </div>

        {/* 説明 */}
        <div className="space-y-2">
          <Label htmlFor="description">説明（オプション）</Label>
          <Textarea
            id="description"
            {...register('description')}
            onChange={(e) => {
              register('description').onChange(e);
              onUpdate(fieldSet.id, { description: e.target.value });
            }}
            placeholder="フィールドセットの説明"
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

        {fieldSet.fields.length === 0 ? (
          <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
            フィールドがありません
          </div>
        ) : (
          <div className="space-y-2">
            {fieldSet.fields.map((field) => (
              <div key={field.id} className="flex items-center gap-2 rounded-md border bg-card p-2">
                {/* ドラッグハンドル */}
                <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground" />

                {/* フィールド名 */}
                <Input
                  className="flex-1"
                  value={field.name}
                  onChange={(e) => handleFieldNameChange(field.id, e.target.value)}
                  placeholder="フィールド名"
                />

                {/* 型選択（レジストリから動的に生成） */}
                <Select
                  value={field.type}
                  onValueChange={(value) => handleFieldTypeChange(field.id, value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getFieldTypeOptions().map((option) => (
                      <SelectItem key={option.type} value={option.type}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* 削除ボタン */}
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleDeleteField(field.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
