'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { RectTransform } from '@/types/ui/UIComponent';
import { AnchorPresets } from './AnchorPresets';

// ──────────────────────────────────────────────
// Number input helper
// ──────────────────────────────────────────────

function NumberField({
  label,
  value,
  onChange,
  step = 1,
  min,
  max,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  disabled?: boolean;
}) {
  const [localValue, setLocalValue] = useState(String(value));

  return (
    <div className="flex items-center gap-1">
      <Label className="w-8 shrink-0 text-xs text-muted-foreground">{label}</Label>
      <Input
        type="number"
        className="h-7 px-1 text-xs"
        value={localValue}
        step={step}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw !== '' && raw !== '-' && isNaN(Number(raw))) return;
          setLocalValue(raw);
          const v = parseFloat(raw);
          if (!isNaN(v)) onChange(v);
        }}
        onBlur={() => {
          const v = parseFloat(localValue);
          setLocalValue(isNaN(v) ? String(value) : String(v));
        }}
      />
    </div>
  );
}

// ──────────────────────────────────────────────
// RectTransform Editor
// ──────────────────────────────────────────────

interface TransformEditorProps {
  transform: RectTransform;
  onUpdate: (updates: Partial<RectTransform>) => void;
  /** 親のレイアウトで位置が管理されている場合 true（x/y を編集不可にする） */
  layoutManaged?: boolean;
}

export function TransformEditor({ transform, onUpdate, layoutManaged = false }: TransformEditorProps) {
  return (
    <div className="space-y-3" data-testid="transform-editor">
      {/* Position */}
      <fieldset>
        <legend className="mb-1 text-xs font-medium">
          位置{layoutManaged && <span className="ml-1 text-muted-foreground">(レイアウト)</span>}
        </legend>
        <div className="grid grid-cols-2 gap-2">
          <NumberField label="X" value={transform.x} onChange={(v) => onUpdate({ x: v })} disabled={layoutManaged} />
          <NumberField label="Y" value={transform.y} onChange={(v) => onUpdate({ y: v })} disabled={layoutManaged} />
        </div>
      </fieldset>

      {/* Size */}
      <fieldset>
        <legend className="mb-1 text-xs font-medium">サイズ</legend>
        <div className="grid grid-cols-2 gap-2">
          <NumberField
            label="W"
            value={transform.width}
            onChange={(v) => onUpdate({ width: v })}
            min={0}
          />
          <NumberField
            label="H"
            value={transform.height}
            onChange={(v) => onUpdate({ height: v })}
            min={0}
          />
        </div>
      </fieldset>

      {/* Anchor */}
      <fieldset>
        <legend className="mb-1 text-xs font-medium">アンカー</legend>
        <div className="flex items-start gap-3">
          <AnchorPresets
            anchorX={transform.anchorX}
            anchorY={transform.anchorY}
            onUpdate={onUpdate}
          />
          <div className="grid flex-1 grid-cols-1 gap-2">
            <div className="flex items-center gap-1">
              <Label className="w-8 shrink-0 text-xs text-muted-foreground">X</Label>
              <Select
                value={transform.anchorX}
                onValueChange={(v) => onUpdate({ anchorX: v as RectTransform['anchorX'] })}
              >
                <SelectTrigger className="h-7 text-xs" aria-label="アンカーX">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">左</SelectItem>
                  <SelectItem value="center">中央</SelectItem>
                  <SelectItem value="right">右</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-1">
              <Label className="w-8 shrink-0 text-xs text-muted-foreground">Y</Label>
              <Select
                value={transform.anchorY}
                onValueChange={(v) => onUpdate({ anchorY: v as RectTransform['anchorY'] })}
              >
                <SelectTrigger className="h-7 text-xs" aria-label="アンカーY">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top">上</SelectItem>
                  <SelectItem value="center">中央</SelectItem>
                  <SelectItem value="bottom">下</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </fieldset>

      {/* Pivot */}
      <fieldset>
        <legend className="mb-1 text-xs font-medium">ピボット</legend>
        <div className="grid grid-cols-2 gap-2">
          <NumberField
            label="X"
            value={transform.pivotX}
            onChange={(v) => onUpdate({ pivotX: v })}
            step={0.1}
            min={0}
            max={1}
          />
          <NumberField
            label="Y"
            value={transform.pivotY}
            onChange={(v) => onUpdate({ pivotY: v })}
            step={0.1}
            min={0}
            max={1}
          />
        </div>
      </fieldset>

      {/* Visible */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="transform-visible"
          checked={transform.visible !== false}
          onCheckedChange={(checked) => onUpdate({ visible: !!checked })}
        />
        <Label htmlFor="transform-visible" className="text-xs">表示</Label>
      </div>

      {/* Rotation & Scale */}
      <fieldset>
        <legend className="mb-1 text-xs font-medium">回転・スケール</legend>
        <div className="grid grid-cols-3 gap-2">
          <NumberField
            label="R"
            value={transform.rotation}
            onChange={(v) => onUpdate({ rotation: v })}
            step={1}
          />
          <NumberField
            label="SX"
            value={transform.scaleX}
            onChange={(v) => onUpdate({ scaleX: v })}
            step={0.1}
          />
          <NumberField
            label="SY"
            value={transform.scaleY}
            onChange={(v) => onUpdate({ scaleY: v })}
            step={0.1}
          />
        </div>
      </fieldset>
    </div>
  );
}
