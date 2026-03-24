'use client';

import { Input } from '@/components/ui/input';
import type { ArgFieldProps } from './types';

export function StringArgField({ value, onChange, placeholder }: ArgFieldProps) {
  return (
    <Input
      className="h-6 flex-1 text-[10px]"
      placeholder={placeholder ?? '文字列'}
      value={String(value ?? '')}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
