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
        opacity: isDragSource ? 0.25 : 1,
        transition: 'opacity 150ms ease',
      }}
      onClick={(e) => onSelect?.(node.id, e)}
      {...attributes}
      {...listeners}
    >
      <div
        className={[
          'flex cursor-grab items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm transition-colors',
          isSelected
            ? 'bg-blue-50 font-medium text-blue-700'
            : 'text-slate-700 hover:bg-slate-100',
          dropPosition === 'inside'
            ? 'ring-2 ring-blue-400 bg-blue-50'
            : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {/* Expand/collapse toggle */}
        <button
          type="button"
          className="flex h-4 w-4 shrink-0 items-center justify-center rounded transition-colors hover:bg-slate-200"
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) onToggleExpand(node.id);
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            )
          ) : (
            <span className="h-1 w-1 rounded-full bg-slate-200" />
          )}
        </button>
        {renderNode(node, depth)}
      </div>
      {dropPosition && dropPosition !== 'inside' && (
        <DropIndicator position={dropPosition} depth={depth} indentPx={indentPx} />
      )}
    </div>
  );
}
