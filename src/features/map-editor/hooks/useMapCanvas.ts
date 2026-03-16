'use client';
import { useEffect, useRef, useState } from 'react';
import * as twgl from 'twgl.js';
import { useStore } from '@/stores';
import { GRID_VERT, GRID_FRAG } from '../utils/shaders';
import { getVisibleTileRange } from '../utils/visibleTiles';
import { TILE_SIZE } from '../utils/constants';
import { dataUrlToBlob } from '@/hooks/useBlobUrl';
import { TileRenderer } from '@/engine/rendering/TileRenderer';

/** hex色文字列 (#RRGGBB) を [r, g, b, a] (0-1) に変換 */
function hexToGlColor(hex: string, alpha = 1): [number, number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b, alpha];
}

export function useMapCanvas(canvasRef: React.RefObject<HTMLCanvasElement | null>, mapId: string) {
  const maps = useStore((s) => s.maps);
  const chipsets = useStore((s) => s.chipsets);
  const assets = useStore((s) => s.assets);
  const viewport = useStore((s) => s.viewport);
  const showGrid = useStore((s) => s.showGrid);
  const objectFrameColor = useStore((s) => s.objectFrameColor);
  const selectedObjectId = useStore((s) => s.selectedObjectId);

  const glRef = useRef<WebGLRenderingContext | null>(null);
  const tileRendererRef = useRef<TileRenderer | null>(null);
  const gridProgramRef = useRef<twgl.ProgramInfo | null>(null);
  // assetId → Blob URL のキャッシュ（Base64 デコードを初回のみ実行するため）
  const blobUrlCache = useRef<Map<string, string>>(new Map());

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
    tileRendererRef.current = new TileRenderer(gl);
    gridProgramRef.current = twgl.createProgramInfo(gl, [GRID_VERT, GRID_FRAG]);
  }, [canvasRef]);

  // レンダリング（状態変化ごとに1回実行）
  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = glRef.current;
    const tileRenderer = tileRendererRef.current;
    if (!canvas || !gl || !tileRenderer) return;

    const map = maps.find((m) => m.id === mapId);
    if (!map) return;

    twgl.resizeCanvasToDisplaySize(canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const canvasSize = { w: canvas.width, h: canvas.height };
    const mapSize = { w: map.width, h: map.height };

    // 投影行列: ワールド座標 → クリップ座標
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

    // レイヤーを順番に描画
    for (const layer of map.layers) {
      if (layer.visible === false) continue;
      if (layer.type !== 'tile') continue;
      if (!layer.tiles) continue;

      for (const chipsetId of layer.chipsetIds) {
        const chipset = chipsets.find((c) => c.id === chipsetId);
        if (!chipset) continue;

        // テクスチャが未ロードなら非同期ロード → 完了後に再レンダー
        if (!tileRenderer.hasTexture(chipsetId)) {
          const asset = assets.find((a) => a.id === chipset.imageId);
          if (!asset?.data) continue;

          // Blob URL キャッシュ: 同一アセットの Base64 デコードを初回のみ実行
          let blobUrl = blobUrlCache.current.get(asset.id);
          if (!blobUrl) {
            blobUrl = URL.createObjectURL(dataUrlToBlob(asset.data as string));
            blobUrlCache.current.set(asset.id, blobUrl);
          }

          const img = new Image();
          img.src = blobUrl;
          img.onload = () => {
            if (!tileRendererRef.current) return;
            tileRendererRef.current.setTextureFromImage(chipsetId, img);
            setTextureGen((t) => t + 1);
          };
          continue;
        }

        tileRenderer.renderChipset(
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
    // オブジェクトレイヤーのオブジェクト描画
    for (const layer of map.layers) {
      if (layer.visible === false) continue;
      if (layer.type !== 'object') continue;
      if (!layer.objects) continue;

      const gridProgram = gridProgramRef.current;
      if (!gridProgram) continue;

      for (const obj of layer.objects) {
        const transform = obj.components.find((c) => c.type === 'transform');
        if (!transform) continue;
        // Component クラスインスタンスから x, y を取得
        const tx = (transform as unknown as { x: number }).x ?? 0;
        const ty = (transform as unknown as { y: number }).y ?? 0;

        const px = tx * TILE_SIZE;
        const py = ty * TILE_SIZE;
        const isSelected = obj.id === selectedObjectId;

        // 太枠（2px相当の線で矩形を描画）
        const frameColor = hexToGlColor(objectFrameColor);
        gl.useProgram(gridProgram.program);
        twgl.setUniforms(gridProgram, {
          u_matrix: matrix,
          u_color: frameColor,
        });

        const framePositions = new Float32Array([
          px, py, px + TILE_SIZE, py,
          px + TILE_SIZE, py, px + TILE_SIZE, py + TILE_SIZE,
          px + TILE_SIZE, py + TILE_SIZE, px, py + TILE_SIZE,
          px, py + TILE_SIZE, px, py,
        ]);
        const frameBuffer = twgl.createBufferInfoFromArrays(gl, {
          a_position: { numComponents: 2, data: framePositions },
        });
        twgl.setBuffersAndAttributes(gl, gridProgram, frameBuffer);
        gl.lineWidth(2);
        twgl.drawBufferInfo(gl, frameBuffer, gl.LINES);

        // 選択中: 🔻マーカー（小さな三角形を枠の上に描画）
        if (isSelected) {
          const markerColor: [number, number, number, number] = [1, 0.2, 0.2, 1];
          twgl.setUniforms(gridProgram, { u_color: markerColor });
          const cx = px + TILE_SIZE / 2;
          const markerTop = py - 4;
          const markerBottom = py - 12;
          const markerPositions = new Float32Array([
            cx, markerTop,
            cx - 6, markerBottom,
            cx + 6, markerBottom,
          ]);
          const markerBuffer = twgl.createBufferInfoFromArrays(gl, {
            a_position: { numComponents: 2, data: markerPositions },
          });
          twgl.setBuffersAndAttributes(gl, gridProgram, markerBuffer);
          twgl.drawBufferInfo(gl, markerBuffer, gl.TRIANGLES);
        }
      }
    }
  }, [maps, chipsets, assets, viewport, showGrid, mapId, canvasRef, textureGen, objectFrameColor, selectedObjectId]);
}
