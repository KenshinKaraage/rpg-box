'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const COLOR_PRESETS = [
  { value: '#ef4444', label: '赤' },
  { value: '#f97316', label: 'オレンジ' },
  { value: '#eab308', label: '黄' },
  { value: '#22c55e', label: '緑' },
  { value: '#06b6d4', label: '水色' },
  { value: '#3b82f6', label: '青' },
  { value: '#8b5cf6', label: '紫' },
  { value: '#ec4899', label: 'ピンク' },
  { value: '#f43f5e', label: 'ローズ' },
  { value: '#14b8a6', label: 'ティール' },
  { value: '#a855f7', label: 'バイオレット' },
  { value: '#6366f1', label: 'インディゴ' },
  { value: '#78716c', label: 'グレー' },
  { value: '#ffffff', label: '白' },
];

interface ColorPresetPickerProps {
  value?: string;
  onChange: (color: string | undefined) => void;
}

export function ColorPresetPicker({ value, onChange }: ColorPresetPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-2">
          {value ? (
            <div className="h-4 w-4 rounded border" style={{ backgroundColor: value }} />
          ) : (
            <div className="h-4 w-4 rounded border border-dashed" />
          )}
          <span className="text-xs">{(value && COLOR_PRESETS.find((c) => c.value === value)?.label) || 'なし'}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="space-y-2">
          <button
            className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-accent"
            onClick={() => { onChange(undefined); setOpen(false); }}
          >
            <X className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">なし</span>
          </button>
          <div className="grid grid-cols-7 gap-1.5">
            {COLOR_PRESETS.map((c) => (
              <button
                key={c.value}
                className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${value === c.value ? 'border-foreground ring-2 ring-primary' : 'border-transparent'}`}
                style={{ backgroundColor: c.value }}
                title={c.label}
                onClick={() => { onChange(c.value); setOpen(false); }}
              />
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
