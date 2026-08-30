'use client';
import '@/features/event-editor/registry/register';
import { useEffect, useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ThreeColumnLayout } from '@/components/common/ThreeColumnLayout';
import { useToast } from '@/components/common/Toast';
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
import { createDefaultMap } from '@/features/map-editor/utils/createDefaultMap';
import { copyTiles, pasteTiles, type CopiedTile } from '@/features/map-editor/utils/tileCopyPaste';
import { resolveDefaultChipsetId } from '@/features/map-editor/utils/resolveDefaultChipset';
import type { GameMap, Prefab } from '@/types/map';
import type { ImageMetadata } from '@/types/assets';
import type { TileCell } from '@/stores/mapEditorSlice';

export default function MapEditPage() {
  const toast = useToast();

  // Map state
  const maps = useStore((s) => s.maps);
  const selectedMapId = useStore((s) => s.selectedMapId);
  const selectMap = useStore((s) => s.selectMap);
  const addMap = useStore((s) => s.addMap);
  const deleteMap = useStore((s) => s.deleteMap);

  // Layer / object state
  const selectedLayerId = useStore((s) => s.selectedLayerId);
  const selectedObjectId = useStore((s) => s.selectedObjectId);
  const selectedObjectIds = useStore((s) => s.selectedObjectIds);
  const selectLayer = useStore((s) => s.selectLayer);
  const updateLayer = useStore((s) => s.updateLayer);
  const updateMap = useStore((s) => s.updateMap);
  const updateMapValues = useStore((s) => s.updateMapValues);
  const addLayer = useStore((s) => s.addLayer);
  const deleteLayer = useStore((s) => s.deleteLayer);
  const reorderLayers = useStore((s) => s.reorderLayers);
  const selectObject = useStore((s) => s.selectObject);
  const selectObjects = useStore((s) => s.selectObjects);
  const deleteObject = useStore((s) => s.deleteObject);

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
  const selectedChipRange = useStore((s) => s.selectedChipRange);
  const tileSelection = useStore((s) => s.tileSelection);
  const viewport = useStore((s) => s.viewport);
  const showGrid = useStore((s) => s.showGrid);
  const setTool = useStore((s) => s.setTool);
  const selectChip = useStore((s) => s.selectChip);
  const selectChipRange = useStore((s) => s.selectChipRange);
  const setTile = useStore((s) => s.setTile);
  const setTileSelection = useStore((s) => s.setTileSelection);
  const setViewport = useStore((s) => s.setViewport);
  const toggleGrid = useStore((s) => s.toggleGrid);

  // Object placement state
  const placementPrefabId = useStore((s) => s.selectedPrefabId);
  const selectPrefabForPlacement = useStore((s) => s.selectPrefabForPlacement);

  // Undo/redo（editorSlice: design.md#EditorSlice 準拠のページ単位履歴）
  const pushUndoState = useStore((s) => s.pushUndoState);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const undoStacks = useStore((s) => s.undoStacks);
  const redoStacks = useStore((s) => s.redoStacks);
  const setCurrentPage = useStore((s) => s.setCurrentPage);

  const selectedMap = maps.find((m) => m.id === selectedMapId) ?? null;
  const selectedLayer = selectedMap?.layers.find((l) => l.id === selectedLayerId) ?? null;

  // タイルコピー&ペースト用クリップボード（ページ内のみで完結する一時状態）
  const [clipboard, setClipboard] = useState<{ origin: TileCell; tiles: CopiedTile[] } | null>(
    null
  );

  // レイヤー/マッププロパティの変更を Undo 対象にするラッパー
  // （変更前の maps 参照を積んでから元の store アクションを呼ぶだけ）
  function withUndo<Args extends unknown[]>(fn: (...args: Args) => void): (...args: Args) => void {
    return (...args: Args) => {
      pushUndoState('map', { maps });
      fn(...args);
    };
  }

  useEffect(() => {
    setCurrentPage('map');
  }, [setCurrentPage]);

  // レイヤー切り替え時: そのレイヤーで最後に選択していたチップセット（なければ先頭）を選択し直す。
  // 現在の選択が新レイヤーでも有効かどうかに関わらず、必ず切り替え先レイヤー自身の記憶を優先する
  // （複数レイヤーが同じチップセットを共有している場合、そのままだと切り替わったように見えないため）
  useEffect(() => {
    if (!selectedLayer) {
      selectChip(null);
      return;
    }
    const nextChipsetId = resolveDefaultChipsetId(selectedLayer);
    selectChip(nextChipsetId ? `${nextChipsetId}:0` : null);
  }, [selectedLayerId]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Map handlers ---
  const handleAddMap = () => {
    const newMap = createDefaultMap(maps.map((m) => m.id));
    pushUndoState('map', { maps });
    addMap(newMap);
    selectMap(newMap.id);
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
    pushUndoState('map', { maps });
    addMap(duplicated);
    selectMap(newId);
  };

  // --- Prefab handlers ---
  const handleAddPrefab = () => {
    const id = generateId(
      'prefab',
      prefabs.map((p) => p.id)
    );
    const newPrefab: Prefab = { id, name: '新しいプレハブ', prefab: { components: [] } };
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
      prefab: { components: original.prefab.components.map((c) => c.clone()) },
    };
    addPrefab(duplicated);
    selectPrefab(newId);
  };

  // --- コピー&ペースト ---
  const handleCopy = () => {
    if (!tileSelection) return;
    const layer = selectedMap?.layers.find((l) => l.id === tileSelection.layerId);
    if (!layer?.tiles) return;
    const tiles = copyTiles(layer.tiles, tileSelection.cells);
    if (tiles.length === 0) return;
    const originX = Math.min(...tileSelection.cells.map((c) => c.x));
    const originY = Math.min(...tileSelection.cells.map((c) => c.y));
    setClipboard({ origin: { x: originX, y: originY }, tiles });
    toast.success(`${tiles.length}マスをコピーしました`);
  };

  const handlePaste = () => {
    if (!clipboard || !selectedMapId || !selectedLayerId || !selectedMap) return;
    const anchor = useStore.getState().hoverTile ?? clipboard.origin;
    const targets = pasteTiles(clipboard.tiles, anchor, selectedMap.width, selectedMap.height);
    if (targets.length === 0) return;
    pushUndoState('map', { maps });
    targets.forEach(({ x, y, chipId }) => setTile(selectedMapId, selectedLayerId, x, y, chipId));
  };

  const handleDeleteSelection = () => {
    if (!selectedMapId || !selectedLayerId) return;

    if (selectedLayer?.type === 'object') {
      if (selectedObjectIds.length === 0) return;
      pushUndoState('map', { maps });
      selectedObjectIds.forEach((id) => deleteObject(selectedMapId, selectedLayerId, id));
      selectObjects([]);
      return;
    }

    if (!tileSelection) return;
    pushUndoState('map', { maps });
    tileSelection.cells.forEach(({ x, y }) =>
      setTile(selectedMapId, tileSelection.layerId, x, y, '')
    );
    setTileSelection(null);
  };

  useMapShortcuts({
    onSetTool: setTool,
    onUndo: undo,
    onRedo: redo,
    onCopy: handleCopy,
    onPaste: handlePaste,
    onDelete: handleDeleteSelection,
  });

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
        <Tabs
          defaultValue="map"
          className="flex h-full flex-col bg-muted/20"
          onValueChange={(tab) => {
            if (!selectedMap) return;
            if (tab === 'object') {
              const objLayer = selectedMap.layers.find((l) => l.type === 'object');
              if (objLayer) selectLayer(objLayer.id);
            } else if (tab === 'chipset') {
              const tileLayer = selectedMap.layers.find((l) => l.type === 'tile');
              if (tileLayer) selectLayer(tileLayer.id);
            }
          }}
        >
          <TabsList className="flex h-auto w-full shrink-0 flex-wrap rounded-none border-b bg-transparent p-0">
            <TabsTrigger value="map" className="px-3 py-1.5 text-xs">
              マップ
            </TabsTrigger>
            <TabsTrigger value="chipset" className="px-3 py-1.5 text-xs">
              チップセット
            </TabsTrigger>
            <TabsTrigger value="object" className="px-3 py-1.5 text-xs">
              オブジェクト
            </TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="mt-0 flex-1 overflow-auto">
            <MapList
              maps={maps}
              selectedId={selectedMapId}
              onSelect={selectMap}
              onAdd={handleAddMap}
              onDelete={withUndo(deleteMap)}
              onDuplicate={handleDuplicateMap}
            />
          </TabsContent>

          <TabsContent value="chipset" className="mt-0 flex min-h-0 flex-1 flex-col">
            {selectedMap && (
              <LayerTabs
                layers={selectedMap.layers.filter((l) => l.type === 'tile')}
                selectedLayerId={selectedLayerId}
                onSelectLayer={selectLayer}
                onToggleVisibility={(id) =>
                  withUndo(updateLayer)(selectedMapId!, id, {
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
                      withUndo(updateLayer)(selectedMapId, selectedLayerId, {
                        chipsetIds: [...layer.chipsetIds, id],
                      });
                    }
                    // どのチップセットを見ていたかはレイヤーに保存する（Undo対象外の付随情報）
                    updateLayer(selectedMapId, selectedLayerId, { selectedChipsetId: id });
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
                selectedRange={selectedChipRange}
                onSelectRange={selectChipRange}
              />
            </div>
          </TabsContent>

          <TabsContent value="object" className="mt-0 flex min-h-0 flex-1 flex-col">
            {selectedMap && (
              <LayerTabs
                layers={selectedMap.layers.filter((l) => l.type === 'object')}
                selectedLayerId={selectedLayerId}
                onSelectLayer={selectLayer}
                onToggleVisibility={(id) =>
                  withUndo(updateLayer)(selectedMapId!, id, {
                    visible: !(selectedMap.layers.find((l) => l.id === id)?.visible ?? true),
                  })
                }
              />
            )}
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
                    pushUndoState('map', { maps });
                    deleteObject(selectedMapId, selectedLayerId, id);
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
            canUndo={(undoStacks['map']?.length ?? 0) > 0}
            canRedo={(redoStacks['map']?.length ?? 0) > 0}
            onUndo={undo}
            onRedo={redo}
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
          {selectedObjectIds.length > 1 ? (
            <div className="p-4 text-sm text-muted-foreground">
              {selectedObjectIds.length}件選択中（複数選択時のプロパティ編集は未対応）
            </div>
          ) : selectedObjectId ? (
            <MapPropertyPanel
              selectedObjectId={selectedObjectId}
              mapId={selectedMapId ?? ''}
              layerId={selectedLayerId}
            />
          ) : (
            <MapSettingsEditor
              map={selectedMap}
              chipsets={chipsets}
              onUpdateMap={withUndo(updateMap)}
              onUpdateMapValues={withUndo(updateMapValues)}
              onAddLayer={withUndo(addLayer)}
              onUpdateLayer={withUndo(updateLayer)}
              onDeleteLayer={withUndo(deleteLayer)}
              onReorderLayers={withUndo(reorderLayers)}
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
