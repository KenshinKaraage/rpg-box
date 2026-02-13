'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { SelectOption } from '@/types/fields/SelectFieldType';

interface SelectFieldConfigProps {
  options: SelectOption[];
  placeholder?: string;
  onChange: (updates: Record<string, unknown>) => void;
}

export function SelectFieldConfig({ options, placeholder, onChange }: SelectFieldConfigProps) {
  const handleAddOption = () => {
    const newOption: SelectOption = {
      value: `option_${Date.now()}`,
      label: '新しい選択肢',
    };
    onChange({ options: [...options, newOption] });
  };

  const handleRemoveOption = (index: number) => {
    const updated = options.filter((_, i) => i !== index);
    onChange({ options: updated });
  };

  const handleOptionChange = (index: number, field: keyof SelectOption, value: string) => {
    const updated = options.map((opt, i) => (i === index ? { ...opt, [field]: value } : opt));
    onChange({ options: updated });
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-xs">プレースホルダー</Label>
        <Input
          value={placeholder ?? ''}
          onChange={(e) => onChange({ placeholder: e.target.value || undefined })}
          placeholder="選択してください"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">選択肢</Label>
          <Button size="sm" variant="outline" onClick={handleAddOption} className="h-6 text-xs">
            <Plus className="mr-1 h-3 w-3" />
            追加
          </Button>
        </div>

        {options.length === 0 ? (
          <p className="text-xs text-muted-foreground">選択肢がありません</p>
        ) : (
          <div className="space-y-1">
            {options.map((opt, index) => (
              <div key={index} className="flex items-center gap-1">
                <Input
                  className="flex-1 h-8 text-xs"
                  value={opt.value}
                  onChange={(e) => handleOptionChange(index, 'value', e.target.value)}
                  placeholder="値"
                />
                <Input
                  className="flex-1 h-8 text-xs"
                  value={opt.label}
                  onChange={(e) => handleOptionChange(index, 'label', e.target.value)}
                  placeholder="ラベル"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                  onClick={() => handleRemoveOption(index)}
                  aria-label={`選択肢「${opt.label}」を削除`}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
