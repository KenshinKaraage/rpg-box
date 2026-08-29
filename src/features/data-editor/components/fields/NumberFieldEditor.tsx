'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface NumberFieldEditorProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  error?: string;
  min?: number;
  max?: number;
  step?: number;
  /** 呼び出し側で高さ・文字サイズ等を上書きしたい場合（例: コンパクトなプロパティパネル） */
  className?: string;
  placeholder?: string;
  id?: string;
  'data-testid'?: string;
}

export function NumberFieldEditor({
  value,
  onChange,
  disabled,
  error,
  min,
  max,
  step,
  className,
  placeholder,
  id,
  'data-testid': testId,
}: NumberFieldEditorProps) {
  const [localValue, setLocalValue] = useState(Number.isNaN(value) ? '' : String(value));

  return (
    <div className="space-y-1">
      <Input
        id={id}
        type="number"
        value={localValue}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        data-testid={testId}
        className={cn(error && 'border-red-500', className)}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw !== '' && raw !== '-' && isNaN(Number(raw))) return;
          setLocalValue(raw);
          const v = parseFloat(raw);
          if (!isNaN(v)) onChange(v);
        }}
        onBlur={() => {
          const parsed = parseFloat(localValue);
          // 空欄のまま確定した場合はフォールバック値（min優先、なければ0）にする
          const resolved = isNaN(parsed) ? (min ?? 0) : parsed;
          // min/max は入力途中では適用せず、確定（blur）時にだけクランプする
          let clamped = resolved;
          if (min !== undefined) clamped = Math.max(min, clamped);
          if (max !== undefined) clamped = Math.min(max, clamped);
          setLocalValue(String(clamped));
          // 空欄だった、またはクランプで値が変わった場合のみ通知する
          // （typing中に既に同じ値でonChange済みのケースで重複通知しないよう、
          //   確定前の value プロパティではなく実際にパースした値と比較する）
          if (isNaN(parsed) || clamped !== parsed) onChange(clamped);
        }}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
