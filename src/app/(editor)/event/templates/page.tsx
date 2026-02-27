'use client';

import { useMemo, useState, useCallback } from 'react';
import { ThreeColumnLayout } from '@/components/common/ThreeColumnLayout';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EventTemplateList } from '@/features/event-editor/components/EventTemplateList';
import { EventTemplateEditor } from '@/features/event-editor/components/EventTemplateEditor';
import { ActionBlockEditor } from '@/features/event-editor/components/ActionBlockEditor';
import { useStore } from '@/stores';
import { createEventTemplate } from '@/types/event';
import { generateId } from '@/lib/utils';
import type { EventAction } from '@/engine/actions/EventAction';

const EMPTY_ACTIONS: EventAction[] = [];

/**
 * イベントテンプレートページ
 *
 * 3カラムレイアウト:
 * - 左: EventTemplateList（テンプレート一覧）
 * - 中央: ActionBlockEditor（アクション編集）
 * - 右: EventTemplateEditor（テンプレート設定・引数）
 */
export default function EventTemplatePage() {
  // ストアから状態とアクションを取得
  const eventTemplates = useStore((state) => state.eventTemplates);
  const selectedTemplateId = useStore((state) => state.selectedTemplateId);

  const addTemplate = useStore((state) => state.addTemplate);
  const updateTemplate = useStore((state) => state.updateTemplate);
  const deleteTemplate = useStore((state) => state.deleteTemplate);
  const selectTemplate = useStore((state) => state.selectTemplate);
  const updateTemplateActions = useStore((state) => state.updateTemplateActions);

  // 選択中のテンプレート
  const selectedTemplate = useStore((state) =>
    state.selectedTemplateId
      ? (state.eventTemplates.find((t) => t.id === state.selectedTemplateId) ?? null)
      : null
  );

  // 選択中テンプレートのアクション（セレクタで新規配列を生成しない）
  const currentActions = useStore((state) => {
    if (!state.selectedTemplateId) return null;
    const template = state.eventTemplates.find((t) => t.id === state.selectedTemplateId);
    return template?.actions ?? null;
  });
  const actions = currentActions ?? EMPTY_ACTIONS;

  // 既存のテンプレートIDリスト（バリデーション用）
  const existingIds = useMemo(() => eventTemplates.map((t) => t.id), [eventTemplates]);

  // 削除確認ダイアログの状態
  const [deleteConfirm, setDeleteConfirm] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    variant: 'danger' | 'warning';
  } | null>(null);

  // --- ハンドラ ---

  // テンプレートを追加
  const handleAddTemplate = () => {
    const id = generateId(
      'template',
      eventTemplates.map((t) => t.id)
    );
    const newTemplate = createEventTemplate(id, '新しいテンプレート');
    addTemplate(newTemplate);
    selectTemplate(id);
  };

  // テンプレートを複製
  const handleDuplicateTemplate = (id: string) => {
    const original = eventTemplates.find((t) => t.id === id);
    if (!original) return;

    const newId = generateId(
      'template',
      eventTemplates.map((t) => t.id)
    );
    const duplicated = {
      ...original,
      id: newId,
      name: `${original.name} のコピー`,
      args: [...original.args],
      actions: [...original.actions],
    };
    addTemplate(duplicated);
    selectTemplate(newId);
  };

  // テンプレートを削除（確認ダイアログ付き）
  const handleDeleteTemplate = useCallback(
    (id: string) => {
      setDeleteConfirm({
        title: 'テンプレートの削除',
        message: 'このテンプレートを削除しますか？',
        variant: 'danger',
        onConfirm: () => {
          deleteTemplate(id);
          setDeleteConfirm(null);
        },
      });
    },
    [deleteTemplate]
  );

  // アクション配列を更新
  const handleActionsChange = useCallback(
    (newActions: EventAction[]) => {
      if (!selectedTemplateId) return;
      updateTemplateActions(selectedTemplateId, newActions);
    },
    [selectedTemplateId, updateTemplateActions]
  );

  // --- レンダリング ---

  return (
    <>
      <ThreeColumnLayout
        left={
          <EventTemplateList
            templates={eventTemplates}
            selectedId={selectedTemplateId}
            onSelect={selectTemplate}
            onAdd={handleAddTemplate}
            onDelete={handleDeleteTemplate}
            onDuplicate={handleDuplicateTemplate}
          />
        }
        center={
          selectedTemplate ? (
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b p-3">
                <h2 className="text-sm font-semibold">アクション</h2>
              </div>
              <div className="flex-1 overflow-auto p-4">
                <ActionBlockEditor actions={actions} onChange={handleActionsChange} />
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              テンプレートを選択してください
            </div>
          )
        }
        right={
          <EventTemplateEditor
            key={selectedTemplateId ?? 'none'}
            template={selectedTemplate}
            existingIds={existingIds}
            onUpdate={updateTemplate}
          />
        }
      />

      {deleteConfirm && (
        <ConfirmDialog
          open={true}
          title={deleteConfirm.title}
          message={deleteConfirm.message}
          variant={deleteConfirm.variant}
          onConfirm={deleteConfirm.onConfirm}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </>
  );
}
