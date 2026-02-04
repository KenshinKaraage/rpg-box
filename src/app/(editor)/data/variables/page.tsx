'use client';

import { useCallback } from 'react';
import { TwoColumnLayout } from '@/components/common/TwoColumnLayout';
import { VariableList, VariableEditor } from '@/features/data-editor';
import { useStore } from '@/stores';
import { createVariable } from '@/types/variable';

/**
 * 変数管理ページ
 */
export default function VariablesPage() {
  // ストアから状態とアクションを取得
  const variables = useStore((state) => state.variables);
  const selectedVariableId = useStore((state) => state.selectedVariableId);
  const addVariable = useStore((state) => state.addVariable);
  const updateVariable = useStore((state) => state.updateVariable);
  const deleteVariable = useStore((state) => state.deleteVariable);
  const selectVariable = useStore((state) => state.selectVariable);

  // 選択中の変数を取得（リアクティブなセレクタ）
  const selectedVariable = useStore((state) =>
    state.selectedVariableId
      ? (state.variables.find((v) => v.id === state.selectedVariableId) ?? null)
      : null
  );

  // 新規変数を追加
  const handleAdd = useCallback(() => {
    const id = `var_${Date.now()}`;
    const newVariable = createVariable(id, '新しい変数');
    addVariable(newVariable);
    selectVariable(id);
  }, [addVariable, selectVariable]);

  // 変数を複製
  const handleDuplicate = useCallback(
    (id: string) => {
      const original = variables.find((v) => v.id === id);
      if (!original) return;

      const newId = `var_${Date.now()}`;
      const duplicated = {
        ...original,
        id: newId,
        name: `${original.name} のコピー`,
      };
      addVariable(duplicated);
      selectVariable(newId);
    },
    [variables, addVariable, selectVariable]
  );

  // 変数を削除
  const handleDelete = useCallback(
    (id: string) => {
      deleteVariable(id);
    },
    [deleteVariable]
  );

  return (
    <TwoColumnLayout
      left={
        <VariableList
          variables={variables}
          selectedId={selectedVariableId}
          onSelect={selectVariable}
          onAdd={handleAdd}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
        />
      }
      right={
        <VariableEditor
          key={selectedVariableId ?? 'none'}
          variable={selectedVariable}
          onUpdate={updateVariable}
        />
      }
    />
  );
}
