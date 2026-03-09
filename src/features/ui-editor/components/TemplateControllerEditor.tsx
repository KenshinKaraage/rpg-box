'use client';

import { useMemo } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { generateId } from '@/lib/utils';
import { getFieldTypeOptions } from '@/types/fields';
import { ActionBlockEditor } from '@/features/event-editor/components/ActionBlockEditor';
import { deserializeActions, serializeActions } from '../utils/actionBridge';
import type { TemplateArg } from '@/types/ui/components/TemplateControllerComponent';
import type { SerializedAction } from '@/types/ui/components/ActionTypes';
import type { EditableAction } from '@/types/ui/actions/UIAction';

// ──────────────────────────────────────────────
// Props
// ──────────────────────────────────────────────

interface TemplateControllerEditorProps {
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
}

/** ファンクション引数で選択可能なフィールドタイプ */
const ARG_FIELD_TYPES = ['number', 'string', 'boolean', 'color', 'select'];

// ──────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────

export function TemplateControllerEditor({ data, onChange }: TemplateControllerEditorProps) {
  const args = (data.args as TemplateArg[] | undefined) ?? [];
  const onSpawnActions = (data.onSpawnActions as SerializedAction[] | undefined) ?? [];
  const onApplyActions = (data.onApplyActions as SerializedAction[] | undefined) ?? [];

  const fieldTypeOptions = useMemo(() => getFieldTypeOptions(ARG_FIELD_TYPES), []);

  // ── Arg handlers ──

  const handleAddArg = () => {
    const argId = generateId(
      'arg',
      args.map((a) => a.id)
    );
    const newArg: TemplateArg = {
      id: argId,
      name: '引数',
      fieldType: 'string',
      defaultValue: '',
    };
    onChange({ ...data, args: [...args, newArg] });
  };

  const handleUpdateArg = (argId: string, updates: Partial<TemplateArg>) => {
    const newArgs = args.map((a) => (a.id === argId ? { ...a, ...updates } : a));
    onChange({ ...data, args: newArgs });
  };

  const handleDeleteArg = (argId: string) => {
    onChange({ ...data, args: args.filter((a) => a.id !== argId) });
  };

  // ── Action handlers ──

  const handleSpawnActionsChange = (editableActions: EditableAction[]) => {
    onChange({ ...data, onSpawnActions: serializeActions(editableActions) });
  };

  const handleApplyActionsChange = (editableActions: EditableAction[]) => {
    onChange({ ...data, onApplyActions: serializeActions(editableActions) });
  };

  return (
    <div className="space-y-3 px-2 pb-2" data-testid="template-controller-editor">
      {/* Args section */}
      <div>
        <div className="flex items-center justify-between">
          <Label className="text-[10px]">テンプレート引数</Label>
          <Button
            size="sm"
            variant="ghost"
            className="h-5 px-1 text-[10px]"
            onClick={handleAddArg}
            data-testid="add-template-arg"
          >
            <Plus className="mr-0.5 h-3 w-3" />
            追加
          </Button>
        </div>
        {args.length === 0 ? (
          <div className="text-[10px] text-muted-foreground">引数なし</div>
        ) : (
          <ul className="mt-1 space-y-1">
            {args.map((arg) => (
              <li key={arg.id} className="flex items-center gap-1" data-testid={`template-arg-${arg.id}`}>
                <Input
                  className="h-5 flex-1 px-1 text-[10px]"
                  value={arg.name}
                  onChange={(e) => handleUpdateArg(arg.id, { name: e.target.value })}
                />
                <Select
                  value={arg.fieldType}
                  onValueChange={(v) => handleUpdateArg(arg.id, { fieldType: v })}
                >
                  <SelectTrigger className="h-5 w-20 px-1 text-[10px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fieldTypeOptions.map((opt) => (
                      <SelectItem key={opt.type} value={opt.type}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-4 w-4 p-0"
                  onClick={() => handleDeleteArg(arg.id)}
                  aria-label={`${arg.name}を削除`}
                >
                  <Trash2 className="h-2.5 w-2.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* onSpawn actions */}
      <div>
        <Label className="text-[10px]">生成時アクション (onSpawn)</Label>
        <div className="mt-1">
          <ActionBlockEditor
            actions={deserializeActions(onSpawnActions)}
            onChange={handleSpawnActionsChange}
          />
        </div>
      </div>

      {/* onApply actions */}
      <div>
        <Label className="text-[10px]">更新時アクション (onApply)</Label>
        <div className="mt-1">
          <ActionBlockEditor
            actions={deserializeActions(onApplyActions)}
            onChange={handleApplyActionsChange}
          />
        </div>
      </div>
    </div>
  );
}
