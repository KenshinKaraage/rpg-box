'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface CommonFieldConfigProps {
  required: boolean;
  onChange: (updates: Record<string, unknown>) => void;
}

export function CommonFieldConfig({ required, onChange }: CommonFieldConfigProps) {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        id="field-required"
        checked={required}
        onCheckedChange={(checked) => onChange({ required: !!checked })}
      />
      <Label htmlFor="field-required" className="cursor-pointer text-sm">
        必須フィールド
      </Label>
    </div>
  );
}
