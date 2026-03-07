'use client';

import { Plus, Trash2, Copy, Download, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { cn } from '@/lib/utils';
import type { DataType, DataEntry } from '@/types/data';

interface DataTypeListProps {
  dataTypes: DataType[];
  dataEntries: Record<string, DataEntry[]>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onImportDefaults: () => void;
  isImporting: boolean;
}

/**
 * データ型一覧コンポーネント
 */
export function DataTypeList({
  dataTypes,
  dataEntries,
  selectedId,
  onSelect,
  onAdd,
  onDelete,
  onDuplicate,
  onImportDefaults,
  isImporting,
}: DataTypeListProps) {
  return (
    <div className="flex h-full flex-col">
      {/* ヘッダー */}
      <div className="flex items-center justify-between border-b px-5 py-4">
        <h2 className="text-sm font-bold">データタイプ</h2>
        <div className="flex gap-1">
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            onClick={onImportDefaults}
            disabled={isImporting}
            data-testid="import-defaults-button"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            onClick={onAdd}
            data-testid="add-datatype-button"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* リスト */}
      <div className="flex-1 overflow-auto px-3 py-3">
        {dataTypes.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            <Database className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
            データ型がありません
          </div>
        ) : (
          <ul className="space-y-1.5" data-testid="datatype-list">
            {dataTypes.map((dataType) => {
              const entryCount = dataEntries[dataType.id]?.length ?? 0;
              return (
                <ContextMenu key={dataType.id}>
                  <ContextMenuTrigger asChild>
                    <li
                      className={cn(
                        'cursor-pointer rounded-lg px-4 py-3 transition-colors',
                        selectedId === dataType.id
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-accent'
                      )}
                      onClick={() => onSelect(dataType.id)}
                      data-testid={`datatype-item-${dataType.id}`}
                    >
                      <div className="text-sm font-medium">{dataType.name}</div>
                      <div
                        className={cn(
                          'mt-1 text-xs',
                          selectedId === dataType.id
                            ? 'text-primary-foreground/70'
                            : 'text-muted-foreground'
                        )}
                      >
                        {dataType.fields.length} フィールド · {entryCount} エントリ
                      </div>
                    </li>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem onClick={() => onDuplicate(dataType.id)}>
                      <Copy className="mr-2 h-4 w-4" />
                      複製
                    </ContextMenuItem>
                    <ContextMenuItem
                      onClick={() => onDelete(dataType.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      削除
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
