'use client';

import { useCallback, useMemo } from 'react';
import { TwoColumnLayout } from '@/components/common/TwoColumnLayout';
import { ClassList, ClassEditor } from '@/features/data-editor';
import { useStore } from '@/stores';
import { createCustomClass } from '@/types/customClass';
import { createFieldTypeInstance } from '@/types/fields';
import type { FieldConfigContext } from '@/types/fields/FieldType';

/**
 * クラス管理ページ
 */
export default function ClassesPage() {
  // ストアから状態とアクションを取得
  const classes = useStore((state) => state.classes);
  const selectedClassId = useStore((state) => state.selectedClassId);
  const addClass = useStore((state) => state.addClass);
  const updateClass = useStore((state) => state.updateClass);
  const deleteClass = useStore((state) => state.deleteClass);
  const selectClass = useStore((state) => state.selectClass);
  const addFieldToClass = useStore((state) => state.addFieldToClass);
  const replaceClassField = useStore((state) => state.replaceClassField);
  const deleteClassField = useStore((state) => state.deleteClassField);
  const reorderClassFields = useStore((state) => state.reorderClassFields);

  // 選択中のクラスを取得（リアクティブなセレクタ）
  const selectedClass = useStore((state) =>
    state.selectedClassId
      ? (state.classes.find((c) => c.id === state.selectedClassId) ?? null)
      : null
  );

  // 新規クラスを追加
  const handleAdd = useCallback(() => {
    const id = `class_${Date.now()}`;
    const newClass = createCustomClass(id, '新しいクラス');
    addClass(newClass);
    selectClass(id);
  }, [addClass, selectClass]);

  // クラスを複製
  const handleDuplicate = useCallback(
    (id: string) => {
      const original = classes.find((c) => c.id === id);
      if (!original) return;

      const newId = `class_${Date.now()}`;
      // FieldTypeインスタンスを適切に複製
      const clonedFields = original.fields.map((f) => {
        const cloned = createFieldTypeInstance(f.type);
        if (!cloned) return f; // フォールバック
        Object.assign(cloned, f, {
          id: `field_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        });
        return cloned;
      });
      const duplicated = {
        ...original,
        id: newId,
        name: `${original.name} のコピー`,
        fields: clonedFields,
      };
      addClass(duplicated);
      selectClass(newId);
    },
    [classes, addClass, selectClass]
  );

  // クラスを削除
  const handleDelete = useCallback(
    (id: string) => {
      deleteClass(id);
    },
    [deleteClass]
  );

  const configContext: FieldConfigContext = useMemo(
    () => ({
      classes: classes.map((c) => ({ id: c.id, name: c.name })),
    }),
    [classes]
  );

  return (
    <TwoColumnLayout
      left={
        <ClassList
          classes={classes}
          selectedId={selectedClassId}
          onSelect={selectClass}
          onAdd={handleAdd}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
        />
      }
      right={
        <ClassEditor
          key={selectedClassId ?? 'none'}
          customClass={selectedClass}
          onUpdateClass={updateClass}
          onAddField={addFieldToClass}
          onReplaceField={replaceClassField}
          onDeleteField={deleteClassField}
          onReorderFields={reorderClassFields}
          configContext={configContext}
        />
      }
    />
  );
}
