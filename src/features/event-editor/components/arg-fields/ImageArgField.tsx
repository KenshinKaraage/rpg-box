'use client';

import { ImageFieldEditor } from '@/features/data-editor/components/fields/ImageFieldEditor';
import type { ArgFieldProps } from './types';

export function ImageArgField({ value, onChange }: ArgFieldProps) {
  return (
    <div className="flex-1">
      <ImageFieldEditor
        value={(value as string) ?? null}
        onChange={(v) => onChange(v ?? '')}
        showPreview={false}
      />
    </div>
  );
}
