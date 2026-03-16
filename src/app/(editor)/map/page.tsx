'use client';
import { useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ThreeColumnLayout } from '@/components/common/ThreeColumnLayout';
import { useStore } from '@/stores';
import { MapList, PrefabList } from '@/features/map-editor';
import { MapCanvas } from '@/features/map-editor/components/MapCanvas';
import { MapToolbar } from '@/features/map-editor/components/MapToolbar';
import { LayerTabs } from '@/features/map-editor/components/LayerTabs';
import { ChipPalette } from '@/features/map-editor/components/ChipPalette';
import { MapObjectList } from '@/features/map-editor/components/MapObjectList';
import { MapPropertyPanel } from '@/features/map-editor/components/MapPropertyPanel';
import { MapSettingsEditor } from '@/features/map-editor/components/MapSettingsEditor';
import { useMapShortcuts } from '@/features/map-editor/hooks/useMapShortcuts';
import { applyZoom } from '@/features/map-editor/hooks/useMapViewport';
import { useBlobUrl } from '@/hooks/useBlobUrl';
import { generateId } from '@/lib/utils';
import { createDefaultMapFields } from '@/lib/defaultMapFields';
import type { GameMap, Prefab } from '@/types/map';
import type { ImageMetadata } from '@/types/assets';

export default function MapEditPage() {
  // Map state
  const maps = useStore((s) => s.maps);
  const selectedMapId = useStore((s) => s.selectedMapId);
  const selectMap = useStore((s) => s.selectMap);
  const addMap = useStore((s) => s.addMap);
  const deleteMap = useStore((s) => s.deleteMap);

  // Layer / object state
  const selectedLayerId = useStore((s) => s.selectedLayerId);
  const selectedObjectId = useStore((s) => s.selectedObjectId);
  const selectLayer = useStore((s) => s.selectLayer);
  const updateLayer = useStore((s) => s.updateLayer);
  const updateMap = useStore((s) => s.updateMap);
  const updateMapValues = useStore((s) => s.updateMapValues);
  const addLayer = useStore((s) => s.addLayer);
  const deleteLayer = useStore((s) => s.deleteLayer);
  const reorderLayers = useStore((s) => s.reorderLayers);
  const selectObject = useStore((s) => s.selectObject);
  const deleteObject = useStore((s) => s.deleteObject);
  const addObject = useStore((s) => s.addObject);
  const setTile = useStore((s) => s.setTile);

  // Prefab state
  const prefabs = useStore((s) => s.prefabs);
  const selectedPrefabId = useStore((s) => s.selectedPrefabId);
  const selectPrefab = useStore((s) => s.selectPrefab);
  const addPrefab = useStore((s) => s.addPrefab);
  const deletePrefab = useStore((s) => s.deletePrefab);

  // Chipset / asset state
  const chipsets = useStore((s) => s.chipsets);
  const assets = useStore((s) => s.assets);

  // Editor UI state
  const currentTool = useStore((s) => s.currentTool);
  const selectedChipId = useStore((s) => s.selectedChipId);
  const viewport = useStore((s) => s.viewport);
  const showGrid = useStore((s) => s.showGrid);
  const setTool = useStore((s) => s.setTool);
  const selectChip = useStore((s) => s.selectChip);
  const setViewport = useStore((s) => s.setViewport);
  const toggleGrid = useStore((s) => s.toggleGrid);

  // Object placement state
  const placementPrefabId = useStore((s) => s.selectedPrefabId);
  const selectPrefabForPlacement = useStore((s) => s.selectPrefabForPlacement);

  // Undo/redo
  const pushUndo = useStore((s) => s.pushUndo);
  const popUndo = useStore((s) => s.popUndo);
  const pushRedo = useStore((s) => s.pushRedo);
  const popRedo = useStore((s) => s.popRedo);

  const selectedMap = maps.find((m) => m.id === selectedMapId) ?? null;
  const selectedLayer = selectedMap?.layers.find((l) => l.id === selectedLayerId) ?? null;

  // レイヤー切り替え時: 選択チップが新レイヤーのチップセットに含まれなければリセット
  useEffect(() => {
    if (!selectedLayer) {
      selectChip(null);
      return;
    }
    const currentChipsetId = selectedChipId?.split(':')[0] ?? null;
    if (currentChipsetId && !selectedLayer.chipsetIds.includes(currentChipsetId)) {
      const firstChipsetId = selectedLayer.chipsetIds[0] ?? null;
      selectChip(firstChipsetId ? `${firstChipsetId}:0` : null);
    }
  }, [selectedLayerId]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Map handlers ---
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
          visible: true,
          chipsetIds: [],
        },
      ],
      fields: createDefaultMapFields(),
      values: {},
    };
    addMap(newMap);
    selectMap(id);
  };

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

  // --- Prefab handlers ---
  const handleAddPrefab = () => {
    const id = generateId(
      'prefab',
      prefabs.map((p) => p.id)
    );
    const newPrefab: Prefab = { id, name: '新しいプレハブ', components: [] };
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
      components: original.components.map((c) => ({ ...c })),
    };
    addPrefab(duplicated);
    selectPrefab(newId);
  };

  // --- Undo/redo handlers ---
  const handleUndo = () => {
    const action = popUndo();
    if (!action) return;
    if (action.type === 'setTile') {
      setTile(action.mapId, action.layerId, action.x, action.y, action.prev);
      pushRedo(action);
    } else if (action.type === 'setTileRange') {
      action.tiles.forEach((t) => setTile(action.mapId, action.layerId, t.x, t.y, t.prev));
      pushRedo(action);
    } else if (action.type === 'addObject') {
      deleteObject(action.mapId, action.layerId, action.object.id);
      pushRedo(action);
    } else if (action.type === 'deleteObject') {
      addObject(action.mapId, action.layerId, action.object);
      pushRedo(action);
    }
  };

  const handleRedo = () => {
    const action = popRedo();
    if (!action) return;
    if (action.type === 'setTile') {
      setTile(action.mapId, action.layerId, action.x, action.y, action.next);
    } else if (action.type === 'setTileRange') {
      action.tiles.forEach((t) => setTile(action.mapId, action.layerId, t.x, t.y, t.next));
    } else if (action.type === 'addObject') {
      addObject(action.mapId, action.layerId, action.object);
    } else if (action.type === 'deleteObject') {
      deleteObject(action.mapId, action.layerId, action.object.id);
    }
  };

  useMapShortcuts({ onSetTool: setTool, onUndo: handleUndo, onRedo: handleRedo });

  // 選択中チップセットの画像データとサイズを取得
  const selectedChipsetId = selectedChipId?.split(':')[0] ?? null;
  const selectedChipset = chipsets.find((c) => c.id === selectedChipsetId) ?? null;
  const chipsetAsset = selectedChipset
    ? (assets.find((a) => a.id === selectedChipset.imageId) ?? null)
    : null;
  const chipsetImageMeta = chipsetAsset?.metadata as ImageMetadata | null;
  const chipsetImageSize =
    chipsetImageMeta?.width && chipsetImageMeta?.height
      ? { w: chipsetImageMeta.width, h: chipsetImageMeta.height }
      : null;

  // data URL を Blob URL に変換（チップセット切り替え時に前の Blob URL を解放）
  const chipsetBlobUrl = useBlobUrl((chipsetAsset?.data as string) ?? null);

  return (
    <ThreeColumnLayout
      left={
        <Tabs defaultValue="chipset" className="flex h-full flex-col bg-muted/20">
          <TabsList className="w-full shrink-0 rounded-none border-b">
            <TabsTrigger value="map" className="flex-1">
              マップ
            </TabsTrigger>
            <TabsTrigger value="chipset" className="flex-1">
              チップセット
            </TabsTrigger>
            <TabsTrigger value="object" className="flex-1">
              オブジェクト
            </TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="mt-0 flex-1 overflow-auto">
            <MapList
              maps={maps}
              selectedId={selectedMapId}
              onSelect={selectMap}
              onAdd={handleAddMap}
              onDelete={deleteMap}
              onDuplicate={handleDuplicateMap}
            />
          </TabsContent>

          <TabsContent value="chipset" className="mt-0 flex min-h-0 flex-1 flex-col">
            {selectedMap && (
              <LayerTabs
                layers={selectedMap.layers}
                selectedLayerId={selectedLayerId}
                onSelectLayer={selectLayer}
                onToggleVisibility={(id) =>
                  updateLayer(selectedMapId!, id, {
                    visible: !(selectedMap.layers.find((l) => l.id === id)?.visible ?? true),
                  })
                }
              />
            )}
            {/* チップセット選択：選択時にレイヤーの chipsetIds に自動登録 */}
            <div className="shrink-0 border-b px-2 py-1">
              <Select
                value={selectedChipsetId ?? ''}
                onValueChange={(id) => {
                  if (selectedMapId && selectedLayerId && selectedMap) {
                    const layer = selectedMap.layers.find((l) => l.id === selectedLayerId);
                    if (layer && !layer.chipsetIds.includes(id)) {
                      updateLayer(selectedMapId, selectedLayerId, {
                        chipsetIds: [...layer.chipsetIds, id],
                      });
                    }
                  }
                  selectChip(`${id}:0`);
                }}
              >
                <SelectTrigger className="h-7 text-xs" aria-label="チップセットを選択">
                  <SelectValue placeholder="チップセットを選択" />
                </SelectTrigger>
                <SelectContent>
                  {chipsets
                    .filter((cs) => selectedLayer?.chipsetIds.includes(cs.id))
                    .map((cs) => (
                      <SelectItem key={cs.id} value={cs.id}>
                        {cs.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            {/* 縦スクロール・横スクロール両対応: キャンバスは固有サイズで表示 */}
            <div className="min-h-0 flex-1 overflow-auto">
              <ChipPalette
                chipset={selectedChipset}
                imageDataUrl={chipsetBlobUrl}
                imageSize={chipsetImageSize}
                selectedChipId={selectedChipId}
                onSelectChip={selectChip}
              />
            </div>
          </TabsContent>

          <TabsContent value="object" className="mt-0 flex min-h-0 flex-1 flex-col">
            <div className="border-b p-2 text-xs font-semibold text-muted-foreground">プレハブ</div>
            <PrefabList
              prefabs={prefabs}
              selectedId={selectedPrefabId}
              onSelect={selectPrefab}
              onAdd={handleAddPrefab}
              onDelete={deletePrefab}
              onDuplicate={handleDuplicatePrefab}
              placementSelectedId={placementPrefabId}
              onSelectForPlacement={selectPrefabForPlacement}
            />
            <div className="border-b border-t p-2 text-xs font-semibold text-muted-foreground">
              配置済み
            </div>
            <div className="min-h-0 flex-1 overflow-auto">
              <MapObjectList
                objects={selectedLayer?.objects ?? []}
                selectedObjectId={selectedObjectId}
                onSelectObject={selectObject}
                onDeleteObject={(id) => {
                  if (!selectedMapId || !selectedLayerId) return;
                  const obj = selectedLayer?.objects?.find((o) => o.id === id);
                  if (obj) {
                    deleteObject(selectedMapId, selectedLayerId, id);
                    pushUndo({
                      type: 'deleteObject',
                      mapId: selectedMapId,
                      layerId: selectedLayerId,
                      object: obj,
                    });
                  }
                }}
              />
            </div>
          </TabsContent>
        </Tabs>
      }
      center={
        <div className="flex h-full flex-col">
          <MapToolbar
            currentTool={currentTool}
            onSetTool={setTool}
            showGrid={showGrid}
            onToggleGrid={toggleGrid}
            zoom={viewport.zoom}
            onZoomIn={() => setViewport(applyZoom(viewport, 1, 0, 0))}
            onZoomOut={() => setViewport(applyZoom(viewport, -1, 0, 0))}
          />
          <div className="flex-1 overflow-hidden bg-neutral-800">
            {selectedMapId ? (
              <MapCanvas mapId={selectedMapId} />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                マップを選択してください
              </div>
            )}
          </div>
        </div>
      }
      right={
        <div className="h-full overflow-auto bg-muted/20">
          {selectedObjectId ? (
            <MapPropertyPanel
              selectedObjectId={selectedObjectId}
              mapId={selectedMapId ?? ''}
              layerId={selectedLayerId}
            />
          ) : (
            <MapSettingsEditor
              map={selectedMap}
              chipsets={chipsets}
              onUpdateMap={updateMap}
              onUpdateMapValues={updateMapValues}
              onAddLayer={addLayer}
              onUpdateLayer={updateLayer}
              onDeleteLayer={deleteLayer}
              onReorderLayers={reorderLayers}
            />
          )}
        </div>
      }
      leftDefaultWidth={240}
      rightDefaultWidth={300}
      leftMinWidth={160}
      leftMaxWidth={500}
      rightMinWidth={200}
      rightMaxWidth={450}
    />
  );
}
