'use client';
import { useEffect, useRef } from 'react';
import * as twgl from 'twgl.js';
import { useStore } from '@/stores';
import { TILE_VERT, TILE_FRAG, GRID_VERT, GRID_FRAG } from '../utils/shaders';
import { getVisibleTileRange } from '../utils/visibleTiles';
import { buildTileBatch } from '../utils/tileBatch';

const TILE_SIZE = 32;

export function useMapCanvas(canvasRef: React.RefObject<HTMLCanvasElement | null>, mapId: string) {
  const maps = useStore((s) => s.maps);
  const chipsets = useStore((s) => s.chipsets);
  const assets = useStore((s) => s.assets);
  const viewport = useStore((s) => s.viewport);
  const showGrid = useStore((s) => s.showGrid);

  const glRef = useRef<WebGLRenderingContext | null>(null);
  const tileProgramRef = useRef<twgl.ProgramInfo | null>(null);
  const gridProgramRef = useRef<twgl.ProgramInfo | null>(null);
  const textureCache = useRef<Map<string, WebGLTexture>>(new Map());
  const rafRef = useRef<number>(0);

  // WebGL 初期化
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl');
    if (!gl) return;
    glRef.current = gl;
    tileProgramRef.current = twgl.createProgramInfo(gl, [TILE_VERT, TILE_FRAG]);
    gridProgramRef.current = twgl.createProgramInfo(gl, [GRID_VERT, GRID_FRAG]);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [canvasRef]);

  // レンダリングループ
  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = glRef.current;
    const tileProgram = tileProgramRef.current;
    if (!canvas || !gl || !tileProgram) return;

    const map = maps.find((m) => m.id === mapId);
    if (!map) return;

    cancelAnimationFrame(rafRef.current);

    const renderFrame = () => {
      twgl.resizeCanvasToDisplaySize(canvas);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clear(gl.COLOR_BUFFER_BIT);

      const canvasSize = { w: canvas.width, h: canvas.height };
      const mapSize = { w: map.width, h: map.height };

      // 投影行列（スクリーン座標 → クリップ座標）
      const proj = twgl.m4.ortho(
        viewport.x,
        viewport.x + canvas.width,
        viewport.y + canvas.height,
        viewport.y,
        -1,
        1
      );
      const matrix = twgl.m4.scale(proj, [viewport.zoom, viewport.zoom, 1]);

      const range = getVisibleTileRange(viewport, canvasSize, mapSize, TILE_SIZE);

      // レイヤーを順番に描画
      for (const layer of map.layers) {
        if (!layer.visible) continue;
        if (layer.type !== 'tile' || !layer.tiles) continue;

        for (const chipsetId of layer.chipsetIds) {
          const chipset = chipsets.find((c) => c.id === chipsetId);
          if (!chipset) continue;

          // テクスチャ取得（キャッシュ優先）
          const texture = textureCache.current.get(chipsetId);
          if (!texture) {
            const asset = assets.find((a) => a.id === chipset.imageId);
            if (!asset?.data) continue;
            const img = new Image();
            img.src = asset.data as string;
            // 非同期なので初回は skip し、ロード完了後に再描画される
            img.onload = () => {
              if (!gl) return;
              const tex = twgl.createTexture(gl, { src: img, minMag: gl.NEAREST });
              textureCache.current.set(chipsetId, tex);
            };
            continue;
          }

          const tilesPerRow = Math.max(
            1,
            Math.floor(chipset.tileWidth > 0 ? 128 / chipset.tileWidth : 4)
          );
          const batch = buildTileBatch(
            layer.tiles,
            range,
            TILE_SIZE,
            chipset.tileWidth * tilesPerRow,
            chipset.tileHeight,
            tilesPerRow
          );
          if (batch.count === 0) continue;

          const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
            a_position: { numComponents: 2, data: new Float32Array(batch.positions) },
            a_texcoord: { numComponents: 2, data: new Float32Array(batch.texcoords) },
          });

          gl.useProgram(tileProgram.program);
          twgl.setBuffersAndAttributes(gl, tileProgram, bufferInfo);
          twgl.setUniforms(tileProgram, { u_matrix: matrix, u_texture: texture });
          twgl.drawBufferInfo(gl, bufferInfo);
        }
      }

      // グリッドオーバーレイ
      if (showGrid) {
        const gridProgram = gridProgramRef.current;
        if (gridProgram) {
          gl.useProgram(gridProgram.program);
          twgl.setUniforms(gridProgram, {
            u_matrix: matrix,
            u_color: [0.5, 0.5, 0.5, 0.3],
          });
          // グリッド線の描画（範囲内の垂直・水平線）
          const gridPositions: number[] = [];
          for (let x = range.minX; x <= range.maxX; x++) {
            gridPositions.push(x * TILE_SIZE, range.minY * TILE_SIZE);
            gridPositions.push(x * TILE_SIZE, range.maxY * TILE_SIZE);
          }
          for (let y = range.minY; y <= range.maxY; y++) {
            gridPositions.push(range.minX * TILE_SIZE, y * TILE_SIZE);
            gridPositions.push(range.maxX * TILE_SIZE, y * TILE_SIZE);
          }
          if (gridPositions.length > 0) {
            const gridBuffer = twgl.createBufferInfoFromArrays(gl, {
              a_position: { numComponents: 2, data: new Float32Array(gridPositions) },
            });
            twgl.setBuffersAndAttributes(gl, gridProgram, gridBuffer);
            twgl.drawBufferInfo(gl, gridBuffer, gl.LINES);
          }
        }
      }

      rafRef.current = requestAnimationFrame(renderFrame);
    };

    renderFrame();
    return () => cancelAnimationFrame(rafRef.current);
  }, [maps, chipsets, assets, viewport, showGrid, mapId, canvasRef]);
}
