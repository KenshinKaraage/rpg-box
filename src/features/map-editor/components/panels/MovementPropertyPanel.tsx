'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { MovementComponent } from '@/types/components/MovementComponent';
import type { ComponentPanelProps } from '@/types/components/Component';

interface Props extends ComponentPanelProps {
  component: MovementComponent;
}

export function MovementPropertyPanel({ component, onChange }: Props) {
  return (
    <div className="space-y-2">
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
    </div>
  );
}
