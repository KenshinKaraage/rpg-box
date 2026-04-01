/**
 * Viewport camera with target following and map boundary clamping.
 */

export class Camera {
  x = 0;
  y = 0;
  zoom = 1;

  /** スクリーンオーバーレイ色（Tween で操作する） */
  overlayR = 0;
  overlayG = 0;
  overlayB = 0;
  overlayA = 0;

  private screenWidth: number;
  private screenHeight: number;
  private mapWidthPx: number;
  private mapHeightPx: number;
  private targetGetter: (() => { x: number; y: number } | null) | null = null;

  /** シェイク用 */
  private shakeIntensity = 0;
  private shakeRemaining = 0;
  private shakeOffsetX = 0;
  private shakeOffsetY = 0;

  /** パン用（一時的にフォロー無効） */
  private panTarget: { x: number; y: number } | null = null;

  constructor(screenWidth: number, screenHeight: number, mapWidthPx: number, mapHeightPx: number) {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
    this.mapWidthPx = mapWidthPx;
    this.mapHeightPx = mapHeightPx;
  }

  /** Set a function that returns the follow target's pixel position. */
  followTarget(getter: (() => { x: number; y: number } | null) | null): void {
    this.targetGetter = getter;
  }

  /** Update the map dimensions (e.g. after map change). */
  setMapSize(widthPx: number, heightPx: number): void {
    this.mapWidthPx = widthPx;
    this.mapHeightPx = heightPx;
  }

  /** Update camera position. Call once per frame. */
  update(): void {
    if (this.panTarget) {
      // パン中: フォロー無効、固定位置
      this.x = this.panTarget.x;
      this.y = this.panTarget.y;
    } else if (this.targetGetter) {
      const target = this.targetGetter();
      if (target) {
        this.x = target.x;
        this.y = target.y;
      }
    }
    this.clamp();

    // シェイク
    if (this.shakeRemaining > 0) {
      this.shakeRemaining--;
      this.shakeOffsetX = (Math.random() - 0.5) * 2 * this.shakeIntensity;
      this.shakeOffsetY = (Math.random() - 0.5) * 2 * this.shakeIntensity;
    } else {
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
    }
  }

  getViewport(): { x: number; y: number; zoom: number } {
    return {
      x: this.x + this.shakeOffsetX,
      y: this.y + this.shakeOffsetY,
      zoom: this.zoom,
    };
  }

  /** スクリーンオーバーレイ色（RGBA 0-1）を返す。alpha=0 ならオーバーレイなし */
  getOverlay(): [number, number, number, number] {
    return [this.overlayR, this.overlayG, this.overlayB, this.overlayA];
  }

  /** カメラシェイク */
  shake(intensity: number, frames: number): void {
    this.shakeIntensity = intensity;
    this.shakeRemaining = frames;
  }

  /** ズーム設定 */
  setZoom(level: number): void {
    this.zoom = Math.max(0.25, Math.min(4, level));
  }

  /** パン（固定位置に移動、フォロー停止） */
  panTo(x: number, y: number): void {
    this.panTarget = { x, y };
  }

  /** パン解除（フォロー再開） */
  resetPan(): void {
    this.panTarget = null;
  }

  /** オーバーレイ色を即座に設定 */
  setOverlay(r: number, g: number, b: number, a: number): void {
    this.overlayR = r;
    this.overlayG = g;
    this.overlayB = b;
    this.overlayA = a;
  }

  /** ズーム・パン・シェイク・オーバーレイをすべてリセット */
  reset(): void {
    this.zoom = 1;
    this.panTarget = null;
    this.shakeRemaining = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
    this.overlayR = 0;
    this.overlayG = 0;
    this.overlayB = 0;
    this.overlayA = 0;
  }

  private clamp(): void {
    const halfW = (this.screenWidth / this.zoom) / 2;
    const halfH = (this.screenHeight / this.zoom) / 2;

    // If the map is smaller than the viewport, center it
    if (this.mapWidthPx <= halfW * 2) {
      this.x = this.mapWidthPx / 2;
    } else {
      this.x = Math.max(halfW, Math.min(this.mapWidthPx - halfW, this.x));
    }

    if (this.mapHeightPx <= halfH * 2) {
      this.y = this.mapHeightPx / 2;
    } else {
      this.y = Math.max(halfH, Math.min(this.mapHeightPx - halfH, this.y));
    }
  }
}
