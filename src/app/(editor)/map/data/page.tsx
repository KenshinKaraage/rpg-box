'use client';

import { ThreeColumnLayout } from '@/components/common/ThreeColumnLayout';
import { MapList, MapSettingsEditor } from '@/features/map-editor';
import { useStore } from '@/stores';
import { generateId } from '@/lib/utils';
import { createDefaultMapFields } from '@/lib/defaultMapFields';
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

  // 選択中のマップ
  const selectedMap = useStore((state) =>
    state.selectedMapId ? (state.maps.find((m) => m.id === state.selectedMapId) ?? null) : null
  );

  // --- ハンドラ ---

  // マップを追加
  const handleAddMap = () => {
    const id = generateId(
      'map',
      maps.map((m) => m.id)
    );
    const newMap: GameMap = {
      id,
      name: '新しいマップ',
      width: 20,
      height: 15,
      layers: [
        {
          id: generateId('layer', []),
          name: 'レイヤー1',
          type: 'tile' as const,
          chipsetIds: [],
        },
      ],
      fields: createDefaultMapFields(),
      values: {},
    };
    addMap(newMap);
    selectMap(id);
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
          onUpdateMap={updateMap}
          onUpdateMapValues={updateMapValues}
          onAddLayer={addLayer}
          onUpdateLayer={updateLayer}
          onDeleteLayer={deleteLayer}
        />
      }
      right={<div className="p-4 text-sm text-muted-foreground">チップセット設定（準備中）</div>}
    />
  );
}
