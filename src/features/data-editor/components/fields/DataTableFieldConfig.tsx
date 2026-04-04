'use client';

import { Plus, X } from 'lucide-react';
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
import { getFieldTypeOptions } from '@/types/fields/registry';
import type { FieldConfigContext } from '@/types/fields/FieldType';
import type { DataTableColumn } from '@/types/fields/DataTableFieldType';

/** カラムで使用可能なフィールドタイプ */
const COLUMN_ALLOWED_TYPES = ['number', 'string', 'boolean', 'select', 'color'];

interface DataTableFieldConfigProps {
  referenceTypeId: string;
  columns: DataTableColumn[];
  context?: FieldConfigContext;
  onChange: (updates: Record<string, unknown>) => void;
}

export function DataTableFieldConfig({
  referenceTypeId,
  columns,
  context,
  onChange,
}: DataTableFieldConfigProps) {
  const dataTypes = context?.dataTypes ?? [];
  const typeOptions = getFieldTypeOptions(COLUMN_ALLOWED_TYPES);

  const handleAddColumn = () => {
    const newColumn: DataTableColumn = {
      id: `col_${Date.now()}`,
      name: '',
      fieldType: 'number',
    };
    onChange({ columns: [...columns, newColumn] });
  };

  const handleRemoveColumn = (index: number) => {
    onChange({ columns: columns.filter((_, i) => i !== index) });
  };

  const handleUpdateColumn = (index: number, updates: Partial<DataTableColumn>) => {
    const updated = [...columns];
    updated[index] = { ...updated[index]!, ...updates } as DataTableColumn;
    onChange({ columns: updated });
  };

  return (
    <div className="space-y-3">
      {/* 参照データタイプ */}
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

      {/* カラム定義 */}
      <div className="space-y-1">
        <Label className="text-xs">カラム定義</Label>
        {columns.map((col, index) => (
          <div key={col.id} className="flex items-center gap-1">
            <Input
              className="h-8 flex-1 text-xs"
              placeholder="列名"
              value={col.name}
              onChange={(e) => handleUpdateColumn(index, { name: e.target.value })}
            />
            <Select
              value={col.fieldType}
              onValueChange={(value) => handleUpdateColumn(index, { fieldType: value })}
            >
              <SelectTrigger className="h-8 w-24 shrink-0 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((opt) => (
                  <SelectItem key={opt.type} value={opt.type}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => handleRemoveColumn(index)}
              aria-label={`${col.name || '列'}を削除`}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" className="w-full" onClick={handleAddColumn}>
          <Plus className="mr-1 h-4 w-4" />
          列を追加
        </Button>
      </div>
    </div>
  );
}
