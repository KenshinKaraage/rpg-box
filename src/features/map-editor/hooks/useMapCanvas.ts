'use client';
import { useEffect, useRef, useState } from 'react';
import * as twgl from 'twgl.js';
import { useStore } from '@/stores';
import { GRID_VERT, GRID_FRAG } from '../utils/shaders';
import { TEXTURED_VERT, TEXTURED_FRAG } from '@/features/ui-editor/utils/shaders';
import { getVisibleTileRange } from '../utils/visibleTiles';
import { TILE_SIZE } from '../utils/constants';
import { dataUrlToBlob } from '@/hooks/useBlobUrl';
import { TileRenderer } from '@/engine/rendering/TileRenderer';
import type { DragRect } from './useMultiTileSelect';

/** hex色文字列 (#RRGGBB) を [r, g, b, a] (0-1) に変換 */
function hexToGlColor(hex: string, alpha = 1): [number, number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b, alpha];
}

/** 矩形の外周を太さ fw の塗りつぶし矩形4枚として頂点を積む（WebGL の lineWidth は信頼できないため） */
function pushFrameRect(
  positions: number[],
  x: number,
  y: number,
  w: number,
  h: number,
  fw: number
) {
  positions.push(
    // Top
    x,
    y,
    x + w,
    y,
    x,
    y + fw,
    x + w,
    y,
    x + w,
    y + fw,
    x,
    y + fw,
    // Bottom
    x,
    y + h - fw,
    x + w,
    y + h - fw,
    x,
    y + h,
    x + w,
    y + h - fw,
    x + w,
    y + h,
    x,
    y + h,
    // Left
    x,
    y,
    x + fw,
    y,
    x,
    y + h,
    x + fw,
    y,
    x + fw,
    y + h,
    x,
    y + h,
    // Right
    x + w - fw,
    y,
    x + w,
    y,
    x + w - fw,
    y + h,
    x + w,
    y,
    x + w,
    y + h,
    x + w - fw,
    y + h
  );
}

export function useMapCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  mapId: string,
  liveSelectionRect?: DragRect | null
) {
  const maps = useStore((s) => s.maps);
  const chipsets = useStore((s) => s.chipsets);
  const assets = useStore((s) => s.assets);
  const viewport = useStore((s) => s.viewport);
  const showGrid = useStore((s) => s.showGrid);
  const objectFrameColor = useStore((s) => s.objectFrameColor);
  const selectedObjectIds = useStore((s) => s.selectedObjectIds);
  const selectedLayerId = useStore((s) => s.selectedLayerId);
  const tileSelection = useStore((s) => s.tileSelection);
  const hoverTile = useStore((s) => s.hoverTile);

  const glRef = useRef<WebGLRenderingContext | null>(null);
  const tileRendererRef = useRef<TileRenderer | null>(null);
  const gridProgramRef = useRef<twgl.ProgramInfo | null>(null);
  const spriteProgramRef = useRef<twgl.ProgramInfo | null>(null);
  // assetId → Blob URL のキャッシュ（Base64 デコードを初回のみ実行するため）
  const blobUrlCache = useRef<Map<string, string>>(new Map());
  // スプライトテクスチャキャッシュ（imageId → texture + size）
  const spriteTextureCache = useRef<
    Map<string, { texture: WebGLTexture; width: number; height: number }>
  >(new Map());

  // テクスチャロード完了時に再レンダーをトリガーするカウンタ
  const [textureGen, setTextureGen] = useState(0);

  // コンテナリサイズ時に再描画をトリガーするカウンタ
  const [resizeGen, setResizeGen] = useState(0);

  // WebGL 初期化（一度だけ）
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // antialias:false — MSAAが有効だと、隣接タイルの頂点座標が数学的に一致していても
    // ドローコールをまたいだエッジのカバレッジ計算がズレて境界に半透明の隙間が出ることがある
    const gl = canvas.getContext('webgl', { antialias: false });
    if (!gl) return;
    glRef.current = gl;
    gl.clearColor(0, 0, 0, 1); // 未描画エリアを黒に
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); // 透明部分は背景（黒）を透過
    tileRendererRef.current = new TileRenderer(gl);
    gridProgramRef.current = twgl.createProgramInfo(gl, [GRID_VERT, GRID_FRAG]);
    spriteProgramRef.current = twgl.createProgramInfo(gl, [TEXTURED_VERT, TEXTURED_FRAG]);

    // パネルリサイズ検知 → canvas 内部解像度を更新して再描画
    const observer = new ResizeObserver(() => setResizeGen((g) => g + 1));
    observer.observe(canvas);
    return () => observer.disconnect();
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
    // viewport.x/y は整数ピクセルにスナップしてから使う（サブピクセル位置だとタイル境界のAAカバレッジが
    // フレームごとに微妙にズレてチラつく隙間の原因になる）。screenToTile 等の入力判定には影響しないよう
    // 元の viewport state 自体は変更せず、行列計算用にローカルで丸めるだけ
    const z = viewport.zoom;
    const vx = Math.round(viewport.x);
    const vy = Math.round(viewport.y);
    const matrix = twgl.m4.ortho(
      vx / z,
      (vx + canvas.width) / z,
      (vy + canvas.height) / z,
      vy / z,
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
        const isSelected = selectedObjectIds.includes(obj.id);

        // スプライト画像の描画（フレームより先に描画してフレームが上に来るようにする）
        const spriteComp = obj.components.find((c) => c.type === 'sprite');
        const spriteData = spriteComp as unknown as
          | {
              imageId?: string;
              spriteMode?: string;
              frameWidth?: number;
              frameHeight?: number;
              animFrameCount?: number;
            }
          | undefined;
        const spriteProgram = spriteProgramRef.current;
        if (spriteData?.imageId && spriteProgram) {
          const imageId = spriteData.imageId;
          const cached = spriteTextureCache.current.get(imageId);

          if (!cached) {
            // テクスチャ未ロード: アセットから非同期ロード
            const asset = assets.find((a) => a.id === imageId);
            if (asset?.data) {
              let blobUrl = blobUrlCache.current.get(asset.id);
              if (!blobUrl) {
                blobUrl = URL.createObjectURL(dataUrlToBlob(asset.data as string));
                blobUrlCache.current.set(asset.id, blobUrl);
              }
              const img = new Image();
              img.src = blobUrl;
              img.onload = () => {
                const glCtx = glRef.current;
                if (!glCtx) return;
                const tex = twgl.createTexture(glCtx, { src: img, minMag: glCtx.NEAREST });
                spriteTextureCache.current.set(imageId, {
                  texture: tex,
                  width: img.naturalWidth,
                  height: img.naturalHeight,
                });
                setTextureGen((t) => t + 1);
              };
            }
          } else {
            // テクスチャ取得済み: UV座標を計算して描画
            const spriteMode = spriteData.spriteMode ?? 'single';
            const frameWidth = spriteData.frameWidth ?? 0;
            const frameHeight = spriteData.frameHeight ?? 0;
            const texW = cached.width;
            const texH = cached.height;

            let u0 = 0,
              u1 = 1,
              v0 = 0,
              v1 = 1;
            if (spriteMode === 'directional' && frameWidth > 0 && frameHeight > 0) {
              // 1フレーム目、下向き（行0）
              u0 = 0;
              u1 = frameWidth / texW;
              v0 = 0;
              v1 = frameHeight / texH;
            } else if (spriteMode === 'single' && frameWidth > 0 && frameHeight > 0) {
              // アニメーション付きシングル: 1フレーム目
              u0 = 0;
              u1 = frameWidth / texW;
              v0 = 0;
              v1 = frameHeight / texH;
            }
            // spriteMode === 'single' && frameWidth === 0: フル画像 (u0=0, u1=1, v0=0, v1=1)

            const positions = new Float32Array([
              px,
              py,
              px + TILE_SIZE,
              py,
              px,
              py + TILE_SIZE,
              px + TILE_SIZE,
              py,
              px + TILE_SIZE,
              py + TILE_SIZE,
              px,
              py + TILE_SIZE,
            ]);
            const texcoords = new Float32Array([u0, v0, u1, v0, u0, v1, u1, v0, u1, v1, u0, v1]);
            const spriteBuffer = twgl.createBufferInfoFromArrays(gl, {
              a_position: { numComponents: 2, data: positions },
              a_texcoord: { numComponents: 2, data: texcoords },
            });
            gl.useProgram(spriteProgram.program);
            twgl.setBuffersAndAttributes(gl, spriteProgram, spriteBuffer);
            twgl.setUniforms(spriteProgram, {
              u_matrix: matrix,
              u_texture: cached.texture,
              u_tint: [1, 1, 1, 1],
            });
            twgl.drawBufferInfo(gl, spriteBuffer);
          }
        }

        // Frame as 4 filled rectangles (lineWidth not reliable in WebGL)
        const frameColor = hexToGlColor(objectFrameColor);
        gl.useProgram(gridProgram.program);
        twgl.setUniforms(gridProgram, {
          u_matrix: matrix,
          u_color: frameColor,
        });

        const fw = 3; // frame width in pixels
        // Top, Right, Bottom, Left strips as two triangles each
        const framePositions = new Float32Array([
          // Top
          px,
          py,
          px + TILE_SIZE,
          py,
          px,
          py + fw,
          px + TILE_SIZE,
          py,
          px + TILE_SIZE,
          py + fw,
          px,
          py + fw,
          // Bottom
          px,
          py + TILE_SIZE - fw,
          px + TILE_SIZE,
          py + TILE_SIZE - fw,
          px,
          py + TILE_SIZE,
          px + TILE_SIZE,
          py + TILE_SIZE - fw,
          px + TILE_SIZE,
          py + TILE_SIZE,
          px,
          py + TILE_SIZE,
          // Left
          px,
          py,
          px + fw,
          py,
          px,
          py + TILE_SIZE,
          px + fw,
          py,
          px + fw,
          py + TILE_SIZE,
          px,
          py + TILE_SIZE,
          // Right
          px + TILE_SIZE - fw,
          py,
          px + TILE_SIZE,
          py,
          px + TILE_SIZE - fw,
          py + TILE_SIZE,
          px + TILE_SIZE,
          py,
          px + TILE_SIZE,
          py + TILE_SIZE,
          px + TILE_SIZE - fw,
          py + TILE_SIZE,
        ]);
        const frameBuffer = twgl.createBufferInfoFromArrays(gl, {
          a_position: { numComponents: 2, data: framePositions },
        });
        twgl.setBuffersAndAttributes(gl, gridProgram, frameBuffer);
        twgl.drawBufferInfo(gl, frameBuffer, gl.TRIANGLES);

        // 選択中: 🔻マーカー（小さな三角形を枠の上に描画）
        if (isSelected) {
          const markerColor: [number, number, number, number] = [1, 0.2, 0.2, 1];
          twgl.setUniforms(gridProgram, { u_color: markerColor });
          const cx = px + TILE_SIZE / 2;
          const markerTop = py - 4;
          const markerBottom = py - 12;
          const markerPositions = new Float32Array([
            cx,
            markerTop,
            cx - 6,
            markerBottom,
            cx + 6,
            markerBottom,
          ]);
          const markerBuffer = twgl.createBufferInfoFromArrays(gl, {
            a_position: { numComponents: 2, data: markerPositions },
          });
          twgl.setBuffersAndAttributes(gl, gridProgram, markerBuffer);
          twgl.drawBufferInfo(gl, markerBuffer, gl.TRIANGLES);
        }
      }
    }

    // タイル/オブジェクトの範囲選択の赤枠（ドラッグ中はライブプレビュー、確定後は選択範囲のバウンディングボックス）
    // オブジェクトより後に描画し、選択中であることが常に最前面で分かるようにする
    const selectionBoundingBox = liveSelectionRect
      ? {
          minX: Math.min(liveSelectionRect.start.x, liveSelectionRect.end.x),
          maxX: Math.max(liveSelectionRect.start.x, liveSelectionRect.end.x),
          minY: Math.min(liveSelectionRect.start.y, liveSelectionRect.end.y),
          maxY: Math.max(liveSelectionRect.start.y, liveSelectionRect.end.y),
        }
      : tileSelection && tileSelection.layerId === selectedLayerId && tileSelection.cells.length > 0
        ? {
            minX: Math.min(...tileSelection.cells.map((c) => c.x)),
            maxX: Math.max(...tileSelection.cells.map((c) => c.x)),
            minY: Math.min(...tileSelection.cells.map((c) => c.y)),
            maxY: Math.max(...tileSelection.cells.map((c) => c.y)),
          }
        : null;

    if (selectionBoundingBox) {
      const gridProgram = gridProgramRef.current;
      if (gridProgram) {
        const { minX, maxX, minY, maxY } = selectionBoundingBox;

        gl.useProgram(gridProgram.program);
        twgl.setUniforms(gridProgram, {
          u_matrix: matrix,
          u_color: [0.94, 0.11, 0.11, 1], // red-600
        });
        const framePositions: number[] = [];
        pushFrameRect(
          framePositions,
          minX * TILE_SIZE,
          minY * TILE_SIZE,
          (maxX - minX + 1) * TILE_SIZE,
          (maxY - minY + 1) * TILE_SIZE,
          2
        );
        const frameBuffer = twgl.createBufferInfoFromArrays(gl, {
          a_position: { numComponents: 2, data: new Float32Array(framePositions) },
        });
        twgl.setBuffersAndAttributes(gl, gridProgram, frameBuffer);
        twgl.drawBufferInfo(gl, frameBuffer, gl.TRIANGLES);
      }
    }

    // ホバー中タイルのプレビュー枠（一番最前面。ライブドラッグ中のみ、選択枠と重なるため非表示）
    if (hoverTile && !liveSelectionRect) {
      const gridProgram = gridProgramRef.current;
      if (gridProgram) {
        gl.useProgram(gridProgram.program);
        twgl.setUniforms(gridProgram, {
          u_matrix: matrix,
          u_color: [1, 1, 1, 0.6], // 白半透明: 確定選択（赤）と区別
        });
        const hoverPositions: number[] = [];
        pushFrameRect(
          hoverPositions,
          hoverTile.x * TILE_SIZE,
          hoverTile.y * TILE_SIZE,
          TILE_SIZE,
          TILE_SIZE,
          2
        );
        const hoverBuffer = twgl.createBufferInfoFromArrays(gl, {
          a_position: { numComponents: 2, data: new Float32Array(hoverPositions) },
        });
        twgl.setBuffersAndAttributes(gl, gridProgram, hoverBuffer);
        twgl.drawBufferInfo(gl, hoverBuffer, gl.TRIANGLES);
      }
    }
  }, [
    maps,
    chipsets,
    assets,
    viewport,
    showGrid,
    mapId,
    canvasRef,
    textureGen,
    resizeGen,
    objectFrameColor,
    selectedObjectIds,
    selectedLayerId,
    tileSelection,
    hoverTile,
    liveSelectionRect,
  ]);
}
