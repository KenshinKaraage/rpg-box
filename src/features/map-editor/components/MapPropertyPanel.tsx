'use client';
import { useStore } from '@/stores';
import { ComponentEditor } from './ComponentEditor';

interface MapPropertyPanelProps {
  selectedObjectId: string | null;
  mapId: string;
  layerId: string | null;
}

export function MapPropertyPanel({ selectedObjectId, mapId, layerId }: MapPropertyPanelProps) {
  const maps = useStore((s) => s.maps);
  const prefabs = useStore((s) => s.prefabs);
  const updatePrefab = useStore((s) => s.updatePrefab);

  if (!selectedObjectId || !layerId) {
    return <div className="p-4 text-sm text-muted-foreground">オブジェクトを選択してください</div>;
  }

  const map = maps.find((m) => m.id === mapId);
  const layer = map?.layers.find((l) => l.id === layerId);
  const obj = layer?.objects?.find((o) => o.id === selectedObjectId);

  if (!obj) return null;

  const prefab = obj.prefabId ? (prefabs.find((p) => p.id === obj.prefabId) ?? null) : null;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex h-header items-center border-b px-4 text-sm font-semibold">
        {obj.name}
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <ComponentEditor prefab={prefab} onUpdatePrefab={updatePrefab} />
      </div>
    </div>
  );
}
