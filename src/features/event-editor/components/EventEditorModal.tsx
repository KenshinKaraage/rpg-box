'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ActionBlockEditor } from './ActionBlockEditor';
import type { EditableAction } from '@/types/ui/actions/UIAction';

interface EventEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actions: EditableAction[];
  onSave: (actions: EditableAction[]) => void;
  title?: string;
}

export function EventEditorModal({
  open,
  onOpenChange,
  actions: initialActions,
  onSave,
  title = 'イベント編集',
}: EventEditorModalProps) {
  const [actions, setActions] = useState<EditableAction[]>(initialActions);

  // Reset when opened with new actions
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setActions(initialActions);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-modal-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-auto py-4">
          <ActionBlockEditor actions={actions} onChange={setActions} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button
            onClick={() => {
              onSave(actions);
              onOpenChange(false);
            }}
          >
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
