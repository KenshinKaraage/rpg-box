'use client';

import { Input } from '@/components/ui/input';

interface StringFieldEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
  maxLength?: number;
  placeholder?: string;
}

export function StringFieldEditor({
  value,
  onChange,
  disabled,
  error,
  maxLength,
  placeholder,
}: StringFieldEditorProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="space-y-1">
      <Input
        type="text"
        value={value}
        onChange={handleChange}
        disabled={disabled}
        placeholder={placeholder}
        maxLength={maxLength}
        className={error ? 'border-red-500' : ''}
      />
      {maxLength && (
        <p className="text-xs text-muted-foreground">
          {value.length} / {maxLength}
        </p>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
