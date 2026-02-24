'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ObjectCanvasComponent } from '@/types/components/ObjectCanvasComponent';
import type { ComponentPanelProps } from '@/types/components/Component';

interface Props extends ComponentPanelProps {
  component: ObjectCanvasComponent;
}

export function ObjectCanvasPropertyPanel({ component, onChange }: Props) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">オフセット X</Label>
          <Input
            type="number"
            className="h-7 text-xs"
            value={component.offsetX}
            onChange={(e) => onChange({ offsetX: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">オフセット Y</Label>
          <Input
            type="number"
            className="h-7 text-xs"
            value={component.offsetY}
            onChange={(e) => onChange({ offsetY: parseFloat(e.target.value) || 0 })}
          />
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground">
        UI要素はマップエディタのオブジェクトキャンバスで編集します
      </p>
    </div>
  );
}
