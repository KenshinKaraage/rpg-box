'use client';

import { useState, useEffect, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

// ── Draggable Chip ──

function DraggableChip({
  id,
  frame,
  onRemove,
}: {
  id: string;
  frame: number;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  const style: React.CSSProperties = {
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative flex items-center justify-center w-9 h-9 rounded border bg-muted text-sm font-mono cursor-grab active:cursor-grabbing select-none"
      {...attributes}
      {...listeners}
    >
      {frame}
      <button
        onPointerDown={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute -top-1.5 -right-1.5 hidden group-hover:flex items-center justify-center w-4 h-4 rounded-full bg-destructive text-white hover:bg-destructive/90"
        aria-label={`フレーム ${frame} を削除`}
      >
        <X className="h-2.5 w-2.5" />
      </button>
    </div>
  );
}

// ── Drop Zone ──

function DropSlot({ id, index }: { id: string; index: number }) {
  const { isOver, setNodeRef } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`w-1 self-stretch rounded transition-all ${
        isOver ? 'w-4 bg-primary/30' : ''
      }`}
      data-index={index}
    />
  );
}

// ── Frame Pattern Editor ──

interface FramePatternEditorProps {
  pattern: number[];
  frameCount: number;
  onChange: (pattern: number[]) => void;
}

function FramePatternEditor({ pattern, frameCount, onChange }: FramePatternEditorProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeIdStr = active.id as string;
    const overIdStr = over.id as string;

    // chip-N → ドラッグ元のindex
    const fromIndex = parseInt(activeIdStr.replace('chip-', ''), 10);
    // slot-N → ドロップ先のindex
    const toIndex = parseInt(overIdStr.replace('slot-', ''), 10);

    if (isNaN(fromIndex) || isNaN(toIndex)) return;
    if (fromIndex === toIndex || fromIndex === toIndex - 1) return;

    const newPattern = [...pattern];
    const [removed] = newPattern.splice(fromIndex, 1);
    const insertAt = toIndex > fromIndex ? toIndex - 1 : toIndex;
    newPattern.splice(insertAt, 0, removed!);
    onChange(newPattern);
  };

  const handleAdd = (frame: number) => {
    onChange([...pattern, frame]);
  };

  const handleRemove = (index: number) => {
    onChange(pattern.filter((_, i) => i !== index));
  };

  const availableFrames = Array.from({ length: frameCount }, (_, i) => i);

  return (
    <div className="space-y-3">
      {/* パターン表示（D&D 並べ替え） */}
      <div className="space-y-1">
        <div className="text-xs font-medium text-muted-foreground">再生順</div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="flex flex-wrap items-center gap-0 min-h-[36px] rounded border border-dashed p-2">
            {pattern.length === 0 ? (
              <span className="text-xs text-muted-foreground">
                線形ループ（0, 1, 2, ...）
              </span>
            ) : (
              <>
                {pattern.map((frame, i) => (
                  <div key={`group-${i}`} className="flex items-center">
                    <DropSlot id={`slot-${i}`} index={i} />
                    <DraggableChip
                      id={`chip-${i}`}
                      frame={frame}
                      onRemove={() => handleRemove(i)}
                    />
                  </div>
                ))}
                <DropSlot id={`slot-${pattern.length}`} index={pattern.length} />
              </>
            )}
          </div>
        </DndContext>
      </div>

      {/* フレーム追加ボタン */}
      <div className="space-y-1">
        <div className="text-xs font-medium text-muted-foreground">フレーム追加</div>
        <div className="flex flex-wrap gap-1">
          {availableFrames.map((frame) => (
            <Button
              key={frame}
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0 font-mono text-xs"
              onClick={() => handleAdd(frame)}
            >
              {frame}
            </Button>
          ))}
        </div>
      </div>

      {/* クリアボタン */}
      {pattern.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs text-muted-foreground"
          onClick={() => onChange([])}
        >
          クリア（線形ループに戻す）
        </Button>
      )}
    </div>
  );
}

// ── Animation Preview ──

function AnimationPreview({
  pattern,
  frameCount,
  intervalMs,
}: {
  pattern: number[];
  frameCount: number;
  intervalMs: number;
}) {
  const effectivePattern =
    pattern.length > 0 ? pattern : Array.from({ length: frameCount }, (_, i) => i);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (playing) {
      timerRef.current = setInterval(() => {
        setStep((prev) => (prev + 1) % effectivePattern.length);
      }, intervalMs);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing, intervalMs, effectivePattern.length]);

  // パターン変更時にリセット
  useEffect(() => {
    setStep(0);
  }, [pattern, frameCount]);

  const currentFrame = effectivePattern[step % effectivePattern.length] ?? 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">プレビュー</div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setPlaying(!playing);
            if (!playing) setStep(0);
          }}
        >
          {playing ? '停止' : '再生'}
        </Button>
      </div>

      {/* シーケンス表示 */}
      <div className="flex gap-1 flex-wrap">
        {effectivePattern.map((frame, i) => (
          <div
            key={i}
            className={`h-9 w-9 rounded border flex items-center justify-center font-mono text-sm transition-colors ${
              i === step % effectivePattern.length
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted/50 text-muted-foreground'
            }`}
          >
            {frame}
          </div>
        ))}
      </div>

      <div className="text-xs text-muted-foreground">
        現在のフレーム: <span className="font-mono font-bold">{currentFrame}</span>
        {' | '}パターン: [{effectivePattern.join(', ')}]
        {pattern.length === 0 && ' (線形ループ)'}
      </div>
    </div>
  );
}

// ── Test Page ──

export default function FramePatternTestPage() {
  const [frameCount, setFrameCount] = useState(3);
  const [pattern, setPattern] = useState<number[]>([0, 1, 0, 2]);
  const [intervalMs, setIntervalMs] = useState(200);

  const handleFrameCountChange = (count: number) => {
    const c = Math.max(1, Math.min(16, count));
    setFrameCount(c);
    setPattern((prev) => prev.filter((v) => v < c));
  };

  return (
    <div className="p-8 max-w-xl space-y-6">
      <h1 className="text-xl font-bold">フレームパターンエディタ</h1>

      {/* 設定 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">フレーム数</label>
          <input
            type="number"
            min={1}
            max={16}
            value={frameCount}
            onChange={(e) => handleFrameCountChange(parseInt(e.target.value) || 1)}
            className="w-full rounded border px-3 py-1.5 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">間隔 (ms)</label>
          <input
            type="number"
            min={50}
            step={50}
            value={intervalMs}
            onChange={(e) => setIntervalMs(parseInt(e.target.value) || 200)}
            className="w-full rounded border px-3 py-1.5 text-sm"
          />
        </div>
      </div>

      {/* エディタ */}
      <div className="rounded-lg border p-4">
        <FramePatternEditor
          pattern={pattern}
          frameCount={frameCount}
          onChange={setPattern}
        />
      </div>

      {/* プレビュー */}
      <div className="rounded-lg border p-4">
        <AnimationPreview
          pattern={pattern}
          frameCount={frameCount}
          intervalMs={intervalMs}
        />
      </div>
    </div>
  );
}
