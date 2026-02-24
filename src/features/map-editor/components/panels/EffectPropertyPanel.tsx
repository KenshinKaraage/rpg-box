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
import type { EffectComponent } from '@/types/components/EffectComponent';
import type { ComponentPanelProps } from '@/types/components/Component';

interface Props extends ComponentPanelProps {
  component: EffectComponent;
}

export function EffectPropertyPanel({ component, onChange }: Props) {
  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Label className="text-xs">エフェクト ID</Label>
        <Input
          className="h-7 text-xs"
          value={component.effectId ?? ''}
          onChange={(e) => onChange({ effectId: e.target.value || undefined })}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">完了後</Label>
        <Select value={component.onComplete} onValueChange={(v) => onChange({ onComplete: v })}>
          <SelectTrigger className="h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">何もしない</SelectItem>
            <SelectItem value="hide">非表示</SelectItem>
            <SelectItem value="delete">削除</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
