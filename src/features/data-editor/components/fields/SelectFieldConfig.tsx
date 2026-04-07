'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import type { SelectOption } from '@/types/fields/SelectFieldType';
import type { FieldConfigContext } from '@/types/fields/FieldType';
import { generateId } from '@/lib/utils';

interface SelectFieldConfigProps {
  options: SelectOption[];
  visibilityMap?: Record<string, string[]>;
  context?: FieldConfigContext;
  onChange: (updates: Record<string, unknown>) => void;
}

export function SelectFieldConfig({
  options,
  visibilityMap,
  context,
  onChange,
}: SelectFieldConfigProps) {
  const allFields = context?.allFields ?? [];

  const handleAddOption = () => {
    const newOption: SelectOption = {
      value: generateId(
        'option',
        options.map((o) => o.value)
      ),
      label: '新しい選択肢',
    };
    onChange({ options: [...options, newOption] });
  };

  const handleRemoveOption = (index: number) => {
    const removed = options[index];
    const updated = options.filter((_, i) => i !== index);
    // visibilityMap からも削除
    if (removed && visibilityMap) {
      const newMap = { ...visibilityMap };
      delete newMap[removed.value];
      onChange({ options: updated, visibilityMap: newMap });
    } else {
      onChange({ options: updated });
    }
  };

  const handleOptionChange = (index: number, field: keyof SelectOption, value: string) => {
    const oldOpt = options[index];
    const updated = options.map((opt, i) => (i === index ? { ...opt, [field]: value } : opt));
    // value が変わった場合、visibilityMap のキーも更新
    if (field === 'value' && oldOpt && visibilityMap && oldOpt.value in visibilityMap) {
      const newMap = { ...visibilityMap };
      newMap[value] = newMap[oldOpt.value]!;
      delete newMap[oldOpt.value];
      onChange({ options: updated, visibilityMap: newMap });
    } else {
      onChange({ options: updated });
    }
  };

  const handleToggleField = (optionValue: string, fieldId: string, checked: boolean) => {
    const current = visibilityMap?.[optionValue] ?? [];
    const updated = checked ? [...current, fieldId] : current.filter((id) => id !== fieldId);
    const newMap = { ...visibilityMap, [optionValue]: updated };
    // 空配列のエントリは削除
    if (updated.length === 0) delete newMap[optionValue];
    onChange({ visibilityMap: newMap });
  };

  return (
    <div className="space-y-3">
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

      {/* 条件付き表示: 選択肢ごとに表示するフィールドを設定 */}
      {allFields.length > 0 && options.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs">条件付き表示</Label>
          <p className="text-[11px] text-muted-foreground">選択肢ごとに表示するフィールドを設定</p>
          <div className="space-y-2">
            {options.map((opt) => (
              <div key={opt.value} className="rounded border p-2 space-y-1">
                <span className="text-xs font-medium">{opt.label || opt.value}</span>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {allFields.map((f) => {
                    const isChecked = visibilityMap?.[opt.value]?.includes(f.id) ?? false;
                    return (
                      <label key={f.id} className="flex items-center gap-1 text-[11px]">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={(checked) =>
                            handleToggleField(opt.value, f.id, checked === true)
                          }
                          className="h-3.5 w-3.5"
                        />
                        {f.name || f.id}
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
