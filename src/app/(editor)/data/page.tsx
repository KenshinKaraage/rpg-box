'use client';

import { useMemo, useState, useCallback, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragMoveEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { Button } from '@/components/ui/button';
import { useKeyboardShortcut, CommonShortcuts } from '@/hooks';
import { ThreeColumnLayout } from '@/components/common/ThreeColumnLayout';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import {
  DataTypeList,
  DataTypeEditor,
  DataTypeInfoView,
  DataEntryList,
  FormBuilder,
  FieldPalette,
  DragPreview,
  END_DROP_ZONE_ID,
  type ActiveDragData,
  type DropTarget,
} from '@/features/data-editor';
import { useStore } from '@/stores';
import { createDataType, createDataEntry } from '@/types/data';
import { createFieldTypeInstance } from '@/types/fields';
import type { FieldType, FieldConfigContext } from '@/types/fields/FieldType';
import type { DataEntry } from '@/types/data';
import { generateId } from '@/lib/utils';
import {
  findDataTypeReferences,
  findDataEntryReferences,
} from '@/features/data-editor/utils/referenceCheck';
import { importDefaultDataTypes } from '@/lib/importDefaultDataTypes';

const EMPTY_ENTRIES: DataEntry[] = [];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFieldType = FieldType<any>;

function resolveFieldIndex(fields: AnyFieldType[], target: DropTarget): number {
  if (target.fieldId === null) return fields.length;
  const idx = fields.findIndex((f) => f.id === target.fieldId);
  if (idx === -1) return fields.length;
  return target.position === 'before' ? idx : idx + 1;
}

function FieldPaletteWithHeader({
  dataTypeName,
  onBack,
}: {
  dataTypeName: string;
  onBack: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-5 py-4">
        <h2 className="text-lg font-bold">{dataTypeName}</h2>
        <Button
          size="sm"
          variant="outline"
          className="border-primary text-primary"
          onClick={onBack}
        >
          戻る
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <FieldPalette />
      </div>
    </div>
  );
}

/**
 * データ設定ページ
 *
 * 3カラムレイアウト:
 * - 左: DataTypeList（データ型一覧）
 * - 中央: DataEntryList（エントリ一覧）
 * - 右: エントリ選択時 → FormBuilder / 未選択時 → DataTypeEditor
 */
export default function DataPage() {
  // ストアから状態とアクションを取得
  const classes = useStore((state) => state.classes);
  const dataTypes = useStore((state) => state.dataTypes);
  const dataEntries = useStore((state) => state.dataEntries);
  const selectedDataTypeId = useStore((state) => state.selectedDataTypeId);
  const selectedDataEntryId = useStore((state) => state.selectedDataEntryId);

  const addClass = useStore((state) => state.addClass);

  const addDataType = useStore((state) => state.addDataType);
  const updateDataType = useStore((state) => state.updateDataType);
  const deleteDataType = useStore((state) => state.deleteDataType);
  const selectDataType = useStore((state) => state.selectDataType);

  const addFieldToDataType = useStore((state) => state.addFieldToDataType);
  const replaceDataTypeField = useStore((state) => state.replaceDataTypeField);
  const deleteDataTypeField = useStore((state) => state.deleteDataTypeField);
  const reorderDataTypeFields = useStore((state) => state.reorderDataTypeFields);

  const addDataEntry = useStore((state) => state.addDataEntry);
  const updateDataEntryId = useStore((state) => state.updateDataEntryId);
  const updateDataEntry = useStore((state) => state.updateDataEntry);
  const deleteDataEntry = useStore((state) => state.deleteDataEntry);
  const selectDataEntry = useStore((state) => state.selectDataEntry);

  // Undo/redo（editorSlice: design.md#EditorSlice 準拠のページ単位履歴）
  const pushUndoState = useStore((state) => state.pushUndoState);
  const undo = useStore((state) => state.undo);
  const redo = useStore((state) => state.redo);
  const setCurrentPage = useStore((state) => state.setCurrentPage);

  useEffect(() => {
    setCurrentPage('data');
  }, [setCurrentPage]);

  useKeyboardShortcut({
    shortcuts: [
      { keys: CommonShortcuts.undo, handler: () => undo() },
      { keys: CommonShortcuts.redo, handler: () => redo() },
      { keys: CommonShortcuts.redoAlt, handler: () => redo() },
    ],
  });

  // レイヤー/マッププロパティ相当: dataTypes/dataEntries の変更をUndo対象にするラッパー
  function withUndo<Args extends unknown[]>(fn: (...args: Args) => void): (...args: Args) => void {
    return (...args: Args) => {
      pushUndoState('data', { dataTypes, dataEntries });
      fn(...args);
    };
  }

  // 選択中のデータ型
  const selectedDataType = useStore((state) =>
    state.selectedDataTypeId
      ? (state.dataTypes.find((t) => t.id === state.selectedDataTypeId) ?? null)
      : null
  );

  // 選択中のデータ型に属するエントリ（直接参照を返し新規配列生成を避ける）
  const currentEntries = useStore((state) =>
    state.selectedDataTypeId ? (state.dataEntries[state.selectedDataTypeId] ?? null) : null
  );
  const entries = currentEntries ?? EMPTY_ENTRIES;

  // 選択中のエントリ
  const selectedEntry = useStore((state) => {
    if (!state.selectedDataTypeId || !state.selectedDataEntryId) return null;
    const typeEntries = state.dataEntries[state.selectedDataTypeId];
    return typeEntries?.find((e) => e.id === state.selectedDataEntryId) ?? null;
  });

  // フィールド編集モード
  const [isFieldEditing, setIsFieldEditing] = useState(false);
  // フィールド編集に入る前に選択していたエントリ（「戻る」で復元する）
  const [returnEntryId, setReturnEntryId] = useState<string | null>(null);

  // フィールドD&D状態
  const [activeData, setActiveData] = useState<ActiveDragData | null>(null);
  const [activeWidth, setActiveWidth] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const [newlyInsertedFieldId, setNewlyInsertedFieldId] = useState<string | null>(null);

  // インポート状態
  const [isImporting, setIsImporting] = useState(false);

  // 削除確認ダイアログの状態
  const [deleteConfirm, setDeleteConfirm] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    variant: 'danger' | 'warning';
  } | null>(null);

  // 既存のデータ型IDリスト（バリデーション用）

  // フィールド設定コンテキスト
  const configContext: FieldConfigContext = useMemo(
    () => ({
      classes: classes.map((c) => ({ id: c.id, name: c.name })),
      dataTypes: dataTypes.map((t) => ({ id: t.id, name: t.name })),
    }),
    [classes, dataTypes]
  );

  // --- ハンドラ ---

  // データ型を追加
  const handleAddDataType = () => {
    const id = generateId(
      'data',
      dataTypes.map((t) => t.id)
    );
    const newType = createDataType(id, '新しいデータ型');
    pushUndoState('data', { dataTypes, dataEntries });
    addDataType(newType);
    selectDataType(id);
  };

  // データ型を複製
  const handleDuplicateDataType = (id: string) => {
    const original = dataTypes.find((t) => t.id === id);
    if (!original) return;

    const newId = generateId(
      'data',
      dataTypes.map((t) => t.id)
    );
    const allFieldIds = dataTypes.flatMap((t) => t.fields.map((f) => f.id));
    const clonedFields = original.fields.map((f) => {
      const cloned = createFieldTypeInstance(f.type);
      if (!cloned) return f;
      const fieldId = generateId('field', allFieldIds);
      allFieldIds.push(fieldId);
      Object.assign(cloned, f, { id: fieldId });
      return cloned;
    });
    const duplicated = {
      ...original,
      id: newId,
      name: `${original.name} のコピー`,
      fields: clonedFields,
    };
    pushUndoState('data', { dataTypes, dataEntries });
    addDataType(duplicated);
    selectDataType(newId);
  };

  // データ型を削除（参照チェック付き）
  const handleDeleteDataType = useCallback(
    (id: string) => {
      const refs = findDataTypeReferences(dataTypes, id);
      const doDelete = () => {
        pushUndoState('data', { dataTypes, dataEntries });
        deleteDataType(id);
      };

      if (refs.length > 0) {
        const refMessages = refs.map((r) => r.description).join('\n');
        setDeleteConfirm({
          title: 'データ型の削除',
          message: `このデータ型は他から参照されています:\n${refMessages}\n\n削除すると参照が壊れます。本当に削除しますか？`,
          variant: 'warning',
          onConfirm: () => {
            doDelete();
            setDeleteConfirm(null);
          },
        });
      } else {
        setDeleteConfirm({
          title: 'データ型の削除',
          message: 'このデータ型を削除しますか？関連するエントリもすべて削除されます。',
          variant: 'danger',
          onConfirm: () => {
            doDelete();
            setDeleteConfirm(null);
          },
        });
      }
    },
    [dataTypes, dataEntries, deleteDataType, pushUndoState]
  );

  // エントリを追加
  const handleAddEntry = () => {
    if (!selectedDataType) return;
    const existingEntryIds = entries.map((e) => e.id);
    const id = generateId('entry', existingEntryIds);
    const entry = createDataEntry(id, selectedDataType.id, selectedDataType.fields);
    pushUndoState('data', { dataTypes, dataEntries });
    addDataEntry(entry);
    selectDataEntry(id);
    setIsFieldEditing(false);
  };

  // エントリを複製
  const handleDuplicateEntry = (entryId: string) => {
    if (!selectedDataType) return;
    const original = entries.find((e) => e.id === entryId);
    if (!original) return;

    const newId = generateId(
      'entry',
      entries.map((e) => e.id)
    );
    const duplicated = {
      ...original,
      id: newId,
      values: { ...original.values },
    };
    pushUndoState('data', { dataTypes, dataEntries });
    addDataEntry(duplicated);
    selectDataEntry(newId);
  };

  // エントリを削除（参照チェック付き）
  const handleDeleteEntry = useCallback(
    (entryId: string) => {
      if (!selectedDataType) return;
      const typeId = selectedDataType.id;
      const refs = findDataEntryReferences(dataTypes, dataEntries, typeId, entryId);
      const doDelete = () => {
        pushUndoState('data', { dataTypes, dataEntries });
        deleteDataEntry(typeId, entryId);
      };

      if (refs.length > 0) {
        const refMessages = refs.map((r) => r.description).join('\n');
        setDeleteConfirm({
          title: 'エントリの削除',
          message: `このエントリは他から参照されています:\n${refMessages}\n\n削除すると参照が壊れます。本当に削除しますか？`,
          variant: 'warning',
          onConfirm: () => {
            doDelete();
            setDeleteConfirm(null);
          },
        });
      } else {
        setDeleteConfirm({
          title: 'エントリの削除',
          message: `エントリ「${entryId}」を削除しますか？`,
          variant: 'danger',
          onConfirm: () => {
            doDelete();
            setDeleteConfirm(null);
          },
        });
      }
    },
    [selectedDataType, dataTypes, dataEntries, deleteDataEntry, pushUndoState]
  );

  // デフォルトデータタイプをインポート
  const handleImportDefaults = () => {
    setIsImporting(true);
    try {
      // classes も一緒に追加されるため、まとめてスナップショットに含める
      pushUndoState('data', { dataTypes, dataEntries, classes });
      const result = importDefaultDataTypes(dataTypes, classes, addDataType, addClass);
      console.info(
        `インポート完了: データ型 ${result.importedTypes}件（${result.skippedTypes}件スキップ）、クラス ${result.importedClasses}件（${result.skippedClasses}件スキップ）`
      );
    } finally {
      setIsImporting(false);
    }
  };

  // --- フィールドD&D ---

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragStart = (event: DragStartEvent) => {
    setActiveData((event.active.data.current as ActiveDragData) ?? null);
    setActiveWidth(event.active.rect.current.initial?.width ?? null);
  };

  const handleDragMove = (event: DragMoveEvent) => {
    const { over, active, activatorEvent, delta } = event;
    const data = active.data.current as ActiveDragData | undefined;

    if (data?.source !== 'palette') return;

    if (!over) {
      setDropTarget(null);
      return;
    }

    if (over.id === END_DROP_ZONE_ID) {
      setDropTarget({ fieldId: null, position: 'after' });
      return;
    }

    const overId = String(over.id);
    const startY = (activatorEvent as PointerEvent).clientY;
    const currentY = startY + delta.y;
    const overRect = over.rect;
    const relY = (currentY - overRect.top) / overRect.height;

    setDropTarget({ fieldId: overId, position: relY < 0.5 ? 'before' : 'after' });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const data = active.data.current as ActiveDragData | undefined;

    if (data?.source === 'palette' && dropTarget && selectedDataType) {
      const targetIndex = resolveFieldIndex(selectedDataType.fields, dropTarget);
      const instance = createFieldTypeInstance(data.type);
      if (instance) {
        const id = generateId(
          'field',
          selectedDataType.fields.map((f) => f.id)
        );
        instance.id = id;
        instance.name = '新しいフィールド';
        withUndo(addFieldToDataType)(selectedDataType.id, instance);
        const insertedAt = selectedDataType.fields.length;
        if (targetIndex !== insertedAt) {
          reorderDataTypeFields(selectedDataType.id, insertedAt, targetIndex);
        }
        setNewlyInsertedFieldId(id);
      }
    } else if (data?.source === 'field' && over && selectedDataType) {
      const oldIndex = selectedDataType.fields.findIndex((f) => f.id === data.field.id);
      const newIndex =
        over.id === END_DROP_ZONE_ID
          ? selectedDataType.fields.length - 1
          : selectedDataType.fields.findIndex((f) => f.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        withUndo(reorderDataTypeFields)(selectedDataType.id, oldIndex, newIndex);
      }
      setNewlyInsertedFieldId(null);
    }

    setActiveData(null);
    setActiveWidth(null);
    setDropTarget(null);
  };

  const handleDragCancel = () => {
    setActiveData(null);
    setActiveWidth(null);
    setDropTarget(null);
  };

  // --- レンダリング ---

  // データタイプ切替時にフィールド編集モードを解除
  const handleSelectDataType = (id: string) => {
    setIsFieldEditing(false);
    selectDataType(id);
  };

  // フィールド編集モードに入る（戻れるよう、直前の選択エントリを退避）
  const handleFieldEdit = () => {
    setReturnEntryId(selectedDataEntryId);
    selectDataEntry(null);
    setIsFieldEditing(true);
  };

  // フィールド編集から戻る（入る前の状態に復元）
  const handleFieldEditBack = () => {
    setIsFieldEditing(false);
    selectDataEntry(returnEntryId);
  };

  // エントリ選択時にフィールド編集モードを解除
  const handleSelectEntry = (id: string | null) => {
    if (id !== null) {
      setIsFieldEditing(false);
    }
    selectDataEntry(id);
  };

  // 右パネル: エントリ選択時 → FormBuilder / フィールド編集 → DataTypeEditor / それ以外 → DataTypeInfoView
  let rightPanel;
  if (selectedDataType && selectedEntry) {
    rightPanel = (
      <FormBuilder
        key={selectedEntry.id}
        dataType={selectedDataType}
        entry={selectedEntry}
        existingEntryIds={entries.map((e) => e.id)}
        onUpdateEntry={updateDataEntry}
        onUpdateEntryId={updateDataEntryId}
      />
    );
  } else if (selectedDataType && isFieldEditing) {
    rightPanel = (
      <DataTypeEditor
        key={`fields-${selectedDataTypeId}`}
        dataType={selectedDataType}
        dropTarget={dropTarget}
        newlyInsertedId={newlyInsertedFieldId}
        onAddField={withUndo(addFieldToDataType)}
        onReplaceField={replaceDataTypeField}
        onDeleteField={withUndo(deleteDataTypeField)}
        configContext={configContext}
      />
    );
  } else {
    rightPanel = (
      <DataTypeInfoView
        key={selectedDataTypeId ?? 'none'}
        dataType={selectedDataType}
        onUpdateDataType={updateDataType}
        onFieldEdit={handleFieldEdit}
      />
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <ThreeColumnLayout
        left={
          <DataTypeList
            dataTypes={dataTypes}
            selectedId={selectedDataTypeId}
            onSelect={handleSelectDataType}
            onAdd={handleAddDataType}
            onDelete={handleDeleteDataType}
            onDuplicate={handleDuplicateDataType}
            onImportDefaults={handleImportDefaults}
            isImporting={isImporting}
          />
        }
        center={
          isFieldEditing && selectedDataType ? (
            <FieldPaletteWithHeader
              dataTypeName={selectedDataType.name}
              onBack={handleFieldEditBack}
            />
          ) : (
            <DataEntryList
              entries={entries}
              dataType={selectedDataType}
              selectedId={selectedDataEntryId}
              isFieldEditing={isFieldEditing}
              onSelect={handleSelectEntry}
              onFieldEdit={handleFieldEdit}
              onAdd={handleAddEntry}
              onDelete={handleDeleteEntry}
              onDuplicate={handleDuplicateEntry}
            />
          )
        }
        right={rightPanel}
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

      <DragOverlay dropAnimation={null}>
        {activeData ? <DragPreview data={activeData} width={activeWidth} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
