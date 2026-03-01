import {
  registerTweenPreset,
  getTweenPreset,
  getAllTweenPresets,
  getTweenPresetNames,
  clearTweenPresetRegistry,
} from './presets';
import type { TweenPresetFn } from './presets';

// Save built-in presets before tests modify the registry
const builtInPresets: [string, TweenPresetFn][] = getAllTweenPresets().map(([name, fn]) => [
  name,
  fn,
]);

afterEach(() => {
  // Restore built-in presets after each test
  clearTweenPresetRegistry();
  for (const [name, fn] of builtInPresets) {
    registerTweenPreset(name, fn);
  }
});

describe('Tween Preset Registry', () => {
  it('registers and retrieves a preset', () => {
    const custom: TweenPresetFn = (duration) => [
      { property: 'opacity', startTime: 0, duration, from: 1, to: 0.5, easing: 'linear' },
    ];
    registerTweenPreset('customFade', custom);
    expect(getTweenPreset('customFade')).toBe(custom);
  });

  it('returns undefined for unregistered preset', () => {
    expect(getTweenPreset('nonexistent')).toBeUndefined();
  });

  it('getAllTweenPresets returns all registered presets', () => {
    const all = getAllTweenPresets();
    expect(all.length).toBeGreaterThanOrEqual(8);
    const names = all.map(([name]) => name);
    expect(names).toContain('fadeIn');
    expect(names).toContain('scaleOut');
  });

  it('getTweenPresetNames returns all names', () => {
    const names = getTweenPresetNames();
    expect(names.length).toBeGreaterThanOrEqual(8);
    expect(names).toContain('slideIn');
    expect(names).toContain('bounce');
  });

  it('clearTweenPresetRegistry removes all presets', () => {
    clearTweenPresetRegistry();
    expect(getAllTweenPresets()).toHaveLength(0);
    expect(getTweenPresetNames()).toHaveLength(0);
  });

  it('warns and overwrites when registering duplicate name', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    const replacement: TweenPresetFn = (duration) => [
      { property: 'opacity', startTime: 0, duration, from: 0.5, to: 1, easing: 'linear' },
    ];
    registerTweenPreset('fadeIn', replacement);

    expect(warnSpy).toHaveBeenCalledWith(
      'Tween preset "fadeIn" is already registered. Overwriting.'
    );
    expect(getTweenPreset('fadeIn')).toBe(replacement);
    warnSpy.mockRestore();
  });
});

describe('Built-in presets', () => {
  it('has 8 built-in presets', () => {
    expect(getTweenPresetNames()).toHaveLength(8);
  });

  it('includes all expected presets', () => {
    const names = getTweenPresetNames();
    expect(names).toEqual([
      'fadeIn',
      'fadeOut',
      'slideIn',
      'slideOut',
      'bounce',
      'vibe',
      'scaleIn',
      'scaleOut',
    ]);
  });

  it('fadeIn returns correct tracks', () => {
    const fadeIn = getTweenPreset('fadeIn')!;
    const tracks = fadeIn(500);
    expect(tracks).toHaveLength(1);
    expect(tracks[0]).toEqual({
      property: 'opacity',
      startTime: 0,
      duration: 500,
      from: 0,
      to: 1,
      easing: 'easeOut',
    });
  });

  it('scaleIn returns 2 tracks (scaleX + scaleY)', () => {
    const scaleIn = getTweenPreset('scaleIn')!;
    const tracks = scaleIn(300);
    expect(tracks).toHaveLength(2);
    expect(tracks[0]!.property).toBe('transform.scaleX');
    expect(tracks[1]!.property).toBe('transform.scaleY');
    expect(tracks[0]!.duration).toBe(300);
    expect(tracks[1]!.duration).toBe(300);
  });
});
