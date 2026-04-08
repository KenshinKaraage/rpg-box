'use client';

import { Label } from '@/components/ui/label';
import { useStore } from '@/stores';
import type { ClassValue } from '@/types/fields/ClassFieldType';
import { computeFieldVisibility } from '../../utils/conditionEvaluator';

interface ClassFieldEditorProps {
  value: ClassValue;
  onChange: (value: ClassValue) => void;
  disabled?: boolean;
  error?: string;
  classId: string;
  /** グリッド列数（デフォルト: 2） */
  columns?: number;
}

/**
 * クラスフィールドエディタ
 * classId から Zustand ストアのクラス定義を取得し、フィールドを展開表示する
 */
export function ClassFieldEditor({
  value,
  onChange,
  disabled,
  error,
  classId,
  columns = 2,
}: ClassFieldEditorProps) {
  const customClass = useStore((state) =>
    classId ? (state.classes.find((c) => c.id === classId) ?? null) : null
  );

  if (!classId) {
    return (
      <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
        クラスが設定されていません
      </div>
    );
  }

  if (!customClass) {
    return (
      <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
        クラス「{classId}」が見つかりません
      </div>
    );
  }

  const handleFieldChange = (fieldId: string, fieldValue: unknown) => {
    onChange({
      ...value,
      [fieldId]: fieldValue,
    });
  };

  const visibility = computeFieldVisibility(customClass.fields, value);

  return (
    <div>
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {customClass.fields.map((field) => {
          if (!visibility[field.id]) return null;
          return (
            <div key={field.id} className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                {field.name}
                {field.required && <span className="ml-1 text-red-500">*</span>}
              </Label>
              {field.renderEditor({
                value: value[field.id] ?? field.getDefaultValue(),
                onChange: (newValue) => handleFieldChange(field.id, newValue),
                disabled,
              })}
            </div>
          );
        })}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
