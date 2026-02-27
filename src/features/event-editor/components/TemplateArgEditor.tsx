'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getFieldTypeOptions, createFieldTypeInstance } from '@/types/fields';
import { generateId } from '@/lib/utils';
import type { TemplateArg } from '@/types/event';

// =============================================================================
// 型定義
// =============================================================================

interface TemplateArgEditorProps {
  args: TemplateArg[];
  onChange: (args: TemplateArg[]) => void;
}

// =============================================================================
// TemplateArgEditor コンポーネント
// =============================================================================

export function TemplateArgEditor({ args, onChange }: TemplateArgEditorProps) {
  const fieldTypeOptions = getFieldTypeOptions();

  const handleAdd = () => {
    const id = generateId(
      'arg',
      args.map((a) => a.id)
    );
    const fieldType = createFieldTypeInstance('string');
    if (!fieldType) return;
    fieldType.id = id;
    fieldType.name = '新しい引数';
    const newArg: TemplateArg = {
      id,
      name: '新しい引数',
      fieldType,
      required: false,
    };
    onChange([...args, newArg]);
  };

  const handleChangeName = (index: number, name: string) => {
    const updated = [...args];
    const arg = updated[index];
    if (!arg) return;
    updated[index] = { ...arg, name };
    onChange(updated);
  };

  const handleChangeType = (index: number, type: string) => {
    const updated = [...args];
    const arg = updated[index];
    if (!arg) return;
    const fieldType = createFieldTypeInstance(type);
    if (!fieldType) return;
    fieldType.id = arg.id;
    fieldType.name = arg.name;
    updated[index] = { ...arg, fieldType };
    onChange(updated);
  };

  const handleChangeRequired = (index: number, required: boolean) => {
    const updated = [...args];
    const arg = updated[index];
    if (!arg) return;
    updated[index] = { ...arg, required };
    onChange(updated);
  };

  const handleDelete = (index: number) => {
    onChange(args.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">引数</Label>
        <Button size="sm" variant="outline" onClick={handleAdd} data-testid="add-arg-button">
          <Plus className="mr-1 h-4 w-4" />
          追加
        </Button>
      </div>

      {args.length === 0 ? (
        <div className="text-sm text-muted-foreground">引数がありません</div>
      ) : (
        <div className="space-y-2">
          {args.map((arg, index) => (
            <div
              key={arg.id}
              className="flex items-center gap-2 rounded-md border p-2"
              data-testid={`arg-row-${index}`}
            >
              <Input
                value={arg.name}
                onChange={(e) => handleChangeName(index, e.target.value)}
                className="flex-1"
                placeholder="引数名"
                data-testid={`arg-name-${index}`}
              />
              <Select
                value={arg.fieldType.type}
                onValueChange={(val) => handleChangeType(index, val)}
              >
                <SelectTrigger className="w-32" data-testid={`arg-type-${index}`}>
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
              <div className="flex items-center gap-1">
                <Checkbox
                  checked={arg.required}
                  onCheckedChange={(checked) => handleChangeRequired(index, checked === true)}
                  data-testid={`arg-required-${index}`}
                />
                <span className="text-xs text-muted-foreground">必須</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDelete(index)}
                data-testid={`arg-delete-${index}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
