'use client';

import { Plus, Trash2, Eye, EyeOff, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { MapLayer, Chipset } from '@/types/map';

interface LayerEditorProps {
  layers: MapLayer[];
  chipsets: Chipset[];
  onAddLayer: () => void;
  onUpdateLayer: (layerId: string, updates: Partial<MapLayer>) => void;
  onDeleteLayer: (layerId: string) => void;
  onReorderLayers: (fromIndex: number, toIndex: number) => void;
}

export function LayerEditor({
  layers,
  onAddLayer,
  onUpdateLayer,
  onDeleteLayer,
  onReorderLayers,
}: LayerEditorProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>レイヤー</Label>
        <Button size="sm" variant="outline" onClick={onAddLayer} data-testid="add-layer-button">
          <Plus className="mr-1 h-4 w-4" />
          追加
        </Button>
      </div>

      {layers.length === 0 ? (
        <div className="text-sm text-muted-foreground">レイヤーがありません</div>
      ) : (
        <ul className="space-y-1" data-testid="layer-list">
          {layers.map((layer, index) => {
            const isVisible = layer.visible !== false;
            return (
              <li
                key={layer.id}
                className="flex items-center gap-1 rounded border p-1.5"
                data-testid={`layer-item-${layer.id}`}
              >
                {/* 表示/非表示 */}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 shrink-0 p-0"
                  onClick={() => onUpdateLayer(layer.id, { visible: !isVisible })}
                  aria-label={isVisible ? '非表示にする' : '表示する'}
                  data-testid={`toggle-visible-${layer.id}`}
                  data-visible={String(isVisible)}
                >
                  {isVisible ? (
                    <Eye className="h-3.5 w-3.5" />
                  ) : (
                    <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </Button>

                {/* 名前 */}
                <Input
                  value={layer.name}
                  onChange={(e) => onUpdateLayer(layer.id, { name: e.target.value })}
                  className={cn('h-7 flex-1 text-sm', !isVisible && 'opacity-50')}
                  data-testid={`layer-name-${layer.id}`}
                />

                {/* タイプバッジ */}
                <button
                  className="shrink-0"
                  onClick={() =>
                    onUpdateLayer(layer.id, {
                      type: layer.type === 'tile' ? 'object' : 'tile',
                    })
                  }
                  title="クリックでタイプ切り替え"
                  data-testid={`toggle-type-${layer.id}`}
                >
                  <Badge variant="secondary" className="cursor-pointer text-xs">
                    {layer.type}
                  </Badge>
                </button>

                {/* 並び替え */}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 shrink-0 p-0"
                  onClick={() => onReorderLayers(index, index - 1)}
                  disabled={index === 0}
                  aria-label="上に移動"
                  data-testid={`move-up-${layer.id}`}
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 shrink-0 p-0"
                  onClick={() => onReorderLayers(index, index + 1)}
                  disabled={index === layers.length - 1}
                  aria-label="下に移動"
                  data-testid={`move-down-${layer.id}`}
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>

                {/* 削除 */}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 shrink-0 p-0 text-destructive hover:text-destructive"
                  onClick={() => onDeleteLayer(layer.id)}
                  aria-label={`${layer.name}を削除`}
                  data-testid={`delete-layer-${layer.id}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
