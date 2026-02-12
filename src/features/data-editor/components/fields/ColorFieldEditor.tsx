'use client';

import { Input } from '@/components/ui/input';

interface ColorFieldEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
  showHexInput?: boolean;
  defaultColor?: string;
}

export function ColorFieldEditor({
  value,
  onChange,
  disabled,
  error,
  showHexInput,
  defaultColor = '#000000',
}: ColorFieldEditorProps) {
  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || defaultColor}
          onChange={handleColorChange}
          disabled={disabled}
          className="h-10 w-14 cursor-pointer rounded border border-input p-1 disabled:cursor-not-allowed disabled:opacity-50"
        />
        {showHexInput && (
          <Input
            type="text"
            value={value}
            onChange={handleTextChange}
            disabled={disabled}
            placeholder="#000000"
            className={`w-28 font-mono ${error ? 'border-red-500' : ''}`}
          />
        )}
        {!showHexInput && <span className="font-mono text-sm text-muted-foreground">{value}</span>}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
