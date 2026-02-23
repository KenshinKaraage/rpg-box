'use client';

import { Label } from '@/components/ui/label';
import type { Chipset } from '@/types/map';

interface ChipPropertyEditorProps {
  chipset: Chipset | null;
  chipIndex: number | null;
  onUpdateChipProperty: (
    chipsetId: string,
    chipIndex: number,
    values: Record<string, unknown>
  ) => void;
}

export function ChipPropertyEditor({
  chipset,
  chipIndex,
  onUpdateChipProperty,
}: ChipPropertyEditorProps) {
  if (!chipset || chipIndex === null) return null;

  const chip = chipset.chips.find((c) => c.index === chipIndex);
  const values = chip?.values ?? {};

  const handleFieldChange = (fieldId: string, value: unknown) => {
    onUpdateChipProperty(chipset.id, chipIndex, { ...values, [fieldId]: value });
  };

  return (
    <div className="space-y-3" data-testid="chip-property-editor">
      <div className="text-sm font-medium">チップ #{chipIndex}</div>
      {chipset.fields.length === 0 ? (
        <div className="text-xs text-muted-foreground">フィールドがありません</div>
      ) : (
        <div className="space-y-2">
          {chipset.fields.map((field) => {
            const value = values[field.id] ?? field.getDefaultValue();
            return (
              <div key={field.id} className="space-y-1">
                <Label className="text-xs">{field.name}</Label>
                {field.renderEditor({
                  value,
                  onChange: (newValue: unknown) => handleFieldChange(field.id, newValue),
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
