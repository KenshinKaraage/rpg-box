import type { TweenTrack } from '../../types/ui/components/AnimationComponent';

export type TweenPresetFn = (duration: number) => TweenTrack[];

const presetRegistry = new Map<string, TweenPresetFn>();

export function registerTweenPreset(name: string, fn: TweenPresetFn): void {
  if (presetRegistry.has(name)) {
    console.warn(`Tween preset "${name}" is already registered. Overwriting.`);
  }
  presetRegistry.set(name, fn);
}

export function getTweenPreset(name: string): TweenPresetFn | undefined {
  return presetRegistry.get(name);
}

export function getAllTweenPresets(): [string, TweenPresetFn][] {
  return Array.from(presetRegistry.entries());
}

export function getTweenPresetNames(): string[] {
  return Array.from(presetRegistry.keys());
}

export function clearTweenPresetRegistry(): void {
  presetRegistry.clear();
}

// Built-in presets

registerTweenPreset('fadeIn', (duration) => [
  { property: 'opacity', startTime: 0, duration, from: 0, to: 1, easing: 'easeOut' },
]);

registerTweenPreset('fadeOut', (duration) => [
  { property: 'opacity', startTime: 0, duration, from: 1, to: 0, easing: 'easeIn' },
]);

registerTweenPreset('slideIn', (duration) => [
  { property: 'transform.x', startTime: 0, duration, from: -100, to: 0, easing: 'easeOut' },
]);

registerTweenPreset('slideOut', (duration) => [
  { property: 'transform.x', startTime: 0, duration, from: 0, to: 100, easing: 'easeIn' },
]);

registerTweenPreset('bounce', (duration) => [
  { property: 'transform.y', startTime: 0, duration, from: -20, to: 0, easing: 'easeOutQuad' },
]);

registerTweenPreset('vibe', (duration) => [
  { property: 'transform.x', startTime: 0, duration, from: -5, to: 5, easing: 'linear' },
]);

registerTweenPreset('scaleIn', (duration) => [
  { property: 'transform.scaleX', startTime: 0, duration, from: 0, to: 1, easing: 'easeOut' },
  { property: 'transform.scaleY', startTime: 0, duration, from: 0, to: 1, easing: 'easeOut' },
]);

registerTweenPreset('scaleOut', (duration) => [
  { property: 'transform.scaleX', startTime: 0, duration, from: 1, to: 0, easing: 'easeIn' },
  { property: 'transform.scaleY', startTime: 0, duration, from: 1, to: 0, easing: 'easeIn' },
]);

// Color presets

registerTweenPreset('tintRed', (duration) => [
  {
    property: 'color',
    valueType: 'color',
    startTime: 0,
    duration,
    from: 0,
    to: 0,
    fromColor: '#ffffff',
    toColor: '#ff0000',
    easing: 'easeOut',
  },
]);

registerTweenPreset('tintBlue', (duration) => [
  {
    property: 'color',
    valueType: 'color',
    startTime: 0,
    duration,
    from: 0,
    to: 0,
    fromColor: '#ffffff',
    toColor: '#0066ff',
    easing: 'easeOut',
  },
]);

registerTweenPreset('colorFlash', (duration) => [
  {
    property: 'color',
    valueType: 'color',
    startTime: 0,
    duration: Math.floor(duration / 2),
    from: 0,
    to: 0,
    fromColor: '#ffffff',
    toColor: '#ffff00',
    easing: 'easeOut',
  },
  {
    property: 'color',
    valueType: 'color',
    startTime: Math.floor(duration / 2),
    duration: duration - Math.floor(duration / 2),
    from: 0,
    to: 0,
    fromColor: '#ffff00',
    toColor: '#ffffff',
    easing: 'easeIn',
  },
]);
