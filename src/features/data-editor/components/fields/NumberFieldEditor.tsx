'use client';

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
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value === '' ? NaN : Number(e.target.value);
    onChange(newValue);
  };

  return (
    <div className="space-y-1">
      <Input
        type="number"
        value={Number.isNaN(value) ? '' : value}
        onChange={handleChange}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        className={error ? 'border-red-500' : ''}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
