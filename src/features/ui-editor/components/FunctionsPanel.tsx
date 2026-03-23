'use client';

import { useState, useCallback, useMemo } from 'react';
import { Plus, Trash2, ChevronRight, ChevronDown } from 'lucide-react';
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
import { useStore } from '@/stores';
import { generateId } from '@/lib/utils';
import { getFieldTypeOptions } from '@/types/fields';
import { ActionBlockEditor } from '@/features/event-editor/components/ActionBlockEditor';
import { deserializeActions, serializeActions } from '../utils/actionBridge';
import { ActionPreviewButton } from './ActionPreviewButton';
import type { EditorUIFunction, TemplateArg } from '@/stores/uiEditorSlice';
import type { EditableAction } from '@/types/ui/actions/UIAction';

interface FunctionsPanelProps {
  functions: EditorUIFunction[];
}

/** ファンクション引数で選択可能なフィールドタイプ */
const ARG_FIELD_TYPES = ['number', 'string', 'boolean', 'color', 'select'];

export function FunctionsPanel({ functions }: FunctionsPanelProps) {
  const selectedCanvasId = useStore((s) => s.selectedCanvasId);
  const addUIFunction = useStore((s) => s.addUIFunction);
  const updateUIFunction = useStore((s) => s.updateUIFunction);
  const deleteUIFunction = useStore((s) => s.deleteUIFunction);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fieldTypeOptions = useMemo(() => getFieldTypeOptions(ARG_FIELD_TYPES), []);

  const handleAdd = useCallback(() => {
    if (!selectedCanvasId) return;
    const id = generateId(
      'fn',
      functions.map((f) => f.id)
    );
    addUIFunction(selectedCanvasId, {
      id,
      name: '新しいファンクション',
      args: [],
      actions: [],
    });
    setExpandedId(id);
  }, [selectedCanvasId, functions, addUIFunction]);

  const handleDelete = useCallback(
    (fnId: string) => {
      if (!selectedCanvasId) return;
      deleteUIFunction(selectedCanvasId, fnId);
      if (expandedId === fnId) setExpandedId(null);
    },
    [selectedCanvasId, deleteUIFunction, expandedId]
  );

  const handleUpdateName = useCallback(
    (fnId: string, name: string) => {
      if (!selectedCanvasId) return;
      updateUIFunction(selectedCanvasId, fnId, { name });
    },
    [selectedCanvasId, updateUIFunction]
  );

  const handleAddArg = useCallback(
    (fnId: string, currentArgs: TemplateArg[]) => {
      if (!selectedCanvasId) return;
      const argId = generateId(
        'arg',
        currentArgs.map((a) => a.id)
      );
      const newArg: TemplateArg = {
        id: argId,
        name: '引数',
        fieldType: 'string',
        defaultValue: '',
      };
      updateUIFunction(selectedCanvasId, fnId, {
        args: [...currentArgs, newArg],
      });
    },
    [selectedCanvasId, updateUIFunction]
  );

  const handleUpdateArg = useCallback(
    (fnId: string, currentArgs: TemplateArg[], argId: string, updates: Partial<TemplateArg>) => {
      if (!selectedCanvasId) return;
      const newArgs = currentArgs.map((a) =>
        a.id === argId ? { ...a, ...updates } : a
      );
      updateUIFunction(selectedCanvasId, fnId, { args: newArgs });
    },
    [selectedCanvasId, updateUIFunction]
  );

  const handleDeleteArg = useCallback(
    (fnId: string, currentArgs: TemplateArg[], argId: string) => {
      if (!selectedCanvasId) return;
      updateUIFunction(selectedCanvasId, fnId, {
        args: currentArgs.filter((a) => a.id !== argId),
      });
    },
    [selectedCanvasId, updateUIFunction]
  );

  const handleUpdateActions = useCallback(
    (fnId: string, editableActions: EditableAction[]) => {
      if (!selectedCanvasId) return;
      updateUIFunction(selectedCanvasId, fnId, {
        actions: serializeActions(editableActions),
      });
    },
    [selectedCanvasId, updateUIFunction]
  );

  return (
    <div className="p-2" data-testid="functions-panel">
      {/* Add button */}
      <div className="mb-2">
        <Button
          size="sm"
          variant="outline"
          className="w-full gap-1 text-xs"
          disabled={!selectedCanvasId}
          onClick={handleAdd}
          data-testid="add-function-btn"
        >
          <Plus className="h-3.5 w-3.5" />
          ファンクション追加
        </Button>
      </div>

      {/* Function list */}
      {functions.length === 0 ? (
        <div className="text-center text-xs text-muted-foreground">
          ファンクションなし
        </div>
      ) : (
        <ul className="space-y-1">
          {functions.map((fn) => {
            const isExpanded = expandedId === fn.id;
            return (
              <li key={fn.id} data-testid={`function-item-${fn.id}`}>
                {/* Header row */}
                <div className="flex items-center gap-1 rounded px-1 py-0.5 hover:bg-accent">
                  <button
                    type="button"
                    className="shrink-0"
                    onClick={() => setExpandedId(isExpanded ? null : fn.id)}
                    aria-label={isExpanded ? '折りたたむ' : '展開する'}
                    data-testid={`toggle-function-${fn.id}`}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <span className="flex-1 truncate text-xs">{fn.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {fn.args.length}args
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-5 w-5 p-0"
                    onClick={() => handleDelete(fn.id)}
                    aria-label={`${fn.name}を削除`}
                    data-testid={`delete-function-${fn.id}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="ml-4 mt-1 space-y-2 border-l pl-2" data-testid={`function-detail-${fn.id}`}>
                    {/* Name edit */}
                    <div>
                      <Label className="text-[10px]">名前</Label>
                      <Input
                        className="mt-0.5 h-6 text-xs"
                        value={fn.name}
                        onChange={(e) => handleUpdateName(fn.id, e.target.value)}
                        data-testid={`function-name-input-${fn.id}`}
                      />
                    </div>

                    {/* Args */}
                    <div>
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px]">引数</Label>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-5 px-1 text-[10px]"
                          onClick={() => handleAddArg(fn.id, fn.args)}
                          data-testid={`add-arg-${fn.id}`}
                        >
                          <Plus className="mr-0.5 h-3 w-3" />
                          追加
                        </Button>
                      </div>
                      {fn.args.length === 0 ? (
                        <div className="text-[10px] text-muted-foreground">引数なし</div>
                      ) : (
                        <ul className="mt-1 space-y-1">
                          {fn.args.map((arg) => (
                            <li key={arg.id} className="flex items-center gap-1" data-testid={`arg-item-${arg.id}`}>
                              <Input
                                className="h-5 flex-1 px-1 text-[10px]"
                                value={arg.name}
                                onChange={(e) =>
                                  handleUpdateArg(fn.id, fn.args, arg.id, { name: e.target.value })
                                }
                              />
                              <Select
                                value={arg.fieldType}
                                onValueChange={(v) =>
                                  handleUpdateArg(fn.id, fn.args, arg.id, { fieldType: v })
                                }
                              >
                                <SelectTrigger className="h-5 w-20 px-1 text-[10px]" data-testid={`arg-type-${arg.id}`}>
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
                                onClick={() => handleDeleteArg(fn.id, fn.args, arg.id)}
                                aria-label={`${arg.name}を削除`}
                              >
                                <Trash2 className="h-2.5 w-2.5" />
                              </Button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Actions */}
                    <div>
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px]">アクション</Label>
                        {selectedCanvasId && (
                          <ActionPreviewButton
                            actions={deserializeActions(fn.actions)}
                            canvasId={selectedCanvasId}
                            functionArgs={fn.args.map((arg) => ({
                              id: arg.id,
                              name: arg.name,
                              fieldType: arg.fieldType ?? 'string',
                            }))}
                          />
                        )}
                      </div>
                      <div className="mt-1">
                        <ActionBlockEditor
                          actions={deserializeActions(fn.actions)}
                          onChange={(actions) => handleUpdateActions(fn.id, actions)}
                          functionArgs={fn.args.map((arg) => ({
                            id: arg.id,
                            name: arg.name,
                            fieldType: arg.fieldType ?? 'string',
                          }))}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
