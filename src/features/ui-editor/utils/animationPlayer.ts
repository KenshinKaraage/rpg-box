/**
 * 命令的アニメーション再生ユーティリティ
 *
 * React コンポーネント外からでも使える RAF ベースのアニメーション再生。
 * actionPreview / AnimationPreviewPlayer の両方で共用する。
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
// Object snapshot
// ──────────────────────────────────────────────

export interface ObjectSnapshot {
  transform: EditorUIObject['transform'];
  components: EditorUIObject['components'];
}

export function snapshotObject(obj: EditorUIObject): ObjectSnapshot {
  return {
    transform: structuredClone(obj.transform),
    components: structuredClone(obj.components),
  };
}

export function restoreSnapshot(
  canvasId: string,
  objectId: string,
  snapshot: ObjectSnapshot
): void {
  const store = useStore.getState();
  store.updateUIObject(canvasId, objectId, {
    transform: snapshot.transform,
  });
  for (const comp of snapshot.components) {
    store.updateUIComponent(canvasId, objectId, comp.type, comp.data);
  }
}

// ──────────────────────────────────────────────
// Imperative animation playback
// ──────────────────────────────────────────────

export interface AnimationPlaybackHandle {
  /** Stop animation, keep current state */
  stop: () => void;
  /** Stop animation and revert to pre-play snapshot */
  reset: () => void;
  /** Whether animation is currently playing */
  isPlaying: () => boolean;
  /** Resolves when animation finishes naturally (not on stop/reset) */
  finished: Promise<void>;
}

/**
 * Start playing an animation on an object.
 *
 * Returns a handle to stop/reset. The object's current state is snapshotted
 * before playback begins so it can be fully reverted via `handle.reset()`.
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

  const snap = snapshotObject(obj);
  let rafId: number | null = null;
  let playing = true;
  const startTime = performance.now();

  const totalDuration = computeTimelineDuration(
    animation.timeline.tracks,
    animation.timeline.loopCount,
    animation.timeline.loopType,
  );

  let resolveFinished: () => void;
  const finished = new Promise<void>((resolve) => { resolveFinished = resolve; });

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

  const reset = () => {
    stop();
    restoreSnapshot(canvasId, objectId, snap);
  };

  return {
    stop,
    reset,
    isPlaying: () => playing,
    finished,
  };
}
