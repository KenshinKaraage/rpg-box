/**
 * Viewport camera with target following and map boundary clamping.
 */

export class Camera {
  x = 0;
  y = 0;
  zoom = 1;

  private screenWidth: number;
  private screenHeight: number;
  private mapWidthPx: number;
  private mapHeightPx: number;
  private targetGetter: (() => { x: number; y: number } | null) | null = null;

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
    if (this.targetGetter) {
      const target = this.targetGetter();
      if (target) {
        this.x = target.x;
        this.y = target.y;
      }
    }
    this.clamp();
  }

  getViewport(): { x: number; y: number; zoom: number } {
    return { x: this.x, y: this.y, zoom: this.zoom };
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
