'use client';

import { useState, useRef, useCallback } from 'react';
import { Play, Square, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  startAnimationPlayback,
  type AnimationPlaybackHandle,
} from '../utils/animationPlayer';
import type { NamedAnimation } from '@/types/ui/components/AnimationComponent';

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

export function AnimationPreviewPlayer({
  animation,
  canvasId,
  objectId,
  loop = false,
}: AnimationPreviewPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [hasSnapshot, setHasSnapshot] = useState(false);
  const handleRef = useRef<AnimationPlaybackHandle | null>(null);

  const handlePlay = useCallback(() => {
    const handle = startAnimationPlayback(canvasId, objectId, animation, loop);
    if (!handle) return;

    // If we already have a handle (re-play), stop old one but keep snapshot
    if (handleRef.current) {
      handleRef.current.stop();
    }

    handleRef.current = handle;
    setPlaying(true);
    setHasSnapshot(true);

    // Poll for completion (non-looping animations)
    const checkDone = () => {
      if (handle.isPlaying()) {
        requestAnimationFrame(checkDone);
      } else {
        setPlaying(false);
      }
    };
    requestAnimationFrame(checkDone);
  }, [animation, canvasId, objectId, loop]);

  const handleStop = useCallback(() => {
    handleRef.current?.stop();
    setPlaying(false);
  }, []);

  const handleReset = useCallback(() => {
    handleRef.current?.reset();
    handleRef.current = null;
    setPlaying(false);
    setHasSnapshot(false);
  }, []);

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
      {hasSnapshot && (
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
