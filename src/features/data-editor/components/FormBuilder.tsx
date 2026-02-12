'use client';

import { useCallback } from 'react';
import { Label } from '@/components/ui/label';
import type { DataType, DataEntry } from '@/types/data';
import { computeFieldVisibility } from '../utils/conditionEvaluator';

interface FormBuilderProps {
  dataType: DataType;
  entry: DataEntry;
  onUpdateEntry: (typeId: string, entryId: string, values: Record<string, unknown>) => void;
}

/**
 * データエントリの動的フォームビルダー
 *
 * DataType のフィールド定義に基づいて、フォームを動的に生成する。
 * 各フィールドの表示条件（displayCondition）を評価し、条件を満たすフィールドのみ表示する。
 */
export function FormBuilder({ dataType, entry, onUpdateEntry }: FormBuilderProps) {
  const visibility = computeFieldVisibility(dataType.fields, entry.values);

  const handleFieldChange = useCallback(
    (fieldId: string, value: unknown) => {
      onUpdateEntry(dataType.id, entry.id, {
        ...entry.values,
        [fieldId]: value,
      });
    },
    [dataType.id, entry.id, entry.values, onUpdateEntry]
  );

  return (
    <div className="flex h-full flex-col">
      {/* ヘッダー */}
      <div className="border-b p-3">
        <h2 className="text-sm font-semibold">データ編集</h2>
        <p className="text-xs text-muted-foreground">{entry.id}</p>
      </div>

      {/* フィールド */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {dataType.fields.map((field) => {
          if (!visibility[field.id]) return null;
          const value = entry.values[field.id] ?? field.getDefaultValue();
          return (
            <div key={field.id} className="space-y-1">
              <Label>
                {field.name}
                {field.required && <span className="ml-1 text-red-500">*</span>}
              </Label>
              {field.renderEditor({
                value,
                onChange: (newValue: unknown) => handleFieldChange(field.id, newValue),
              })}
            </div>
          );
        })}
        {dataType.fields.length === 0 && (
          <p className="text-sm text-muted-foreground">フィールドが定義されていません</p>
        )}
      </div>
    </div>
  );
}
