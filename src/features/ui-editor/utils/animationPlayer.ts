/**
 * 命令的アニメーション再生ユーティリティ
 *
 * React コンポーネント外からでも使える RAF ベースのアニメーション再生。
 * スナップショット管理は SnapshotManager に委譲。
 */
import { useStore } from '@/stores';
import { evaluateTimeline } from '../renderer/animationResolver';
import { computeTimelineDuration } from '@/types/ui/components/AnimationComponent';
import type { NamedAnimation } from '@/types/ui/components/AnimationComponent';
import type { EditorUIObject } from '@/stores/uiEditorSlice';

// ──────────────────────────────────────────────
// Apply animated values to the store
// ──────────────────────────────────────────────

/**
 * Apply evaluated animation values to an object via the Zustand store.
 *
 * Property paths use 'component.property' format:
 * - 'transform.x'   → updateUIObject(transform)
 * - 'image.opacity'  → updateUIComponent(compType, { key })
 */
export function applyAnimatedValues(
  canvasId: string,
  objectId: string,
  values: Map<string, number | string>,
  currentObj: EditorUIObject
): void {
  const store = useStore.getState();

  const transformPatch: Record<string, unknown> = {};
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

  if (Object.keys(transformPatch).length > 0) {
    store.updateUIObject(canvasId, objectId, {
      transform: { ...currentObj.transform, ...transformPatch },
    });
  }

  compPatches.forEach((patch, compType) => {
    const comp = currentObj.components.find((c) => c.type === compType);
    if (comp) {
      const merged = Object.assign({}, comp.data as Record<string, unknown>, patch);
      store.updateUIComponent(canvasId, objectId, compType, merged);
    }
  });
}

// ──────────────────────────────────────────────
// Imperative animation playback
// ──────────────────────────────────────────────

export interface AnimationPlaybackHandle {
  /** Stop animation, keep current state */
  stop: () => void;
  /** Whether animation is currently playing */
  isPlaying: () => boolean;
  /** Resolves when animation finishes naturally (not on stop) */
  finished: Promise<void>;
}

/**
 * Start playing an animation on an object via RAF loop.
 *
 * Snapshot/revert は呼び出し側（SnapshotManager）が管理する。
 */
export function startAnimationPlayback(
  canvasId: string,
  objectId: string,
  animation: NamedAnimation,
  loop: boolean
): AnimationPlaybackHandle | null {
  const state = useStore.getState();
  const canvas = state.uiCanvases.find((c) => c.id === canvasId);
  if (!canvas) return null;
  const obj = canvas.objects.find((o) => o.id === objectId);
  if (!obj) return null;
  if (animation.timeline.tracks.length === 0) return null;

  let rafId: number | null = null;
  let playing = true;
  const startTime = performance.now();

  const totalDuration = computeTimelineDuration(
    animation.timeline.tracks,
    animation.timeline.loopCount,
    animation.timeline.loopType
  );

  let resolveFinished: () => void;
  const finished = new Promise<void>((resolve) => {
    resolveFinished = resolve;
  });

  const tick = (now: number) => {
    if (!playing) return;
    const elapsed = now - startTime;

    const currentState = useStore.getState();
    const currentCanvas = currentState.uiCanvases.find((c) => c.id === canvasId);
    const currentObj = currentCanvas?.objects.find((o) => o.id === objectId);
    if (!currentObj) {
      playing = false;
      resolveFinished();
      return;
    }

    const values = evaluateTimeline(animation.timeline, elapsed, loop);
    applyAnimatedValues(canvasId, objectId, values, currentObj);

    if (!loop && elapsed >= totalDuration) {
      playing = false;
      resolveFinished();
      return;
    }

    rafId = requestAnimationFrame(tick);
  };

  rafId = requestAnimationFrame(tick);

  const stop = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    playing = false;
    resolveFinished();
  };

  return {
    stop,
    isPlaying: () => playing,
    finished,
  };
}
