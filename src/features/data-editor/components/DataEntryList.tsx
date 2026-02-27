'use client';

import { Plus, Trash2, Copy, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDataFilter } from '../hooks/useDataFilter';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { cn } from '@/lib/utils';
import type { DataType, DataEntry } from '@/types/data';
import { MAX_DATA_ENTRIES_PER_TYPE } from '@/types/data';

interface DataEntryListProps {
  entries: DataEntry[];
  dataType: DataType | null;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

/**
 * データエントリ一覧コンポーネント
 */
export function DataEntryList({
  entries,
  dataType,
  selectedId,
  onSelect,
  onAdd,
  onDelete,
  onDuplicate,
}: DataEntryListProps) {
  const { query, setQuery, filteredEntries } = useDataFilter(entries);

  // dataType のフィールドから最初の string タイプを見つける
  const firstStringField = dataType?.fields.find((field) => field.type === 'string') ?? null;

  const isAddDisabled = !dataType || entries.length >= MAX_DATA_ENTRIES_PER_TYPE;

  return (
    <div className="flex h-full flex-col">
      {/* ヘッダー */}
      <div className="flex items-center justify-between border-b p-3">
        <div>
          <h2 className="text-sm font-semibold">{dataType ? dataType.name : 'データ一覧'}</h2>
          {dataType && <span className="text-xs text-muted-foreground">{entries.length} 件</span>}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={onAdd}
          disabled={isAddDisabled}
          data-testid="add-entry-button"
        >
          <Plus className="mr-1 h-4 w-4" />
          追加
        </Button>
      </div>

      {/* 検索 */}
      {dataType && entries.length > 0 && (
        <div className="border-b px-3 py-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="検索..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-8"
              data-testid="entry-search"
            />
          </div>
        </div>
      )}

      {/* リスト */}
      <div className="min-h-0 flex-1 overflow-auto">
        {!dataType ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            データ型を選択してください
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            {entries.length === 0 ? 'エントリがありません' : '一致するエントリがありません'}
          </div>
        ) : (
          <ul className="divide-y" data-testid="entry-list">
            {filteredEntries.map((entry) => (
              <ContextMenu key={entry.id}>
                <ContextMenuTrigger asChild>
                  <li
                    className={cn(
                      'cursor-pointer px-3 py-2 hover:bg-accent',
                      selectedId === entry.id && 'bg-accent'
                    )}
                    onClick={() => onSelect(entry.id)}
                    data-testid={`entry-item-${entry.id}`}
                  >
                    <div className="font-medium">{entry.id}</div>
                    {firstStringField && (
                      <div className="truncate text-xs text-muted-foreground">
                        {String(entry.values[firstStringField.id] ?? '')}
                      </div>
                    )}
                  </li>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem onClick={() => onDuplicate(entry.id)}>
                    <Copy className="mr-2 h-4 w-4" />
                    複製
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => onDelete(entry.id)} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    削除
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
