'use client';

import { ThreeColumnLayout } from '@/components/common/ThreeColumnLayout';
import { MapList, MapSettingsEditor } from '@/features/map-editor';
import { ChipsetEditor } from '@/features/map-editor/components/ChipsetEditor';
import { useStore } from '@/stores';
import { generateId } from '@/lib/utils';
import { createDefaultChipsetFields } from '@/lib/defaultChipsetFields';
import { createDefaultMap } from '@/features/map-editor/utils/createDefaultMap';
import type { GameMap } from '@/types/map';

/**
 * マップデータページ
 *
 * 3カラムレイアウト:
 * - 左: MapList（マップ一覧）
 * - 中央: MapSettingsEditor（マップ設定）
 * - 右: チップセット設定（準備中）
 */
export default function MapDataPage() {
  // ストアから状態とアクションを取得
  const maps = useStore((state) => state.maps);
  const selectedMapId = useStore((state) => state.selectedMapId);

  const addMap = useStore((state) => state.addMap);
  const updateMap = useStore((state) => state.updateMap);
  const deleteMap = useStore((state) => state.deleteMap);
  const selectMap = useStore((state) => state.selectMap);

  const updateMapValues = useStore((state) => state.updateMapValues);
  const addLayer = useStore((state) => state.addLayer);
  const updateLayer = useStore((state) => state.updateLayer);
  const deleteLayer = useStore((state) => state.deleteLayer);
  const reorderLayers = useStore((state) => state.reorderLayers);

  const chipsets = useStore((state) => state.chipsets);
  const addChipset = useStore((state) => state.addChipset);
  const updateChipset = useStore((state) => state.updateChipset);
  const deleteChipset = useStore((state) => state.deleteChipset);
  const updateChipProperty = useStore((state) => state.updateChipProperty);
  const addFieldToChipset = useStore((state) => state.addFieldToChipset);
  const replaceChipsetField = useStore((state) => state.replaceChipsetField);
  const deleteChipsetField = useStore((state) => state.deleteChipsetField);
  const reorderChipsetFields = useStore((state) => state.reorderChipsetFields);

  // 選択中のマップ
  const selectedMap = useStore((state) =>
    state.selectedMapId ? (state.maps.find((m) => m.id === state.selectedMapId) ?? null) : null
  );

  // --- ハンドラ ---

  // マップを追加
  const handleAddMap = () => {
    const newMap = createDefaultMap(maps.map((m) => m.id));
    addMap(newMap);
    selectMap(newMap.id);
  };

  // マップを複製
  const handleDuplicateMap = (id: string) => {
    const original = maps.find((m) => m.id === id);
    if (!original) return;

    const newId = generateId(
      'map',
      maps.map((m) => m.id)
    );
    const allLayerIds = maps.flatMap((m) => m.layers.map((l) => l.id));
    const clonedLayers = original.layers.map((layer) => {
      const layerId = generateId('layer', allLayerIds);
      allLayerIds.push(layerId);
      return { ...layer, id: layerId };
    });
    const duplicated: GameMap = {
      ...original,
      id: newId,
      name: `${original.name} のコピー`,
      layers: clonedLayers,
      fields: original.fields.map((f) => Object.assign(Object.create(Object.getPrototypeOf(f)), f)),
      values: { ...original.values },
    };
    addMap(duplicated);
    selectMap(newId);
  };

  // マップを削除
  const handleDeleteMap = (id: string) => {
    deleteMap(id);
  };

  // チップセットを追加
  const handleAddChipset = (): string => {
    const id = generateId(
      'cs',
      chipsets.map((c) => c.id)
    );
    addChipset({
      id,
      name: '新しいチップセット',
      imageId: '',
      tileWidth: 32,
      tileHeight: 32,
      autotile: false,
      animated: false,
      animFrameCount: 3,
      animIntervalMs: 200,
      fields: createDefaultChipsetFields(),
      chips: [],
    });
    return id;
  };

  // --- レンダリング ---

  return (
    <ThreeColumnLayout
      left={
        <MapList
          maps={maps}
          selectedId={selectedMapId}
          onSelect={selectMap}
          onAdd={handleAddMap}
          onDelete={handleDeleteMap}
          onDuplicate={handleDuplicateMap}
        />
      }
      center={
        <MapSettingsEditor
          key={selectedMapId ?? 'none'}
          map={selectedMap}
          chipsets={chipsets}
          onUpdateMap={updateMap}
          onUpdateMapValues={updateMapValues}
          onAddLayer={addLayer}
          onUpdateLayer={updateLayer}
          onDeleteLayer={deleteLayer}
          onReorderLayers={reorderLayers}
        />
      }
      right={
        <ChipsetEditor
          chipsets={chipsets}
          onAddChipset={handleAddChipset}
          onUpdateChipset={updateChipset}
          onDeleteChipset={deleteChipset}
          onUpdateChipProperty={updateChipProperty}
          onAddFieldToChipset={addFieldToChipset}
          onReplaceChipsetField={replaceChipsetField}
          onDeleteChipsetField={deleteChipsetField}
          onReorderChipsetFields={reorderChipsetFields}
        />
      }
    />
  );
}
