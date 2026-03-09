'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Settings2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { DataType } from '@/types/data';

const dataTypeSchema = z.object({
  name: z.string().min(1, 'データ型名は必須です').max(50, '50文字以内で入力してください'),
  description: z.string().max(200, '200文字以内で入力してください').optional(),
});

type DataTypeFormData = z.infer<typeof dataTypeSchema>;

interface DataTypeInfoViewProps {
  dataType: DataType | null;
  onUpdateDataType: (id: string, updates: Partial<DataType>) => void;
  onFieldEdit: () => void;
}

export function DataTypeInfoView({
  dataType,
  onUpdateDataType,
  onFieldEdit,
}: DataTypeInfoViewProps) {
  const defaultValues: DataTypeFormData = dataType
    ? { name: dataType.name, description: dataType.description ?? '' }
    : { name: '', description: '' };

  const {
    register,
    formState: { errors },
  } = useForm<DataTypeFormData>({
    resolver: zodResolver(dataTypeSchema),
    defaultValues,
  });

  if (!dataType) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
        <Settings2 className="mb-2 h-10 w-10 text-muted-foreground/20" />
        <p className="text-sm">データ型を選択してください</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* ヘッダー */}
      <div className="border-b px-5 py-4">
        <h3 className="text-sm font-bold">データ型設定</h3>
      </div>

      {/* データ型基本情報（編集可能） */}
      <div className="space-y-4 border-b p-5">
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


      {/* フィールド一覧（読み取り専用サマリー） */}
      <div className="flex-1 overflow-auto p-5">
        <h4 className="mb-3 text-sm font-bold text-muted-foreground">
          フィールド ({dataType.fields.length})
        </h4>
        {dataType.fields.length === 0 ? (
          <p className="text-sm text-muted-foreground">フィールドがありません</p>
        ) : (
          <div className="space-y-2">
            {dataType.fields.map((field) => (
              <div
                key={field.id}
                className="flex items-center justify-between rounded-lg border px-4 py-2.5"
              >
                <div>
                  <span className="text-sm font-medium">{field.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{field.id}</span>
                </div>
                <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {field.type}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* フィールド編集ボタン */}
      <div className="border-t p-5">
        <Button
          variant="outline"
          className="w-full border-primary text-primary"
          onClick={onFieldEdit}
        >
          フィールド編集
        </Button>
      </div>
    </div>
  );
}
