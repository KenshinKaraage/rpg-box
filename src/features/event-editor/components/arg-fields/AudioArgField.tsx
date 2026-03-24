'use client';

import { AudioFieldEditor } from '@/features/data-editor/components/fields/AudioFieldEditor';
import type { ArgFieldProps } from './types';

export function AudioArgField({ value, onChange }: ArgFieldProps) {
  return (
    <div className="flex-1">
      <AudioFieldEditor
        value={(value as string) ?? null}
        onChange={(v) => onChange(v ?? '')}
      />
    </div>
  );
}
