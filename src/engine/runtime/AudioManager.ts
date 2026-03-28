/**
 * AudioManager — Web Audio API を使った BGM/SE 再生管理
 *
 * アセットの data URL から AudioBuffer を生成し、再生/停止/フェードを管理。
 */

import type { SoundAPI } from './GameContext';

export type AssetResolver = (assetId: string) => string | null;

export class AudioManager {
  private audioCtx: AudioContext | null = null;
  private bufferCache = new Map<string, AudioBuffer>();
  private bgmSource: AudioBufferSourceNode | null = null;
  private bgmGain: GainNode | null = null;
  private bgmAssetId: string | null = null;
  private resolveAsset: AssetResolver;

  constructor(resolveAsset: AssetResolver) {
    this.resolveAsset = resolveAsset;
  }

  private getContext(): AudioContext {
    if (!this.audioCtx) {
      this.audioCtx = new AudioContext();
    }
    return this.audioCtx;
  }

  private async loadBuffer(assetId: string): Promise<AudioBuffer | null> {
    const cached = this.bufferCache.get(assetId);
    if (cached) return cached;

    const dataUrl = this.resolveAsset(assetId);
    if (!dataUrl) return null;

    try {
      const response = await fetch(dataUrl);
      const arrayBuffer = await response.arrayBuffer();
      const ctx = this.getContext();
      const buffer = await ctx.decodeAudioData(arrayBuffer);
      this.bufferCache.set(assetId, buffer);
      return buffer;
    } catch (err) {
      console.warn(`[AudioManager] Failed to load audio: ${assetId}`, err);
      return null;
    }
  }

  /** SoundAPI インターフェースを生成 */
  createSoundAPI(): SoundAPI {
    return {
      playBGM: (assetId, options) => {
        this.playBGM(assetId, options?.volume ?? 1, options?.loop ?? true, options?.fadeIn ?? 0);
      },
      stopBGM: (fadeOut) => {
        this.stopBGM(fadeOut ?? 0);
      },
      playSE: (assetId, options) => {
        this.playSE(assetId, options?.volume ?? 1);
      },
      stopAll: () => {
        this.stopAll();
      },
    };
  }

  private async playBGM(assetId: string, volume: number, loop: boolean, fadeIn: number): Promise<void> {
    // 同じ BGM が再生中ならスキップ
    if (this.bgmAssetId === assetId && this.bgmSource) return;

    // 既存 BGM を停止
    this.stopBGMImmediate();

    // アセット名→IDの解決を試みる（名前でもIDでも渡せるように）
    const buffer = await this.loadBuffer(assetId);
    if (!buffer) return;

    const ctx = this.getContext();
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = loop;

    const gain = ctx.createGain();
    if (fadeIn > 0) {
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + fadeIn / 1000);
    } else {
      gain.gain.setValueAtTime(volume, ctx.currentTime);
    }

    source.connect(gain);
    gain.connect(ctx.destination);
    source.start();

    this.bgmSource = source;
    this.bgmGain = gain;
    this.bgmAssetId = assetId;

    source.onended = () => {
      if (this.bgmSource === source) {
        this.bgmSource = null;
        this.bgmGain = null;
        this.bgmAssetId = null;
      }
    };
  }

  private stopBGM(fadeOut: number): void {
    if (!this.bgmSource || !this.bgmGain) return;

    if (fadeOut > 0) {
      const ctx = this.getContext();
      const gain = this.bgmGain;
      const source = this.bgmSource;
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + fadeOut / 1000);
      setTimeout(() => {
        try { source.stop(); } catch { /* already stopped */ }
      }, fadeOut);
    } else {
      this.stopBGMImmediate();
    }

    this.bgmSource = null;
    this.bgmGain = null;
    this.bgmAssetId = null;
  }

  private stopBGMImmediate(): void {
    if (this.bgmSource) {
      try { this.bgmSource.stop(); } catch { /* already stopped */ }
      this.bgmSource = null;
      this.bgmGain = null;
      this.bgmAssetId = null;
    }
  }

  private async playSE(assetId: string, volume: number): Promise<void> {
    const buffer = await this.loadBuffer(assetId);
    if (!buffer) return;

    const ctx = this.getContext();
    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, ctx.currentTime);

    source.connect(gain);
    gain.connect(ctx.destination);
    source.start();
  }

  private stopAll(): void {
    this.stopBGMImmediate();
    // SE は fire-and-forget なので個別停止は不要
    // AudioContext をリセットすれば全停止
    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
      this.bufferCache.clear();
    }
  }

  dispose(): void {
    this.stopAll();
  }
}
