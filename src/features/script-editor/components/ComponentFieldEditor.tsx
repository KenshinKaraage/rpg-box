'use client';

import { useMemo } from 'react';
import { Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getFieldType, getFieldTypeOptions } from '@/types/fields';
import { parseComponentFields, replaceExportDefault } from '@/lib/componentScriptUtils';
import type { ComponentField } from '@/types/script';

interface ComponentFieldEditorProps {
  content: string | null;
  onContentChange: (newContent: string) => void;
}

export function ComponentFieldEditor({ content, onContentChange }: ComponentFieldEditorProps) {
  const fields = useMemo(
    () => (content !== null ? parseComponentFields(content) : null),
    [content]
  );

  const fieldTypeOptions = useMemo(() => getFieldTypeOptions(), []);

  if (content === null || fields === null) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        {content === null ? 'スクリプトを選択してください' : 'コードの解析に失敗しました'}
      </div>
    );
  }

  const handleAdd = () => {
    let n = fields.length + 1;
    while (fields.some((f) => f.name === `field${n}`)) n++;
    const newField: ComponentField = {
      name: `field${n}`,
      fieldType: 'string',
      defaultValue: '',
      label: `フィールド${n}`,
    };
    onContentChange(replaceExportDefault(content, [...fields, newField]));
  };

  const handleUpdate = (index: number, updates: Partial<ComponentField>) => {
    const newFields = fields.map((f, i) => (i === index ? { ...f, ...updates } : f));
    onContentChange(replaceExportDefault(content, newFields));
  };

  const handleDelete = (index: number) => {
    onContentChange(
      replaceExportDefault(
        content,
        fields.filter((_, i) => i !== index)
      )
    );
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <span className="text-sm font-medium">フィールド</span>
        <Button size="sm" variant="outline" onClick={handleAdd} aria-label="追加">
          <Plus className="mr-1 h-3 w-3" />
          追加
        </Button>
      </div>
      <div className="flex-1 overflow-auto p-3">
        {fields.length === 0 ? (
          <p className="text-sm text-muted-foreground">フィールドがありません</p>
        ) : (
          <ul className="space-y-3">
            {fields.map((field, index) => {
              const FieldClass = getFieldType(field.fieldType);
              const fieldInstance = FieldClass ? new FieldClass() : null;
              return (
                <li key={field.name} className="space-y-2 rounded border p-3">
                  <div className="flex justify-end">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => handleDelete(index)}
                      aria-label={`${field.name}を削除`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="space-y-1">
                    <Label
                      htmlFor={`field-name-${index}`}
                      className="text-xs text-muted-foreground"
                    >
                      名前
                    </Label>
                    <Input
                      id={`field-name-${index}`}
                      value={field.name}
                      onChange={(e) => handleUpdate(index, { name: e.target.value })}
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label
                      htmlFor={`field-label-${index}`}
                      className="text-xs text-muted-foreground"
                    >
                      ラベル
                    </Label>
                    <Input
                      id={`field-label-${index}`}
                      value={field.label}
                      onChange={(e) => handleUpdate(index, { label: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label
                      htmlFor={`field-type-${index}`}
                      className="text-xs text-muted-foreground"
                    >
                      型
                    </Label>
                    <Select
                      value={field.fieldType}
                      onValueChange={(v) => {
                        const NewClass = getFieldType(v);
                        const newDefault = NewClass ? new NewClass().getDefaultValue() : null;
                        handleUpdate(index, { fieldType: v, defaultValue: newDefault });
                      }}
                    >
                      <SelectTrigger id={`field-type-${index}`} className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {fieldTypeOptions.map((opt) => (
                          <SelectItem key={opt.type} value={opt.type}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {fieldInstance ? (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">デフォルト値</Label>
                      {fieldInstance.renderEditor({
                        value: field.defaultValue,
                        onChange: (v) => handleUpdate(index, { defaultValue: v }),
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">未対応の型: {field.fieldType}</p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
