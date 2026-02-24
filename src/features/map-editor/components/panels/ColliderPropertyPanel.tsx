'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import type { ColliderComponent } from '@/types/components/ColliderComponent';
import type { ComponentPanelProps } from '@/types/components/Component';

interface Props extends ComponentPanelProps {
  component: ColliderComponent;
}

export function ColliderPropertyPanel({ component, onChange }: Props) {
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
      <div className="space-y-1">
        <Label className="text-xs">レイヤー</Label>
        <Input
          type="number"
          className="h-7 text-xs"
          min={0}
          value={component.layer}
          onChange={(e) => onChange({ layer: parseInt(e.target.value, 10) || 0 })}
        />
      </div>
      <div className="flex items-center gap-1.5">
        <Checkbox
          id="collider-passable"
          checked={component.passable}
          onCheckedChange={(v) => onChange({ passable: v === true })}
        />
        <Label htmlFor="collider-passable" className="text-xs">
          通過可能
        </Label>
      </div>
    </div>
  );
}
