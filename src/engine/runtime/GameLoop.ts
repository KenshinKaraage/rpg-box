/**
 * Fixed-timestep game loop using requestAnimationFrame.
 * Runs update() at a fixed 60fps rate, render() once per frame.
 */

const FRAME_TIME = 1 / 60; // ~16.67ms in seconds
const MAX_DELTA = 0.1; // 100ms cap (tab-hidden recovery)

export interface GameLoopCallbacks {
  update(dt: number): void;
  render(): void;
}

export class GameLoop {
  private callbacks: GameLoopCallbacks;
  private rafId: number | null = null;
  private lastTime = 0;
  private hasLastTime = false;
  private accumulator = 0;
  private running = false;
  private paused = false;

  constructor(callbacks: GameLoopCallbacks) {
    this.callbacks = callbacks;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.paused = false;
    this.lastTime = 0;
    this.hasLastTime = false;
    this.accumulator = 0;
    this.rafId = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    this.paused = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  pause(): void {
    if (!this.running) return;
    this.paused = true;
  }

  resume(): void {
    if (!this.running) return;
    if (!this.paused) return;
    this.paused = false;
    this.hasLastTime = false; // reset to avoid big delta on resume
  }

  isRunning(): boolean {
    return this.running;
  }

  isPaused(): boolean {
    return this.paused;
  }

  private tick = (timestamp: number): void => {
    if (!this.running) return;
    this.rafId = requestAnimationFrame(this.tick);

    if (this.paused) {
      this.hasLastTime = false;
      return;
    }

    if (!this.hasLastTime) {
      this.lastTime = timestamp;
      this.hasLastTime = true;
      return;
    }

    const rawDelta = (timestamp - this.lastTime) / 1000; // ms → seconds
    this.lastTime = timestamp;
    const delta = Math.min(rawDelta, MAX_DELTA);

    this.accumulator += delta;

    while (this.accumulator >= FRAME_TIME) {
      this.callbacks.update(FRAME_TIME);
      this.accumulator -= FRAME_TIME;
    }

    this.callbacks.render();
  };
}
