'use client';

import { useState } from 'react';
import { Plus, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getActionBlock } from '../registry/actionBlockRegistry';
import { ActionSelector } from './ActionSelector';
import type { EditableAction } from '@/types/ui/actions/UIAction';
import type { FunctionArgDef } from '../registry/actionBlockRegistry';
import { getAction } from '@/engine/actions';
import { getUIAction } from '@/types/ui/actions';

// =============================================================================
// 型定義
// =============================================================================

interface ActionBlockEditorProps {
  actions: EditableAction[];
  onChange: (actions: EditableAction[]) => void;
  /** UIFunction の引数定義（UIFunction 内のブロックでのみ渡される） */
  functionArgs?: FunctionArgDef[];
}

// =============================================================================
// ActionBlockEditor コンポーネント
// =============================================================================

export function ActionBlockEditor({ actions, onChange, functionArgs }: ActionBlockEditorProps) {
  const [selectorOpen, setSelectorOpen] = useState(false);

  const handleAddAction = (type: string) => {
    const ActionClass = getAction(type) ?? getUIAction(type);
    if (!ActionClass) return;
    const newAction = new ActionClass();
    onChange([...actions, newAction]);
  };

  const handleChangeAction = (index: number, updatedAction: EditableAction) => {
    const newActions = [...actions];
    newActions[index] = updatedAction;
    onChange(newActions);
  };

  const handleDeleteAction = (index: number) => {
    const newActions = actions.filter((_, i) => i !== index);
    onChange(newActions);
  };

  return (
    <div className="space-y-2">
      {actions.length === 0 ? (
        <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
          アクションがありません
        </div>
      ) : (
        actions.map((action, index) => {
          const blockDef = getActionBlock(action.type);
          if (!blockDef) {
            return (
              <div
                key={index}
                className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm"
                data-testid={`unknown-action-${index}`}
              >
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span>不明なアクション: {action.type}</span>
              </div>
            );
          }
          const BlockComponent = blockDef.BlockComponent;
          return (
            <div key={index} data-testid={`action-block-${index}`}>
              <BlockComponent
                action={action}
                onChange={(updated) => handleChangeAction(index, updated)}
                onDelete={() => handleDeleteAction(index)}
                functionArgs={functionArgs}
              />
            </div>
          );
        })
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={() => setSelectorOpen(true)}
        data-testid="add-action-button"
      >
        <Plus className="mr-1 h-4 w-4" />
        アクションを追加
      </Button>

      <ActionSelector
        open={selectorOpen}
        onOpenChange={setSelectorOpen}
        onSelect={handleAddAction}
      />
    </div>
  );
}
