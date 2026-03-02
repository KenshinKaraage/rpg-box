import { UIComponent, type PropertyDef } from '../UIComponent';

export interface TweenTrack {
  /** Property path to animate (e.g. 'transform.x', 'opacity') */
  property: string;
  /** Start time in ms */
  startTime: number;
  /** Duration in ms */
  duration: number;
  /** Start value */
  from: number;
  /** End value */
  to: number;
  /** Easing registry key (e.g. 'linear', 'easeInOut') */
  easing: string;
}

export interface InlineTimeline {
  /** Total duration in ms */
  duration: number;
  /** Tween tracks */
  tracks: TweenTrack[];
}

export class AnimationComponent extends UIComponent {
  readonly type = 'animation';
  readonly label = 'アニメーション';
  mode: 'reference' | 'inline' = 'inline';
  timelineId?: string;
  inlineTimeline?: InlineTimeline;
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
      inlineTimeline: this.inlineTimeline ? structuredClone(this.inlineTimeline) : undefined,
      autoPlay: this.autoPlay,
      loop: this.loop,
    };
  }

  deserialize(data: unknown): void {
    const d = data as Record<string, unknown>;
    this.mode = (d.mode as 'reference' | 'inline') ?? 'inline';
    this.timelineId = d.timelineId as string | undefined;
    const timeline = d.inlineTimeline as InlineTimeline | undefined;
    this.inlineTimeline = timeline ? structuredClone(timeline) : undefined;
    this.autoPlay = (d.autoPlay as boolean) ?? false;
    this.loop = (d.loop as boolean) ?? false;
  }

  clone(): AnimationComponent {
    const c = new AnimationComponent();
    c.mode = this.mode;
    c.timelineId = this.timelineId;
    c.inlineTimeline = this.inlineTimeline ? structuredClone(this.inlineTimeline) : undefined;
    c.autoPlay = this.autoPlay;
    c.loop = this.loop;
    return c;
  }
}
