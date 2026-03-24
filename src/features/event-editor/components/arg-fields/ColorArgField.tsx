'use client';

import { ColorFieldEditor } from '@/features/data-editor/components/fields/ColorFieldEditor';
import type { ArgFieldProps } from './types';

export function ColorArgField({ value, onChange }: ArgFieldProps) {
  return (
    <div className="flex-1">
      <ColorFieldEditor
        value={(value as string) ?? '#000000'}
        onChange={(v) => onChange(v)}
      />
    </div>
  );
}
