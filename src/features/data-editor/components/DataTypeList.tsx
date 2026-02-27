'use client';

import { Plus, Trash2, Copy, Download } from 'lucide-react';
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
      <div className="flex items-center justify-between border-b p-3">
        <h2 className="text-sm font-semibold">データ型一覧</h2>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={onImportDefaults}
            disabled={isImporting}
            data-testid="import-defaults-button"
          >
            <Download className="mr-1 h-4 w-4" />
            {isImporting ? 'インポート中...' : 'デフォルト'}
          </Button>
          <Button size="sm" variant="outline" onClick={onAdd} data-testid="add-datatype-button">
            <Plus className="mr-1 h-4 w-4" />
            追加
          </Button>
        </div>
      </div>

      {/* リスト */}
      <div className="flex-1 overflow-auto">
        {dataTypes.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">データ型がありません</div>
        ) : (
          <ul className="divide-y" data-testid="datatype-list">
            {dataTypes.map((dataType) => {
              const entryCount = dataEntries[dataType.id]?.length ?? 0;
              return (
                <ContextMenu key={dataType.id}>
                  <ContextMenuTrigger asChild>
                    <li
                      className={cn(
                        'cursor-pointer px-3 py-2 hover:bg-accent',
                        selectedId === dataType.id && 'bg-accent'
                      )}
                      onClick={() => onSelect(dataType.id)}
                      data-testid={`datatype-item-${dataType.id}`}
                    >
                      <div className="font-medium">{dataType.name}</div>
                      <div className="text-xs text-muted-foreground">
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
