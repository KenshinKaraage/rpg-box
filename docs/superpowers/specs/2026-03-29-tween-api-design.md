# TweenAPI Design

## Overview

Replace the existing animation system (evaluateTimeline, UICanvasManager.updateAnimations, animationPlayer) with a unified, stateful TweenManager. The TweenManager is the single source of all property interpolation — used by scripts, AnimationComponent runtime, and editor preview.

## Core: TweenManager

A global, stateful animation engine. Manages a list of active tweens, ticks them each frame, and resolves promises on completion.

```ts
class TweenManager {
  private tweens: ActiveTween[] = [];

  /** Called by GameRuntime (or rAF in editor) each frame */
  update(dtMs: number): void;

  /** Create a numeric tween. Returns promise that resolves on completion. */
  to(getter: () => number, setter: (v: number) => void,
     to: number, durationMs: number, easing?: string): Promise<void>;

  /** Create a color tween (hex interpolation). */
  toColor(getter: () => string, setter: (v: string) => void,
          to: string, durationMs: number, easing?: string): Promise<void>;

  /** Stop all tweens for a specific key (e.g., objectId). */
  kill(key: string): void;

  /** Stop all tweens. */
  killAll(): void;
}

interface ActiveTween {
  key: string;           // grouping key (objectId) for kill()
  update: (t: number) => void;  // applies interpolated value (0→1 normalized)
  durationMs: number;
  elapsed: number;
  easing: EasingFn;
  resolve: () => void;
}
```

`update(t)` is a closure that captures from/to/getter/setter. TweenManager only manages timing and calls `update(normalizedT)`. No type switching.

### Numeric tween update closure

```ts
const from = getter();
return (t: number) => setter(from + (to - from) * t);
```

### Color tween update closure

```ts
const fromRgb = parseHex(getter());
const toRgb = parseHex(to);
return (t: number) => setter(lerpColor(fromRgb, toRgb, t));
```

## Script API (injected as `Tween`)

```js
// Single property
await Tween.to(obj, "x", 100, 500);
await Tween.to(obj, "x", 100, 500, "easeOut");

// Component property
await Tween.to(obj, "image.opacity", 0, 300);

// Color
await Tween.toColor(obj, "text.color", "#ff0000", 500);

// Multiple properties (same duration/easing, all run in parallel)
await Tween.all(obj, { x: 100, y: 50, "image.opacity": 0 }, 500, "easeOut");

// Sequence (run one after another)
await Tween.sequence([
  () => Tween.to(obj, "x", 100, 300),
  () => Tween.to(obj, "y", 200, 300),
]);

// Kill all tweens on an object
Tween.kill(obj);
```

### Property resolution

The script-facing `Tween.to(obj, property, ...)` builds getter/setter from the UIObjectRuntimeProxy:

- **Transform shortcut** (`x`, `y`, `width`, `height`, `scaleX`, `scaleY`, `rotation`): `() => obj.x` / `(v) => obj.x = v`
- **Component path** (`"image.opacity"`, `"text.fontSize"`): `() => obj.getComponentData(type)[key]` / `(v) => obj.setProperty(type, key, v)`

This resolution happens once when the tween is created. TweenManager never sees property names.

## AnimationComponent Changes

AnimationComponent implements `generateRuntimeScript()`. The script uses `Tween` API to play named animations:

```js
({
  async play(name) {
    const anim = self.state._animations[name];
    if (!anim) return;
    // Kill existing tweens on this object
    Tween.kill(self.object);
    // Start all tracks in parallel, respecting startTime offsets
    const promises = anim.tracks.map(track => {
      return new Promise(async (resolve) => {
        if (track.startTime > 0) {
          await self.waitFrames(Math.round(track.startTime / 16.67));
        }
        if (track.valueType === 'color') {
          await Tween.toColor(self.object, track.property, track.toColor, track.duration, track.easing);
        } else {
          await Tween.to(self.object, track.property, track.to, track.duration, track.easing);
        }
        resolve();
      });
    });
    await Promise.all(promises);
  },

  onShow() {
    // Build animation lookup from component data
    self.state._animations = {};
    // ... parse NamedAnimation[] from component data
  }
})
```

`autoPlay` is honored: if true, `onShow()` calls `this.play(firstAnimationName)`.

### Loop support

For looping animations, the `play()` function repeats:

```js
async play(name) {
  const anim = self.state._animations[name];
  const loopType = anim.timeline.loopType || 'none';
  do {
    await this._playOnce(name);
    if (loopType === 'pingpong') await this._playOnceReverse(name);
  } while (loopType !== 'none' && self.state._playing === name);
}
```

## Removed Code

| File | Action |
|------|--------|
| `UICanvasManager.updateAnimations()` | Remove |
| `UICanvasManager.playAnimation()` | Remove |
| `UICanvasManager.RuntimeAnimation` | Remove |
| `animationResolver.ts` (`evaluateTimeline`) | Remove |
| `animationPlayer.ts` | Remove (editor preview uses TweenManager with rAF) |

## GameRuntime Integration

```ts
// New field
private tweenManager = new TweenManager();

// In update():
this.tweenManager.update(dt * 1000);  // dt is seconds, tweens use ms

// Script injection:
// Tween is added to INJECTED_PARAM_NAMES in ScriptRunner
// context.tween provides the script-facing API

// self.waitFrames already available for AnimationComponent scripts
```

## Editor Preview Integration

Editor animation preview (formerly `animationPlayer.ts`) uses TweenManager with rAF:

```ts
const manager = new TweenManager();
let running = true;
let lastTime = performance.now();

function tick() {
  if (!running) return;
  const now = performance.now();
  manager.update(now - lastTime);
  lastTime = now;
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
```

## `self` Context Extension

TweenManager reference is added to the `self` context for component runtime scripts:

```ts
const selfCtx = {
  object: ...,
  children: ...,
  state: {},
  waitFrames: ...,
  tween: tweenManager,  // NEW
};
```

Components access it as `self.tween.to(...)` or just `Tween` (injected in ScriptRunner for user scripts).

## Existing Code Kept

| File | Status |
|------|--------|
| `easings.ts` | Kept (registry used by TweenManager) |
| `presets.ts` | Kept (generates TweenTrack arrays, consumed by AnimationComponent) |
| `AnimationComponent.ts` | Kept, adds `generateRuntimeScript()` |
| `TweenTrack`, `InlineTimeline`, `NamedAnimation` types | Kept as data format |

## Affected Files Summary

| File | Change |
|------|--------|
| `src/engine/tween/TweenManager.ts` | **New** |
| `src/engine/runtime/GameRuntime.ts` | Add TweenManager, remove animation update delegation |
| `src/engine/runtime/UICanvasManager.ts` | Remove updateAnimations/playAnimation/RuntimeAnimation |
| `src/engine/core/ScriptRunner.ts` | Add 'Tween' to injected params |
| `src/engine/runtime/GameContext.ts` | Add tween property |
| `src/types/ui/components/AnimationComponent.ts` | Add generateRuntimeScript() |
| `src/features/ui-editor/renderer/animationResolver.ts` | Remove |
| `src/features/ui-editor/utils/animationPlayer.ts` | Rewrite to use TweenManager |
| `src/types/ui/actions/PlayAnimationAction.ts` | Rewrite to call component's play() |
| `src/features/script-editor/utils/apiDefinitions.ts` | Add Tween declarations |
