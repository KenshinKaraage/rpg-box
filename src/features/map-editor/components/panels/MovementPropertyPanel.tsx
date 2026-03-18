'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import type { MovementComponent, RoutePoint } from '@/types/components/MovementComponent';
import type { ComponentPanelProps } from '@/types/components/Component';

interface Props extends ComponentPanelProps {
  component: MovementComponent;
}

export function MovementPropertyPanel({ component, onChange }: Props) {
  const isRandom = component.pattern === 'random';
  const isRoute = component.pattern === 'route';

  const handleRoutePointChange = (index: number, field: 'x' | 'y', value: number) => {
    const newPoints = component.routePoints.map((p, i) =>
      i === index ? { ...p, [field]: value } : p
    );
    onChange({ routePoints: newPoints });
  };

  const handleAddRoutePoint = () => {
    const lastPoint = component.routePoints[component.routePoints.length - 1];
    const newPoint: RoutePoint = lastPoint
      ? { x: lastPoint.x, y: lastPoint.y }
      : { x: 0, y: 0 };
    onChange({ routePoints: [...component.routePoints, newPoint] });
  };

  const handleDeleteRoutePoint = (index: number) => {
    onChange({ routePoints: component.routePoints.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-2">
      {/* 移動パターン */}
      <div className="space-y-1">
        <Label className="text-xs">移動パターン</Label>
        <Select value={component.pattern} onValueChange={(v) => onChange({ pattern: v })}>
          <SelectTrigger className="h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fixed">固定</SelectItem>
            <SelectItem value="random">ランダム</SelectItem>
            <SelectItem value="route">ルート</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 速度 */}
      <div className="space-y-1">
        <Label className="text-xs">速度</Label>
        <Input
          type="number"
          className="h-7 text-xs"
          min={0}
          step={0.5}
          value={component.speed}
          onChange={(e) => onChange({ speed: parseFloat(e.target.value) || 1 })}
        />
      </div>

      {/* 活発さ（ランダム時のみ） */}
      {isRandom && (
        <div className="space-y-1">
          <Label className="text-xs">
            活発さ（{component.activeness}）
          </Label>
          <input
            type="range"
            min={1}
            max={10}
            value={component.activeness}
            onChange={(e) => onChange({ activeness: parseInt(e.target.value) })}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>おとなしい</span>
            <span>せわしない</span>
          </div>
        </div>
      )}

      {/* ルート編集（ルート時のみ） */}
      {isRoute && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">ルートポイント</Label>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleAddRoutePoint}
              aria-label="ポイントを追加"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          {component.routePoints.length === 0 ? (
            <div className="text-xs text-muted-foreground">ポイントがありません</div>
          ) : (
            <div className="space-y-1">
              {component.routePoints.map((point, index) => (
                <div key={index} className="flex items-center gap-1">
                  <span className="w-5 text-[10px] text-muted-foreground">{index + 1}</span>
                  <Input
                    type="number"
                    className="h-6 w-14 text-xs"
                    value={point.x}
                    onChange={(e) =>
                      handleRoutePointChange(index, 'x', parseInt(e.target.value) || 0)
                    }
                    placeholder="X"
                  />
                  <Input
                    type="number"
                    className="h-6 w-14 text-xs"
                    value={point.y}
                    onChange={(e) =>
                      handleRoutePointChange(index, 'y', parseInt(e.target.value) || 0)
                    }
                    placeholder="Y"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleDeleteRoutePoint(index)}
                    aria-label="ポイントを削除"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* ループ設定 */}
          <div className="flex items-center gap-1.5">
            <Checkbox
              id="route-loop"
              checked={component.routeLoop}
              onCheckedChange={(v) => onChange({ routeLoop: v === true })}
            />
            <Label htmlFor="route-loop" className="text-xs">
              ループ
            </Label>
          </div>
        </div>
      )}
    </div>
  );
}
