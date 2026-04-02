'use client';

import { DataSelectFieldEditor } from '@/features/data-editor/components/fields/DataSelectFieldEditor';
import type { ArgFieldProps } from './types';

export function DataSelectArgField({ value, onChange, referenceTypeId }: ArgFieldProps) {
  return (
    <DataSelectFieldEditor
      value={(value as string) ?? null}
      onChange={(v) => onChange(v ?? '')}
      referenceTypeId={referenceTypeId ?? ''}
    />
  );
}
