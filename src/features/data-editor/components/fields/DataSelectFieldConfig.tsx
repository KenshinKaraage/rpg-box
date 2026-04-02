'use client';

import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { FieldConfigContext } from '@/types/fields/FieldType';

interface DataSelectFieldConfigProps {
  referenceTypeId: string;
  allowNull?: boolean;
  context?: FieldConfigContext;
  onChange: (updates: Record<string, unknown>) => void;
}

/**
 * データ参照フィールド設定コンポーネント
 * 参照先のデータタイプを選択するUI
 */
export function DataSelectFieldConfig({
  referenceTypeId,
  allowNull = true,
  context,
  onChange,
}: DataSelectFieldConfigProps) {
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
      <div className="flex items-center gap-2">
        <Checkbox
          id="allowNull"
          checked={allowNull}
          onCheckedChange={(checked) => onChange({ allowNull: checked === true })}
        />
        <Label htmlFor="allowNull" className="text-xs">未選択を許可</Label>
      </div>
    </div>
  );
}
