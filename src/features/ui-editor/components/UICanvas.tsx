'use client';

import { useEffect, useRef, useState } from 'react';
import * as twgl from 'twgl.js';
import { useStore } from '@/stores';
import { useUIViewport } from '../hooks/useUIViewport';
import { SOLID_VERT, SOLID_FRAG } from '../utils/shaders';
import { createRendererPrograms, renderUIObjects } from '../renderer/UIRenderer';
import type { UIRendererContext } from '../renderer/UIRenderer';

export function UICanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const solidProgramRef = useRef<twgl.ProgramInfo | null>(null);
  const rendererCtxRef = useRef<UIRendererContext | null>(null);

  const resolution = useStore((s) => s.gameSettings.resolution);
  const showGrid = useStore((s) => s.showUIGrid);
  const gridSize = useStore((s) => s.uiGridSize);
  const selectedCanvasId = useStore((s) => s.selectedCanvasId);
  const uiCanvases = useStore((s) => s.uiCanvases);
  const assets = useStore((s) => s.assets);

  const selectedCanvas = uiCanvases.find((c) => c.id === selectedCanvasId) ?? null;

  // テクスチャロード完了時に再レンダーをトリガー
  const [textureGen, setTextureGen] = useState(0);

  const { viewport, handleWheel, handleMouseDown, handleMouseMove, handleMouseUp } =
    useUIViewport(canvasRef);

  // WebGL 初期化
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl');
    if (!gl) return;
    glRef.current = gl;
    gl.clearColor(0.15, 0.15, 0.15, 1);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    solidProgramRef.current = twgl.createProgramInfo(gl, [SOLID_VERT, SOLID_FRAG]);

    const programs = createRendererPrograms(gl);
    rendererCtxRef.current = {
      gl,
      ...programs,
      matrix: twgl.m4.identity(),
      textureCache: new Map(),
      getAssetData: () => null,
      onTextureLoaded: () => setTextureGen((t) => t + 1),
    };
  }, []);

  // ホイールイベント（passive:false 必須）
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // レンダリング
  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = glRef.current;
    const solidProgram = solidProgramRef.current;
    const rendererCtx = rendererCtxRef.current;
    if (!canvas || !gl || !solidProgram) return;

    twgl.resizeCanvasToDisplaySize(canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const z = viewport.zoom;
    const matrix = twgl.m4.ortho(
      viewport.x / z,
      (viewport.x + canvas.width) / z,
      (viewport.y + canvas.height) / z,
      viewport.y / z,
      -1,
      1
    );

    gl.useProgram(solidProgram.program);

    // ── 解像度プレビュー枠の背景（白） ──
    const resW = resolution.width;
    const resH = resolution.height;
    const bgPositions = new Float32Array([
      0, 0, resW, 0, 0, resH,
      0, resH, resW, 0, resW, resH,
    ]);
    const bgBuffer = twgl.createBufferInfoFromArrays(gl, {
      a_position: { numComponents: 2, data: bgPositions },
    });
    twgl.setBuffersAndAttributes(gl, solidProgram, bgBuffer);
    twgl.setUniforms(solidProgram, { u_matrix: matrix, u_color: [1, 1, 1, 1] });
    twgl.drawBufferInfo(gl, bgBuffer);

    // ── グリッド ──
    if (showGrid && gridSize > 0) {
      const gridPositions: number[] = [];
      const cols = Math.ceil(resW / gridSize);
      const rows = Math.ceil(resH / gridSize);
      for (let x = 0; x <= cols; x++) {
        const px = x * gridSize;
        gridPositions.push(px, 0, px, resH);
      }
      for (let y = 0; y <= rows; y++) {
        const py = y * gridSize;
        gridPositions.push(0, py, resW, py);
      }
      if (gridPositions.length > 0) {
        const gridBuffer = twgl.createBufferInfoFromArrays(gl, {
          a_position: { numComponents: 2, data: new Float32Array(gridPositions) },
        });
        twgl.setBuffersAndAttributes(gl, solidProgram, gridBuffer);
        twgl.setUniforms(solidProgram, {
          u_matrix: matrix,
          u_color: [0.85, 0.85, 0.85, 0.5],
        });
        twgl.drawBufferInfo(gl, gridBuffer, gl.LINES);
      }
    }

    // ── UIObject 描画 ──
    if (rendererCtx && selectedCanvas && selectedCanvas.objects.length > 0) {
      rendererCtx.matrix = matrix;
      rendererCtx.getAssetData = (assetId: string) => {
        const asset = assets.find((a) => a.id === assetId);
        return (asset?.data as string) ?? null;
      };
      renderUIObjects(rendererCtx, selectedCanvas.objects, resW, resH);
    }

    // ── 解像度プレビュー枠（青い外枠） ──
    gl.useProgram(solidProgram.program);
    const borderPositions = new Float32Array([
      0, 0, resW, 0,
      resW, 0, resW, resH,
      resW, resH, 0, resH,
      0, resH, 0, 0,
    ]);
    const borderBuffer = twgl.createBufferInfoFromArrays(gl, {
      a_position: { numComponents: 2, data: borderPositions },
    });
    twgl.setBuffersAndAttributes(gl, solidProgram, borderBuffer);
    twgl.setUniforms(solidProgram, {
      u_matrix: matrix,
      u_color: [0.3, 0.5, 1.0, 0.8],
    });
    twgl.drawBufferInfo(gl, borderBuffer, gl.LINES);
  }, [viewport, resolution, showGrid, gridSize, selectedCanvas, assets, textureGen]);

  return (
    <div className="relative h-full w-full overflow-hidden" data-testid="ui-canvas-container">
      <canvas
        ref={canvasRef}
        data-testid="ui-canvas"
        className="block h-full w-full"
        onMouseDown={(e) => handleMouseDown(e.nativeEvent)}
        onMouseMove={(e) => handleMouseMove(e.nativeEvent)}
        onMouseUp={handleMouseUp}
      />
      {/* DOM オーバーレイ（選択枠・ハンドル用、T194 で使用） */}
      <div
        ref={overlayRef}
        className="pointer-events-none absolute inset-0"
        data-testid="ui-canvas-overlay"
      />
    </div>
  );
}
