'use client';

import { Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { generateId } from '@/lib/utils';
import type { GameMap, MapLayer, Chipset } from '@/types/map';
import { LayerEditor } from './LayerEditor';

interface MapSettingsEditorProps {
  map: GameMap | null;
  chipsets: Chipset[];
  onUpdateMap: (id: string, updates: Partial<GameMap>) => void;
  onUpdateMapValues: (mapId: string, values: Record<string, unknown>) => void;
  onAddLayer: (mapId: string, layer: MapLayer) => void;
  onUpdateLayer: (mapId: string, layerId: string, updates: Partial<MapLayer>) => void;
  onDeleteLayer: (mapId: string, layerId: string) => void;
  onReorderLayers: (mapId: string, fromIndex: number, toIndex: number) => void;
}

/**
 * マップ設定エディタ
 */
export function MapSettingsEditor({
  map,
  chipsets,
  onUpdateMap,
  onUpdateMapValues,
  onAddLayer,
  onUpdateLayer,
  onDeleteLayer,
  onReorderLayers,
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
      visible: true,
      chipsetIds: [],
    };
    onAddLayer(map.id, newLayer);
  };

  const handleFieldChange = (fieldId: string, value: unknown) => {
    onUpdateMapValues(map.id, { ...map.values, [fieldId]: value });
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
        <LayerEditor
          layers={map.layers}
          chipsets={chipsets}
          onAddLayer={handleAddLayer}
          onUpdateLayer={(layerId, updates) => onUpdateLayer(map.id, layerId, updates)}
          onDeleteLayer={(layerId) => onDeleteLayer(map.id, layerId)}
          onReorderLayers={(from, to) => onReorderLayers(map.id, from, to)}
        />

        {/* カスタムフィールド */}
        {map.fields.length > 0 && (
          <div className="space-y-2" data-testid="map-fields-section">
            <Label>プロパティ</Label>
            <div className="space-y-3">
              {map.fields.map((field) => {
                const value = map.values[field.id] ?? field.getDefaultValue();
                return (
                  <div key={field.id} className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      {field.name}
                      {field.required && <span className="ml-1 text-red-500">*</span>}
                    </Label>
                    {field.renderEditor({
                      value,
                      onChange: (newValue: unknown) => handleFieldChange(field.id, newValue),
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
