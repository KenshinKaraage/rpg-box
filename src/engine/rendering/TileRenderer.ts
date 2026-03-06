/**
 * Shared tile rendering core.
 * Used by both the map editor (via useMapCanvas) and the game runtime (via MapRenderer).
 * Handles shader program, texture cache, and per-chipset batch rendering.
 */

import * as twgl from 'twgl.js';
import { TILE_VERT, TILE_FRAG } from '@/features/map-editor/utils/shaders';
import { buildTileBatch } from '@/features/map-editor/utils/tileBatch';
import type { TileRange } from '@/features/map-editor/utils/visibleTiles';

// ── Constants ──

const TILE_SIZE = 32;

// ── Types ──

export interface TextureMeta {
  texture: WebGLTexture;
  width: number;
  height: number;
}

export interface ChipsetInfo {
  tileWidth: number;
  tileHeight: number;
  autotile?: boolean;
}

// ── TileRenderer ──

export class TileRenderer {
  private gl: WebGLRenderingContext;
  private programInfo: twgl.ProgramInfo;
  private textures = new Map<string, TextureMeta>();

  constructor(gl: WebGLRenderingContext) {
    this.gl = gl;
    this.programInfo = twgl.createProgramInfo(gl, [TILE_VERT, TILE_FRAG]);
  }

  // ── Texture management ──

  hasTexture(chipsetId: string): boolean {
    return this.textures.has(chipsetId);
  }

  getTextureMeta(chipsetId: string): TextureMeta | null {
    return this.textures.get(chipsetId) ?? null;
  }

  /** Load texture from a data URL (async). */
  loadTexture(chipsetId: string, dataUrl: string): Promise<TextureMeta | null> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const meta = this.setTextureFromImage(chipsetId, img);
        resolve(meta);
      };
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });
  }

  /** Set texture from an already-loaded Image element (sync). */
  setTextureFromImage(chipsetId: string, img: HTMLImageElement): TextureMeta {
    const gl = this.gl;
    const texture = twgl.createTexture(gl, {
      src: img,
      minMag: gl.NEAREST,
    });
    const meta: TextureMeta = {
      texture,
      width: img.naturalWidth,
      height: img.naturalHeight,
    };
    this.textures.set(chipsetId, meta);
    return meta;
  }

  /** Remove a single texture. */
  deleteTexture(chipsetId: string): void {
    const meta = this.textures.get(chipsetId);
    if (meta) {
      this.gl.deleteTexture(meta.texture);
      this.textures.delete(chipsetId);
    }
  }

  // ── Rendering ──

  /**
   * Render tiles for a single chipset within the visible range.
   * Call this once per chipset per tile layer.
   */
  renderChipset(
    tiles: string[][],
    range: TileRange,
    chipsetId: string,
    chipset: ChipsetInfo,
    matrix: twgl.m4.Mat4,
    mapWidth: number,
    mapHeight: number
  ): void {
    const texMeta = this.textures.get(chipsetId);
    if (!texMeta) return;

    const tilesPerRow = Math.max(1, Math.floor(texMeta.width / chipset.tileWidth));
    const batch = buildTileBatch(
      tiles,
      range,
      chipsetId,
      TILE_SIZE,
      texMeta.width,
      texMeta.height,
      chipset.tileWidth,
      chipset.tileHeight,
      tilesPerRow,
      chipset.autotile ?? false,
      mapWidth,
      mapHeight
    );

    if (batch.count === 0) return;

    const gl = this.gl;
    const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
      a_position: { numComponents: 2, data: new Float32Array(batch.positions) },
      a_texcoord: { numComponents: 2, data: new Float32Array(batch.texcoords) },
    });

    gl.useProgram(this.programInfo.program);
    twgl.setBuffersAndAttributes(gl, this.programInfo, bufferInfo);
    twgl.setUniforms(this.programInfo, {
      u_matrix: matrix,
      u_texture: texMeta.texture,
    });
    twgl.drawBufferInfo(gl, bufferInfo);
  }

  // ── Cleanup ──

  dispose(): void {
    const gl = this.gl;
    this.textures.forEach((meta) => {
      gl.deleteTexture(meta.texture);
    });
    this.textures.clear();
  }
}
