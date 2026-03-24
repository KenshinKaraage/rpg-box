'use client';

import { Checkbox } from '@/components/ui/checkbox';
import type { ArgFieldProps } from './types';

export function BooleanArgField({ value, onChange }: ArgFieldProps) {
  return (
    <div className="flex flex-1 items-center">
      <Checkbox
        checked={!!value}
        onCheckedChange={(checked) => onChange(!!checked)}
      />
    </div>
  );
}
