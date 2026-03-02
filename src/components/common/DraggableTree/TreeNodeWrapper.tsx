'use client';

import { useRef, useCallback } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import type { TreeNode, DropPosition } from './types';
import { DropIndicator } from './DropIndicator';

interface TreeNodeWrapperProps {
  node: TreeNode;
  depth: number;
  indentPx: number;
  isSelected: boolean;
  isExpanded: boolean;
  hasChildren: boolean;
  isDragSource: boolean;
  dropPosition: DropPosition | null;
  onToggleExpand: (id: string) => void;
  onPointerZone: (nodeId: string, position: DropPosition | null) => void;
  renderNode: (node: TreeNode, depth: number) => React.ReactNode;
  onSelect?: (id: string, e: React.MouseEvent) => void;
}

export function TreeNodeWrapper({
  node,
  depth,
  indentPx,
  isSelected,
  isDragSource,
  dropPosition,
  onPointerZone,
  renderNode,
  onSelect,
}: TreeNodeWrapperProps) {
  const nodeRef = useRef<HTMLDivElement | null>(null);

  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id: node.id,
    data: { node },
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: node.id,
    data: { node },
  });

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!nodeRef.current) return;
      const rect = nodeRef.current.getBoundingClientRect();
      const relY = (e.clientY - rect.top) / rect.height;
      let position: DropPosition;
      if (relY < 0.25) {
        position = 'before';
      } else if (relY > 0.75) {
        position = 'after';
      } else {
        position = 'inside';
      }
      onPointerZone(node.id, position);
    },
    [node.id, onPointerZone]
  );

  const handlePointerLeave = useCallback(() => {
    onPointerZone(node.id, null);
  }, [node.id, onPointerZone]);

  const setRefs = useCallback(
    (el: HTMLDivElement | null) => {
      nodeRef.current = el;
      setDragRef(el);
      setDropRef(el);
    },
    [setDragRef, setDropRef]
  );

  return (
    <div
      ref={setRefs}
      className="relative"
      style={{
        paddingLeft: `${depth * indentPx}px`,
        opacity: isDragging ? 0.3 : 1,
      }}
      onPointerMove={isOver ? handlePointerMove : undefined}
      onPointerLeave={isOver ? handlePointerLeave : undefined}
      onClick={(e) => onSelect?.(node.id, e)}
      {...attributes}
      {...listeners}
    >
      <div
        className={[
          'flex cursor-grab items-center gap-1 rounded px-2 py-1 text-sm',
          isSelected ? 'bg-accent font-medium' : 'hover:bg-accent/50',
          dropPosition === 'inside' ? 'ring-2 ring-blue-500' : '',
          isDragSource ? 'opacity-30' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {renderNode(node, depth)}
      </div>
      {dropPosition && dropPosition !== 'inside' && (
        <DropIndicator position={dropPosition} depth={depth} indentPx={indentPx} />
      )}
    </div>
  );
}
