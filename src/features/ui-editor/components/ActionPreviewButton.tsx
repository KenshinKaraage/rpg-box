'use client';

import { useState, useCallback } from 'react';
import { Play, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { executeActionPreview } from '../utils/actionPreview';
import type { EditableAction } from '@/types/ui/actions/UIAction';
import type { FunctionArgDef } from '@/features/event-editor/registry/actionBlockRegistry';
import { getArgField } from '@/features/event-editor/components/arg-fields';
import '@/features/event-editor/components/arg-fields/register';

interface ActionPreviewButtonProps {
  actions: EditableAction[];
  canvasId: string;
  /** ファンクション引数定義（テスト値入力用） */
  functionArgs?: FunctionArgDef[];
}

/**
 * アクションリストのテスト実行 / 戻すボタン
 *
 * 引数がある場合は入力フォームを表示し、入力した値でテスト実行する。
 */
export function ActionPreviewButton({ actions, canvasId, functionArgs }: ActionPreviewButtonProps) {
  const [revertFn, setRevertFn] = useState<(() => void) | null>(null);
  const [executing, setExecuting] = useState(false);
  const [testArgs, setTestArgs] = useState<Record<string, unknown>>({});

  const hasArgs = functionArgs && functionArgs.length > 0;

  const handleExecute = useCallback(async () => {
    if (actions.length === 0) return;
    setExecuting(true);

    // 値は arg-fields レンダラーが正しい型で保持しているのでそのまま渡す
    const resolvedArgs: Record<string, unknown> = {};
    if (functionArgs) {
      for (const arg of functionArgs) {
        resolvedArgs[arg.id] = testArgs[arg.id] ?? '';
      }
    }

    const revert = await executeActionPreview(actions, canvasId, resolvedArgs);
    setExecuting(false);
    if (revert) {
      setRevertFn(() => revert);
    }
  }, [actions, canvasId, functionArgs, testArgs]);

  const handleRevert = useCallback(() => {
    if (revertFn) {
      revertFn();
      setRevertFn(null);
    }
  }, [revertFn]);

  return (
    <div className="space-y-1">
      {/* 引数テスト入力 */}
      {hasArgs && (
        <div className="space-y-1 rounded border border-dashed p-2">
          <Label className="text-[10px] text-muted-foreground">テスト引数</Label>
          {functionArgs!.map((arg) => {
            const Renderer = getArgField(arg.fieldType);
            return (
              <div key={arg.id} className="flex items-center gap-1">
                <Label className="w-16 shrink-0 truncate text-[10px]" title={arg.name}>
                  {arg.name}
                </Label>
                {Renderer ? (
                  <Renderer
                    value={testArgs[arg.id]}
                    onChange={(v) =>
                      setTestArgs((prev) => ({ ...prev, [arg.id]: v }))
                    }
                    placeholder={arg.fieldType}
                  />
                ) : (
                  <Input
                    className="h-6 flex-1 text-[10px]"
                    placeholder={arg.fieldType}
                    value={String(testArgs[arg.id] ?? '')}
                    onChange={(e) =>
                      setTestArgs((prev) => ({ ...prev, [arg.id]: e.target.value }))
                    }
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 実行 / 戻すボタン */}
      {revertFn ? (
        <Button
          size="sm"
          variant="outline"
          className="h-6 gap-1 text-[10px] text-orange-600 border-orange-300 hover:bg-orange-50"
          onClick={handleRevert}
        >
          <Undo2 className="h-3 w-3" />
          戻す
        </Button>
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="h-6 gap-1 text-[10px]"
          onClick={handleExecute}
          disabled={actions.length === 0 || executing}
        >
          <Play className="h-3 w-3" />
          テスト
        </Button>
      )}
    </div>
  );
}
