'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TextareaFieldConfigProps {
  maxLength?: number;
  rows?: number;
  placeholder?: string;
  onChange: (updates: Record<string, unknown>) => void;
}

export function TextareaFieldConfig({
  maxLength,
  rows,
  placeholder,
  onChange,
}: TextareaFieldConfigProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">最大文字数</Label>
          <Input
            type="number"
            value={maxLength ?? ''}
            onChange={(e) =>
              onChange({ maxLength: e.target.value === '' ? undefined : Number(e.target.value) })
            }
            placeholder="制限なし"
            min={1}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">表示行数</Label>
          <Input
            type="number"
            value={rows ?? ''}
            onChange={(e) =>
              onChange({ rows: e.target.value === '' ? undefined : Number(e.target.value) })
            }
            placeholder="3"
            min={1}
            max={20}
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">プレースホルダー</Label>
        <Input
          value={placeholder ?? ''}
          onChange={(e) => onChange({ placeholder: e.target.value || undefined })}
          placeholder="入力欄に表示するテキスト"
        />
      </div>
    </div>
  );
}
