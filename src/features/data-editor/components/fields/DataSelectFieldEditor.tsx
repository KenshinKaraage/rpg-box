'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useStore } from '@/stores';
import type { DataEntry } from '@/types/data';

interface DataSelectFieldEditorProps {
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  error?: string;
  referenceTypeId: string;
}

/**
 * エントリの表示ラベルを取得する
 * values['name'] があればそれを、なければ entry.id を返す
 */
function getEntryLabel(entry: DataEntry): string {
  const name = entry.values['name'];
  if (typeof name === 'string' && name) {
    return name;
  }
  return entry.id;
}

/**
 * データ参照フィールドエディタ
 * 指定されたデータタイプのエントリを選択するドロップダウン
 */
export function DataSelectFieldEditor({
  value,
  onChange,
  disabled,
  error,
  referenceTypeId,
}: DataSelectFieldEditorProps) {
  const dataEntries = useStore((state) => state.dataEntries);
  const entries = dataEntries[referenceTypeId] ?? [];

  const handleValueChange = (selected: string) => {
    onChange(selected === '' || selected === '__none__' ? null : selected);
  };

  if (!referenceTypeId) {
    return (
      <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
        参照先データタイプが設定されていません
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

  return (
    <div className="space-y-1">
      <Select value={value || '__none__'} onValueChange={handleValueChange} disabled={disabled}>
        <SelectTrigger className={error ? 'border-red-500' : ''}>
          <SelectValue placeholder="エントリを選択..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">（なし）</SelectItem>
          {entries.map((entry) => (
            <SelectItem key={entry.id} value={entry.id}>
              {getEntryLabel(entry)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
