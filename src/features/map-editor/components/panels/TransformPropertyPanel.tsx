'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { TransformComponent } from '@/types/components/TransformComponent';
import type { ComponentPanelProps } from '@/types/components/Component';

interface Props extends ComponentPanelProps {
  component: TransformComponent;
}

export function TransformPropertyPanel({ component, onChange }: Props) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">X</Label>
          <Input
            type="number"
            className="h-7 text-xs"
            value={component.x}
            onChange={(e) => onChange({ x: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Y</Label>
          <Input
            type="number"
            className="h-7 text-xs"
            value={component.y}
            onChange={(e) => onChange({ y: parseFloat(e.target.value) || 0 })}
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">回転（度）</Label>
        <Input
          type="number"
          className="h-7 text-xs"
          value={component.rotation}
          onChange={(e) => onChange({ rotation: parseFloat(e.target.value) || 0 })}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">スケール X</Label>
          <Input
            type="number"
            className="h-7 text-xs"
            step={0.1}
            value={component.scaleX}
            onChange={(e) => onChange({ scaleX: parseFloat(e.target.value) || 1 })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">スケール Y</Label>
          <Input
            type="number"
            className="h-7 text-xs"
            step={0.1}
            value={component.scaleY}
            onChange={(e) => onChange({ scaleY: parseFloat(e.target.value) || 1 })}
          />
        </div>
      </div>
    </div>
  );
}
