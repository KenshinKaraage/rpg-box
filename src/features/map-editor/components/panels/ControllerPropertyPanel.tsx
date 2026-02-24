'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import type { ControllerComponent } from '@/types/components/ControllerComponent';
import type { ComponentPanelProps } from '@/types/components/Component';

interface Props extends ComponentPanelProps {
  component: ControllerComponent;
}

export function ControllerPropertyPanel({ component, onChange }: Props) {
  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Label className="text-xs">移動速度</Label>
        <Input
          type="number"
          className="h-7 text-xs"
          min={0}
          step={0.5}
          value={component.moveSpeed}
          onChange={(e) => onChange({ moveSpeed: parseFloat(e.target.value) || 1 })}
        />
      </div>
      <div className="flex items-center gap-1.5">
        <Checkbox
          id="ctrl-dash"
          checked={component.dashEnabled}
          onCheckedChange={(v) => onChange({ dashEnabled: v === true })}
        />
        <Label htmlFor="ctrl-dash" className="text-xs">
          ダッシュ有効
        </Label>
      </div>
      <div className="flex items-center gap-1.5">
        <Checkbox
          id="ctrl-input"
          checked={component.inputEnabled}
          onCheckedChange={(v) => onChange({ inputEnabled: v === true })}
        />
        <Label htmlFor="ctrl-input" className="text-xs">
          入力有効
        </Label>
      </div>
    </div>
  );
}
