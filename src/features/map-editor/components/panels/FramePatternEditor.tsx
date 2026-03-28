'use client';

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

// ── Drop Slot ──

function DropSlot({ id }: { id: string }) {
  const { isOver, setNodeRef } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`w-1 self-stretch rounded transition-all ${
        isOver ? 'w-4 bg-primary/30' : ''
      }`}
    />
  );
}

// ── Frame Pattern Editor ──

interface FramePatternEditorProps {
  pattern: number[];
  frameCount: number;
  onChange: (pattern: number[]) => void;
}

export function FramePatternEditor({ pattern, frameCount, onChange }: FramePatternEditorProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const fromIndex = parseInt((active.id as string).replace('chip-', ''), 10);
    const toIndex = parseInt((over.id as string).replace('slot-', ''), 10);

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
    <div className="space-y-2">
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
                    <DropSlot id={`slot-${i}`} />
                    <DraggableChip
                      id={`chip-${i}`}
                      frame={frame}
                      onRemove={() => handleRemove(i)}
                    />
                  </div>
                ))}
                <DropSlot id={`slot-${pattern.length}`} />
              </>
            )}
          </div>
        </DndContext>
      </div>

      {/* フレーム追加ボタン */}
      <div className="space-y-1">
        <div className="text-xs font-medium text-muted-foreground">追加</div>
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
