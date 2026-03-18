'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useStore } from '@/stores';
import type { ColliderComponent } from '@/types/components/ColliderComponent';
import type { ComponentPanelProps } from '@/types/components/Component';

interface Props extends ComponentPanelProps {
  component: ColliderComponent;
}

export function ColliderPropertyPanel({ component, onChange }: Props) {
  const maps = useStore((s) => s.maps);
  const selectedMapId = useStore((s) => s.selectedMapId);
  const map = maps.find((m) => m.id === selectedMapId);
  const layers = map?.layers ?? [];

  const toggleLayer = (layerId: string) => {
    const current = component.collideLayers;
    if (current.includes(layerId)) {
      onChange({ collideLayers: current.filter((id) => id !== layerId) });
    } else {
      onChange({ collideLayers: [...current, layerId] });
    }
  };

  const selectAll = () => {
    onChange({ collideLayers: layers.map((l) => l.id) });
  };

  const deselectAll = () => {
    onChange({ collideLayers: [] });
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">幅（グリッド）</Label>
          <Input
            type="number"
            className="h-7 text-xs"
            min={1}
            value={component.width}
            onChange={(e) => onChange({ width: parseInt(e.target.value, 10) || 1 })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">高さ（グリッド）</Label>
          <Input
            type="number"
            className="h-7 text-xs"
            min={1}
            value={component.height}
            onChange={(e) => onChange({ height: parseInt(e.target.value, 10) || 1 })}
          />
        </div>
      </div>

      {/* ぶつかるレイヤー */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label className="text-xs">ぶつかるレイヤー</Label>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[10px]" onClick={selectAll}>
              全ON
            </Button>
            <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[10px]" onClick={deselectAll}>
              全OFF
            </Button>
          </div>
        </div>
        <div className="space-y-1">
          {layers.map((layer) => (
            <div key={layer.id} className="flex items-center gap-1.5">
              <Checkbox
                id={`collide-${layer.id}`}
                checked={component.collideLayers.includes(layer.id)}
                onCheckedChange={() => toggleLayer(layer.id)}
              />
              <Label htmlFor={`collide-${layer.id}`} className="text-xs">
                {layer.name}
                <span className="ml-1 text-[10px] text-muted-foreground">
                  ({layer.type === 'tile' ? 'タイル' : 'オブジェクト'})
                </span>
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
