'use client';

import { Plus, Trash2, Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { generateId } from '@/lib/utils';
import type { GameMap, MapLayer } from '@/types/map';

interface MapSettingsEditorProps {
  map: GameMap | null;
  onUpdateMap: (id: string, updates: Partial<GameMap>) => void;
  onAddLayer: (mapId: string, layer: MapLayer) => void;
  onUpdateLayer: (mapId: string, layerId: string, updates: Partial<MapLayer>) => void;
  onDeleteLayer: (mapId: string, layerId: string) => void;
}

/**
 * マップ設定エディタ
 */
export function MapSettingsEditor({
  map,
  onUpdateMap,
  onAddLayer,
  onUpdateLayer,
  onDeleteLayer,
}: MapSettingsEditorProps) {
  if (!map) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        マップを選択してください
      </div>
    );
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateMap(map.id, { name: e.target.value });
  };

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      onUpdateMap(map.id, { width: Math.max(20, Math.min(999, value)) });
    }
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      onUpdateMap(map.id, { height: Math.max(15, Math.min(999, value)) });
    }
  };

  const handleAddLayer = () => {
    const existingLayerIds = map.layers.map((l) => l.id);
    const id = generateId('layer', existingLayerIds);
    const newLayer: MapLayer = {
      id,
      name: `レイヤー${map.layers.length + 1}`,
      type: 'tile' as const,
    };
    onAddLayer(map.id, newLayer);
  };

  const handleLayerNameChange = (layerId: string, name: string) => {
    onUpdateLayer(map.id, layerId, { name });
  };

  const handleDeleteLayer = (layerId: string) => {
    onDeleteLayer(map.id, layerId);
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(map.id);
  };

  return (
    <div className="h-full overflow-auto p-4">
      {/* ヘッダー */}
      <div className="mb-6 flex items-center gap-2">
        <h2 className="text-lg font-semibold" data-testid="map-settings-title">
          {map.name}
        </h2>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCopyId}
          aria-label="IDをコピー"
          data-testid="copy-id-button"
        >
          <Copy className="h-3 w-3" />
        </Button>
        <span className="text-xs text-muted-foreground">{map.id}</span>
      </div>

      <div className="space-y-6">
        {/* 名前 */}
        <div className="space-y-2">
          <Label htmlFor="map-name">名前</Label>
          <Input
            id="map-name"
            value={map.name}
            onChange={handleNameChange}
            data-testid="map-name-input"
          />
        </div>

        {/* サイズ */}
        <div className="space-y-2">
          <Label>サイズ</Label>
          <div className="flex gap-4">
            <div className="flex-1 space-y-1">
              <Label htmlFor="map-width" className="text-xs text-muted-foreground">
                幅
              </Label>
              <Input
                id="map-width"
                type="number"
                min={20}
                max={999}
                value={map.width}
                onChange={handleWidthChange}
                data-testid="map-width-input"
              />
            </div>
            <div className="flex-1 space-y-1">
              <Label htmlFor="map-height" className="text-xs text-muted-foreground">
                高さ
              </Label>
              <Input
                id="map-height"
                type="number"
                min={15}
                max={999}
                value={map.height}
                onChange={handleHeightChange}
                data-testid="map-height-input"
              />
            </div>
          </div>
        </div>

        {/* レイヤー */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>レイヤー</Label>
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddLayer}
              data-testid="add-layer-button"
            >
              <Plus className="mr-1 h-4 w-4" />
              追加
            </Button>
          </div>
          {map.layers.length === 0 ? (
            <div className="text-sm text-muted-foreground">レイヤーがありません</div>
          ) : (
            <ul className="space-y-2" data-testid="layer-list">
              {map.layers.map((layer) => (
                <li
                  key={layer.id}
                  className="flex items-center gap-2 rounded border p-2"
                  data-testid={`layer-item-${layer.id}`}
                >
                  <Input
                    value={layer.name}
                    onChange={(e) => handleLayerNameChange(layer.id, e.target.value)}
                    className="flex-1"
                    data-testid={`layer-name-input-${layer.id}`}
                  />
                  <Badge variant="secondary">{layer.type}</Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteLayer(layer.id)}
                    aria-label={`${layer.name}を削除`}
                    data-testid={`delete-layer-${layer.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* BGM */}
        <div className="space-y-2">
          <Label>BGM</Label>
          <div className="text-sm text-muted-foreground" data-testid="bgm-display">
            {map.bgmId ?? '未設定'}
          </div>
        </div>
      </div>
    </div>
  );
}
