'use client';

import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useStore } from '@/stores';
import type { DataEntry } from '@/types/data';

interface DataListFieldEditorProps {
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  error?: string;
  referenceTypeId: string;
}

function getEntryLabel(entry: DataEntry): string {
  const name = entry.values['name'];
  if (typeof name === 'string' && name) {
    return name;
  }
  return entry.id;
}

export function DataListFieldEditor({
  value,
  onChange,
  disabled,
  error,
  referenceTypeId,
}: DataListFieldEditorProps) {
  const entries = useStore((state) => state.dataEntries[referenceTypeId] ?? []);
  const [addingEntryId, setAddingEntryId] = useState<string>('');

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

  // 追加可能なエントリ（まだ選択されていないもの）
  const availableEntries = entries.filter((e) => !value.includes(e.id));

  const handleChange = (index: number, newEntryId: string) => {
    const updated = [...value];
    updated[index] = newEntryId;
    onChange(updated);
  };

  const handleAdd = () => {
    if (!addingEntryId) return;
    onChange([...value, addingEntryId]);
    setAddingEntryId('');
  };

  const handleRemove = (entryId: string) => {
    onChange(value.filter((id) => id !== entryId));
  };

  return (
    <div className="space-y-2">
      {/* 選択済みリスト */}
      {value.length > 0 && (
        <div className="space-y-1">
          {value.map((entryId, index) => {
            // この行で選択可能なエントリ = 自分自身 + 他の行で未使用
            const othersSelected = value.filter((_, i) => i !== index);
            const selectableEntries = entries.filter(
              (e) => e.id === entryId || !othersSelected.includes(e.id)
            );
            const entry = entries.find((e) => e.id === entryId);
            const label = entry ? getEntryLabel(entry) : entryId;
            return (
              <div key={entryId} className="flex items-center gap-1">
                {disabled ? (
                  <div className="flex-1 rounded-md border px-3 py-1.5 text-sm">{label}</div>
                ) : (
                  <Select value={entryId} onValueChange={(newId) => handleChange(index, newId)}>
                    <SelectTrigger className="h-8 flex-1 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {selectableEntries.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {getEntryLabel(e)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {!disabled && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => handleRemove(entryId)}
                    aria-label={`${label}を削除`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 追加 UI */}
      {!disabled && availableEntries.length > 0 && (
        <div className="flex items-center gap-1">
          <Select value={addingEntryId} onValueChange={setAddingEntryId}>
            <SelectTrigger className="h-8 flex-1 text-xs">
              <SelectValue placeholder="エントリを選択..." />
            </SelectTrigger>
            <SelectContent>
              {availableEntries.map((entry) => (
                <SelectItem key={entry.id} value={entry.id}>
                  {getEntryLabel(entry)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={handleAdd}
            disabled={!addingEntryId}
            aria-label="追加"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
