'use client';

import { useState, useCallback } from 'react';
import { Plus, Trash2, ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { generateId } from '@/lib/utils';
import { ActionBlockEditor } from '@/features/event-editor/components/ActionBlockEditor';
import { deserializeActions, serializeActions } from '../utils/actionBridge';
import type { UIActionEntry, SerializedAction } from '@/types/ui/components/ActionComponent';
import type { EditableAction } from '@/types/ui/actions/UIAction';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface ActionComponentEditorProps {
  actions: UIActionEntry[];
  onChange: (actions: UIActionEntry[]) => void;
}

// ──────────────────────────────────────────────
// Single entry editor
// ──────────────────────────────────────────────

function ActionEntryEditor({
  entry,
  onUpdate,
  onDelete,
}: {
  entry: UIActionEntry;
  onUpdate: (updated: UIActionEntry) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const handleBlocksChange = useCallback(
    (editableActions: EditableAction[]) => {
      const blocks: SerializedAction[] = serializeActions(editableActions);
      onUpdate({ ...entry, blocks });
    },
    [entry, onUpdate]
  );

  const eventActions = expanded ? deserializeActions(entry.blocks) : [];

  return (
    <div
      className="rounded border bg-background"
      data-testid={`action-entry-${entry.id}`}
    >
      {/* Header */}
      <div className="flex items-center gap-1 px-2 py-1">
        <Button
          size="sm"
          variant="ghost"
          className="h-5 w-5 p-0"
          onClick={() => setExpanded(!expanded)}
          aria-label={expanded ? '閉じる' : '開く'}
        >
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </Button>
        <Input
          className="h-6 flex-1 border-0 bg-transparent px-1 text-xs shadow-none focus-visible:ring-0"
          value={entry.name}
          onChange={(e) => onUpdate({ ...entry, name: e.target.value })}
          aria-label="アクション名"
        />
        <span className="shrink-0 text-[10px] text-muted-foreground">
          {entry.blocks.length}
        </span>
        <Button
          size="sm"
          variant="ghost"
          className="h-5 w-5 p-0"
          onClick={onDelete}
          aria-label={`${entry.name}を削除`}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* Block editor */}
      {expanded && (
        <div className="border-t px-2 py-2">
          <ActionBlockEditor
            actions={eventActions}
            onChange={handleBlocksChange}
          />
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// ActionComponentEditor
// ──────────────────────────────────────────────

export function ActionComponentEditor({ actions, onChange }: ActionComponentEditorProps) {
  const handleAddEntry = useCallback(() => {
    const existingIds = actions.map((a) => a.id);
    const id = generateId('act', existingIds);
    const newEntry: UIActionEntry = {
      id,
      name: '新しいアクション',
      blocks: [],
    };
    onChange([...actions, newEntry]);
  }, [actions, onChange]);

  const handleUpdateEntry = useCallback(
    (index: number, updated: UIActionEntry) => {
      const newActions = [...actions];
      newActions[index] = updated;
      onChange(newActions);
    },
    [actions, onChange]
  );

  const handleDeleteEntry = useCallback(
    (index: number) => {
      onChange(actions.filter((_, i) => i !== index));
    },
    [actions, onChange]
  );

  return (
    <div className="space-y-2" data-testid="action-component-editor">
      {actions.length === 0 ? (
        <div className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">
          アクションエントリなし
        </div>
      ) : (
        actions.map((entry, index) => (
          <ActionEntryEditor
            key={entry.id}
            entry={entry}
            onUpdate={(updated) => handleUpdateEntry(index, updated)}
            onDelete={() => handleDeleteEntry(index)}
          />
        ))
      )}

      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={handleAddEntry}
        data-testid="add-action-entry"
      >
        <Plus className="mr-1 h-3.5 w-3.5" />
        アクションエントリ追加
      </Button>
    </div>
  );
}
