'use client';

import { useState } from 'react';
import { Plus, Trash2, ChevronRight, ChevronDown } from 'lucide-react';
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
import type { NamedAnimation, TweenTrack } from '@/types/ui/components/AnimationComponent';
import { computeTimelineDuration } from '@/types/ui/components/AnimationComponent';
import { useStore } from '@/stores';
import { getEasingNames } from '@/engine/tween/easings';
import { getTweenPresetNames, getTweenPreset } from '@/engine/tween/presets';
import {
  useComponentOptions,
  getAnimatableDefsForComponent,
  type ComponentOption,
} from '@/features/ui-editor/hooks/useComponentProperties';
import { ColorPickerPopover } from '../ColorPickerPopover';
import { AnimationPreviewPlayer } from '../AnimationPreviewPlayer';

// ──────────────────────────────────────────────
// Preset virtual property resolution
// ──────────────────────────────────────────────

/** Resolve virtual preset property (e.g. 'opacity', 'color') to explicit path */
function resolvePresetProperty(
  path: string,
  componentTypes: string[],
): string {
  if (path.includes('.')) return path;
  for (const ct of componentTypes) {
    const defs = getAnimatableDefsForComponent(ct);
    if (defs.some((p) => p.key === path)) {
      return `${ct}.${path}`;
    }
  }
  return path;
}

// ──────────────────────────────────────────────
// InlineAnimationEditor
// ──────────────────────────────────────────────

interface InlineAnimationEditorProps {
  animations: NamedAnimation[];
  onChange: (animations: NamedAnimation[]) => void;
}

export function InlineAnimationEditor({ animations, onChange }: InlineAnimationEditorProps) {
  const selectedCanvasId = useStore((s) => s.selectedCanvasId);
  const selectedObjectIds = useStore((s) => s.selectedObjectIds);
  const objectId = selectedObjectIds.length === 1 ? selectedObjectIds[0]! : null;

  const componentOptions = useComponentOptions(objectId ?? '', 'animatable');

  const [expandedIndex, setExpandedIndex] = useState<number | null>(
    animations.length > 0 ? 0 : null
  );

  const handleAddAnimation = () => {
    const newAnim: NamedAnimation = {
      name: `アニメーション${animations.length + 1}`,
      timeline: { tracks: [] },
    };
    const updated = [...animations, newAnim];
    onChange(updated);
    setExpandedIndex(updated.length - 1);
  };

  const handleDeleteAnimation = (index: number) => {
    const updated = animations.filter((_, i) => i !== index);
    onChange(updated);
    if (expandedIndex === index) {
      setExpandedIndex(null);
    } else if (expandedIndex !== null && expandedIndex > index) {
      setExpandedIndex(expandedIndex - 1);
    }
  };

  const handleUpdateName = (index: number, name: string) => {
    const updated = animations.map((a, i) => (i === index ? { ...a, name } : a));
    onChange(updated);
  };

  const handleUpdateTrack = (animIndex: number, trackIndex: number, patch: Partial<TweenTrack>) => {
    const updated = animations.map((a, i) => {
      if (i !== animIndex) return a;
      const tracks = a.timeline.tracks.map((t, j) => (j === trackIndex ? { ...t, ...patch } : t));
      return { ...a, timeline: { ...a.timeline, tracks } };
    });
    onChange(updated);
  };

  const handleAddTrack = (animIndex: number) => {
    const newTrack: TweenTrack = {
      property: 'transform.x',
      startTime: 0,
      duration: 500,
      from: 0,
      to: 100,
      easing: 'easeOut',
    };
    const updated = animations.map((a, i) => {
      if (i !== animIndex) return a;
      return { ...a, timeline: { ...a.timeline, tracks: [...a.timeline.tracks, newTrack] } };
    });
    onChange(updated);
  };

  const handleDeleteTrack = (animIndex: number, trackIndex: number) => {
    const updated = animations.map((a, i) => {
      if (i !== animIndex) return a;
      return {
        ...a,
        timeline: {
          ...a.timeline,
          tracks: a.timeline.tracks.filter((_, j) => j !== trackIndex),
        },
      };
    });
    onChange(updated);
  };

  const handleApplyPreset = (animIndex: number, presetName: string) => {
    const presetFn = getTweenPreset(presetName);
    if (!presetFn) return;
    const anim = animations[animIndex];
    if (!anim) return;
    const currentDuration = computeTimelineDuration(anim.timeline.tracks);
    const rawTracks = presetFn(currentDuration > 0 ? currentDuration : 500);
    // Resolve virtual property paths to explicit component.property paths
    const compTypes = componentOptions.map((c) => c.type);
    const tracks = rawTracks.map((t) => ({
      ...t,
      property: resolvePresetProperty(t.property, compTypes),
    }));
    const updated = animations.map((a, i) =>
      i === animIndex ? { ...a, name: presetName, timeline: { ...a.timeline, tracks } } : a
    );
    onChange(updated);
    setExpandedIndex(animIndex);
  };

  const easingNames = getEasingNames();
  const presetNames = getTweenPresetNames();

  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">アニメーション</Label>

      {animations.map((anim, animIdx) => {
        const isExpanded = expandedIndex === animIdx;
        return (
          <div key={animIdx} className="rounded border">
            {/* Header */}
            <div className="flex items-center gap-1 px-1 py-0.5 hover:bg-accent">
              <button
                type="button"
                className="shrink-0"
                onClick={() => setExpandedIndex(isExpanded ? null : animIdx)}
                aria-label={isExpanded ? '折りたたむ' : '展開する'}
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </button>
              <span className="flex-1 truncate text-xs">{anim.name}</span>
              <span className="text-[10px] text-muted-foreground">
                {anim.timeline.tracks.length}tr
              </span>
              {selectedCanvasId && objectId && (
                <AnimationPreviewPlayer
                  animation={anim}
                  canvasId={selectedCanvasId}
                  objectId={objectId}
                />
              )}
              <Button
                size="sm"
                variant="ghost"
                className="h-5 w-5 p-0"
                onClick={() => handleDeleteAnimation(animIdx)}
                aria-label={`${anim.name}を削除`}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>

            {/* Expanded detail */}
            {isExpanded && (
              <div className="space-y-2 border-t px-2 py-1.5">
                {/* Name */}
                <div className="flex items-center gap-2">
                  <Label className="w-12 shrink-0 text-[10px] text-muted-foreground">名前</Label>
                  <Input
                    className="h-6 flex-1 px-1 text-xs"
                    value={anim.name}
                    onChange={(e) => handleUpdateName(animIdx, e.target.value)}
                  />
                </div>

                {/* Preset buttons */}
                <div>
                  <Label className="text-[10px] text-muted-foreground">プリセット</Label>
                  <div className="mt-0.5 flex flex-wrap gap-1">
                    {presetNames.map((name) => (
                      <Button
                        key={name}
                        size="sm"
                        variant="outline"
                        className="h-5 px-1.5 text-[10px]"
                        onClick={() => handleApplyPreset(animIdx, name)}
                      >
                        {name}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Tracks */}
                <div>
                  <Label className="text-[10px] text-muted-foreground">トラック</Label>
                  {anim.timeline.tracks.length === 0 ? (
                    <div className="text-[10px] text-muted-foreground">トラックなし</div>
                  ) : (
                    <div className="mt-0.5 space-y-1.5">
                      {anim.timeline.tracks.map((track, tIdx) => (
                        <TrackEditor
                          key={tIdx}
                          track={track}
                          easingNames={easingNames}
                          componentOptions={componentOptions}
                          onChange={(patch) => handleUpdateTrack(animIdx, tIdx, patch)}
                          onDelete={() => handleDeleteTrack(animIdx, tIdx)}
                        />
                      ))}
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-1 h-6 w-full text-xs"
                    onClick={() => handleAddTrack(animIdx)}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    トラック追加
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <Button
        size="sm"
        variant="outline"
        className="h-6 w-full text-xs"
        onClick={handleAddAnimation}
      >
        <Plus className="mr-1 h-3 w-3" />
        アニメーション追加
      </Button>
    </div>
  );
}

// ──────────────────────────────────────────────
// TrackEditor (two-level: component → property)
// ──────────────────────────────────────────────

interface TrackEditorProps {
  track: TweenTrack;
  easingNames: string[];
  componentOptions: ComponentOption[];
  onChange: (patch: Partial<TweenTrack>) => void;
  onDelete: () => void;
}

function TrackEditor({ track, easingNames, componentOptions, onChange, onDelete }: TrackEditorProps) {
  // Parse current path into component + property key
  const dotIdx = track.property.indexOf('.');
  const currentComp = dotIdx > 0 ? track.property.slice(0, dotIdx) : 'transform';
  const currentPropKey = dotIdx > 0 ? track.property.slice(dotIdx + 1) : track.property;

  const compProps = getAnimatableDefsForComponent(currentComp);
  const propDef = compProps.find((p) => p.key === currentPropKey);
  const isColor = track.valueType === 'color' || propDef?.valueType === 'color';

  const handleComponentChange = (newComp: string) => {
    const defs = getAnimatableDefsForComponent(newComp);
    if (defs.length === 0) return;
    const firstProp = defs[0]!;
    const newPath = `${newComp}.${firstProp.key}`;
    if (firstProp.valueType === 'color') {
      onChange({
        property: newPath,
        valueType: 'color',
        fromColor: track.fromColor ?? '#000000',
        toColor: track.toColor ?? '#ffffff',
      });
    } else {
      onChange({ property: newPath, valueType: undefined });
    }
  };

  const handlePropertyChange = (newKey: string) => {
    const newPath = `${currentComp}.${newKey}`;
    const newPropDef = compProps.find((p) => p.key === newKey);
    if (newPropDef?.valueType === 'color') {
      onChange({
        property: newPath,
        valueType: 'color',
        fromColor: track.fromColor ?? '#000000',
        toColor: track.toColor ?? '#ffffff',
      });
    } else {
      onChange({ property: newPath, valueType: undefined });
    }
  };

  return (
    <div className="rounded border bg-muted/30 p-1.5">
      {/* Component → Property (two dropdowns) */}
      <div className="flex items-center gap-1">
        <Select value={currentComp} onValueChange={handleComponentChange}>
          <SelectTrigger className="h-5 w-24 shrink-0 px-1 text-[10px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {componentOptions.map((opt) => (
              <SelectItem key={opt.type} value={opt.type}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={currentPropKey} onValueChange={handlePropertyChange}>
          <SelectTrigger className="h-5 flex-1 px-1 text-[10px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {compProps.map((p) => (
              <SelectItem key={p.key} value={p.key}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          variant="ghost"
          className="h-5 w-5 shrink-0 p-0"
          onClick={onDelete}
          aria-label="トラック削除"
        >
          <Trash2 className="h-2.5 w-2.5" />
        </Button>
      </div>

      {/* Value inputs: color or number */}
      {isColor ? (
        <div className="mt-1 flex items-center gap-1">
          <Label className="w-6 shrink-0 text-[10px] text-muted-foreground">from</Label>
          <ColorPickerPopover
            value={track.fromColor ?? '#000000'}
            onChange={(v) => onChange({ fromColor: v })}
          >
            <button
              type="button"
              className="flex h-5 flex-1 items-center gap-1 rounded border px-1"
            >
              <span
                className="h-3 w-3 shrink-0 rounded-sm border"
                style={{ backgroundColor: track.fromColor ?? '#000000' }}
              />
              <span className="truncate text-[10px]">{track.fromColor ?? '#000000'}</span>
            </button>
          </ColorPickerPopover>
          <Label className="w-4 shrink-0 text-center text-[10px] text-muted-foreground">to</Label>
          <ColorPickerPopover
            value={track.toColor ?? '#ffffff'}
            onChange={(v) => onChange({ toColor: v })}
          >
            <button
              type="button"
              className="flex h-5 flex-1 items-center gap-1 rounded border px-1"
            >
              <span
                className="h-3 w-3 shrink-0 rounded-sm border"
                style={{ backgroundColor: track.toColor ?? '#ffffff' }}
              />
              <span className="truncate text-[10px]">{track.toColor ?? '#ffffff'}</span>
            </button>
          </ColorPickerPopover>
        </div>
      ) : (
        <div className="mt-1 flex items-center gap-1">
          <Label className="w-6 shrink-0 text-[10px] text-muted-foreground">from</Label>
          <Input
            type="number"
            className="h-5 flex-1 px-1 text-[10px]"
            value={track.from}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              if (!isNaN(v)) onChange({ from: v });
            }}
          />
          <Label className="w-4 shrink-0 text-center text-[10px] text-muted-foreground">to</Label>
          <Input
            type="number"
            className="h-5 flex-1 px-1 text-[10px]"
            value={track.to}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              if (!isNaN(v)) onChange({ to: v });
            }}
          />
        </div>
      )}

      {/* StartTime / Duration */}
      <div className="mt-1 flex items-center gap-1">
        <Label className="w-6 shrink-0 text-[10px] text-muted-foreground">開始</Label>
        <Input
          type="number"
          className="h-5 flex-1 px-1 text-[10px]"
          value={track.startTime}
          min={0}
          step={50}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            if (!isNaN(v) && v >= 0) onChange({ startTime: v });
          }}
        />
        <Label className="w-6 shrink-0 text-center text-[10px] text-muted-foreground">長さ</Label>
        <Input
          type="number"
          className="h-5 flex-1 px-1 text-[10px]"
          value={track.duration}
          min={1}
          step={50}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            if (!isNaN(v) && v > 0) onChange({ duration: v });
          }}
        />
      </div>

      {/* Easing */}
      <div className="mt-1 flex items-center gap-1">
        <Label className="w-6 shrink-0 text-[10px] text-muted-foreground">緩急</Label>
        <Select value={track.easing} onValueChange={(v) => onChange({ easing: v })}>
          <SelectTrigger className="h-5 flex-1 px-1 text-[10px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {easingNames.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
