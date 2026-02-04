'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Variable } from '@/types/variable';
import { getDefaultInitialValue } from '@/types/variable';
import { createFieldTypeInstance, getFieldTypeOptions } from '@/types/fields';

// 変数で使用可能なフィールドタイプ（シンプルな型のみ）
const VARIABLE_ALLOWED_TYPES = ['number', 'string', 'boolean'];

/**
 * バリデーションスキーマ
 */
const variableSchema = z.object({
  name: z.string().min(1, '変数名は必須です').max(50, '50文字以内で入力してください'),
  fieldTypeName: z.string(), // フィールドタイプの名前
  isArray: z.boolean(),
  initialValue: z.unknown(),
  description: z.string().max(200, '200文字以内で入力してください').optional(),
});

type VariableFormData = z.infer<typeof variableSchema>;

interface VariableEditorProps {
  variable: Variable | null;
  onUpdate: (id: string, updates: Partial<Variable>) => void;
}

/**
 * 変数エディタコンポーネント
 */
export function VariableEditor({ variable, onUpdate }: VariableEditorProps) {
  // variableがある場合はその値をデフォルトに、なければ空のデフォルト
  const defaultValues: VariableFormData = variable
    ? {
        name: variable.name,
        fieldTypeName: variable.fieldType.type,
        isArray: variable.isArray,
        initialValue: variable.initialValue,
        description: variable.description ?? '',
      }
    : {
        name: '',
        fieldTypeName: 'number',
        isArray: false,
        initialValue: 0,
        description: '',
      };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<VariableFormData>({
    resolver: zodResolver(variableSchema),
    defaultValues,
  });

  const watchFieldTypeName = watch('fieldTypeName') ?? 'number';
  const watchIsArray = watch('isArray') ?? false;
  const watchInitialValue = watch('initialValue');

  // フォーム値が変更されたら親に通知
  const onFieldChange = (field: keyof VariableFormData, value: unknown) => {
    if (!variable) return;

    // 型が変更された場合、新しいFieldTypeインスタンスを作成し初期値をリセット
    if (field === 'fieldTypeName') {
      const newFieldType = createFieldTypeInstance(value as string);
      if (!newFieldType) return;
      const newIsArray = watchIsArray;
      const newInitialValue = getDefaultInitialValue(newFieldType, newIsArray);

      onUpdate(variable.id, {
        fieldType: newFieldType,
        initialValue: newInitialValue,
      });
      setValue('initialValue', newInitialValue);
    } else if (field === 'isArray') {
      const newIsArray = value as boolean;
      const newInitialValue = getDefaultInitialValue(variable.fieldType, newIsArray);

      onUpdate(variable.id, {
        isArray: newIsArray,
        initialValue: newInitialValue,
      });
      setValue('initialValue', newInitialValue);
    } else {
      onUpdate(variable.id, { [field]: value });
    }
  };

  if (!variable) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        変数を選択してください
      </div>
    );
  }

  return (
    <form className="space-y-6 p-4" onSubmit={handleSubmit(() => {})}>
      {/* 変数ID（読み取り専用） */}
      <div className="space-y-2">
        <Label>変数ID</Label>
        <Input value={variable.id} disabled className="bg-muted" />
      </div>

      {/* 変数名 */}
      <div className="space-y-2">
        <Label htmlFor="name">変数名</Label>
        <Input
          id="name"
          {...register('name')}
          onChange={(e) => {
            register('name').onChange(e);
            onFieldChange('name', e.target.value);
          }}
          placeholder="変数名を入力"
        />
        {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
      </div>

      {/* 型選択（レジストリから動的に生成） */}
      <div className="space-y-2">
        <Label>型</Label>
        <Select
          value={watchFieldTypeName}
          onValueChange={(value) => {
            setValue('fieldTypeName', value);
            onFieldChange('fieldTypeName', value);
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {getFieldTypeOptions(VARIABLE_ALLOWED_TYPES).map((option) => (
              <SelectItem key={option.type} value={option.type}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 配列フラグ */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="isArray"
          checked={watchIsArray}
          onCheckedChange={(checked) => {
            setValue('isArray', !!checked);
            onFieldChange('isArray', !!checked);
          }}
        />
        <Label htmlFor="isArray" className="cursor-pointer">
          配列として扱う
        </Label>
      </div>

      {/* 初期値（FieldTypeのrenderEditorを使用） */}
      <div className="space-y-2">
        <Label htmlFor="initialValue">初期値</Label>
        {watchIsArray ? (
          <div className="rounded-md bg-muted p-2 text-sm text-muted-foreground">
            配列の初期値: []
          </div>
        ) : (
          variable.fieldType.renderEditor({
            value: watchInitialValue,
            onChange: (value) => {
              setValue('initialValue', value);
              onFieldChange('initialValue', value);
            },
          })
        )}
      </div>

      {/* 説明 */}
      <div className="space-y-2">
        <Label htmlFor="description">説明（オプション）</Label>
        <Textarea
          id="description"
          {...register('description')}
          onChange={(e) => {
            register('description').onChange(e);
            onFieldChange('description', e.target.value);
          }}
          placeholder="変数の説明"
          rows={3}
        />
        {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
      </div>
    </form>
  );
}
