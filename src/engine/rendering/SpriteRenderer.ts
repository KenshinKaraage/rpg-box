/**
 * Shared sprite rendering core.
 * Renders RuntimeObjects with SpriteComponent as textured quads.
 * Y-sorted for correct draw order (lower objects drawn on top).
 */

import * as twgl from 'twgl.js';
import { TEXTURED_VERT, TEXTURED_FRAG } from '@/features/ui-editor/utils/shaders';
import type { RuntimeObject } from '@/engine/runtime/GameWorld';

// ── Constants ──

const TILE_SIZE = 32;

// ── Types ──

export interface SpriteTextureMeta {
  texture: WebGLTexture;
  width: number;
  height: number;
}

// ── SpriteRenderer ──

export class SpriteRenderer {
  private gl: WebGLRenderingContext;
  private programInfo: twgl.ProgramInfo;
  private textures = new Map<string, SpriteTextureMeta>();

  constructor(gl: WebGLRenderingContext) {
    this.gl = gl;
    this.programInfo = twgl.createProgramInfo(gl, [TEXTURED_VERT, TEXTURED_FRAG]);
  }

  // ── Texture management ──

  hasTexture(imageId: string): boolean {
    return this.textures.has(imageId);
  }

  loadTexture(imageId: string, dataUrl: string): Promise<SpriteTextureMeta | null> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const meta = this.setTextureFromImage(imageId, img);
        resolve(meta);
      };
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });
  }

  setTextureFromImage(imageId: string, img: HTMLImageElement): SpriteTextureMeta {
    const gl = this.gl;
    const texture = twgl.createTexture(gl, {
      src: img,
      minMag: gl.NEAREST,
    });
    const meta: SpriteTextureMeta = {
      texture,
      width: img.naturalWidth,
      height: img.naturalHeight,
    };
    this.textures.set(imageId, meta);
    return meta;
  }

  // ── Rendering ──

  /**
   * Render all objects with SpriteComponent, Y-sorted.
   * Objects further down (higher pixelY) are drawn later (on top).
   */
  render(objects: RuntimeObject[], matrix: twgl.m4.Mat4): void {
    // Filter objects with sprite component and sort by Y
    const spriteObjects = objects
      .filter((obj) => obj.components['sprite']?.imageId)
      .sort((a, b) => a.pixelY - b.pixelY);

    for (const obj of spriteObjects) {
      this.renderSprite(obj, matrix);
    }
  }

  dispose(): void {
    this.textures.forEach((meta) => {
      this.gl.deleteTexture(meta.texture);
    });
    this.textures.clear();
  }

  // ── Private ──

  private renderSprite(obj: RuntimeObject, matrix: twgl.m4.Mat4): void {
    const gl = this.gl;
    const sprite = obj.components['sprite'];
    if (!sprite) return;

    const imageId = sprite.imageId as string;
    const texMeta = this.textures.get(imageId);
    if (!texMeta) return;

    const flipX = (sprite.flipX as boolean) ?? false;
    const flipY = (sprite.flipY as boolean) ?? false;
    const opacity = (sprite.opacity as number) ?? 1;

    const spriteMode = (sprite.spriteMode as string) ?? 'single';
    const frameWidth = (sprite.frameWidth as number) ?? 0;
    const frameHeight = (sprite.frameHeight as number) ?? 0;
    const animFrameCount = (sprite.animFrameCount as number) ?? 1;
    const animIntervalMs = (sprite.animIntervalMs as number) ?? 200;

    const texW = texMeta.width;
    const texH = texMeta.height;

    // Calculate UV coordinates based on sprite mode and frame extraction
    let u0 = 0, u1 = 1, v0 = 0, v1 = 1;

    if (spriteMode === 'directional' && frameWidth > 0 && frameHeight > 0) {
      // Direction determines row: down=0, left=1, right=2, up=3
      const DIR_ROW: Record<string, number> = { down: 0, left: 1, right: 2, up: 3 };
      const dirRow = DIR_ROW[obj.facing] ?? 0;

      // Current animation frame based on elapsed time
      const frameIndex = Math.floor(Date.now() / animIntervalMs) % animFrameCount;

      u0 = (frameIndex * frameWidth) / texW;
      u1 = ((frameIndex + 1) * frameWidth) / texW;
      v0 = (dirRow * frameHeight) / texH;
      v1 = ((dirRow + 1) * frameHeight) / texH;
    } else if (spriteMode === 'single' && frameWidth > 0 && frameHeight > 0) {
      // Animated single sprite: only row 0, no direction
      const frameIndex = Math.floor(Date.now() / animIntervalMs) % animFrameCount;

      u0 = (frameIndex * frameWidth) / texW;
      u1 = ((frameIndex + 1) * frameWidth) / texW;
      v0 = 0;
      v1 = frameHeight / texH;
    }
    // else: single mode with frameWidth=0 → full image (u0=0, u1=1, v0=0, v1=1)

    // Apply flip
    if (flipX) { const tmp = u0; u0 = u1; u1 = tmp; }
    if (flipY) { const tmp = v0; v0 = v1; v1 = tmp; }

    // Sprite is drawn at pixelX, pixelY with size TILE_SIZE x TILE_SIZE
    const x = obj.pixelX;
    const y = obj.pixelY;
    const w = TILE_SIZE;
    const h = TILE_SIZE;

    // Position: 2 triangles forming a quad
    const positions = new Float32Array([
      x, y, x + w, y, x, y + h,
      x + w, y, x + w, y + h, x, y + h,
    ]);

    const texcoords = new Float32Array([
      u0, v0, u1, v0, u0, v1,
      u1, v0, u1, v1, u0, v1,
    ]);

    const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
      a_position: { numComponents: 2, data: positions },
      a_texcoord: { numComponents: 2, data: texcoords },
    });

    // Tint: white with opacity (multiply with texture color)
    const tint = [1, 1, 1, opacity];

    gl.useProgram(this.programInfo.program);
    twgl.setBuffersAndAttributes(gl, this.programInfo, bufferInfo);
    twgl.setUniforms(this.programInfo, {
      u_matrix: matrix,
      u_texture: texMeta.texture,
      u_tint: tint,
    });
    twgl.drawBufferInfo(gl, bufferInfo);
  }
}
