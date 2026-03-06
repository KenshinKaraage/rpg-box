/**
 * Game runtime map renderer.
 * Wraps TileRenderer (shared with editor) for game-specific usage:
 * pre-loads all textures, renders with Camera viewport.
 */

import * as twgl from 'twgl.js';
import type { GameMap, Chipset } from '@/lib/storage/types';
import { getVisibleTileRange } from '@/features/map-editor/utils/visibleTiles';
import { TileRenderer } from '@/engine/rendering/TileRenderer';

// ── Constants ──

const TILE_SIZE = 32;

// ── Types ──

export interface MapViewport {
  x: number;
  y: number;
  zoom: number;
}

// ── MapRenderer ──

export class MapRenderer {
  private tileRenderer: TileRenderer;

  constructor(gl: WebGLRenderingContext) {
    this.tileRenderer = new TileRenderer(gl);
  }

  /** Pre-load all chipset textures before first render. */
  async loadTextures(
    chipsets: Chipset[],
    getAssetData: (imageId: string) => string | null
  ): Promise<void> {
    const promises: Promise<unknown>[] = [];
    for (const chipset of chipsets) {
      if (this.tileRenderer.hasTexture(chipset.id)) continue;
      const data = getAssetData(chipset.imageId);
      if (!data) continue;
      promises.push(this.tileRenderer.loadTexture(chipset.id, data));
    }
    await Promise.all(promises);
  }

  /** Render all tile layers. */
  render(
    map: GameMap,
    chipsets: Chipset[],
    viewport: MapViewport,
    canvasW: number,
    canvasH: number
  ): void {
    const z = viewport.zoom;
    const matrix = twgl.m4.ortho(
      viewport.x / z,
      (viewport.x + canvasW) / z,
      (viewport.y + canvasH) / z,
      viewport.y / z,
      -1,
      1
    );

    const range = getVisibleTileRange(
      viewport,
      { w: canvasW, h: canvasH },
      { w: map.width, h: map.height },
      TILE_SIZE
    );

    for (const layer of map.layers) {
      if (layer.type !== 'tile' || !layer.tiles) continue;

      // Serialized MapLayer has no chipsetIds — scan visible tiles for chipset IDs
      const chipsetIds = this.getChipsetIdsInRange(layer.tiles, range);

      for (const chipsetId of Array.from(chipsetIds)) {
        const chipset = chipsets.find((c) => c.id === chipsetId);
        if (!chipset) continue;

        this.tileRenderer.renderChipset(
          layer.tiles,
          range,
          chipsetId,
          chipset,
          matrix,
          map.width,
          map.height
        );
      }
    }
  }

  dispose(): void {
    this.tileRenderer.dispose();
  }

  // ── Private ──

  private getChipsetIdsInRange(tiles: string[][], range: ReturnType<typeof getVisibleTileRange>): Set<string> {
    const ids = new Set<string>();
    for (let y = range.minY; y < range.maxY; y++) {
      const row = tiles[y];
      if (!row) continue;
      for (let x = range.minX; x < range.maxX; x++) {
        const cell = row[x];
        if (!cell) continue;
        const colonIdx = cell.indexOf(':');
        if (colonIdx > 0) {
          ids.add(cell.substring(0, colonIdx));
        }
      }
    }
    return ids;
  }
}
