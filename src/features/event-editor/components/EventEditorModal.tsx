'use client';

import { useState, useEffect } from 'react';
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
import type { MapObject } from '@/types/map';

const TRIGGER_TYPES = [
  { type: 'talkTrigger', label: '話しかけ' },
  { type: 'touchTrigger', label: '接触' },
  { type: 'stepTrigger', label: '踏み' },
  { type: 'autoTrigger', label: '自動' },
  { type: 'inputTrigger', label: 'キー入力' },
];

interface TriggerInfo {
  type: string;
  label: string;
  index: number;
}

/** 従来の直接アクション指定モード */
interface DirectModeProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actions: EditableAction[];
  onSave: (actions: EditableAction[]) => void;
  title?: string;
}

/** オブジェクト指定モード: トリガー選択 → アクション編集 */
interface ObjectModeProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  object: MapObject;
  onSave: (triggerIndex: number, actions: EditableAction[]) => void;
}

type EventEditorModalProps = DirectModeProps | ObjectModeProps;

function isObjectMode(props: EventEditorModalProps): props is ObjectModeProps {
  return 'object' in props;
}

export function EventEditorModal(props: EventEditorModalProps) {
  if (isObjectMode(props)) {
    return <ObjectModeModal {...props} />;
  }
  return <DirectModeModal {...props} />;
}

/** 従来モード: アクション配列を直接編集 */
function DirectModeModal({
  open,
  onOpenChange,
  actions: initialActions,
  onSave,
  title = 'イベント編集',
}: DirectModeProps) {
  const [actions, setActions] = useState<EditableAction[]>(initialActions);

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) setActions(initialActions);
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
          <Button onClick={() => { onSave(actions); onOpenChange(false); }}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** オブジェクトモード: トリガー選択 → アクション編集 */
function ObjectModeModal({ open, onOpenChange, object, onSave }: ObjectModeProps) {
  const [selectedTrigger, setSelectedTrigger] = useState<TriggerInfo | null>(null);
  const [actions, setActions] = useState<EditableAction[]>([]);

  // オブジェクトのトリガーコンポーネント一覧
  const triggers: TriggerInfo[] = object.components
    .map((c, i) => {
      const info = TRIGGER_TYPES.find((t) => t.type === c.type);
      return info ? { type: info.type, label: info.label, index: i } : null;
    })
    .filter((t): t is TriggerInfo => t !== null);

  // モーダルが開いた時: トリガーが1つなら自動選択
  useEffect(() => {
    if (open) {
      if (triggers.length === 1) {
        selectTrigger(triggers[0]!);
      } else {
        setSelectedTrigger(null);
        setActions([]);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, object.id]);

  const selectTrigger = (trigger: TriggerInfo) => {
    setSelectedTrigger(trigger);
    const comp = object.components[trigger.index];
    const existing = (comp as unknown as { actions?: EditableAction[] })?.actions ?? [];
    setActions(existing);
  };

  const handleSave = () => {
    if (!selectedTrigger) return;
    onSave(selectedTrigger.index, actions);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-modal-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            イベント編集 — {object.name}
            {selectedTrigger && ` (${selectedTrigger.label})`}
          </DialogTitle>
        </DialogHeader>

        {!selectedTrigger ? (
          // トリガー選択画面
          <div className="flex-1 py-4">
            {triggers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                トリガーコンポーネントがありません
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">編集するトリガーを選択:</p>
                {triggers.map((t) => (
                  <Button
                    key={t.type}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => selectTrigger(t)}
                  >
                    {t.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        ) : (
          // アクション編集画面
          <>
            {triggers.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                className="self-start text-xs"
                onClick={() => setSelectedTrigger(null)}
              >
                ← トリガー選択に戻る
              </Button>
            )}
            <div className="min-h-0 flex-1 overflow-auto py-4">
              <ActionBlockEditor actions={actions} onChange={setActions} />
            </div>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          {selectedTrigger && (
            <Button onClick={handleSave}>保存</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
