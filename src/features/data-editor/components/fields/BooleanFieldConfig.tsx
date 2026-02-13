'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface BooleanFieldConfigProps {
  checkboxLabel?: string;
  onChange: (updates: Record<string, unknown>) => void;
}

export function BooleanFieldConfig({ checkboxLabel, onChange }: BooleanFieldConfigProps) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">チェックボックスラベル</Label>
      <Input
        value={checkboxLabel ?? ''}
        onChange={(e) => onChange({ checkboxLabel: e.target.value || undefined })}
        placeholder="チェックボックスの横に表示するテキスト"
      />
    </div>
  );
}
