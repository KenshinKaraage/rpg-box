'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface ColorFieldConfigProps {
  showHexInput?: boolean;
  onChange: (updates: Record<string, unknown>) => void;
}

export function ColorFieldConfig({ showHexInput, onChange }: ColorFieldConfigProps) {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        id="field-showHexInput"
        checked={showHexInput ?? false}
        onCheckedChange={(checked) => onChange({ showHexInput: !!checked })}
      />
      <Label htmlFor="field-showHexInput" className="cursor-pointer text-sm">
        HEX入力欄を表示
      </Label>
    </div>
  );
}
