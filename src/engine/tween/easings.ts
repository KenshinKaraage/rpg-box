export type EasingFn = (t: number) => number;

const easingRegistry = new Map<string, EasingFn>();

export function registerEasing(name: string, fn: EasingFn): void {
  if (easingRegistry.has(name)) {
    console.warn(`Easing "${name}" is already registered. Overwriting.`);
  }
  easingRegistry.set(name, fn);
}

export function getEasing(name: string): EasingFn | undefined {
  return easingRegistry.get(name);
}

export function getAllEasings(): [string, EasingFn][] {
  return Array.from(easingRegistry.entries());
}

export function getEasingNames(): string[] {
  return Array.from(easingRegistry.keys());
}

export function clearEasingRegistry(): void {
  easingRegistry.clear();
}

// Built-in easings
registerEasing('linear', (t) => t);
registerEasing('easeIn', (t) => t * t);
registerEasing('easeOut', (t) => t * (2 - t));
registerEasing('easeInOut', (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t));
registerEasing('easeInQuad', (t) => t * t);
registerEasing('easeOutQuad', (t) => t * (2 - t));
registerEasing('easeInOutQuad', (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t));
