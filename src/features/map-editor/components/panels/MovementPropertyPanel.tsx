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
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, X } from 'lucide-react';
import type { MovementComponent, RouteStep } from '@/types/components/MovementComponent';
import type { ComponentPanelProps } from '@/types/components/Component';

interface Props extends ComponentPanelProps {
  component: MovementComponent;
}

const DIR_ICON = { up: ArrowUp, down: ArrowDown, left: ArrowLeft, right: ArrowRight };
const DIR_ARROW = { up: '↑', down: '↓', left: '←', right: '→' };
const DIRECTIONS = ['up', 'down', 'left', 'right'] as const;

function stepLabel(step: RouteStep): string {
  return `${step.type === 'face' ? '👁' : ''}${DIR_ARROW[step.direction]}`;
}

export function MovementPropertyPanel({ component, onChange }: Props) {
  const isRandom = component.pattern === 'random';
  const isRoute = component.pattern === 'route';

  const handleAddStep = (step: RouteStep) => {
    onChange({ routeSteps: [...component.routeSteps, step] });
  };

  const handleDeleteStep = (index: number) => {
    onChange({ routeSteps: component.routeSteps.filter((_, i) => i !== index) });
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
          <Label className="text-xs">活発さ（{component.activeness}）</Label>
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
          <Label className="text-xs">ルート</Label>

          {/* 移動追加ボタン（赤） */}
          <div className="space-y-1">
            <div className="text-[10px] text-red-400">移動</div>
            <div className="flex gap-1">
              {DIRECTIONS.map((dir) => {
                const Icon = DIR_ICON[dir];
                return (
                  <Button
                    key={`move-${dir}`}
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 border-red-400/50 text-red-400 hover:bg-red-400/10"
                    onClick={() => handleAddStep({ type: 'move', direction: dir })}
                    aria-label={`移動${DIR_ARROW[dir]}を追加`}
                  >
                    <Icon className="h-4 w-4" />
                  </Button>
                );
              })}
            </div>
          </div>

          {/* 向き変更追加ボタン（青） */}
          <div className="space-y-1">
            <div className="text-[10px] text-blue-400">向き変更</div>
            <div className="flex gap-1">
              {DIRECTIONS.map((dir) => {
                const Icon = DIR_ICON[dir];
                return (
                  <Button
                    key={`face-${dir}`}
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 border-blue-400/50 text-blue-400 hover:bg-blue-400/10"
                    onClick={() => handleAddStep({ type: 'face', direction: dir })}
                    aria-label={`向き${DIR_ARROW[dir]}を追加`}
                  >
                    <Icon className="h-4 w-4" />
                  </Button>
                );
              })}
            </div>
          </div>

          {/* ステップ一覧 */}
          {component.routeSteps.length === 0 ? (
            <div className="text-xs text-muted-foreground">ボタンでルートを追加</div>
          ) : (
            <div className="flex flex-wrap gap-1">
              {component.routeSteps.map((step, index) => (
                <div
                  key={index}
                  className={`group flex items-center gap-0.5 rounded border px-1.5 py-0.5 text-xs ${
                    step.type === 'move'
                      ? 'border-red-400/50 bg-red-400/10 text-red-300'
                      : 'border-blue-400/50 bg-blue-400/10 text-blue-300'
                  }`}
                >
                  <span>{stepLabel(step)}</span>
                  <button
                    className="hidden h-3 w-3 items-center justify-center group-hover:flex"
                    onClick={() => handleDeleteStep(index)}
                    aria-label="削除"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
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
