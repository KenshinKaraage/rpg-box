'use client';

import { ThreeColumnLayout } from '@/components/common/ThreeColumnLayout';
import { PrefabList } from '@/features/map-editor/components/PrefabList';
import { PrefabPreview } from '@/features/map-editor/components/PrefabPreview';
import { ComponentEditor } from '@/features/map-editor/components/ComponentEditor';
import { useStore } from '@/stores';
import { generateId } from '@/lib/utils';
import type { Prefab } from '@/types/map';

/**
 * プレハブページ
 *
 * 3カラムレイアウト:
 * - 左: PrefabList（プレハブ一覧）
 * - 中央: ComponentEditor（コンポーネント編集）
 * - 右: PrefabPreview（プレビュー）
 */
export default function PrefabPage() {
  const prefabs = useStore((state) => state.prefabs);
  const selectedPrefabId = useStore((state) => state.selectedPrefabId);
  const selectedPrefab = useStore((state) =>
    state.selectedPrefabId
      ? (state.prefabs.find((p) => p.id === state.selectedPrefabId) ?? null)
      : null
  );

  const addPrefab = useStore((state) => state.addPrefab);
  const updatePrefab = useStore((state) => state.updatePrefab);
  const deletePrefab = useStore((state) => state.deletePrefab);
  const selectPrefab = useStore((state) => state.selectPrefab);

  const handleAddPrefab = () => {
    const id = generateId(
      'prefab',
      prefabs.map((p) => p.id)
    );
    const newPrefab: Prefab = {
      id,
      name: '新しいプレハブ',
      components: [],
    };
    addPrefab(newPrefab);
    selectPrefab(id);
  };

  const handleDuplicatePrefab = (id: string) => {
    const original = prefabs.find((p) => p.id === id);
    if (!original) return;

    const newId = generateId(
      'prefab',
      prefabs.map((p) => p.id)
    );
    const duplicated: Prefab = {
      ...original,
      id: newId,
      name: `${original.name} のコピー`,
      components: original.components.map((c) => c.clone()),
    };
    addPrefab(duplicated);
    selectPrefab(newId);
  };

  const handleDeletePrefab = (id: string) => {
    deletePrefab(id);
  };

  return (
    <ThreeColumnLayout
      left={
        <PrefabList
          prefabs={prefabs}
          selectedId={selectedPrefabId}
          onSelect={selectPrefab}
          onAdd={handleAddPrefab}
          onDelete={handleDeletePrefab}
          onDuplicate={handleDuplicatePrefab}
        />
      }
      center={
        <ComponentEditor
          key={selectedPrefabId ?? 'none'}
          prefab={selectedPrefab}
          onUpdatePrefab={updatePrefab}
        />
      }
      right={<PrefabPreview prefab={selectedPrefab} />}
    />
  );
}
