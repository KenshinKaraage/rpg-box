'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ImageFieldEditor } from '@/features/data-editor/components/fields/ImageFieldEditor';
import type { SpriteComponent } from '@/types/components/SpriteComponent';
import type { ComponentPanelProps } from '@/types/components/Component';

interface Props extends ComponentPanelProps {
  component: SpriteComponent;
}

export function SpritePropertyPanel({ component, onChange }: Props) {
  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Label className="text-xs">画像</Label>
        <ImageFieldEditor
          value={component.imageId ?? null}
          onChange={(id) => onChange({ imageId: id ?? undefined })}
          showPreview={false}
        />
      </div>
      <div className="flex gap-4">
        <div className="flex items-center gap-1.5">
          <Checkbox
            id="sprite-flipX"
            checked={component.flipX}
            onCheckedChange={(v) => onChange({ flipX: v === true })}
          />
          <Label htmlFor="sprite-flipX" className="text-xs">
            X反転
          </Label>
        </div>
        <div className="flex items-center gap-1.5">
          <Checkbox
            id="sprite-flipY"
            checked={component.flipY}
            onCheckedChange={(v) => onChange({ flipY: v === true })}
          />
          <Label htmlFor="sprite-flipY" className="text-xs">
            Y反転
          </Label>
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">不透明度（0〜1）</Label>
        <Input
          type="number"
          className="h-7 text-xs"
          min={0}
          max={1}
          step={0.1}
          value={component.opacity}
          onChange={(e) => onChange({ opacity: parseFloat(e.target.value) ?? 1 })}
        />
      </div>
    </div>
  );
}
