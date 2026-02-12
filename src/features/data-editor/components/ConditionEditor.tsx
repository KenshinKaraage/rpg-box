'use client';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import type { DisplayCondition } from '@/types/fields/FieldType';
import type { FieldType } from '@/types/fields/FieldType';
import { SelectFieldType } from '@/types/fields/SelectFieldType';

interface AvailableField {
  id: string;
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fieldType: FieldType<any>;
}

interface ConditionEditorProps {
  /** 現在の条件 */
  condition?: DisplayCondition;
  /** 条件変更ハンドラ */
  onChange: (condition: DisplayCondition | undefined) => void;
  /** 条件対象にできるフィールド一覧 */
  availableFields: AvailableField[];
}

/**
 * 条件エディタ
 *
 * フィールドの表示条件を設定するUI。
 * Select タイプのフィールドのみ条件対象として使用可能。
 */
export function ConditionEditor({ condition, onChange, availableFields }: ConditionEditorProps) {
  // Select タイプのフィールドのみ条件対象に
  const selectFields = availableFields.filter((f) => f.fieldType instanceof SelectFieldType);

  // 選択中のフィールドの選択肢を取得
  const selectedField = selectFields.find((f) => f.id === condition?.fieldId);
  const options =
    selectedField && selectedField.fieldType instanceof SelectFieldType
      ? selectedField.fieldType.options
      : [];

  const handleFieldChange = (fieldId: string) => {
    onChange({ fieldId, value: '' });
  };

  const handleValueChange = (value: string) => {
    if (condition) {
      onChange({ fieldId: condition.fieldId, value });
    }
  };

  const handleClear = () => {
    onChange(undefined);
  };

  if (selectFields.length === 0) {
    return (
      <div className="rounded-md border p-4">
        <p className="text-sm text-muted-foreground">
          条件対象にできるフィールド（選択タイプ）がありません
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-md border p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">表示条件</h3>
        {condition && (
          <Button size="sm" variant="ghost" onClick={handleClear} aria-label="条件をクリア">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* フィールド選択 */}
      <div className="space-y-2">
        <Label htmlFor="condition-field">フィールド</Label>
        <Select value={condition?.fieldId ?? ''} onValueChange={handleFieldChange}>
          <SelectTrigger id="condition-field">
            <SelectValue placeholder="フィールドを選択" />
          </SelectTrigger>
          <SelectContent>
            {selectFields.map((field) => (
              <SelectItem key={field.id} value={field.id}>
                {field.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 値選択 */}
      {condition?.fieldId && options.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="condition-value">値</Label>
          <Select
            value={condition.value ? String(condition.value) : ''}
            onValueChange={handleValueChange}
          >
            <SelectTrigger id="condition-value">
              <SelectValue placeholder="値を選択" />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* 説明テキスト */}
      {condition?.fieldId && condition.value && (
        <p className="text-xs text-muted-foreground">
          「{selectedField?.name}」が「
          {options.find((o) => o.value === String(condition.value))?.label}」のときに表示
        </p>
      )}
    </div>
  );
}
