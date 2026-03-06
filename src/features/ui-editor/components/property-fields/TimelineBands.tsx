'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Maximize2 } from 'lucide-react';
import type { TweenTrack, LoopType } from '@/types/ui/components/AnimationComponent';

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

export const BAND_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#f43f5e',
  '#8b5cf6', '#06b6d4', '#f97316', '#ec4899',
];

const MIN_VIEW_SPAN = 50;
const MAX_VIEW_SPAN = 60000;
const MAX_VISIBLE_LOOPS = 8;

// ──────────────────────────────────────────────
// TimelineBands (interactive, zoom + pan)
// ──────────────────────────────────────────────

export interface TimelineBandsProps {
  tracks: TweenTrack[];
  /** Single-cycle duration */
  totalDuration: number;
  /** Loop type for visualization */
  loopType?: LoopType;
  /** Loop count (0 = infinite) */
  loopCount?: number;
  selectedTrackIdx: number | null;
  onSelectTrack: (idx: number) => void;
  onUpdateTrack: (idx: number, patch: Partial<TweenTrack>) => void;
}

export function TimelineBands({
  tracks, totalDuration, loopType, loopCount,
  selectedTrackIdx, onSelectTrack, onUpdateTrack,
}: TimelineBandsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lt = loopType ?? 'none';
  const lc = loopCount ?? 1;

  // Effective display duration: for looping, show up to MAX_VISIBLE_LOOPS repetitions
  const visibleLoops = lt === 'none' ? 1 : lc === 0 ? MAX_VISIBLE_LOOPS : Math.min(lc, MAX_VISIBLE_LOOPS);
  const displayDuration = totalDuration * visibleLoops;

  const [viewStart, setViewStart] = useState(0);
  const [viewEnd, setViewEnd] = useState(() => Math.max(displayDuration, 500));
  const [isDraggingBand, setIsDraggingBand] = useState(false);
  const panRef = useRef<{ startX: number; origStart: number; origEnd: number } | null>(null);

  const prevDurationRef = useRef(displayDuration);
  useEffect(() => {
    if (isDraggingBand) { prevDurationRef.current = displayDuration; return; }
    if (displayDuration > viewEnd) setViewEnd(displayDuration);
    prevDurationRef.current = displayDuration;
  }, [displayDuration, isDraggingBand, viewEnd]);

  const viewSpan = viewEnd - viewStart;
  const snapStep = viewSpan <= 500 ? 10 : viewSpan <= 2000 ? 25 : 50;
  const snap = (v: number) => Math.round(v / snapStep) * snapStep;

  const pxToMs = useCallback((dx: number): number => {
    const w = containerRef.current?.offsetWidth ?? 1;
    return (dx / w) * viewSpan;
  }, [viewSpan]);

  const msToPercent = useCallback((ms: number): number => {
    return ((ms - viewStart) / viewSpan) * 100;
  }, [viewStart, viewSpan]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const ratio = (e.clientX - rect.left) / rect.width;
    const cursorMs = viewStart + ratio * viewSpan;
    const factor = e.deltaY > 0 ? 1.15 : 1 / 1.15;
    const newSpan = Math.min(MAX_VIEW_SPAN, Math.max(MIN_VIEW_SPAN, viewSpan * factor));
    let s = cursorMs - ratio * newSpan;
    let end = s + newSpan;
    if (s < 0) { end -= s; s = 0; }
    setViewStart(s);
    setViewEnd(end);
  }, [viewStart, viewSpan]);

  const handlePanDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 1) return;
    e.preventDefault();
    panRef.current = { startX: e.clientX, origStart: viewStart, origEnd: viewEnd };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [viewStart, viewEnd]);

  const handlePanMove = useCallback((e: React.PointerEvent) => {
    if (!panRef.current) return;
    const dx = pxToMs(panRef.current.startX - e.clientX);
    let s = panRef.current.origStart + dx;
    let end = panRef.current.origEnd + dx;
    if (s < 0) { end -= s; s = 0; }
    setViewStart(s);
    setViewEnd(end);
  }, [pxToMs]);

  const handlePanUp = useCallback(() => { panRef.current = null; }, []);

  const fitAll = () => { setViewStart(0); setViewEnd(Math.max(displayDuration, 500)); };

  // Time axis marks
  const marks: number[] = [];
  const markStep = viewSpan <= 300 ? 50 : viewSpan <= 800 ? 100 : viewSpan <= 2000 ? 250 : 500;
  const firstMark = Math.ceil(viewStart / markStep) * markStep;
  for (let t = firstMark; t <= viewEnd; t += markStep) marks.push(t);

  // Cycle boundary lines
  const cycleBoundaries: number[] = [];
  if (lt !== 'none' && totalDuration > 0) {
    for (let i = 1; i < visibleLoops; i++) {
      cycleBoundaries.push(totalDuration * i);
    }
  }

  if (tracks.length === 0) {
    return (
      <div className="py-2 text-center text-[10px] text-muted-foreground">トラックなし</div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ display: 'flex', flexDirection: 'column', gap: 2, userSelect: 'none' }}
      onWheel={handleWheel}
      onPointerDown={handlePanDown}
      onPointerMove={handlePanMove}
      onPointerUp={handlePanUp}
    >
      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 9, color: 'var(--muted-foreground)' }}>
          {Math.round(viewStart)}–{Math.round(viewEnd)}ms
        </span>
        <button type="button" onClick={fitAll}
          style={{ fontSize: 9, padding: '0 4px', borderRadius: 2, border: '1px solid var(--border)', background: 'var(--muted)', cursor: 'pointer', color: 'var(--foreground)', lineHeight: '14px' }}>
          <Maximize2 style={{ width: 8, height: 8, display: 'inline' }} />
        </button>
      </div>

      {/* Time axis */}
      <div style={{ position: 'relative', height: 14, borderBottom: '1px solid var(--border)' }}>
        {marks.map((t) => {
          const pct = msToPercent(t);
          if (pct < -5 || pct > 105) return null;
          return (
            <span key={t} style={{
              position: 'absolute', left: `${pct}%`, transform: 'translateX(-50%)',
              fontSize: 9, color: 'var(--muted-foreground)',
            }}>
              {t}
            </span>
          );
        })}
        {/* Cycle boundary markers on time axis */}
        {cycleBoundaries.map((t) => {
          const pct = msToPercent(t);
          if (pct < -2 || pct > 102) return null;
          return (
            <div key={`cb-${t}`} style={{
              position: 'absolute', left: `${pct}%`, top: 0, bottom: 0,
              width: 1, background: 'var(--muted-foreground)', opacity: 0.3,
            }} />
          );
        })}
      </div>

      {/* Bands */}
      {tracks.map((track, i) => (
        <BandRow
          key={i}
          track={track}
          trackIndex={i}
          color={BAND_COLORS[i % BAND_COLORS.length]!}
          selected={i === selectedTrackIdx}
          snap={snap}
          msToPercent={msToPercent}
          pxToMs={pxToMs}
          cycleDuration={totalDuration}
          loopType={lt}
          visibleLoops={visibleLoops}
          cycleBoundaries={cycleBoundaries}
          onSelect={() => onSelectTrack(i)}
          onUpdate={(patch) => onUpdateTrack(i, patch)}
          onDragStateChange={setIsDraggingBand}
        />
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────
// BandRow — primary band + ghost loop repetitions
// ──────────────────────────────────────────────

interface BandRowProps {
  track: TweenTrack;
  trackIndex: number;
  color: string;
  selected: boolean;
  snap: (v: number) => number;
  msToPercent: (ms: number) => number;
  pxToMs: (dx: number) => number;
  cycleDuration: number;
  loopType: LoopType;
  visibleLoops: number;
  cycleBoundaries: number[];
  onSelect: () => void;
  onUpdate: (patch: Partial<TweenTrack>) => void;
  onDragStateChange: (dragging: boolean) => void;
}

function BandRow({
  track, color, selected, snap, msToPercent, pxToMs,
  cycleDuration, loopType, visibleLoops, cycleBoundaries,
  onSelect, onUpdate, onDragStateChange,
}: BandRowProps) {
  const ghostLoops = loopType !== 'none' && cycleDuration > 0 ? visibleLoops - 1 : 0;

  return (
    <div style={{ position: 'relative', height: 22, borderRadius: 3, background: 'var(--muted)', overflow: 'hidden' }}
      onClick={onSelect}>
      {/* Cycle boundary dividers */}
      {cycleBoundaries.map((t) => {
        const pct = msToPercent(t);
        return (
          <div key={`div-${t}`} style={{
            position: 'absolute', left: `${pct}%`, top: 0, bottom: 0,
            width: 1, background: 'var(--foreground)', opacity: 0.1, zIndex: 0,
          }} />
        );
      })}

      {/* Ghost loop repetitions (inset, semi-transparent) */}
      {ghostLoops > 0 && Array.from({ length: ghostLoops }, (_, loopIdx) => {
        const offset = cycleDuration * (loopIdx + 1);
        const isPingpongReverse = loopType === 'pingpong' && (loopIdx + 1) % 2 !== 0;
        let ghostStart: number;
        let ghostEnd: number;
        if (isPingpongReverse) {
          ghostStart = offset + (cycleDuration - track.startTime - track.duration);
          ghostEnd = offset + (cycleDuration - track.startTime);
        } else {
          ghostStart = offset + track.startTime;
          ghostEnd = offset + track.startTime + track.duration;
        }
        const leftPct = msToPercent(ghostStart);
        const widthPct = msToPercent(ghostEnd) - leftPct;
        if (widthPct <= 0) return null;
        return (
          <div key={`ghost-${loopIdx}`} style={{
            position: 'absolute',
            top: 4, bottom: 4,
            left: `${leftPct}%`, width: `${Math.max(widthPct, 0.3)}%`,
            borderRadius: 2,
            background: color,
            opacity: 0.25,
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)',
            pointerEvents: 'none',
          }} />
        );
      })}

      {/* Primary (editable) band */}
      <DraggableBandInner
        track={track}
        color={color}
        selected={selected}
        snap={snap}
        msToPercent={msToPercent}
        pxToMs={pxToMs}
        onSelect={onSelect}
        onUpdate={onUpdate}
        onDragStateChange={onDragStateChange}
      />
    </div>
  );
}

// ──────────────────────────────────────────────
// DraggableBandInner (the interactive primary band)
// ──────────────────────────────────────────────

interface DraggableBandInnerProps {
  track: TweenTrack;
  color: string;
  selected: boolean;
  snap: (v: number) => number;
  msToPercent: (ms: number) => number;
  pxToMs: (dx: number) => number;
  onSelect: () => void;
  onUpdate: (patch: Partial<TweenTrack>) => void;
  onDragStateChange: (dragging: boolean) => void;
}

type DragMode = 'move' | 'resize-left' | 'resize-right';

function DraggableBandInner({ track, color, selected, snap, msToPercent, pxToMs, onSelect, onUpdate, onDragStateChange }: DraggableBandInnerProps) {
  const dragRef = useRef<{ mode: DragMode; startX: number; origStart: number; origDuration: number } | null>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent, mode: DragMode) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    onSelect();
    dragRef.current = { mode, startX: e.clientX, origStart: track.startTime, origDuration: track.duration };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    onDragStateChange(true);
  }, [track.startTime, track.duration, onSelect, onDragStateChange]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const { mode, startX, origStart, origDuration } = dragRef.current;
    const dx = pxToMs(e.clientX - startX);
    if (mode === 'move') {
      onUpdate({ startTime: snap(Math.max(0, origStart + dx)) });
    } else if (mode === 'resize-left') {
      const ns = snap(Math.max(0, Math.min(origStart + origDuration - 10, origStart + dx)));
      onUpdate({ startTime: ns, duration: Math.max(10, origDuration - (ns - origStart)) });
    } else {
      onUpdate({ duration: snap(Math.max(10, origDuration + dx)) });
    }
  }, [pxToMs, snap, onUpdate]);

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
    onDragStateChange(false);
  }, [onDragStateChange]);

  const leftPct = msToPercent(track.startTime);
  const widthPct = msToPercent(track.startTime + track.duration) - leftPct;
  const HANDLE_W = 5;

  return (
    <div
      style={{
        position: 'absolute', top: 2, bottom: 2,
        left: `${leftPct}%`, width: `${Math.max(widthPct, 0.5)}%`,
        borderRadius: 2, background: color,
        opacity: selected ? 1 : 0.7,
        outline: selected ? '1.5px solid var(--ring)' : 'none',
        outlineOffset: 1,
        display: 'flex', alignItems: 'center', overflow: 'hidden', cursor: 'grab',
        zIndex: 2,
      }}
      onPointerDown={(e) => handlePointerDown(e, 'move')}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: HANDLE_W, cursor: 'ew-resize', zIndex: 1 }}
        onPointerDown={(e) => handlePointerDown(e, 'resize-left')}
        onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} />
      <span style={{
        fontSize: 9, color: '#fff', fontWeight: 500,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        paddingLeft: HANDLE_W + 1, paddingRight: HANDLE_W + 1, pointerEvents: 'none',
      }}>
        {track.property.split('.').pop()}
      </span>
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: HANDLE_W, cursor: 'ew-resize', zIndex: 1 }}
        onPointerDown={(e) => handlePointerDown(e, 'resize-right')}
        onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} />
    </div>
  );
}
