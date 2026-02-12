'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface BooleanFieldEditorProps {
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  error?: string;
  checkboxLabel?: string;
}

export function BooleanFieldEditor({
  value,
  onChange,
  disabled,
  error,
  checkboxLabel,
}: BooleanFieldEditorProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Checkbox
          checked={value}
          onCheckedChange={(checked) => onChange(checked === true)}
          disabled={disabled}
          id="boolean-field"
        />
        {checkboxLabel && (
          <Label htmlFor="boolean-field" className="cursor-pointer text-sm">
            {checkboxLabel}
          </Label>
        )}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
