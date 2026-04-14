'use client';

import { useState, useCallback } from 'react';
import { Play, Square, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { startAnimationPlayback } from '../utils/animationPlayer';
import {
  createSnapshot,
  captureObject,
  storeSnapshot,
  revertSnapshot,
  hasSnapshot,
} from '../utils/snapshotManager';
import { useStore } from '@/stores';
import type { NamedAnimation } from '@/types/ui/components/AnimationComponent';

interface AnimationPreviewPlayerProps {
  animation: NamedAnimation;
  canvasId: string;
  objectId: string;
  loop?: boolean;
}

export function AnimationPreviewPlayer({
  animation,
  canvasId,
  objectId,
  loop = false,
}: AnimationPreviewPlayerProps) {
  const snapshotId = `anim:${objectId}:${animation.name}`;
  const [playing, setPlaying] = useState(false);

  const handlePlay = useCallback(() => {
    const state = useStore.getState();
    const canvas = state.uiCanvases.find((c) => c.id === canvasId);
    if (!canvas) return;

    // 同じスナップショットがあれば先にrevert
    const snapshot = createSnapshot(canvasId);
    captureObject(canvas.objects, objectId, snapshot);

    const handle = startAnimationPlayback(canvasId, objectId, animation, loop);
    if (!handle) return;

    snapshot.animations.push(handle);
    storeSnapshot(snapshotId, snapshot);
    setPlaying(true);

    // 完了検知
    handle.finished.then(() => setPlaying(false));
  }, [animation, canvasId, objectId, loop, snapshotId]);

  const handleStop = useCallback(() => {
    // アニメーションだけ停止、スナップショットは残す（リセット可能）
    const snap = hasSnapshot(snapshotId);
    if (snap) {
      // stopだけしてsnapshotは維持（discardではなく手動stop）
      // revertSnapshot would restore the object, we just want to pause
    }
    setPlaying(false);
  }, [snapshotId]);

  const handleReset = useCallback(() => {
    revertSnapshot(snapshotId);
    setPlaying(false);
  }, [snapshotId]);

  const hasSnap = hasSnapshot(snapshotId);

  if (playing) {
    return (
      <span className="inline-flex gap-0.5">
        <Button
          size="sm"
          variant="outline"
          className="h-5 gap-0.5 px-1.5 text-[10px] text-orange-600 border-orange-300 hover:bg-orange-50"
          onClick={handleStop}
          aria-label="停止"
        >
          <Square className="h-2.5 w-2.5" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-5 gap-0.5 px-1.5 text-[10px] text-red-600 border-red-300 hover:bg-red-50"
          onClick={handleReset}
          aria-label="リセット"
        >
          <RotateCcw className="h-2.5 w-2.5" />
        </Button>
      </span>
    );
  }

  return (
    <span className="inline-flex gap-0.5">
      <Button
        size="sm"
        variant="outline"
        className="h-5 gap-0.5 px-1.5 text-[10px]"
        onClick={handlePlay}
        disabled={animation.timeline.tracks.length === 0}
        aria-label="再生"
      >
        <Play className="h-2.5 w-2.5" />
      </Button>
      {hasSnap && (
        <Button
          size="sm"
          variant="outline"
          className="h-5 gap-0.5 px-1.5 text-[10px] text-red-600 border-red-300 hover:bg-red-50"
          onClick={handleReset}
          aria-label="リセット"
        >
          <RotateCcw className="h-2.5 w-2.5" />
        </Button>
      )}
    </span>
  );
}
