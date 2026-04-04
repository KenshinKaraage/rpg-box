'use client';

import { useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useStore } from '@/stores';
import { createFieldTypeInstance } from '@/types/fields/registry';
import type { DataEntry } from '@/types/data';
import type { DataTableRow, DataTableColumn } from '@/types/fields/DataTableFieldType';

interface DataTableFieldEditorProps {
  value: DataTableRow[];
  onChange: (value: DataTableRow[]) => void;
  disabled?: boolean;
  error?: string;
  referenceTypeId: string;
  columns: DataTableColumn[];
}

function getEntryLabel(entry: DataEntry): string {
  const name = entry.values['name'];
  if (typeof name === 'string' && name) {
    return name;
  }
  return entry.id;
}

/**
 * データテーブルフィールドエディタ
 * データエントリを行として、カスタム列で追加値を管理するテーブルUI
 */
export function DataTableFieldEditor({
  value,
  onChange,
  disabled,
  error,
  referenceTypeId,
  columns,
}: DataTableFieldEditorProps) {
  const entries = useStore((state) => state.dataEntries[referenceTypeId] ?? []);
  const [addingEntryId, setAddingEntryId] = useState<string>('');

  // 列のフィールドタイプインスタンスをメモ化
  const columnFields = useMemo(
    () =>
      columns.map((col) => {
        const instance = createFieldTypeInstance(col.fieldType);
        if (instance && col.config) {
          Object.assign(instance, col.config);
        }
        return { column: col, fieldType: instance };
      }),
    [columns]
  );

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
  const selectedIds = value.map((row) => row.id);
  const availableEntries = entries.filter((e) => !selectedIds.includes(e.id));

  const handleChangeEntry = (index: number, newEntryId: string) => {
    const updated = [...value];
    updated[index] = { ...updated[index]!, id: newEntryId };
    onChange(updated);
  };

  const handleChangeColumnValue = (index: number, columnId: string, columnValue: unknown) => {
    const updated = [...value];
    updated[index] = {
      ...updated[index]!,
      values: { ...updated[index]!.values, [columnId]: columnValue },
    };
    onChange(updated);
  };

  const handleAdd = () => {
    if (!addingEntryId) return;
    const newRow: DataTableRow = {
      id: addingEntryId,
      values: {},
    };
    onChange([...value, newRow]);
    setAddingEntryId('');
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      {/* テーブル */}
      {value.length > 0 && (
        <div className="space-y-1">
          {value.map((row, index) => {
            const entry = entries.find((e) => e.id === row.id);
            const label = entry ? getEntryLabel(entry) : row.id;
            // この行で選択可能なエントリ = 自分自身 + 他の行で未使用
            const othersSelected = value.filter((_, i) => i !== index).map((r) => r.id);
            const selectableEntries = entries.filter(
              (e) => e.id === row.id || !othersSelected.includes(e.id)
            );

            return (
              <div key={row.id} className="rounded-md border bg-muted/20 p-2">
                <div className="flex items-center gap-1">
                  {disabled ? (
                    <div className="flex-1 truncate text-sm">{label}</div>
                  ) : (
                    <Select
                      value={row.id}
                      onValueChange={(newId) => handleChangeEntry(index, newId)}
                    >
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
                      onClick={() => handleRemove(index)}
                      aria-label={`${label}を削除`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                {/* カラム値 */}
                {columnFields.length > 0 && (
                  <div className="mt-1 space-y-1 pl-2">
                    {columnFields.map(({ column, fieldType }) => {
                      if (!fieldType) return null;
                      const colValue = row.values[column.id] ?? fieldType.getDefaultValue();
                      return (
                        <div key={column.id} className="flex items-center gap-2">
                          <span className="w-20 shrink-0 truncate text-xs text-muted-foreground">
                            {column.name}
                          </span>
                          <div className="flex-1">
                            {fieldType.renderEditor({
                              value: colValue,
                              onChange: (v) => handleChangeColumnValue(index, column.id, v),
                              disabled,
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
