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
}

export interface InlineTimeline {
  /** Tween tracks */
  tracks: TweenTrack[];
}

/** Compute total duration from tracks: max(startTime + duration) */
export function computeTimelineDuration(tracks: TweenTrack[]): number {
  if (tracks.length === 0) return 0;
  return Math.max(...tracks.map((t) => t.startTime + t.duration));
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
