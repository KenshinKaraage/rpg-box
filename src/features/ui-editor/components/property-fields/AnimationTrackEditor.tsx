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
import { useMemo } from 'react';
import type { TweenTrack } from '@/types/ui/components/AnimationComponent';
import {
  getAnimatableDefsForComponent,
  type ComponentOption,
} from '@/features/ui-editor/hooks/useComponentProperties';
import { getUIComponent } from '@/types/ui';
import { ColorPickerPopover } from '../ColorPickerPopover';

// ──────────────────────────────────────────────
// TrackEditor (selected track detail)
// ──────────────────────────────────────────────

export interface AnimationTrackEditorProps {
  track: TweenTrack;
  easingNames: string[];
  componentOptions: ComponentOption[];
  onChange: (patch: Partial<TweenTrack>) => void;
  onDelete: () => void;
}

export function AnimationTrackEditor({ track, easingNames, componentOptions, onChange, onDelete }: AnimationTrackEditorProps) {
  const dotIdx = track.property.indexOf('.');
  const currentComp = dotIdx > 0 ? track.property.slice(0, dotIdx) : 'transform';
  const currentPropKey = dotIdx > 0 ? track.property.slice(dotIdx + 1) : track.property;
  const compProps = getAnimatableDefsForComponent(currentComp);

  // Ensure current component appears in dropdown even if not on the object
  const effectiveOptions = useMemo(() => {
    if (componentOptions.some((o) => o.type === currentComp)) return componentOptions;
    const Ctor = getUIComponent(currentComp);
    const label = Ctor ? new Ctor().label : currentComp;
    return [...componentOptions, { type: currentComp, label }];
  }, [componentOptions, currentComp]);
  const propDef = compProps.find((p) => p.key === currentPropKey);
  const isColor = track.valueType === 'color' || propDef?.valueType === 'color';

  const handleComponentChange = (newComp: string) => {
    const defs = getAnimatableDefsForComponent(newComp);
    if (defs.length === 0) return;
    const first = defs[0]!;
    const path = `${newComp}.${first.key}`;
    if (first.valueType === 'color') {
      onChange({ property: path, valueType: 'color', fromColor: '#000000', toColor: '#ffffff' });
    } else {
      onChange({ property: path, valueType: undefined });
    }
  };

  const handlePropertyChange = (newKey: string) => {
    const path = `${currentComp}.${newKey}`;
    const def = compProps.find((p) => p.key === newKey);
    if (def?.valueType === 'color') {
      onChange({ property: path, valueType: 'color', fromColor: track.fromColor ?? '#000000', toColor: track.toColor ?? '#ffffff' });
    } else {
      onChange({ property: path, valueType: undefined });
    }
  };

  return (
    <div className="rounded border bg-muted/30 p-1.5 space-y-1">
      <div className="flex items-center justify-between">
        <Label className="text-[10px] font-semibold">トラック編集</Label>
        <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={onDelete} aria-label="トラック削除">
          <Trash2 className="h-2.5 w-2.5" />
        </Button>
      </div>

      {/* Component → Property */}
      <div className="flex items-center gap-1">
        <Select value={currentComp} onValueChange={handleComponentChange}>
          <SelectTrigger className="h-5 w-24 shrink-0 px-1 text-[10px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {effectiveOptions.map((opt) => (
              <SelectItem key={opt.type} value={opt.type}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={currentPropKey} onValueChange={handlePropertyChange}>
          <SelectTrigger className="h-5 flex-1 px-1 text-[10px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {compProps.map((p) => (
              <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Values */}
      {isColor ? (
        <div className="flex items-center gap-1">
          <Label className="w-6 shrink-0 text-[10px] text-muted-foreground">from</Label>
          <ColorPickerPopover value={track.fromColor ?? '#000000'} onChange={(v) => onChange({ fromColor: v })}>
            <button type="button" className="flex h-5 flex-1 items-center gap-1 rounded border px-1">
              <span className="h-3 w-3 shrink-0 rounded-sm border" style={{ backgroundColor: track.fromColor ?? '#000000' }} />
              <span className="truncate text-[10px]">{track.fromColor ?? '#000000'}</span>
            </button>
          </ColorPickerPopover>
          <Label className="w-4 shrink-0 text-center text-[10px] text-muted-foreground">to</Label>
          <ColorPickerPopover value={track.toColor ?? '#ffffff'} onChange={(v) => onChange({ toColor: v })}>
            <button type="button" className="flex h-5 flex-1 items-center gap-1 rounded border px-1">
              <span className="h-3 w-3 shrink-0 rounded-sm border" style={{ backgroundColor: track.toColor ?? '#ffffff' }} />
              <span className="truncate text-[10px]">{track.toColor ?? '#ffffff'}</span>
            </button>
          </ColorPickerPopover>
        </div>
      ) : (
        <div className="flex items-center gap-1">
          <Label className="w-6 shrink-0 text-[10px] text-muted-foreground">from</Label>
          <Input type="number" className="h-5 flex-1 px-1 text-[10px]" value={track.from}
            onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) onChange({ from: v }); }} />
          <Label className="w-4 shrink-0 text-center text-[10px] text-muted-foreground">to</Label>
          <Input type="number" className="h-5 flex-1 px-1 text-[10px]" value={track.to}
            onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) onChange({ to: v }); }} />
        </div>
      )}

      {/* Timing */}
      <div className="flex items-center gap-1">
        <Label className="w-6 shrink-0 text-[10px] text-muted-foreground">開始</Label>
        <Input type="number" className="h-5 flex-1 px-1 text-[10px]" value={track.startTime} min={0} step={50}
          onChange={(e) => { const v = parseInt(e.target.value, 10); if (!isNaN(v) && v >= 0) onChange({ startTime: v }); }} />
        <Label className="w-6 shrink-0 text-center text-[10px] text-muted-foreground">長さ</Label>
        <Input type="number" className="h-5 flex-1 px-1 text-[10px]" value={track.duration} min={1} step={50}
          onChange={(e) => { const v = parseInt(e.target.value, 10); if (!isNaN(v) && v > 0) onChange({ duration: v }); }} />
      </div>

      {/* Easing + Relative */}
      <div className="flex items-center gap-1">
        <Label className="w-6 shrink-0 text-[10px] text-muted-foreground">緩急</Label>
        <Select value={track.easing} onValueChange={(v) => onChange({ easing: v })}>
          <SelectTrigger className="h-5 flex-1 px-1 text-[10px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {easingNames.map((name) => (
              <SelectItem key={name} value={name}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <label className="flex shrink-0 items-center gap-0.5 text-[10px] text-muted-foreground cursor-pointer">
          <input type="checkbox" className="h-3 w-3" checked={!!track.relative}
            onChange={(e) => onChange({ relative: e.target.checked })} />
          相対
        </label>
      </div>
    </div>
  );
}
