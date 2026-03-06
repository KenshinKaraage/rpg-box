'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { RotateCcw, Plus, Copy, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { NamedAnimation, TweenTrack } from '@/types/ui/components/AnimationComponent';
import { computeTimelineDuration } from '@/types/ui/components/AnimationComponent';
import type { AnimatablePropertyDef } from '@/types/ui/UIComponent';
import { getRectTransformAnimatablePropertyDefs } from '@/types/ui/UIComponent';
import { getUIComponent } from '@/types/ui';
import { getEasingNames } from '@/engine/tween/easings';
import '@/types/ui/register';

// ──────────────────────────────────────────────
// Component / Property definitions
// ──────────────────────────────────────────────

interface CompDef {
  type: string;
  label: string;
  props: AnimatablePropertyDef[];
}

/** Build component defs from the registry (test page has no store, so we hardcode the set of available components) */
function buildCompDefs(): CompDef[] {
  const defs: CompDef[] = [
    { type: 'transform', label: 'Transform', props: getRectTransformAnimatablePropertyDefs() },
  ];
  const compTypes = ['image', 'text', 'shape', 'fillMask', 'colorMask'];
  for (const t of compTypes) {
    const Ctor = getUIComponent(t);
    if (!Ctor) continue;
    const inst = new Ctor();
    const props = inst.getAnimatablePropertyDefs();
    if (props.length > 0) {
      defs.push({ type: t, label: inst.label, props });
    }
  }
  return defs;
}

const COMP_DEFS = buildCompDefs();
const EASING_NAMES = getEasingNames();

function getCompDef(type: string): CompDef | undefined {
  return COMP_DEFS.find((d) => d.type === type);
}

// ──────────────────────────────────────────────
// Sample data
// ──────────────────────────────────────────────

const INITIAL_ANIMATIONS: NamedAnimation[] = [
  {
    name: 'fadeIn',
    timeline: {
      tracks: [
        { property: 'image.opacity', startTime: 0, duration: 500, from: 0, to: 1, easing: 'easeOut' },
      ],
    },
  },
  {
    name: 'slideAndFade',
    timeline: {
      tracks: [
        { property: 'transform.x', startTime: 0, duration: 500, from: 0, to: 100, easing: 'easeOut' },
        { property: 'image.opacity', startTime: 300, duration: 300, from: 1, to: 0, easing: 'easeIn' },
      ],
    },
  },
  {
    name: 'complex',
    timeline: {
      tracks: [
        { property: 'transform.x', startTime: 0, duration: 500, from: 0, to: 100, easing: 'easeOut' },
        { property: 'transform.scaleX', startTime: 100, duration: 600, from: 1, to: 2, easing: 'easeInOut' },
        { property: 'image.tint', valueType: 'color', startTime: 200, duration: 400, from: 0, to: 0, fromColor: '#ffffff', toColor: '#ff0000', easing: 'linear' },
        { property: 'image.opacity', startTime: 500, duration: 200, from: 1, to: 0, easing: 'easeIn' },
      ],
    },
  },
];

// ──────────────────────────────────────────────
// Log
// ──────────────────────────────────────────────

interface LogEntry {
  time: string;
  action: string;
  detail: string;
}

// ──────────────────────────────────────────────
// Interactive Timeline Bands (zoom + pan)
// ──────────────────────────────────────────────

const BAND_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#f43f5e',
  '#8b5cf6', '#06b6d4', '#f97316', '#ec4899',
];

const MIN_VIEW_SPAN = 50; // minimum visible ms range

interface TimelineBandsProps {
  tracks: TweenTrack[];
  totalDuration: number;
  selectedTrackIdx: number | null;
  onSelectTrack: (idx: number) => void;
  onUpdateTrack: (idx: number, patch: Partial<TweenTrack>) => void;
}

function TimelineBands({ tracks, totalDuration, selectedTrackIdx, onSelectTrack, onUpdateTrack }: TimelineBandsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // View range: independent of totalDuration so dragging doesn't cause jitter
  const [viewStart, setViewStart] = useState(0);
  const [viewEnd, setViewEnd] = useState(() => Math.max(totalDuration, 500));
  const [isDraggingBand, setIsDraggingBand] = useState(false);
  const panRef = useRef<{ startX: number; origViewStart: number; origViewEnd: number } | null>(null);

  // Auto-fit view when totalDuration grows (but NOT while dragging bands)
  const prevDurationRef = useRef(totalDuration);
  useEffect(() => {
    if (isDraggingBand) {
      prevDurationRef.current = totalDuration;
      return;
    }
    // Only expand, never shrink automatically (user controls zoom)
    if (totalDuration > viewEnd) {
      setViewEnd(totalDuration);
    }
    prevDurationRef.current = totalDuration;
  }, [totalDuration, isDraggingBand, viewEnd]);

  const viewSpan = viewEnd - viewStart;

  // Snap helper
  const snapStep = viewSpan <= 500 ? 10 : viewSpan <= 2000 ? 25 : 50;
  const snap = (v: number) => Math.round(v / snapStep) * snapStep;

  // px <-> ms conversion using view range
  const pxToMs = useCallback((dx: number): number => {
    const w = containerRef.current?.offsetWidth ?? 1;
    return (dx / w) * viewSpan;
  }, [viewSpan]);

  const msToPercent = useCallback((ms: number): number => {
    return ((ms - viewStart) / viewSpan) * 100;
  }, [viewStart, viewSpan]);

  // Wheel zoom (centered on cursor)
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cursorRatio = (e.clientX - rect.left) / rect.width;
    const cursorMs = viewStart + cursorRatio * viewSpan;

    const zoomFactor = e.deltaY > 0 ? 1.15 : 1 / 1.15;
    const newSpan = Math.max(MIN_VIEW_SPAN, viewSpan * zoomFactor);
    let newStart = cursorMs - cursorRatio * newSpan;
    let newEnd = newStart + newSpan;
    // Clamp: don't go below 0
    if (newStart < 0) { newEnd -= newStart; newStart = 0; }
    setViewStart(newStart);
    setViewEnd(newEnd);
  }, [viewStart, viewSpan]);

  // Middle-button pan
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 1) return; // middle button only
    e.preventDefault();
    panRef.current = { startX: e.clientX, origViewStart: viewStart, origViewEnd: viewEnd };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [viewStart, viewEnd]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!panRef.current) return;
    const dx = pxToMs(panRef.current.startX - e.clientX); // drag right = view moves right
    let newStart = panRef.current.origViewStart + dx;
    let newEnd = panRef.current.origViewEnd + dx;
    if (newStart < 0) { newEnd -= newStart; newStart = 0; }
    setViewStart(newStart);
    setViewEnd(newEnd);
  }, [pxToMs]);

  const handlePointerUp = useCallback(() => {
    panRef.current = null;
  }, []);

  // Fit-all button
  const fitAll = () => {
    setViewStart(0);
    setViewEnd(Math.max(totalDuration, 500));
  };

  // Time axis marks
  const marks: number[] = [];
  const markStep = viewSpan <= 300 ? 50 : viewSpan <= 800 ? 100 : viewSpan <= 2000 ? 250 : 500;
  const firstMark = Math.ceil(viewStart / markStep) * markStep;
  for (let t = firstMark; t <= viewEnd; t += markStep) marks.push(t);

  if (tracks.length === 0) {
    return <div style={{ padding: '12px 0', fontSize: 12, color: 'var(--muted-foreground)' }}>No tracks</div>;
  }

  return (
    <div
      ref={containerRef}
      style={{ display: 'flex', flexDirection: 'column', gap: 3, userSelect: 'none', position: 'relative' }}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
        <span style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>
          {Math.round(viewStart)}ms – {Math.round(viewEnd)}ms
        </span>
        <button
          type="button"
          onClick={fitAll}
          style={{
            fontSize: 10, padding: '1px 6px', borderRadius: 3,
            border: '1px solid var(--border)', background: 'var(--muted)', cursor: 'pointer',
            color: 'var(--foreground)',
          }}
        >
          Fit
        </button>
        <span style={{ fontSize: 9, color: 'var(--muted-foreground)', marginLeft: 'auto' }}>
          Wheel: zoom | Middle-drag: pan
        </span>
      </div>

      {/* Time axis */}
      <div style={{ position: 'relative', height: 18, borderBottom: '1px solid var(--border)', marginBottom: 2 }}>
        {marks.map((t) => {
          const pct = msToPercent(t);
          if (pct < -5 || pct > 105) return null;
          return (
            <span
              key={t}
              style={{
                position: 'absolute',
                left: `${pct}%`,
                transform: 'translateX(-50%)',
                fontSize: 10,
                color: 'var(--muted-foreground)',
              }}
            >
              {t}
            </span>
          );
        })}
      </div>

      {/* Track bands */}
      {tracks.map((track, i) => (
        <DraggableBand
          key={i}
          track={track}
          color={BAND_COLORS[i % BAND_COLORS.length]!}
          selected={i === selectedTrackIdx}
          snap={snap}
          msToPercent={msToPercent}
          pxToMs={pxToMs}
          onSelect={() => onSelectTrack(i)}
          onUpdate={(patch) => onUpdateTrack(i, patch)}
          onDragStateChange={setIsDraggingBand}
        />
      ))}
    </div>
  );
}

// ── Single draggable band ──

interface DraggableBandProps {
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

function DraggableBand({ track, color, selected, snap, msToPercent, pxToMs, onSelect, onUpdate, onDragStateChange }: DraggableBandProps) {
  const dragRef = useRef<{ mode: DragMode; startX: number; origStart: number; origDuration: number } | null>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent, mode: DragMode) => {
    if (e.button !== 0) return; // left button only
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
      const newStart = snap(Math.max(0, origStart + dx));
      onUpdate({ startTime: newStart });
    } else if (mode === 'resize-left') {
      const newStart = snap(Math.max(0, Math.min(origStart + origDuration - 10, origStart + dx)));
      const newDuration = origDuration - (newStart - origStart);
      onUpdate({ startTime: newStart, duration: Math.max(10, newDuration) });
    } else if (mode === 'resize-right') {
      const newDuration = snap(Math.max(10, origDuration + dx));
      onUpdate({ duration: newDuration });
    }
  }, [pxToMs, snap, onUpdate]);

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
    onDragStateChange(false);
  }, [onDragStateChange]);

  const leftPct = msToPercent(track.startTime);
  const rightPct = msToPercent(track.startTime + track.duration);
  const widthPct = rightPct - leftPct;
  const label = track.property;

  const HANDLE_W = 6;

  return (
    <div
      style={{
        position: 'relative',
        height: 28,
        borderRadius: 4,
        background: 'var(--muted)',
        cursor: 'default',
        overflow: 'hidden',
      }}
      onClick={onSelect}
    >
      {/* Bar body */}
      <div
        style={{
          position: 'absolute',
          top: 2,
          bottom: 2,
          left: `${leftPct}%`,
          width: `${Math.max(widthPct, 0.5)}%`,
          borderRadius: 3,
          background: color,
          opacity: selected ? 1 : 0.75,
          outline: selected ? '2px solid var(--ring)' : 'none',
          outlineOffset: 1,
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          cursor: 'grab',
        }}
        onPointerDown={(e) => handlePointerDown(e, 'move')}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Left resize handle */}
        <div
          style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: HANDLE_W,
            cursor: 'ew-resize', zIndex: 1,
          }}
          onPointerDown={(e) => handlePointerDown(e, 'resize-left')}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />
        {/* Label */}
        <span style={{
          fontSize: 11, color: '#fff', fontWeight: 500,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          paddingLeft: HANDLE_W + 2, paddingRight: HANDLE_W + 2,
          pointerEvents: 'none',
        }}>
          {label}
        </span>
        {/* Right resize handle */}
        <div
          style={{
            position: 'absolute', right: 0, top: 0, bottom: 0, width: HANDLE_W,
            cursor: 'ew-resize', zIndex: 1,
          }}
          onPointerDown={(e) => handlePointerDown(e, 'resize-right')}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Page
// ──────────────────────────────────────────────

export default function AnimationEditorTestPage() {
  const [animations, setAnimations] = useState<NamedAnimation[]>(structuredClone(INITIAL_ANIMATIONS));
  const [selectedAnimIdx, setSelectedAnimIdx] = useState(0);
  const [selectedTrackIdx, setSelectedTrackIdx] = useState<number | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((action: string, detail: string) => {
    const time = new Date().toLocaleTimeString('ja-JP', { hour12: false });
    setLogs((prev) => [...prev.slice(-49), { time, action, detail }]);
    setTimeout(() => logRef.current?.scrollTo(0, logRef.current.scrollHeight), 0);
  }, []);

  const currentAnim = animations[selectedAnimIdx];
  const currentTrack = selectedTrackIdx !== null ? currentAnim?.timeline.tracks[selectedTrackIdx] : null;
  const totalDuration = currentAnim ? computeTimelineDuration(currentAnim.timeline.tracks) : 0;

  // ── Animation operations ──

  const addAnimation = () => {
    const name = `anim${animations.length + 1}`;
    const newAnim: NamedAnimation = { name, timeline: { tracks: [] } };
    setAnimations((prev) => [...prev, newAnim]);
    setSelectedAnimIdx(animations.length);
    setSelectedTrackIdx(null);
    addLog('ADD_ANIM', `name="${name}"`);
  };

  const deleteAnimation = (idx: number) => {
    const name = animations[idx]?.name;
    setAnimations((prev) => prev.filter((_, i) => i !== idx));
    if (selectedAnimIdx >= idx && selectedAnimIdx > 0) setSelectedAnimIdx((i) => i - 1);
    setSelectedTrackIdx(null);
    addLog('DEL_ANIM', `idx=${idx} name="${name}"`);
  };

  const duplicateAnimation = (idx: number) => {
    const source = animations[idx];
    if (!source) return;
    const copy: NamedAnimation = { name: `${source.name}_copy`, timeline: structuredClone(source.timeline) };
    setAnimations((prev) => [...prev.slice(0, idx + 1), copy, ...prev.slice(idx + 1)]);
    setSelectedAnimIdx(idx + 1);
    addLog('DUP_ANIM', `"${source.name}" -> "${copy.name}"`);
  };

  const updateAnimName = (idx: number, name: string) => {
    setAnimations((prev) => prev.map((a, i) => (i === idx ? { ...a, name } : a)));
  };

  // ── Track operations ──

  const addTrack = () => {
    if (!currentAnim) return;
    const newTrack: TweenTrack = {
      property: 'transform.x', startTime: 0, duration: 500, from: 0, to: 100, easing: 'easeOut',
    };
    setAnimations((prev) =>
      prev.map((a, i) =>
        i === selectedAnimIdx
          ? { ...a, timeline: { ...a.timeline, tracks: [...a.timeline.tracks, newTrack] } }
          : a
      )
    );
    setSelectedTrackIdx(currentAnim.timeline.tracks.length);
    addLog('ADD_TRACK', 'transform.x');
  };

  const deleteTrack = (trackIdx: number) => {
    if (!currentAnim) return;
    const prop = currentAnim.timeline.tracks[trackIdx]?.property;
    setAnimations((prev) =>
      prev.map((a, i) =>
        i === selectedAnimIdx
          ? { ...a, timeline: { ...a.timeline, tracks: a.timeline.tracks.filter((_, j) => j !== trackIdx) } }
          : a
      )
    );
    if (selectedTrackIdx === trackIdx) setSelectedTrackIdx(null);
    else if (selectedTrackIdx !== null && selectedTrackIdx > trackIdx) setSelectedTrackIdx((p) => p! - 1);
    addLog('DEL_TRACK', `${prop}`);
  };

  const updateTrack = (trackIdx: number, patch: Partial<TweenTrack>) => {
    if (!currentAnim) return;
    setAnimations((prev) =>
      prev.map((a, i) =>
        i === selectedAnimIdx
          ? { ...a, timeline: { ...a.timeline, tracks: a.timeline.tracks.map((t, j) => (j === trackIdx ? { ...t, ...patch } : t)) } }
          : a
      )
    );
  };

  const resetAll = () => {
    setAnimations(structuredClone(INITIAL_ANIMATIONS));
    setSelectedAnimIdx(0);
    setSelectedTrackIdx(null);
    addLog('RESET', 'all');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Left: Animation list */}
      <aside className="w-56 shrink-0 border-r flex flex-col">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <h2 className="text-sm font-semibold">Animations</h2>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={resetAll} aria-label="Reset">
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={addAnimation} aria-label="Add">
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-1 space-y-0.5">
          {animations.map((anim, idx) => {
            const dur = computeTimelineDuration(anim.timeline.tracks);
            return (
              <div
                key={idx}
                className={`group flex items-center gap-1 rounded px-2 py-1 cursor-pointer text-xs ${
                  idx === selectedAnimIdx ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
                }`}
                onClick={() => { setSelectedAnimIdx(idx); setSelectedTrackIdx(null); }}
              >
                <span className="flex-1 truncate">{anim.name}</span>
                <span className="text-[10px] text-muted-foreground">{anim.timeline.tracks.length}tr {dur}ms</span>
                <Button size="sm" variant="ghost" className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                  onClick={(e) => { e.stopPropagation(); duplicateAnimation(idx); }} aria-label="Duplicate">
                  <Copy className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="ghost" className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                  onClick={(e) => { e.stopPropagation(); deleteAnimation(idx); }} aria-label="Delete">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            );
          })}
        </div>
      </aside>

      {/* Center */}
      <main className="flex-1 flex flex-col min-w-0">
        {currentAnim ? (
          <>
            {/* Header */}
            <div className="flex items-center gap-2 border-b px-4 py-2">
              <Label className="text-xs text-muted-foreground">Name</Label>
              <Input className="h-7 w-48 text-xs" value={currentAnim.name}
                onChange={(e) => updateAnimName(selectedAnimIdx, e.target.value)} />
              <span className="text-xs text-muted-foreground ml-auto">
                {currentAnim.timeline.tracks.length} tracks | {totalDuration}ms
              </span>
            </div>

            {/* Timeline */}
            <div className="border-b px-4 py-2">
              <div className="flex items-center justify-between mb-1">
                <Label className="text-[10px] text-muted-foreground">Timeline</Label>
                <Button size="sm" variant="outline" className="h-5 px-2 text-[10px]" onClick={addTrack}>
                  <Plus className="h-3 w-3 mr-0.5" /> Track
                </Button>
              </div>
              <div className="rounded border bg-muted/20 p-2">
                <TimelineBands
                  tracks={currentAnim.timeline.tracks}
                  totalDuration={totalDuration}
                  selectedTrackIdx={selectedTrackIdx}
                  onSelectTrack={setSelectedTrackIdx}
                  onUpdateTrack={updateTrack}
                />
              </div>
            </div>

            {/* Track detail */}
            <div className="flex-1 overflow-auto p-4">
              {currentTrack && selectedTrackIdx !== null ? (
                <TrackDetail
                  track={currentTrack}
                  trackIdx={selectedTrackIdx}
                  onChange={(patch) => updateTrack(selectedTrackIdx, patch)}
                  onDelete={() => deleteTrack(selectedTrackIdx)}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Select a track in the timeline above
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No animation selected
          </div>
        )}
      </main>

      {/* Right: Log + JSON */}
      <aside className="w-64 shrink-0 border-l flex flex-col">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <h2 className="text-sm font-semibold">Log</h2>
          <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => setLogs([])}>Clear</Button>
        </div>
        <div ref={logRef} className="flex-1 overflow-auto p-2 space-y-0.5 font-mono text-[10px]">
          {logs.map((log, i) => (
            <div key={i} className="flex gap-1">
              <span className="text-muted-foreground shrink-0">{log.time}</span>
              <span className="text-blue-500 shrink-0 font-semibold">{log.action}</span>
              <span className="text-foreground/80 break-all">{log.detail}</span>
            </div>
          ))}
          {logs.length === 0 && <div className="text-muted-foreground text-center py-4">No logs</div>}
        </div>
        <div className="border-t p-2">
          <Label className="text-[10px] text-muted-foreground">JSON</Label>
          <pre className="mt-1 max-h-48 overflow-auto rounded bg-muted/40 p-2 text-[9px] leading-tight">
            {JSON.stringify(animations, null, 2)}
          </pre>
        </div>
      </aside>
    </div>
  );
}

// ──────────────────────────────────────────────
// Track detail editor (component → property dropdowns, easing dropdown)
// ──────────────────────────────────────────────

function TrackDetail({
  track,
  trackIdx,
  onChange,
  onDelete,
}: {
  track: TweenTrack;
  trackIdx: number;
  onChange: (patch: Partial<TweenTrack>) => void;
  onDelete: () => void;
}) {
  // Parse component.property
  const dotIdx = track.property.indexOf('.');
  const currentComp = dotIdx > 0 ? track.property.slice(0, dotIdx) : 'transform';
  const currentPropKey = dotIdx > 0 ? track.property.slice(dotIdx + 1) : track.property;

  const compDef = getCompDef(currentComp);
  const propDefs = compDef?.props ?? [];
  const propDef = propDefs.find((p) => p.key === currentPropKey);
  const isColor = track.valueType === 'color' || propDef?.valueType === 'color';

  const handleCompChange = (newComp: string) => {
    const def = getCompDef(newComp);
    if (!def || def.props.length === 0) return;
    const firstProp = def.props[0]!;
    const newPath = `${newComp}.${firstProp.key}`;
    if (firstProp.valueType === 'color') {
      onChange({ property: newPath, valueType: 'color', fromColor: '#000000', toColor: '#ffffff' });
    } else {
      onChange({ property: newPath, valueType: undefined });
    }
  };

  const handlePropChange = (newKey: string) => {
    const newPath = `${currentComp}.${newKey}`;
    const newDef = propDefs.find((p) => p.key === newKey);
    if (newDef?.valueType === 'color') {
      onChange({ property: newPath, valueType: 'color', fromColor: track.fromColor ?? '#000000', toColor: track.toColor ?? '#ffffff' });
    } else {
      onChange({ property: newPath, valueType: undefined });
    }
  };

  return (
    <div className="max-w-lg space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          Track #{trackIdx}
        </h3>
        <Button size="sm" variant="ghost" className="h-6 text-xs text-destructive" onClick={onDelete}>
          <Trash2 className="h-3 w-3 mr-1" /> Delete
        </Button>
      </div>

      {/* Component → Property */}
      <div className="flex gap-3">
        <Field label="Component" className="flex-1">
          <Select value={currentComp} onValueChange={handleCompChange}>
            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {COMP_DEFS.map((d) => (
                <SelectItem key={d.type} value={d.type}>{d.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Property" className="flex-1">
          <Select value={currentPropKey} onValueChange={handlePropChange}>
            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {propDefs.map((p) => (
                <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      {/* Timing */}
      <div className="flex gap-3">
        <Field label="Start (ms)" className="flex-1">
          <Input type="number" className="h-7 text-xs" value={track.startTime} min={0} step={50}
            onChange={(e) => { const v = parseInt(e.target.value); if (!isNaN(v) && v >= 0) onChange({ startTime: v }); }} />
        </Field>
        <Field label="Duration (ms)" className="flex-1">
          <Input type="number" className="h-7 text-xs" value={track.duration} min={1} step={50}
            onChange={(e) => { const v = parseInt(e.target.value); if (!isNaN(v) && v > 0) onChange({ duration: v }); }} />
        </Field>
      </div>

      {/* Values */}
      {isColor ? (
        <div className="flex gap-3">
          <Field label="From Color" className="flex-1">
            <div className="flex items-center gap-2">
              <input type="color" className="h-7 w-10 cursor-pointer rounded border"
                value={track.fromColor ?? '#000000'} onChange={(e) => onChange({ fromColor: e.target.value })} />
              <Input className="h-7 flex-1 text-xs" value={track.fromColor ?? '#000000'}
                onChange={(e) => onChange({ fromColor: e.target.value })} />
            </div>
          </Field>
          <Field label="To Color" className="flex-1">
            <div className="flex items-center gap-2">
              <input type="color" className="h-7 w-10 cursor-pointer rounded border"
                value={track.toColor ?? '#ffffff'} onChange={(e) => onChange({ toColor: e.target.value })} />
              <Input className="h-7 flex-1 text-xs" value={track.toColor ?? '#ffffff'}
                onChange={(e) => onChange({ toColor: e.target.value })} />
            </div>
          </Field>
        </div>
      ) : (
        <div className="flex gap-3">
          <Field label="From" className="flex-1">
            <Input type="number" className="h-7 text-xs" value={track.from}
              onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) onChange({ from: v }); }} />
          </Field>
          <Field label="To" className="flex-1">
            <Input type="number" className="h-7 text-xs" value={track.to}
              onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) onChange({ to: v }); }} />
          </Field>
        </div>
      )}

      {/* Easing */}
      <Field label="Easing">
        <Select value={track.easing} onValueChange={(v) => onChange({ easing: v })}>
          <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {EASING_NAMES.map((name) => (
              <SelectItem key={name} value={name}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label className="text-[10px] text-muted-foreground mb-1 block">{label}</Label>
      {children}
    </div>
  );
}
