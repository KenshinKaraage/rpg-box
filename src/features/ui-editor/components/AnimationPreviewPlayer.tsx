'use client';

import { useState, useRef, useCallback } from 'react';
import { Play, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStore } from '@/stores';
import { evaluateTimeline } from '../renderer/animationResolver';
import type { NamedAnimation } from '@/types/ui/components/AnimationComponent';
import { computeTimelineDuration } from '@/types/ui/components/AnimationComponent';
import type { EditorUIObject } from '@/stores/uiEditorSlice';

interface AnimationPreviewPlayerProps {
  /** The animation to preview */
  animation: NamedAnimation;
  /** Canvas ID that owns the object */
  canvasId: string;
  /** Object ID to animate */
  objectId: string;
  /** Whether to loop */
  loop?: boolean;
}

/** Snapshot of object state before preview */
interface ObjectSnapshot {
  transform: EditorUIObject['transform'];
  components: EditorUIObject['components'];
}

/**
 * Apply animated values to an object via the store.
 *
 * All property paths use explicit 'component.property' format:
 * - 'transform.x', 'transform.y'     → updateUIObject(transform)
 * - 'image.opacity', 'text.color'     → updateUIComponent(compType, { key })
 */
function applyAnimatedValues(
  canvasId: string,
  objectId: string,
  values: Map<string, number | string>,
  currentObj: EditorUIObject
): void {
  const store = useStore.getState();

  // Collect transform changes
  const transformPatch: Record<string, unknown> = {};
  // Collect component changes: componentType → { key: value }
  const compPatches = new Map<string, Record<string, unknown>>();

  values.forEach((value, path) => {
    const dotIdx = path.indexOf('.');
    if (dotIdx < 0) return;
    const compType = path.slice(0, dotIdx);
    const propKey = path.slice(dotIdx + 1);

    if (compType === 'transform') {
      transformPatch[propKey] = value;
    } else {
      let patch = compPatches.get(compType);
      if (!patch) {
        patch = {};
        compPatches.set(compType, patch);
      }
      patch[propKey] = value;
    }
  });

  // Apply transform
  if (Object.keys(transformPatch).length > 0) {
    store.updateUIObject(canvasId, objectId, {
      transform: { ...currentObj.transform, ...transformPatch },
    });
  }

  // Apply component changes
  compPatches.forEach((patch, compType) => {
    const comp = currentObj.components.find((c) => c.type === compType);
    if (comp) {
      const merged = Object.assign({}, comp.data as Record<string, unknown>, patch);
      store.updateUIComponent(canvasId, objectId, compType, merged);
    }
  });
}

export function AnimationPreviewPlayer({
  animation,
  canvasId,
  objectId,
  loop = false,
}: AnimationPreviewPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const snapshotRef = useRef<ObjectSnapshot | null>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const handlePlay = useCallback(() => {
    const state = useStore.getState();
    const canvas = state.uiCanvases.find((c) => c.id === canvasId);
    if (!canvas) return;
    const obj = canvas.objects.find((o) => o.id === objectId);
    if (!obj) return;

    // Snapshot current state
    snapshotRef.current = {
      transform: structuredClone(obj.transform),
      components: structuredClone(obj.components),
    };

    startTimeRef.current = performance.now();
    setPlaying(true);

    const tick = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const currentState = useStore.getState();
      const currentCanvas = currentState.uiCanvases.find((c) => c.id === canvasId);
      const currentObj = currentCanvas?.objects.find((o) => o.id === objectId);
      if (!currentObj) {
        setPlaying(false);
        return;
      }

      const values = evaluateTimeline(animation.timeline, elapsed, loop);
      applyAnimatedValues(canvasId, objectId, values, currentObj);

      // Continue or stop
      const totalDuration = computeTimelineDuration(animation.timeline.tracks);
      if (!loop && elapsed >= totalDuration) {
        setPlaying(false);
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [animation, canvasId, objectId, loop]);

  const handleStop = useCallback(() => {
    // Cancel animation frame
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    // Revert to snapshot
    if (snapshotRef.current) {
      const store = useStore.getState();
      store.updateUIObject(canvasId, objectId, {
        transform: snapshotRef.current.transform,
      });
      for (const comp of snapshotRef.current.components) {
        store.updateUIComponent(canvasId, objectId, comp.type, comp.data);
      }
      snapshotRef.current = null;
    }

    setPlaying(false);
  }, [canvasId, objectId]);

  if (playing) {
    return (
      <Button
        size="sm"
        variant="outline"
        className="h-5 gap-0.5 px-1.5 text-[10px] text-orange-600 border-orange-300 hover:bg-orange-50"
        onClick={handleStop}
      >
        <Square className="h-2.5 w-2.5" />
        停止
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className="h-5 gap-0.5 px-1.5 text-[10px]"
      onClick={handlePlay}
      disabled={animation.timeline.tracks.length === 0}
    >
      <Play className="h-2.5 w-2.5" />
      再生
    </Button>
  );
}
