'use client';

import { useMemo } from 'react';
import { ThreeColumnLayout } from '@/components/common/ThreeColumnLayout';
import { DataTypeList, DataTypeEditor, DataEntryList, FormBuilder } from '@/features/data-editor';
import { useStore } from '@/stores';
import { createDataType, createDataEntry } from '@/types/data';
import { createFieldTypeInstance } from '@/types/fields';
import type { FieldConfigContext } from '@/types/fields/FieldType';
import type { DataEntry } from '@/types/data';
import { generateId } from '@/lib/utils';

const EMPTY_ENTRIES: DataEntry[] = [];

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

  // 既存のデータ型IDリスト（バリデーション用）
  const existingIds = useMemo(() => dataTypes.map((t) => t.id), [dataTypes]);

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
    addDataType(duplicated);
    selectDataType(newId);
  };

  // データ型を削除
  const handleDeleteDataType = (id: string) => {
    deleteDataType(id);
  };

  // エントリを追加
  const handleAddEntry = () => {
    if (!selectedDataType) return;
    const existingEntryIds = entries.map((e) => e.id);
    const id = generateId('entry', existingEntryIds);
    const entry = createDataEntry(id, selectedDataType.id, selectedDataType.fields);
    addDataEntry(entry);
    selectDataEntry(id);
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
    addDataEntry(duplicated);
    selectDataEntry(newId);
  };

  // エントリを削除
  const handleDeleteEntry = (entryId: string) => {
    if (!selectedDataType) return;
    deleteDataEntry(selectedDataType.id, entryId);
  };

  // --- レンダリング ---

  // 右パネル: エントリ選択時 → FormBuilder / 未選択時 → DataTypeEditor
  const rightPanel =
    selectedDataType && selectedEntry ? (
      <FormBuilder
        key={selectedEntry.id}
        dataType={selectedDataType}
        entry={selectedEntry}
        existingEntryIds={entries.map((e) => e.id)}
        onUpdateEntry={updateDataEntry}
        onUpdateEntryId={updateDataEntryId}
      />
    ) : (
      <DataTypeEditor
        key={selectedDataTypeId ?? 'none'}
        dataType={selectedDataType}
        existingIds={existingIds}
        onUpdateDataType={updateDataType}
        onAddField={addFieldToDataType}
        onReplaceField={replaceDataTypeField}
        onDeleteField={deleteDataTypeField}
        onReorderFields={reorderDataTypeFields}
        configContext={configContext}
      />
    );

  return (
    <ThreeColumnLayout
      left={
        <DataTypeList
          dataTypes={dataTypes}
          dataEntries={dataEntries}
          selectedId={selectedDataTypeId}
          onSelect={selectDataType}
          onAdd={handleAddDataType}
          onDelete={handleDeleteDataType}
          onDuplicate={handleDuplicateDataType}
        />
      }
      center={
        <DataEntryList
          entries={entries}
          dataType={selectedDataType}
          selectedId={selectedDataEntryId}
          onSelect={selectDataEntry}
          onAdd={handleAddEntry}
          onDelete={handleDeleteEntry}
          onDuplicate={handleDuplicateEntry}
        />
      }
      right={rightPanel}
    />
  );
}
