'use client';

import type { ReactNode } from 'react';
import { Component } from './Component';
import type { ComponentPanelProps } from './Component';
import { SpritePropertyPanel } from '@/features/map-editor/components/panels/SpritePropertyPanel';

export type SpriteMode = 'single' | 'directional';

export class SpriteComponent extends Component {
  readonly type = 'sprite';
  readonly label = 'Sprite';

  imageId?: string;
  animationId?: string;
  flipX = false;
  flipY = false;
  tint?: string;
  opacity = 1;

  /** 単一画像 or 4方向歩行チップ */
  spriteMode: SpriteMode = 'single';
  /** 1フレームの幅（px）。0 = 画像全体 */
  frameWidth = 0;
  /** 1フレームの高さ（px）。0 = 画像全体 */
  frameHeight = 0;
  /** 横方向のアニメーションフレーム数 */
  animFrameCount = 1;
  /** アニメーション間隔（ms） */
  animIntervalMs = 200;
  /** フレーム再生順（例: [0,1,0,2]）。空配列 = 0,1,2,...の線形ループ */
  animFramePattern: number[] = [];

  serialize(): Record<string, unknown> {
    return {
      imageId: this.imageId,
      animationId: this.animationId,
      flipX: this.flipX,
      flipY: this.flipY,
      tint: this.tint,
      opacity: this.opacity,
      spriteMode: this.spriteMode,
      frameWidth: this.frameWidth,
      frameHeight: this.frameHeight,
      animFrameCount: this.animFrameCount,
      animIntervalMs: this.animIntervalMs,
      animFramePattern: [...this.animFramePattern],
    };
  }

  deserialize(data: Record<string, unknown>): void {
    this.imageId = data.imageId as string | undefined;
    this.animationId = data.animationId as string | undefined;
    this.flipX = (data.flipX as boolean) ?? false;
    this.flipY = (data.flipY as boolean) ?? false;
    this.tint = data.tint as string | undefined;
    this.opacity = (data.opacity as number) ?? 1;
    this.spriteMode = (data.spriteMode as SpriteMode) ?? 'single';
    this.frameWidth = (data.frameWidth as number) ?? 0;
    this.frameHeight = (data.frameHeight as number) ?? 0;
    this.animFrameCount = (data.animFrameCount as number) ?? 1;
    this.animIntervalMs = (data.animIntervalMs as number) ?? 200;
    const rawPattern = (data.animFramePattern as number[]) ?? [];
    // バリデーション: 0〜animFrameCount-1 の範囲外をフィルタ
    this.animFramePattern = rawPattern.filter(
      (v) => Number.isInteger(v) && v >= 0 && v < this.animFrameCount
    );
  }

  clone(): SpriteComponent {
    const c = new SpriteComponent();
    c.imageId = this.imageId;
    c.animationId = this.animationId;
    c.flipX = this.flipX;
    c.flipY = this.flipY;
    c.tint = this.tint;
    c.opacity = this.opacity;
    c.spriteMode = this.spriteMode;
    c.frameWidth = this.frameWidth;
    c.frameHeight = this.frameHeight;
    c.animFrameCount = this.animFrameCount;
    c.animIntervalMs = this.animIntervalMs;
    c.animFramePattern = [...this.animFramePattern];
    return c;
  }

  renderPropertyPanel(props: ComponentPanelProps): ReactNode {
    return <SpritePropertyPanel component={this} onChange={props.onChange} />;
  }
}
