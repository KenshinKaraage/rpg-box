import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { PropertyDef } from '@/types/ui/UIComponent';
import type { FieldRendererProps } from './types';

export function NumberField({ def, value, onChange }: FieldRendererProps) {
  const d = def as Extract<PropertyDef, { type: 'number' }>;
  const numValue = (value as number) ?? 0;
  const [localValue, setLocalValue] = useState(String(numValue));

  return (
    <div className="flex items-center gap-2">
      <Label className="w-24 shrink-0 text-xs text-muted-foreground">{d.label}</Label>
      <Input
        type="number"
        className="h-7 text-xs"
        value={localValue}
        min={d.min}
        max={d.max}
        step={d.step ?? 1}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw !== '' && raw !== '-' && isNaN(Number(raw))) return;
          setLocalValue(raw);
          const v = parseFloat(raw);
          if (!isNaN(v)) onChange(v);
        }}
        onBlur={() => {
          const v = parseFloat(localValue);
          setLocalValue(isNaN(v) ? String(numValue) : String(v));
        }}
      />
    </div>
  );
}
