'use client';
import { useEffect, useRef, useState } from 'react';
import * as twgl from 'twgl.js';
import { useStore } from '@/stores';
import { TILE_VERT, TILE_FRAG, GRID_VERT, GRID_FRAG } from '../utils/shaders';
import { getVisibleTileRange } from '../utils/visibleTiles';
import { buildTileBatch } from '../utils/tileBatch';
import { TILE_SIZE } from '../utils/constants';
import type { ImageMetadata } from '@/types/assets';

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

  // テクスチャロード完了時に再レンダーをトリガーするカウンタ
  const [textureGen, setTextureGen] = useState(0);

  // WebGL 初期化（一度だけ）
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl');
    if (!gl) return;
    glRef.current = gl;
    gl.clearColor(0, 0, 0, 1); // 未描画エリアを黒に
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); // 透明部分は背景（黒）を透過
    tileProgramRef.current = twgl.createProgramInfo(gl, [TILE_VERT, TILE_FRAG]);
    gridProgramRef.current = twgl.createProgramInfo(gl, [GRID_VERT, GRID_FRAG]);
  }, [canvasRef]);

  // レンダリング（状態変化ごとに1回実行）
  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = glRef.current;
    const tileProgram = tileProgramRef.current;
    if (!canvas || !gl || !tileProgram) return;
    console.log('[MapCanvas] render effect triggered', { mapId, viewport });

    const map = maps.find((m) => m.id === mapId);
    if (!map) return;

    twgl.resizeCanvasToDisplaySize(canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const canvasSize = { w: canvas.width, h: canvas.height };
    const mapSize = { w: map.width, h: map.height };

    // 投影行列: ワールド座標 → クリップ座標
    // screen_x = world_x * zoom - viewport.x  なので
    // ortho の範囲を [viewport.x/zoom, (viewport.x + canvas.width)/zoom] にする
    const z = viewport.zoom;
    const matrix = twgl.m4.ortho(
      viewport.x / z,
      (viewport.x + canvas.width) / z,
      (viewport.y + canvas.height) / z,
      viewport.y / z,
      -1,
      1
    );

    const range = getVisibleTileRange(viewport, canvasSize, mapSize, TILE_SIZE);
    console.log('[MapCanvas] visible range', range, 'canvas', canvasSize);

    // レイヤーを順番に描画
    for (const layer of map.layers) {
      if (layer.visible === false) continue;
      if (layer.type !== 'tile') continue;
      console.log(
        '[MapCanvas] layer',
        layer.id,
        'chipsetIds:',
        layer.chipsetIds,
        'hasTiles:',
        !!layer.tiles
      );

      if (!layer.tiles) continue;

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
          img.onload = () => {
            if (!glRef.current) return;
            const tex = twgl.createTexture(glRef.current, {
              src: img,
              minMag: glRef.current.NEAREST,
            });
            textureCache.current.set(chipsetId, tex);
            // テクスチャロード完了 → 再レンダーをトリガー
            setTextureGen((t) => t + 1);
          };
          continue;
        }

        const asset = assets.find((a) => a.id === chipset.imageId);
        const meta = asset?.metadata as ImageMetadata | null;
        if (!meta?.width || !meta?.height) {
          console.warn('[MapCanvas] no image metadata for chipset', chipsetId);
          continue;
        }
        const tilesPerRow = Math.max(1, Math.floor(meta.width / chipset.tileWidth));
        const batch = buildTileBatch(
          layer.tiles,
          range,
          chipsetId,
          TILE_SIZE,
          meta.width,
          meta.height,
          chipset.tileWidth,
          chipset.tileHeight,
          tilesPerRow,
          chipset.autotile,
          map.width,
          map.height
        );
        console.log('[MapCanvas] batch', { chipsetId, count: batch.count, tilesPerRow });
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
  }, [maps, chipsets, assets, viewport, showGrid, mapId, canvasRef, textureGen]);
}
