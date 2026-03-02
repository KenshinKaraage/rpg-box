'use client';

import { useState, useCallback } from 'react';
import { Play, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { executeActionPreview } from '../utils/actionPreview';
import type { EditableAction } from '@/types/ui/actions/UIAction';

interface ActionPreviewButtonProps {
  actions: EditableAction[];
  canvasId: string;
}

/**
 * アクションリストのテスト実行 / 戻すボタン
 *
 * 「▶ テスト」を押すとアクションをエディタ上で即時実行し、
 * 「↩ 戻す」で元の状態に復元する。
 */
export function ActionPreviewButton({ actions, canvasId }: ActionPreviewButtonProps) {
  const [revertFn, setRevertFn] = useState<(() => void) | null>(null);

  const handleExecute = useCallback(() => {
    if (actions.length === 0) return;
    const revert = executeActionPreview(actions, canvasId);
    if (revert) {
      setRevertFn(() => revert);
    }
  }, [actions, canvasId]);

  const handleRevert = useCallback(() => {
    if (revertFn) {
      revertFn();
      setRevertFn(null);
    }
  }, [revertFn]);

  if (revertFn) {
    return (
      <Button
        size="sm"
        variant="outline"
        className="h-6 gap-1 text-[10px] text-orange-600 border-orange-300 hover:bg-orange-50"
        onClick={handleRevert}
      >
        <Undo2 className="h-3 w-3" />
        戻す
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className="h-6 gap-1 text-[10px]"
      onClick={handleExecute}
      disabled={actions.length === 0}
    >
      <Play className="h-3 w-3" />
      テスト
    </Button>
  );
}
