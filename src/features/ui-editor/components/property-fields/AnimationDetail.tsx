'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
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
import type { NamedAnimation, TweenTrack, InlineTimeline, LoopType } from '@/types/ui/components/AnimationComponent';
import { computeCycleDuration, LOOP_TYPE_OPTIONS } from '@/types/ui/components/AnimationComponent';
import type { ComponentOption } from '@/features/ui-editor/hooks/useComponentProperties';
import type { PresetInfo } from './InlineAnimationEditor';
import { TimelineBands } from './TimelineBands';
import { AnimationTrackEditor } from './AnimationTrackEditor';

// ──────────────────────────────────────────────
// AnimationDetail (timeline + selected track editor)
// ──────────────────────────────────────────────

export interface AnimationDetailProps {
  anim: NamedAnimation;
  animIdx: number;
  easingNames: string[];
  presets: PresetInfo[];
  componentOptions: ComponentOption[];
  onUpdateName: (name: string) => void;
  onUpdateTimeline: (patch: Partial<InlineTimeline>) => void;
  onUpdateTrack: (trackIdx: number, patch: Partial<TweenTrack>) => void;
  onAddTrack: () => void;
  onDeleteTrack: (trackIdx: number) => void;
  onApplyPreset: (name: string) => void;
}

export function AnimationDetail({
  anim, easingNames, presets, componentOptions,
  onUpdateName, onUpdateTimeline, onUpdateTrack, onAddTrack, onDeleteTrack, onApplyPreset,
}: AnimationDetailProps) {
  const [selectedTrackIdx, setSelectedTrackIdx] = useState<number | null>(null);
  const cycleDuration = computeCycleDuration(anim.timeline.tracks);
  const selectedTrack = selectedTrackIdx !== null ? anim.timeline.tracks[selectedTrackIdx] : null;

  const loopType = anim.timeline.loopType ?? 'none';
  const loopCount = anim.timeline.loopCount ?? 1;

  // Reset selection when track count changes
  useEffect(() => {
    if (selectedTrackIdx !== null && selectedTrackIdx >= anim.timeline.tracks.length) {
      setSelectedTrackIdx(null);
    }
  }, [anim.timeline.tracks.length, selectedTrackIdx]);

  // Total duration display
  const totalLabel = loopType === 'none'
    ? `${cycleDuration}ms`
    : loopCount === 0
      ? `${cycleDuration}ms × ∞`
      : `${cycleDuration}ms × ${loopCount} = ${cycleDuration * loopCount}ms`;

  return (
    <div className="space-y-2 border-t px-2 py-1.5">
      {/* Name */}
      <div className="flex items-center gap-2">
        <Label className="w-10 shrink-0 text-[10px] text-muted-foreground">名前</Label>
        <Input className="h-6 flex-1 px-1 text-xs" value={anim.name}
          onChange={(e) => onUpdateName(e.target.value)} />
      </div>

      {/* Loop settings */}
      <div className="flex items-center gap-1">
        <Label className="w-10 shrink-0 text-[10px] text-muted-foreground">ループ</Label>
        <Select value={loopType} onValueChange={(v) => onUpdateTimeline({ loopType: v as LoopType })}>
          <SelectTrigger className="h-5 w-20 shrink-0 px-1 text-[10px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {LOOP_TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {loopType !== 'none' && (
          <>
            <Label className="shrink-0 text-[10px] text-muted-foreground">回数</Label>
            <Input type="number" className="h-5 w-12 px-1 text-[10px]" min={0} step={1}
              value={loopCount}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v) && v >= 0) onUpdateTimeline({ loopCount: v });
              }}
            />
            <span className="text-[9px] text-muted-foreground">0=∞</span>
          </>
        )}
      </div>

      {/* Presets */}
      <div>
        <Label className="text-[10px] text-muted-foreground">プリセット</Label>
        <div className="mt-0.5 flex flex-wrap gap-1">
          {presets.map((p) => (
            <Button key={p.name} size="sm" variant="outline"
              className="h-5 px-1.5 text-[10px]"
              disabled={!p.available}
              onClick={() => onApplyPreset(p.name)}>
              {p.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Timeline bands */}
      <div>
        <div className="flex items-center justify-between">
          <Label className="text-[10px] text-muted-foreground">タイムライン</Label>
          <span className="text-[9px] text-muted-foreground">{totalLabel}</span>
        </div>
        <div className="mt-0.5 rounded border bg-muted/20 p-1.5">
          <TimelineBands
            tracks={anim.timeline.tracks}
            totalDuration={cycleDuration}
            loopType={loopType}
            loopCount={loopCount}
            selectedTrackIdx={selectedTrackIdx}
            onSelectTrack={setSelectedTrackIdx}
            onUpdateTrack={onUpdateTrack}
          />
        </div>
        <Button size="sm" variant="outline" className="mt-1 h-5 w-full text-[10px]" onClick={onAddTrack}>
          <Plus className="mr-0.5 h-3 w-3" /> トラック追加
        </Button>
      </div>

      {/* Selected track editor */}
      {selectedTrack && selectedTrackIdx !== null && (
        <AnimationTrackEditor
          track={selectedTrack}
          easingNames={easingNames}
          componentOptions={componentOptions}
          onChange={(patch) => onUpdateTrack(selectedTrackIdx, patch)}
          onDelete={() => { onDeleteTrack(selectedTrackIdx); setSelectedTrackIdx(null); }}
        />
      )}
    </div>
  );
}
