'use client';

import { Plus, Trash2, Eye, EyeOff, ChevronUp, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  chipsets,
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
                className="flex flex-col gap-1 rounded border p-1.5"
                data-testid={`layer-item-${layer.id}`}
              >
                {/* 1行目: コントロール */}
                <div className="flex items-center gap-1">
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
                </div>

                {/* 2行目: チップセット割り当て（tile レイヤーのみ） */}
                {layer.type === 'tile' && (
                  <div
                    className="flex flex-wrap items-center gap-1 pl-1"
                    data-testid={`chipset-area-${layer.id}`}
                  >
                    {layer.chipsetIds.map((csId) => {
                      const cs = chipsets.find((c) => c.id === csId);
                      return (
                        <Badge
                          key={csId}
                          variant="secondary"
                          className="flex items-center gap-0.5 pr-0.5 text-xs"
                        >
                          {cs?.name ?? csId}
                          <button
                            className="ml-0.5 rounded hover:text-destructive"
                            onClick={() =>
                              onUpdateLayer(layer.id, {
                                chipsetIds: layer.chipsetIds.filter((id) => id !== csId),
                              })
                            }
                            aria-label={`${cs?.name ?? csId}を外す`}
                            data-testid={`remove-chipset-${layer.id}-${csId}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      );
                    })}
                    {chipsets.filter((cs) => !layer.chipsetIds.includes(cs.id)).length > 0 && (
                      <Select
                        value=""
                        onValueChange={(csId) =>
                          onUpdateLayer(layer.id, {
                            chipsetIds: [...layer.chipsetIds, csId],
                          })
                        }
                      >
                        <SelectTrigger
                          className="h-6 w-auto gap-1 border-dashed px-2 text-xs text-muted-foreground"
                          data-testid={`add-chipset-select-${layer.id}`}
                        >
                          <Plus className="h-3 w-3" />
                          <SelectValue placeholder="チップセット追加" />
                        </SelectTrigger>
                        <SelectContent>
                          {chipsets
                            .filter((cs) => !layer.chipsetIds.includes(cs.id))
                            .map((cs) => (
                              <SelectItem key={cs.id} value={cs.id}>
                                {cs.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
