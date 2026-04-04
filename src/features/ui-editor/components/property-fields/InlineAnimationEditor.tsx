'use client';

import { useState } from 'react';
import { Plus, Trash2, ChevronRight, ChevronDown } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { NamedAnimation, TweenTrack, InlineTimeline } from '@/types/ui/components/AnimationComponent';
import { computeCycleDuration } from '@/types/ui/components/AnimationComponent';
import { useStore } from '@/stores';
import { getEasingNames } from '@/engine/tween/easings';
import { getTweenPresetNames, getTweenPreset } from '@/engine/tween/presets';
import {
  useComponentOptions,
  getAnimatableDefsForComponent,
} from '@/features/ui-editor/hooks/useComponentProperties';
import { getRectTransformAnimatablePropertyDefs } from '@/types/ui/UIComponent';
import { AnimationPreviewPlayer } from '../AnimationPreviewPlayer';
import { AnimationDetail } from './AnimationDetail';

// ──────────────────────────────────────────────
// Preset virtual property resolution
// ──────────────────────────────────────────────

/**
 * Try to resolve a single property key against transform + object components.
 * Returns the resolved 'component.property' string, or null if unresolvable.
 */
function tryResolve(key: string, objectComponentTypes: string[]): string | null {
  if (key.includes('.')) {
    const comp = key.slice(0, key.indexOf('.'));
    const prop = key.slice(key.indexOf('.') + 1);
    if (comp === 'transform') {
      return getRectTransformAnimatablePropertyDefs().some((p) => p.key === prop) ? key : null;
    }
    if (objectComponentTypes.includes(comp)
      && getAnimatableDefsForComponent(comp).some((p) => p.key === prop)) {
      return key;
    }
    return null;
  }
  if (getRectTransformAnimatablePropertyDefs().some((p) => p.key === key)) {
    return `transform.${key}`;
  }
  for (const ct of objectComponentTypes) {
    if (getAnimatableDefsForComponent(ct).some((p) => p.key === key)) {
      return `${ct}.${key}`;
    }
  }
  return null;
}

/**
 * Check if a PresetTrack's property (single or candidate list) can be resolved.
 */
function canResolvePresetTrack(property: string | string[], objectComponentTypes: string[]): boolean {
  const candidates = Array.isArray(property) ? property : [property];
  return candidates.some((c) => tryResolve(c, objectComponentTypes) !== null);
}

/**
 * Resolve a PresetTrack's property (single or candidate list) to 'component.property' format.
 * Returns the first resolvable candidate, or the first candidate as-is if none resolve.
 */
function resolvePresetTrackProperty(property: string | string[], objectComponentTypes: string[]): string {
  const candidates = Array.isArray(property) ? property : [property];
  for (const c of candidates) {
    const resolved = tryResolve(c, objectComponentTypes);
    if (resolved) return resolved;
  }
  return candidates[0]!;
}

export interface PresetInfo {
  name: string;
  available: boolean;
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
    if (expandedIndex === index) setExpandedIndex(null);
    else if (expandedIndex !== null && expandedIndex > index) setExpandedIndex(expandedIndex - 1);
  };

  const handleUpdateName = (index: number, name: string) => {
    onChange(animations.map((a, i) => (i === index ? { ...a, name } : a)));
  };

  const handleUpdateTimeline = (animIndex: number, patch: Partial<InlineTimeline>) => {
    onChange(
      animations.map((a, i) =>
        i === animIndex ? { ...a, timeline: { ...a.timeline, ...patch } } : a
      )
    );
  };

  const handleUpdateTrack = (animIndex: number, trackIndex: number, patch: Partial<TweenTrack>) => {
    onChange(
      animations.map((a, i) => {
        if (i !== animIndex) return a;
        const tracks = a.timeline.tracks.map((t, j) => (j === trackIndex ? { ...t, ...patch } : t));
        return { ...a, timeline: { ...a.timeline, tracks } };
      })
    );
  };

  const handleAddTrack = (animIndex: number) => {
    const newTrack: TweenTrack = {
      property: 'transform.x', startTime: 0, duration: 500, from: 0, to: 100, easing: 'easeOut',
    };
    onChange(
      animations.map((a, i) =>
        i === animIndex ? { ...a, timeline: { ...a.timeline, tracks: [...a.timeline.tracks, newTrack] } } : a
      )
    );
  };

  const handleDeleteTrack = (animIndex: number, trackIndex: number) => {
    onChange(
      animations.map((a, i) =>
        i === animIndex
          ? { ...a, timeline: { ...a.timeline, tracks: a.timeline.tracks.filter((_, j) => j !== trackIndex) } }
          : a
      )
    );
  };

  const handleApplyPreset = (animIndex: number, presetName: string) => {
    const presetFn = getTweenPreset(presetName);
    if (!presetFn) return;
    const anim = animations[animIndex];
    if (!anim) return;
    const dur = computeCycleDuration(anim.timeline.tracks);
    const rawTracks = presetFn(dur > 0 ? dur : 500);
    const ct = componentOptions.map((c) => c.type);
    const tracks: TweenTrack[] = rawTracks.map((t) => ({
      ...t,
      property: resolvePresetTrackProperty(t.property, ct),
    }));
    onChange(animations.map((a, i) =>
      i === animIndex ? { ...a, name: presetName, timeline: { ...a.timeline, tracks } } : a
    ));
    setExpandedIndex(animIndex);
  };

  const easingNames = getEasingNames();
  const presetNames = getTweenPresetNames();

  // Check which presets are compatible with the current object's components
  const compTypes = componentOptions.map((c) => c.type);
  const presets: PresetInfo[] = presetNames.map((name) => {
    const fn = getTweenPreset(name);
    if (!fn) return { name, available: false };
    const tracks = fn(500);
    const available = tracks.every((t) => canResolvePresetTrack(t.property, compTypes));
    return { name, available };
  });

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
                {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </button>
              <span className="flex-1 truncate text-xs">{anim.name}</span>
              <span className="text-[10px] text-muted-foreground">{anim.timeline.tracks.length}tr</span>
              {selectedCanvasId && objectId && (
                <AnimationPreviewPlayer animation={anim} canvasId={selectedCanvasId} objectId={objectId} />
              )}
              <Button size="sm" variant="ghost" className="h-5 w-5 p-0"
                onClick={() => handleDeleteAnimation(animIdx)} aria-label={`${anim.name}を削除`}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>

            {/* Expanded */}
            {isExpanded && (
              <AnimationDetail
                anim={anim}
                animIdx={animIdx}
                easingNames={easingNames}
                presets={presets}
                componentOptions={componentOptions}
                onUpdateName={(name) => handleUpdateName(animIdx, name)}
                onUpdateTimeline={(patch) => handleUpdateTimeline(animIdx, patch)}
                onUpdateTrack={(tIdx, patch) => handleUpdateTrack(animIdx, tIdx, patch)}
                onAddTrack={() => handleAddTrack(animIdx)}
                onDeleteTrack={(tIdx) => handleDeleteTrack(animIdx, tIdx)}
                onApplyPreset={(name) => handleApplyPreset(animIdx, name)}
              />
            )}
          </div>
        );
      })}

      <Button size="sm" variant="outline" className="h-6 w-full text-xs" onClick={handleAddAnimation}>
        <Plus className="mr-1 h-3 w-3" /> アニメーション追加
      </Button>
    </div>
  );
}
