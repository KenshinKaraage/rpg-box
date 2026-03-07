'use client';

import { Trash2, Copy, Search, FileText } from 'lucide-react';
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
      <div className="flex items-center justify-between border-b px-5 py-4">
        <h2 className="text-lg font-bold">
          {dataType ? dataType.name : 'エントリ'}
        </h2>
        <div className="flex gap-2">
          {dataType && (
            <Button
              size="sm"
              variant="outline"
              className="border-primary text-primary"
              onClick={() => onSelect(null)}
            >
              フィールド編集
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="border-primary text-primary"
            onClick={onAdd}
            disabled={isAddDisabled}
            data-testid="add-entry-button"
          >
            新規作成
          </Button>
        </div>
      </div>

      {/* 検索 */}
      {dataType && entries.length > 0 && (
        <div className="border-b px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="検索..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
              data-testid="entry-search"
            />
          </div>
        </div>
      )}

      {/* リスト */}
      <div className="min-h-0 flex-1 overflow-auto px-4 py-4">
        {!dataType ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            <FileText className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
            データ型を選択してください
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            <FileText className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
            {entries.length === 0 ? 'エントリがありません' : '一致するエントリがありません'}
          </div>
        ) : (
          <ul className="space-y-3" data-testid="entry-list">
            {filteredEntries.map((entry) => (
              <ContextMenu key={entry.id}>
                <ContextMenuTrigger asChild>
                  <li
                    className={cn(
                      'flex cursor-pointer items-center justify-between rounded-xl border-2 px-5 py-4 transition-colors',
                      selectedId === entry.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                    onClick={() => onSelect(entry.id)}
                    data-testid={`entry-item-${entry.id}`}
                  >
                    <div>
                      <div className="text-sm font-bold">{entry.id}</div>
                      {firstStringField && (
                        <div className="mt-1 truncate text-xs text-muted-foreground">
                          {String(entry.values[firstStringField.id] ?? '')}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDuplicate(entry.id);
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(entry.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
