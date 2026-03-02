import {
  registerEasing,
  getEasing,
  getAllEasings,
  getEasingNames,
  clearEasingRegistry,
} from './easings';
import type { EasingFn } from './easings';

// Save built-in easings before tests modify the registry
const builtInEasings: [string, EasingFn][] = getAllEasings().map(([name, fn]) => [name, fn]);

afterEach(() => {
  // Restore built-in easings after each test
  clearEasingRegistry();
  for (const [name, fn] of builtInEasings) {
    registerEasing(name, fn);
  }
});

describe('Easing Registry', () => {
  it('registers and retrieves an easing', () => {
    const customEasing: EasingFn = (t) => t * t * t;
    registerEasing('cubic', customEasing);
    expect(getEasing('cubic')).toBe(customEasing);
  });

  it('returns undefined for unregistered easing', () => {
    expect(getEasing('nonexistent')).toBeUndefined();
  });

  it('getAllEasings returns all registered easings', () => {
    const all = getAllEasings();
    expect(all.length).toBeGreaterThanOrEqual(7);
    const names = all.map(([name]) => name);
    expect(names).toContain('linear');
    expect(names).toContain('easeIn');
  });

  it('getEasingNames returns all names', () => {
    const names = getEasingNames();
    expect(names.length).toBeGreaterThanOrEqual(7);
    expect(names).toContain('easeOut');
    expect(names).toContain('easeInOut');
  });

  it('clearEasingRegistry removes all easings', () => {
    clearEasingRegistry();
    expect(getAllEasings()).toHaveLength(0);
    expect(getEasingNames()).toHaveLength(0);
  });

  it('warns and overwrites when registering duplicate name', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    const original = getEasing('linear');
    const replacement: EasingFn = (t) => 1 - t;
    registerEasing('linear', replacement);

    expect(warnSpy).toHaveBeenCalledWith(
      'Easing "linear" is already registered. Overwriting.'
    );
    expect(getEasing('linear')).toBe(replacement);
    expect(getEasing('linear')).not.toBe(original);
    warnSpy.mockRestore();
  });
});

describe('Built-in easings', () => {
  it('has 7 built-in easings', () => {
    expect(getEasingNames()).toHaveLength(7);
  });

  it('includes all expected easings', () => {
    const names = getEasingNames();
    expect(names).toEqual([
      'linear',
      'easeIn',
      'easeOut',
      'easeInOut',
      'easeInQuad',
      'easeOutQuad',
      'easeInOutQuad',
    ]);
  });

  it('all easings satisfy f(0) === 0 and f(1) === 1', () => {
    for (const [, fn] of getAllEasings()) {
      expect(fn(0)).toBe(0);
      expect(fn(1)).toBe(1);
    }
  });

  it('linear: f(0.5) === 0.5', () => {
    const linear = getEasing('linear')!;
    expect(linear(0.5)).toBe(0.5);
  });
});
