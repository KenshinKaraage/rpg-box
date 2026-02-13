'use client';

import { useState } from 'react';
import { ChevronRight, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useStore } from '@/stores';
import type { ClassValue } from '@/types/fields/ClassFieldType';

interface ClassListFieldEditorProps {
  value: ClassValue[];
  onChange: (value: ClassValue[]) => void;
  disabled?: boolean;
  error?: string;
  classId: string;
}

/**
 * クラスリストフィールドエディタ
 * classId からクラス定義を取得し、クラスインスタンスのリストを管理する
 */
export function ClassListFieldEditor({
  value,
  onChange,
  disabled,
  error,
  classId,
}: ClassListFieldEditorProps) {
  const [expandedIndices, setExpandedIndices] = useState<Set<number>>(new Set());

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

  const toggleExpanded = (index: number) => {
    setExpandedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleAdd = () => {
    const newInstance: ClassValue = {};
    for (const field of customClass.fields) {
      newInstance[field.id] = field.getDefaultValue();
    }
    const newValue = [...value, newInstance];
    onChange(newValue);
    setExpandedIndices((prev) => new Set(prev).add(newValue.length - 1));
  };

  const handleRemove = (index: number) => {
    const updated = value.filter((_, i) => i !== index);
    onChange(updated);
    setExpandedIndices((prev) => {
      const next = new Set<number>();
      for (const idx of prev) {
        if (idx < index) next.add(idx);
        else if (idx > index) next.add(idx - 1);
      }
      return next;
    });
  };

  const handleFieldChange = (index: number, fieldId: string, fieldValue: unknown) => {
    const updated = [...value];
    updated[index] = { ...updated[index], [fieldId]: fieldValue };
    onChange(updated);
  };

  const getItemLabel = (item: ClassValue, index: number): string => {
    const nameField = customClass.fields.find((f) => f.id === 'name');
    if (nameField) {
      const nameValue = item['name'];
      if (typeof nameValue === 'string' && nameValue) return nameValue;
    }
    const firstField = customClass.fields[0];
    if (firstField) {
      const firstValue = item[firstField.id];
      if (firstValue !== undefined && firstValue !== null && firstValue !== '') {
        return String(firstValue);
      }
    }
    return `#${index + 1}`;
  };

  return (
    <div className="space-y-1">
      {value.map((item, index) => (
        <Collapsible
          key={index}
          open={expandedIndices.has(index)}
          onOpenChange={() => toggleExpanded(index)}
        >
          <div className="flex items-center gap-1">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                <ChevronRight
                  className={`h-3.5 w-3.5 transition-transform ${
                    expandedIndices.has(index) ? 'rotate-90' : ''
                  }`}
                />
              </Button>
            </CollapsibleTrigger>
            <span className="flex-1 truncate text-sm">{getItemLabel(item, index)}</span>
            {!disabled && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={() => handleRemove(index)}
                aria-label={`${getItemLabel(item, index)}を削除`}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          <CollapsibleContent>
            <div className="ml-7 mt-1 space-y-2 rounded-md border bg-muted/30 p-3">
              {customClass.fields.map((field) => (
                <div key={field.id} className="space-y-1">
                  <Label className="text-xs font-medium">
                    {field.name}
                    {field.required && <span className="ml-1 text-red-500">*</span>}
                  </Label>
                  {field.renderEditor({
                    value: item[field.id] ?? field.getDefaultValue(),
                    onChange: (newValue) => handleFieldChange(index, field.id, newValue),
                    disabled,
                  })}
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      ))}

      {!disabled && (
        <Button variant="outline" size="sm" className="w-full" onClick={handleAdd}>
          <Plus className="mr-1 h-4 w-4" />
          追加
        </Button>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
