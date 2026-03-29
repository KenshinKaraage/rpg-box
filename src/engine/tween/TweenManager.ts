/**
 * TweenManager — ステートフルなプロパティ補間エンジン
 *
 * 数値・色の補間を管理し、毎フレーム update() で進行。
 * getter/setter クロージャで対象プロパティを抽象化するため、
 * TweenManager 自体はプロパティの種類を知らない。
 */

import { getEasing, type EasingFn } from './easings';

// ── Types ──

interface ActiveTween {
  key: string;                  // グルーピングキー（kill 用）
  apply: (t: number) => void;  // 正規化時間 0→1 を受けて値を適用
  durationMs: number;
  elapsed: number;
  easing: EasingFn;
  resolve: () => void;
}

// ── Color helpers ──

function parseHex(hex: string): [number, number, number] {
  const h = hex.startsWith('#') ? hex.slice(1) : hex;
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function toHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return '#' + [clamp(r), clamp(g), clamp(b)].map(v => v.toString(16).padStart(2, '0')).join('');
}

// ── TweenManager ──

export class TweenManager {
  private tweens: ActiveTween[] = [];

  /** 毎フレーム呼ぶ（dtMs はミリ秒） */
  update(dtMs: number): void {
    if (this.tweens.length === 0) return;

    const completed: ActiveTween[] = [];

    for (const tw of this.tweens) {
      tw.elapsed += dtMs;
      const t = Math.min(1, tw.elapsed / tw.durationMs);
      const eased = tw.easing(t);
      tw.apply(eased);
      if (t >= 1) completed.push(tw);
    }

    if (completed.length > 0) {
      this.tweens = this.tweens.filter(tw => !completed.includes(tw));
      for (const tw of completed) tw.resolve();
    }
  }

  /** 数値 tween */
  to(
    getter: () => number,
    setter: (v: number) => void,
    target: number,
    durationMs: number,
    easingName = 'linear',
    key = ''
  ): Promise<void> {
    const from = getter();
    const easing = getEasing(easingName) ?? getEasing('linear')!;
    return new Promise<void>(resolve => {
      this.tweens.push({
        key,
        apply: (t) => setter(from + (target - from) * t),
        durationMs: Math.max(1, durationMs),
        elapsed: 0,
        easing,
        resolve,
      });
    });
  }

  /** 色 tween（hex 補間） */
  toColor(
    getter: () => string,
    setter: (v: string) => void,
    target: string,
    durationMs: number,
    easingName = 'linear',
    key = ''
  ): Promise<void> {
    const fromRgb = parseHex(getter());
    const toRgb = parseHex(target);
    const easing = getEasing(easingName) ?? getEasing('linear')!;
    return new Promise<void>(resolve => {
      this.tweens.push({
        key,
        apply: (t) => {
          const r = fromRgb[0] + (toRgb[0] - fromRgb[0]) * t;
          const g = fromRgb[1] + (toRgb[1] - fromRgb[1]) * t;
          const b = fromRgb[2] + (toRgb[2] - fromRgb[2]) * t;
          setter(toHex(r, g, b));
        },
        durationMs: Math.max(1, durationMs),
        elapsed: 0,
        easing,
        resolve,
      });
    });
  }

  /** 特定キーの全 tween を停止（即座に resolve） */
  kill(key: string): void {
    const killed = this.tweens.filter(tw => tw.key === key);
    this.tweens = this.tweens.filter(tw => tw.key !== key);
    for (const tw of killed) tw.resolve();
  }

  /** 全 tween を停止 */
  killAll(): void {
    const all = this.tweens;
    this.tweens = [];
    for (const tw of all) tw.resolve();
  }

  /** スクリプト向け API を生成 */
  createScriptAPI(): TweenScriptAPI {
    return new TweenScriptAPI(this);
  }
}

// ── Script-facing API ──

/**
 * スクリプトから使う Tween API。
 * UIObjectRuntimeProxy のプロパティ名から getter/setter を自動解決。
 */
export class TweenScriptAPI {
  private manager: TweenManager;

  constructor(manager: TweenManager) {
    this.manager = manager;
  }

  /** 単一プロパティの数値 tween */
  async to(
    obj: { id: string; [k: string]: unknown },
    property: string,
    target: number,
    durationMs: number,
    easing = 'linear'
  ): Promise<void> {
    const { getter, setter } = resolveProperty(obj, property);
    await this.manager.to(getter, setter, target, durationMs, easing, obj.id as string);
  }

  /** 色プロパティの tween */
  async toColor(
    obj: { id: string; [k: string]: unknown },
    property: string,
    target: string,
    durationMs: number,
    easing = 'linear'
  ): Promise<void> {
    const { getter: g, setter: s } = resolveColorProperty(obj, property);
    await this.manager.toColor(g, s, target, durationMs, easing, obj.id as string);
  }

  /** 複数プロパティを同時に tween */
  async all(
    obj: { id: string; [k: string]: unknown },
    properties: Record<string, number>,
    durationMs: number,
    easing = 'linear'
  ): Promise<void> {
    const promises = Object.entries(properties).map(([prop, target]) => {
      const { getter, setter } = resolveProperty(obj, prop);
      return this.manager.to(getter, setter, target, durationMs, easing, obj.id as string);
    });
    await Promise.all(promises);
  }

  /** 順番に実行 */
  async sequence(fns: (() => Promise<void>)[]): Promise<void> {
    for (const fn of fns) {
      await fn();
    }
  }

  /** オブジェクトの全 tween を停止 */
  kill(obj: { id: string }): void {
    this.manager.kill(obj.id as string);
  }
}

// ── Property resolution ──

const TRANSFORM_KEYS = new Set(['x', 'y', 'width', 'height', 'scaleX', 'scaleY', 'rotation']);

function resolveProperty(
  obj: Record<string, unknown>,
  property: string
): { getter: () => number; setter: (v: number) => void } {
  // "transform.y" → "y" に正規化
  const dot = property.indexOf('.');
  const compType = dot > 0 ? property.slice(0, dot) : '';
  const key = dot > 0 ? property.slice(dot + 1) : property;
  const resolvedKey = compType === 'transform' ? key : property;

  if (TRANSFORM_KEYS.has(resolvedKey)) {
    return {
      getter: () => (obj[resolvedKey] as number) ?? 0,
      setter: (v) => { obj[resolvedKey] = v; },
    };
  }
  // "component.key" パス（transform 以外）
  if (dot > 0) {
    const setProperty = obj['setProperty'] as ((type: string, key: string, value: unknown) => void) | undefined;
    const getComponentData = obj['getComponentData'] as ((type: string) => Record<string, unknown> | null) | undefined;
    return {
      getter: () => {
        const data = getComponentData?.(compType);
        return (data?.[key] as number) ?? 0;
      },
      setter: (v) => setProperty?.(compType, key, v),
    };
  }
  // フォールバック
  return {
    getter: () => (obj[property] as number) ?? 0,
    setter: (v) => { obj[property] = v; },
  };
}

function resolveColorProperty(
  obj: Record<string, unknown>,
  property: string
): { getter: () => string; setter: (v: string) => void } {
  const dot = property.indexOf('.');
  if (dot > 0) {
    const compType = property.slice(0, dot);
    const key = property.slice(dot + 1);
    const setProperty = obj['setProperty'] as ((type: string, key: string, value: unknown) => void) | undefined;
    const getComponentData = obj['getComponentData'] as ((type: string) => Record<string, unknown> | null) | undefined;
    return {
      getter: () => {
        const data = getComponentData?.(compType);
        return (data?.[key] as string) ?? '#000000';
      },
      setter: (v) => setProperty?.(compType, key, v),
    };
  }
  return {
    getter: () => (obj[property] as string) ?? '#000000',
    setter: (v) => { obj[property] = v; },
  };
}
