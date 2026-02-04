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
import type { CustomClass } from '@/types/customClass';
import type { FieldType } from '@/types/fields/FieldType';
import { createFieldTypeInstance, getFieldTypeOptions } from '@/types/fields';

/**
 * クラス名バリデーションスキーマ
 */
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
}

// クラスで使用可能なフィールドタイプ（シンプルな型のみ）
const CLASS_ALLOWED_TYPES = ['number', 'string', 'boolean', 'select', 'color'];

/**
 * クラスエディタコンポーネント
 */
export function ClassEditor({
  customClass,
  onUpdateClass,
  onAddField,
  onReplaceField,
  onDeleteField,
}: ClassEditorProps) {
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
    newField.id = `field_${Date.now()}`;
    newField.name = '新しいフィールド';
    onAddField(customClass.id, newField);
  };

  const handleFieldNameChange = (fieldId: string, name: string) => {
    const field = customClass.fields.find((f) => f.id === fieldId);
    if (!field) return;
    // フィールドを複製して名前を変更
    const newField = createFieldTypeInstance(field.type);
    if (!newField) return;
    Object.assign(newField, field, { name });
    onReplaceField(customClass.id, fieldId, newField);
  };

  const handleFieldTypeChange = (fieldId: string, type: string) => {
    const field = customClass.fields.find((f) => f.id === fieldId);
    if (!field) return;
    // 新しいタイプのインスタンスを作成し、id/nameを引き継ぐ
    const newField = createFieldTypeInstance(type);
    if (!newField) return;
    newField.id = field.id;
    newField.name = field.name;
    onReplaceField(customClass.id, fieldId, newField);
  };

  return (
    <div className="flex h-full flex-col">
      {/* クラス基本情報 */}
      <div className="space-y-4 border-b p-4">
        {/* クラスID（読み取り専用） */}
        <div className="space-y-2">
          <Label>クラスID</Label>
          <Input value={customClass.id} disabled className="bg-muted" />
        </div>

        {/* クラス名 */}
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

        {/* 説明 */}
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
              <div key={field.id} className="flex items-center gap-2 rounded-md border bg-card p-2">
                {/* ドラッグハンドル（将来のD&D用） */}
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
                    {getFieldTypeOptions(CLASS_ALLOWED_TYPES).map((option) => (
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
                  onClick={() => onDeleteField(customClass.id, field.id)}
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
