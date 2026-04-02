'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronRight, Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
import type { FieldConfigContext } from '@/types/fields/FieldType';
import { useStore } from '@/stores';
// 変数で使用可能なフィールドタイプ
const VARIABLE_ALLOWED_TYPES = ['number', 'string', 'boolean', 'class'];

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
  const [configOpen, setConfigOpen] = useState(false);
  const classes = useStore((state) => state.classes);
  const configContext: FieldConfigContext = useMemo(
    () => ({
      classes: classes.map((c) => ({ id: c.id, name: c.name })),
    }),
    [classes]
  );

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
      {/* 変数ID */}
      <div className="space-y-2">
        <Label htmlFor="variableId">変数ID</Label>
        <Input
          id="variableId"
          defaultValue={variable.id}
          onBlur={(e) => {
            const newId = e.target.value.trim();
            if (newId && newId !== variable.id) {
              onUpdate(variable.id, { id: newId } as Partial<Variable>);
            }
          }}
          placeholder="変数ID"
        />
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

      {/* 初期値 + フィールド設定（トグルで展開） */}
      <Collapsible open={configOpen} onOpenChange={setConfigOpen}>
        <div className="flex items-center gap-1">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
              <ChevronRight
                className={`h-4 w-4 transition-transform ${configOpen ? 'rotate-90' : ''}`}
              />
            </Button>
          </CollapsibleTrigger>
          <Label className="cursor-pointer" onClick={() => setConfigOpen(!configOpen)}>
            初期値
          </Label>
        </div>
        <div className="mt-2 pl-7">
          {watchIsArray ? (
            <div className="space-y-1">
              {(Array.isArray(watchInitialValue) ? watchInitialValue : []).map(
                (item: unknown, index: number) => (
                  <div key={index} className="flex items-start gap-1 rounded border p-2">
                    <span className="mt-1 w-5 shrink-0 text-center text-xs text-muted-foreground">{index}</span>
                    <div className="min-w-0 flex-1">
                      {variable.fieldType.renderEditor({
                        value: item,
                        onChange: (newVal) => {
                          const arr = [...(watchInitialValue as unknown[])];
                          arr[index] = newVal;
                          setValue('initialValue', arr);
                          onFieldChange('initialValue', arr);
                        },
                      })}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => {
                        const arr = (watchInitialValue as unknown[]).filter((_, i) => i !== index);
                        setValue('initialValue', arr);
                        onFieldChange('initialValue', arr);
                      }}
                      aria-label="削除"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  const arr = [
                    ...(Array.isArray(watchInitialValue) ? watchInitialValue : []),
                    variable.fieldType.getDefaultValue(),
                  ];
                  setValue('initialValue', arr);
                  onFieldChange('initialValue', arr);
                }}
              >
                <Plus className="mr-1 h-4 w-4" />
                追加
              </Button>
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
        <CollapsibleContent>
          <div className="mt-3 space-y-3 rounded-md border bg-muted/30 p-3 ml-7">
            {variable.fieldType.renderConfig({
              onChange: (updates) => {
                const newFieldType = createFieldTypeInstance(variable.fieldType.type);
                if (!newFieldType) return;
                Object.assign(newFieldType, variable.fieldType, updates);
                onUpdate(variable.id, { fieldType: newFieldType });
              },
              context: configContext,
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </form>
  );
}
