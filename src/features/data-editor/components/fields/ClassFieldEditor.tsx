'use client';

import { Label } from '@/components/ui/label';
import { useStore } from '@/stores';
import type { ClassValue } from '@/types/fields/ClassFieldType';

interface ClassFieldEditorProps {
  value: ClassValue;
  onChange: (value: ClassValue) => void;
  disabled?: boolean;
  error?: string;
  classId: string;
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

  return (
    <div className="space-y-3">
      {customClass.fields.map((field) => (
        <div key={field.id} className="space-y-1">
          <Label className="text-sm font-medium">
            {field.name}
            {field.required && <span className="ml-1 text-red-500">*</span>}
          </Label>
          {field.renderEditor({
            value: value[field.id] ?? field.getDefaultValue(),
            onChange: (newValue) => handleFieldChange(field.id, newValue),
            disabled,
          })}
        </div>
      ))}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
