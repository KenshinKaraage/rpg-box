'use client';

/**
 * Fullscreen overlay that runs GameEngine for test play.
 * Renders a WebGL canvas at the game's configured resolution.
 */

import { useCallback, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ProjectData } from '@/lib/storage/types';
import { GameEngine } from '@/engine/runtime/GameEngine';

interface TestPlayOverlayProps {
  projectData: ProjectData;
  onClose: () => void;
  /** GameEngine の start 完了後に呼ばれるコールバック */
  onStarted?: (runtime: GameEngine) => void;
}

export function TestPlayOverlay({ projectData, onClose, onStarted }: TestPlayOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const runtimeRef = useRef<GameEngine | null>(null);

  const stopGame = useCallback(() => {
    if (runtimeRef.current) {
      runtimeRef.current.stop();
      runtimeRef.current = null;
    }
  }, []);

  // Initialize and start GameEngine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { resolution } = projectData.gameSettings;
    canvas.width = resolution.width;
    canvas.height = resolution.height;

    let runtime: GameEngine;
    try {
      runtime = new GameEngine(canvas, projectData);
      runtimeRef.current = runtime;
    } catch (err) {
      console.error('[TestPlay] Failed to create GameEngine:', err);
      return;
    }

    let stopped = false;
    runtime
      .start()
      .then(() => {
        if (stopped) return;
        canvas.focus();
        onStarted?.(runtime);
      })
      .catch((err) => {
        console.error('[TestPlay] Failed to start game:', err);
      });

    return () => {
      stopped = true;
      runtime.stop();
      runtimeRef.current = null;
    };
  }, [projectData]);

  const handleClose = useCallback(() => {
    stopGame();
    onClose();
  }, [stopGame, onClose]);

  // Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F12') {
        e.preventDefault();
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black"
      style={{ zIndex: 9999 }}
      onClick={() => canvasRef.current?.focus()}
    >
      {/* Stop button */}
      <div className="absolute right-4 top-4 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="text-white hover:bg-white/20"
          aria-label="テストプレイを終了"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>

      {/* Hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/40">
        F12 で終了
      </div>

      {/* Game canvas */}
      <canvas
        ref={canvasRef}
        tabIndex={0}
        className="block max-h-full max-w-full outline-none"
        style={{ imageRendering: 'pixelated', objectFit: 'contain' }}
        onMouseDown={() => canvasRef.current?.focus()}
      />
    </div>
  );
}
