'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';

interface NumberFieldEditorProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  error?: string;
  min?: number;
  max?: number;
  step?: number;
}

export function NumberFieldEditor({
  value,
  onChange,
  disabled,
  error,
  min,
  max,
  step,
}: NumberFieldEditorProps) {
  const [localValue, setLocalValue] = useState(Number.isNaN(value) ? '' : String(value));

  return (
    <div className="space-y-1">
      <Input
        type="number"
        value={localValue}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        className={error ? 'border-red-500' : ''}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw !== '' && raw !== '-' && isNaN(Number(raw))) return;
          setLocalValue(raw);
          const v = parseFloat(raw);
          if (!isNaN(v)) onChange(v);
        }}
        onBlur={() => {
          const v = parseFloat(localValue);
          setLocalValue(isNaN(v) ? '' : String(v));
        }}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
