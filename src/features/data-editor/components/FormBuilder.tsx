'use client';

import { useCallback, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { DataType, DataEntry } from '@/types/data';
import { NAME_FIELD_ID, validateDataId } from '@/types/data';
import { computeFieldVisibility } from '../utils/conditionEvaluator';

interface FormBuilderProps {
  dataType: DataType;
  entry: DataEntry;
  existingEntryIds: string[];
  onUpdateEntry: (typeId: string, entryId: string, values: Record<string, unknown>) => void;
  onUpdateEntryId: (typeId: string, oldId: string, newId: string) => void;
}

/**
 * データエントリの動的フォームビルダー
 *
 * DataType のフィールド定義に基づいて、フォームを動的に生成する。
 * 各フィールドの表示条件（displayCondition）を評価し、条件を満たすフィールドのみ表示する。
 */
export function FormBuilder({
  dataType,
  entry,
  existingEntryIds,
  onUpdateEntry,
  onUpdateEntryId,
}: FormBuilderProps) {
  const visibility = computeFieldVisibility(dataType.fields, entry.values);
  const [localId, setLocalId] = useState(entry.id);
  const [idError, setIdError] = useState<string | null>(null);

  // Sync local ID when entry changes
  const [prevEntryId, setPrevEntryId] = useState(entry.id);
  if (entry.id !== prevEntryId) {
    setPrevEntryId(entry.id);
    setLocalId(entry.id);
    setIdError(null);
  }

  const handleIdBlur = () => {
    if (localId === entry.id) {
      setIdError(null);
      return;
    }
    const validation = validateDataId(localId);
    if (!validation.valid) {
      setIdError(validation.message ?? 'IDが無効です');
      return;
    }
    const otherIds = existingEntryIds.filter((id) => id !== entry.id);
    if (otherIds.includes(localId)) {
      setIdError('このIDは既に使用されています');
      return;
    }
    setIdError(null);
    onUpdateEntryId(dataType.id, entry.id, localId);
  };

  const handleFieldChange = useCallback(
    (fieldId: string, value: unknown) => {
      onUpdateEntry(dataType.id, entry.id, {
        ...entry.values,
        [fieldId]: value,
      });
    },
    [dataType.id, entry.id, entry.values, onUpdateEntry]
  );

  return (
    <div className="flex h-full flex-col">
      {/* ヘッダー */}
      <div className="border-b px-5 py-4">
        <h3 className="text-sm font-bold">
          {(() => {
            const nameVal = entry.values[NAME_FIELD_ID];
            return nameVal && typeof nameVal === 'string' && nameVal.trim()
              ? nameVal
              : entry.id;
          })()}
        </h3>
      </div>

      {/* フィールド */}
      <div className="flex-1 overflow-auto p-5 space-y-6">
        {/* エントリID */}
        <div className="space-y-2">
          <Label htmlFor="entry-id">ID</Label>
          <Input
            id="entry-id"
            value={localId}
            onChange={(e) => setLocalId(e.target.value)}
            onBlur={handleIdBlur}
            className="font-mono"
          />
          {idError && <p className="text-xs text-destructive">{idError}</p>}
        </div>

        {dataType.fields.map((field) => {
          if (!visibility[field.id]) return null;
          const value = entry.values[field.id] ?? field.getDefaultValue();
          return (
            <div key={field.id} className="space-y-2">
              <Label>
                {field.name}
                {field.required && <span className="ml-1 text-red-500">*</span>}
              </Label>
              {field.renderEditor({
                value,
                onChange: (newValue: unknown) => handleFieldChange(field.id, newValue),
              })}
            </div>
          );
        })}
        {dataType.fields.length === 0 && (
          <p className="text-sm text-muted-foreground">フィールドが定義されていません</p>
        )}
      </div>
    </div>
  );
}
