'use client';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { FieldConfigContext } from '@/types/fields/FieldType';

interface ClassFieldConfigProps {
  classId: string;
  context?: FieldConfigContext;
  onChange: (updates: Record<string, unknown>) => void;
}

export function ClassFieldConfig({ classId, context, onChange }: ClassFieldConfigProps) {
  const classes = context?.classes ?? [];

  return (
    <div className="space-y-1">
      <Label className="text-xs">参照クラス</Label>
      {classes.length === 0 ? (
        <p className="text-xs text-muted-foreground">利用可能なクラスがありません</p>
      ) : (
        <Select
          value={classId || undefined}
          onValueChange={(value) => onChange({ classId: value })}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="クラスを選択" />
          </SelectTrigger>
          <SelectContent>
            {classes.map((cls) => (
              <SelectItem key={cls.id} value={cls.id}>
                {cls.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
