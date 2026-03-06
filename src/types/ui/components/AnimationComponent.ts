import { UIComponent, type PropertyDef } from '../UIComponent';

export interface TweenTrack {
  /** Property path to animate (e.g. 'transform.x', 'image.tint') */
  property: string;
  /** Value type: 'number' (default) or 'color' (hex RGB interpolation) */
  valueType?: 'number' | 'color';
  /** Start time in ms */
  startTime: number;
  /** Duration in ms */
  duration: number;
  /** Start value (numeric) */
  from: number;
  /** End value (numeric) */
  to: number;
  /** Start color (hex, e.g. '#ff0000') — used when valueType === 'color' */
  fromColor?: string;
  /** End color (hex, e.g. '#00ff00') — used when valueType === 'color' */
  toColor?: string;
  /** Easing registry key (e.g. 'linear', 'easeInOut') */
  easing: string;
  /** If true, from/to are offsets relative to current value */
  relative?: boolean;
}

/** Loop type: 'none' = no loop, 'loop' = restart, 'pingpong' = reverse each iteration */
export type LoopType = 'none' | 'loop' | 'pingpong';

export const LOOP_TYPE_OPTIONS: { value: LoopType; label: string }[] = [
  { value: 'none', label: 'なし' },
  { value: 'loop', label: 'ループ' },
  { value: 'pingpong', label: 'ピンポン' },
];

export interface InlineTimeline {
  /** Tween tracks */
  tracks: TweenTrack[];
  /** Number of times to repeat (0 = infinite, 1 = play once (no repeat), 2+ = repeat N times). Default 1. */
  loopCount?: number;
  /** Loop behaviour. Default 'none'. */
  loopType?: LoopType;
}

/** Compute single-cycle duration from tracks: max(startTime + duration) */
export function computeCycleDuration(tracks: TweenTrack[]): number {
  if (tracks.length === 0) return 0;
  return Math.max(...tracks.map((t) => t.startTime + t.duration));
}

/** Compute total duration considering loops. Returns Infinity for infinite loops. */
export function computeTimelineDuration(tracks: TweenTrack[], loopCount?: number, loopType?: LoopType): number {
  const cycle = computeCycleDuration(tracks);
  if (cycle === 0) return 0;
  const lt = loopType ?? 'none';
  const lc = loopCount ?? 1;
  if (lt === 'none') return cycle;
  if (lc === 0) return Infinity;
  return cycle * lc;
}

/** Named animation entry (multiple per AnimationComponent) */
export interface NamedAnimation {
  /** Animation name (e.g. 'fadeIn', 'idle') */
  name: string;
  /** The timeline for this animation */
  timeline: InlineTimeline;
}

export class AnimationComponent extends UIComponent {
  readonly type = 'animation';
  readonly label = 'アニメーション';
  mode: 'reference' | 'inline' = 'inline';
  timelineId?: string;
  /** Multiple named inline animations */
  animations: NamedAnimation[] = [];
  autoPlay = false;
  loop = false;

  getPropertyDefs(): PropertyDef[] {
    return [
      {
        key: 'mode',
        label: 'モード',
        type: 'select',
        options: [
          { value: 'inline', label: 'インライン' },
          { value: 'reference', label: '参照' },
        ],
      },
      { key: 'autoPlay', label: '自動再生', type: 'boolean' },
      { key: 'loop', label: 'ループ', type: 'boolean' },
    ];
  }

  serialize(): unknown {
    return {
      mode: this.mode,
      timelineId: this.timelineId,
      animations: structuredClone(this.animations),
      autoPlay: this.autoPlay,
      loop: this.loop,
    };
  }

  deserialize(data: unknown): void {
    const d = data as Record<string, unknown>;
    this.mode = (d.mode as 'reference' | 'inline') ?? 'inline';
    this.timelineId = d.timelineId as string | undefined;

    // Backward compat: convert legacy single inlineTimeline to animations array
    const animations = d.animations as NamedAnimation[] | undefined;
    if (animations && Array.isArray(animations)) {
      this.animations = structuredClone(animations);
    } else {
      const legacy = d.inlineTimeline as InlineTimeline | undefined;
      if (legacy) {
        this.animations = [{ name: 'default', timeline: structuredClone(legacy) }];
      } else {
        this.animations = [];
      }
    }

    this.autoPlay = (d.autoPlay as boolean) ?? false;
    this.loop = (d.loop as boolean) ?? false;
  }

  clone(): AnimationComponent {
    const c = new AnimationComponent();
    c.mode = this.mode;
    c.timelineId = this.timelineId;
    c.animations = structuredClone(this.animations);
    c.autoPlay = this.autoPlay;
    c.loop = this.loop;
    return c;
  }
}
