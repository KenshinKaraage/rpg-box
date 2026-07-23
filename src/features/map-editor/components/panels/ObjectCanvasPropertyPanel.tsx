'use client';

import { Label } from '@/components/ui/label';
import { NumberFieldEditor } from '@/features/data-editor/components/fields/NumberFieldEditor';
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
          <NumberFieldEditor
            className="h-7 text-xs"
            value={component.offsetX}
            onChange={(v) => onChange({ offsetX: v })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">オフセット Y</Label>
          <NumberFieldEditor
            className="h-7 text-xs"
            value={component.offsetY}
            onChange={(v) => onChange({ offsetY: v })}
          />
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground">
        UI要素はマップエディタのオブジェクトキャンバスで編集します
      </p>
    </div>
  );
}
