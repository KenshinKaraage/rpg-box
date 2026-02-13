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

interface DataListFieldConfigProps {
  referenceTypeId: string;
  context?: FieldConfigContext;
  onChange: (updates: Record<string, unknown>) => void;
}

export function DataListFieldConfig({
  referenceTypeId,
  context,
  onChange,
}: DataListFieldConfigProps) {
  const dataTypes = context?.dataTypes ?? [];

  return (
    <div className="space-y-1">
      <Label className="text-xs">参照データタイプ</Label>
      {dataTypes.length === 0 ? (
        <p className="text-xs text-muted-foreground">利用可能なデータタイプがありません</p>
      ) : (
        <Select
          value={referenceTypeId || undefined}
          onValueChange={(value) => onChange({ referenceTypeId: value })}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="データタイプを選択" />
          </SelectTrigger>
          <SelectContent>
            {dataTypes.map((dt) => (
              <SelectItem key={dt.id} value={dt.id}>
                {dt.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
