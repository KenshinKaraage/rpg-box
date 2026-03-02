'use client';

import { Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ActionBlockProps } from '@/features/event-editor/registry/actionBlockRegistry';
import type { SetPropertyAction } from '@/types/ui/actions/SetPropertyAction';
import { UIObjectSelector } from '../UIObjectSelector';

function cloneAction(action: SetPropertyAction): SetPropertyAction {
  return Object.assign(Object.create(Object.getPrototypeOf(action)), action);
}

const PROPERTY_OPTIONS = [
  { value: 'transform.x', label: '位置X' },
  { value: 'transform.y', label: '位置Y' },
  { value: 'transform.width', label: '幅' },
  { value: 'transform.height', label: '高さ' },
  { value: 'transform.rotation', label: '回転' },
  { value: 'transform.scaleX', label: 'スケールX' },
  { value: 'transform.scaleY', label: 'スケールY' },
  { value: 'opacity', label: '不透明度' },
  { value: 'fillAmount', label: '充填量' },
  { value: 'fontSize', label: 'フォントサイズ' },
  { value: 'color', label: '色' },
  { value: 'visible', label: '表示' },
];

export function SetPropertyBlock({ action, onChange, onDelete }: ActionBlockProps) {
  const a = action as SetPropertyAction;

  const handleChange = (field: string, value: unknown) => {
    const updated = cloneAction(a);
    (updated as unknown as Record<string, unknown>)[field] = value;
    onChange(updated);
  };

  return (
    <div className="rounded-md border p-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">プロパティ設定</Label>
        <Button size="sm" variant="ghost" onClick={onDelete} aria-label="削除" data-testid="delete-action">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="mt-2 space-y-2">
        <div className="flex items-center gap-2">
          <Label className="w-20 shrink-0 text-xs text-muted-foreground">対象</Label>
          <UIObjectSelector
            value={a.targetId}
            onChange={(id) => handleChange('targetId', id)}
            className="h-7 flex-1 text-xs"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label className="w-20 shrink-0 text-xs text-muted-foreground">プロパティ</Label>
          <Select
            value={a.property || '__none__'}
            onValueChange={(v) => handleChange('property', v === '__none__' ? '' : v)}
          >
            <SelectTrigger className="h-7 text-xs" data-testid="property-select">
              <SelectValue placeholder="選択..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">（選択なし）</SelectItem>
              {PROPERTY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label className="w-20 shrink-0 text-xs text-muted-foreground">値</Label>
          <Input
            type="number"
            value={typeof a.value === 'number' ? a.value : 0}
            onChange={(e) => {
              const num = parseFloat(e.target.value);
              if (!isNaN(num)) handleChange('value', num);
            }}
            className="h-7 text-xs"
            data-testid="value-input"
          />
        </div>
      </div>
    </div>
  );
}
