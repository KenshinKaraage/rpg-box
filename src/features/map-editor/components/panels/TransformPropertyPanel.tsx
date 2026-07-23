'use client';

import { Label } from '@/components/ui/label';
import { NumberFieldEditor } from '@/features/data-editor/components/fields/NumberFieldEditor';
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
          <NumberFieldEditor
            className="h-7 text-xs"
            value={component.x}
            onChange={(v) => onChange({ x: v })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Y</Label>
          <NumberFieldEditor
            className="h-7 text-xs"
            value={component.y}
            onChange={(v) => onChange({ y: v })}
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">回転（度）</Label>
        <NumberFieldEditor
          className="h-7 text-xs"
          value={component.rotation}
          onChange={(v) => onChange({ rotation: v })}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">スケール X</Label>
          <NumberFieldEditor
            className="h-7 text-xs"
            step={0.1}
            value={component.scaleX}
            onChange={(v) => onChange({ scaleX: v })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">スケール Y</Label>
          <NumberFieldEditor
            className="h-7 text-xs"
            step={0.1}
            value={component.scaleY}
            onChange={(v) => onChange({ scaleY: v })}
          />
        </div>
      </div>
    </div>
  );
}
