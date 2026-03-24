'use client';

import { Input } from '@/components/ui/input';
import type { ArgFieldProps } from './types';

export function NumberArgField({ value, onChange }: ArgFieldProps) {
  return (
    <Input
      type="number"
      className="h-6 flex-1 text-[10px]"
      value={String(value ?? '')}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
    />
  );
}
