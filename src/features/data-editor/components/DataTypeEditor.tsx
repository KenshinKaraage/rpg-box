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
import type { DataType } from '@/types/data';
import type { FieldType } from '@/types/fields/FieldType';
import { createFieldTypeInstance, getFieldTypeOptions } from '@/types/fields';

/**
 * データ型名バリデーションスキーマ
 */
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
}

/**
 * データ型エディタコンポーネント
 */
export function DataTypeEditor({
  dataType,
  onUpdateDataType,
  onAddField,
  onReplaceField,
  onDeleteField,
}: DataTypeEditorProps) {
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
    newField.id = `field_${Date.now()}`;
    newField.name = '新しいフィールド';
    onAddField(dataType.id, newField);
  };

  const handleFieldNameChange = (fieldId: string, name: string) => {
    const field = dataType.fields.find((f) => f.id === fieldId);
    if (!field) return;
    // フィールドを複製して名前を変更
    const newField = createFieldTypeInstance(field.type);
    if (!newField) return;
    Object.assign(newField, field, { name });
    onReplaceField(dataType.id, fieldId, newField);
  };

  const handleFieldTypeChange = (fieldId: string, type: string) => {
    const field = dataType.fields.find((f) => f.id === fieldId);
    if (!field) return;
    // 新しいタイプのインスタンスを作成し、id/nameを引き継ぐ
    const newField = createFieldTypeInstance(type);
    if (!newField) return;
    newField.id = field.id;
    newField.name = field.name;
    onReplaceField(dataType.id, fieldId, newField);
  };

  return (
    <div className="flex h-full flex-col">
      {/* データ型基本情報 */}
      <div className="space-y-4 border-b p-4">
        <h3 className="text-sm font-semibold">データ型設定</h3>

        {/* データ型ID（読み取り専用） */}
        <div className="space-y-2">
          <Label>データ型ID</Label>
          <Input value={dataType.id} disabled className="bg-muted" />
        </div>

        {/* データ型名 */}
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

        {/* 説明 */}
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
                  onClick={() => onDeleteField(dataType.id, field.id)}
                  aria-label={`${field.name}を削除`}
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
