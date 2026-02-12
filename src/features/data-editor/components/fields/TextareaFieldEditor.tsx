'use client';

import { Textarea } from '@/components/ui/textarea';

interface TextareaFieldEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
  maxLength?: number;
  placeholder?: string;
  rows?: number;
}

export function TextareaFieldEditor({
  value,
  onChange,
  disabled,
  error,
  maxLength,
  placeholder,
  rows,
}: TextareaFieldEditorProps) {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="space-y-1">
      <Textarea
        value={value}
        onChange={handleChange}
        disabled={disabled}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={rows ?? 4}
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
