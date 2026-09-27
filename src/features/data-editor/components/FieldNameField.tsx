'use client';

import type { CSSProperties } from 'react';
import { GripVertical } from 'lucide-react';

interface FieldNameFieldProps {
  name: string;
  required?: boolean;
  onNameChange?: (name: string) => void;
}

const CONTENT_SIZING_STYLE = { fieldSizing: 'content' } as unknown as CSSProperties;

export function FieldNameField({ name, required, onNameChange }: FieldNameFieldProps) {
  return (
    <div className="flex items-center gap-1">
      <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" aria-hidden="true" />
      <input
        value={name}
        readOnly={!onNameChange}
        onChange={(e) => onNameChange?.(e.target.value)}
        onPointerDown={(e) => {
          if (onNameChange) e.stopPropagation();
        }}
        style={CONTENT_SIZING_STYLE}
        className="min-w-8 max-w-full border-none bg-transparent p-0 text-sm font-medium leading-none text-foreground shadow-none outline-none focus-visible:outline-none"
      />
      {required && <span className="text-red-500">*</span>}
    </div>
  );
}
