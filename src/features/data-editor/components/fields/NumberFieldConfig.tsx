'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface NumberFieldConfigProps {
  min?: number;
  max?: number;
  step?: number;
  onChange: (updates: Record<string, unknown>) => void;
}

export function NumberFieldConfig({ min, max, step, onChange }: NumberFieldConfigProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="space-y-1">
        <Label className="text-xs">最小値</Label>
        <Input
          type="number"
          value={min ?? ''}
          onChange={(e) =>
            onChange({ min: e.target.value === '' ? undefined : Number(e.target.value) })
          }
          placeholder="なし"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">最大値</Label>
        <Input
          type="number"
          value={max ?? ''}
          onChange={(e) =>
            onChange({ max: e.target.value === '' ? undefined : Number(e.target.value) })
          }
          placeholder="なし"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">ステップ</Label>
        <Input
          type="number"
          value={step ?? ''}
          onChange={(e) =>
            onChange({ step: e.target.value === '' ? undefined : Number(e.target.value) })
          }
          placeholder="1"
        />
      </div>
    </div>
  );
}
