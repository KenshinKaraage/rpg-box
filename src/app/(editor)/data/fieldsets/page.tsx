'use client';

import { useCallback } from 'react';
import { TwoColumnLayout } from '@/components/common/TwoColumnLayout';
import { FieldSetList, FieldSetEditor } from '@/features/data-editor';
import { useStore } from '@/stores';
import { createFieldSet } from '@/types/fieldSet';

/**
 * フィールドセット管理ページ
 */
export default function FieldSetsPage() {
  // ストアから状態とアクションを取得
  const fieldSets = useStore((state) => state.fieldSets);
  const selectedFieldSetId = useStore((state) => state.selectedFieldSetId);
  const addFieldSet = useStore((state) => state.addFieldSet);
  const updateFieldSet = useStore((state) => state.updateFieldSet);
  const deleteFieldSet = useStore((state) => state.deleteFieldSet);
  const selectFieldSet = useStore((state) => state.selectFieldSet);

  // 選択中のフィールドセットを取得（リアクティブなセレクタ）
  const selectedFieldSet = useStore((state) =>
    state.selectedFieldSetId
      ? (state.fieldSets.find((fs) => fs.id === state.selectedFieldSetId) ?? null)
      : null
  );

  // 新規フィールドセットを追加
  const handleAdd = useCallback(() => {
    const id = `fieldset_${Date.now()}`;
    const newFieldSet = createFieldSet(id, '新しいフィールドセット');
    addFieldSet(newFieldSet);
    selectFieldSet(id);
  }, [addFieldSet, selectFieldSet]);

  // フィールドセットを複製
  const handleDuplicate = useCallback(
    (id: string) => {
      const original = fieldSets.find((fs) => fs.id === id);
      if (!original) return;

      const newId = `fieldset_${Date.now()}`;
      const duplicated = {
        ...original,
        id: newId,
        name: `${original.name} のコピー`,
        fields: original.fields.map((f) => {
          // FieldTypeのインスタンスをコピー
          const clone = Object.create(Object.getPrototypeOf(f));
          Object.assign(clone, f);
          clone.id = `field_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
          return clone;
        }),
      };
      addFieldSet(duplicated);
      selectFieldSet(newId);
    },
    [fieldSets, addFieldSet, selectFieldSet]
  );

  // フィールドセットを削除
  const handleDelete = useCallback(
    (id: string) => {
      deleteFieldSet(id);
    },
    [deleteFieldSet]
  );

  return (
    <TwoColumnLayout
      left={
        <FieldSetList
          fieldSets={fieldSets}
          selectedId={selectedFieldSetId}
          onSelect={selectFieldSet}
          onAdd={handleAdd}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
        />
      }
      right={
        <FieldSetEditor
          key={selectedFieldSetId ?? 'none'}
          fieldSet={selectedFieldSet}
          onUpdate={updateFieldSet}
        />
      }
    />
  );
}
