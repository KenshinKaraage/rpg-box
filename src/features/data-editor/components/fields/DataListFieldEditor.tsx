'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useStore } from '@/stores';

interface DataListFieldEditorProps {
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  error?: string;
  referenceTypeId: string;
}

export function DataListFieldEditor({
  value,
  onChange,
  disabled,
  error,
  referenceTypeId,
}: DataListFieldEditorProps) {
  const entries = useStore((state) => state.dataEntries[referenceTypeId] ?? []);

  if (!referenceTypeId) {
    return (
      <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
        データタイプが設定されていません
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
        エントリが存在しません
      </div>
    );
  }

  const handleCheckedChange = (entryId: string, checked: boolean) => {
    if (checked) {
      onChange([...value, entryId]);
    } else {
      onChange(value.filter((id) => id !== entryId));
    }
  };

  return (
    <div className="space-y-1">
      <div className="space-y-2 rounded-md border p-3">
        {entries.map((entry) => {
          const label = typeof entry.values['name'] === 'string' ? entry.values['name'] : entry.id;
          const checkboxId = `data-list-${entry.id}`;
          return (
            <div key={entry.id} className="flex items-center gap-2">
              <Checkbox
                id={checkboxId}
                checked={value.includes(entry.id)}
                onCheckedChange={(checked) => handleCheckedChange(entry.id, checked === true)}
                disabled={disabled}
              />
              <Label htmlFor={checkboxId} className="cursor-pointer text-sm font-normal">
                {label}
              </Label>
            </div>
          );
        })}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
