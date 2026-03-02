'use client';

import { useRef, useCallback } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
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
  renderNode: (node: TreeNode, depth: number) => React.ReactNode;
  onSelect?: (id: string, e: React.MouseEvent) => void;
}

export function TreeNodeWrapper({
  node,
  depth,
  indentPx,
  isSelected,
  isExpanded,
  hasChildren,
  isDragSource,
  dropPosition,
  onToggleExpand,
  renderNode,
  onSelect,
}: TreeNodeWrapperProps) {
  const nodeRef = useRef<HTMLDivElement | null>(null);

  const { attributes, listeners, setNodeRef: setDragRef } = useDraggable({
    id: node.id,
    data: { node },
  });

  const { setNodeRef: setDropRef } = useDroppable({
    id: node.id,
    data: { node },
  });

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
        opacity: isDragSource ? 0.3 : 1,
      }}
      onClick={(e) => onSelect?.(node.id, e)}
      {...attributes}
      {...listeners}
    >
      <div
        className={[
          'flex cursor-grab items-center gap-1 rounded px-2 py-1 text-sm',
          isSelected ? 'bg-accent font-medium' : 'hover:bg-accent/50',
          dropPosition === 'inside' ? 'ring-2 ring-blue-500 bg-blue-500/10' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {/* Expand/collapse toggle */}
        <button
          type="button"
          className="h-4 w-4 shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) onToggleExpand(node.id);
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )
          ) : null}
        </button>
        {renderNode(node, depth)}
      </div>
      {dropPosition && dropPosition !== 'inside' && (
        <DropIndicator position={dropPosition} depth={depth} indentPx={indentPx} />
      )}
    </div>
  );
}
