'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragMoveEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import type { DraggableTreeProps, DropPosition, DropTarget } from './types';
import { flattenTree, isDescendant, resolveDropTarget } from './utils';
import { TreeNodeWrapper } from './TreeNodeWrapper';

const DEFAULT_INDENT_PX = 16;

export function DraggableTree({
  nodes,
  renderNode,
  onMove,
  onSelect,
  selectedIds = [],
  indentPx = DEFAULT_INDENT_PX,
}: DraggableTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const parents = new Set<string>();
    for (const n of nodes) {
      if (n.parentId) parents.add(n.parentId);
    }
    return parents;
  });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const flattened = useMemo(
    () => flattenTree(nodes, expandedIds),
    [nodes, expandedIds]
  );

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragMove = useCallback(
    (event: DragMoveEvent) => {
      const { over, activatorEvent, delta } = event;
      const currentActiveId = String(event.active.id);
      if (!over) {
        setDropTarget(null);
        return;
      }

      const nodeId = String(over.id);
      if (nodeId === currentActiveId || isDescendant(nodes, currentActiveId, nodeId)) {
        setDropTarget(null);
        return;
      }

      // Compute pointer Y from initial position + delta
      const startY = (activatorEvent as PointerEvent).clientY;
      const currentY = startY + delta.y;

      // Get droppable element rect
      const overRect = over.rect;
      const relY = (currentY - overRect.top) / overRect.height;

      const hasChildren = nodes.some((n) => n.parentId === nodeId);

      let position: DropPosition;
      if (hasChildren) {
        // Parent nodes: always drop inside (no sibling bars)
        position = 'inside';
      } else if (relY < 0.3) {
        position = 'before';
      } else if (relY > 0.7) {
        position = 'after';
      } else {
        position = 'inside';
      }

      setDropTarget({ nodeId, position });
    },
    [nodes]
  );

  const handleDragEnd = useCallback(
    (_event: DragEndEvent) => {
      if (dropTarget && activeId) {
        const { newParentId, index } = resolveDropTarget(
          nodes,
          dropTarget.nodeId,
          dropTarget.position
        );
        onMove(activeId, newParentId, index);

        if (dropTarget.position === 'inside') {
          setExpandedIds((prev) => new Set(prev).add(dropTarget.nodeId));
        }
      }

      setActiveId(null);
      setDropTarget(null);
    },
    [activeId, dropTarget, nodes, onMove]
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    setDropTarget(null);
  }, []);

  const handleSelect = useCallback(
    (id: string, e: React.MouseEvent) => {
      if (!onSelect) return;
      if (e.metaKey || e.ctrlKey) {
        const newIds = selectedIds.includes(id)
          ? selectedIds.filter((sid) => sid !== id)
          : [...selectedIds, id];
        onSelect(newIds);
      } else {
        onSelect([id]);
      }
    },
    [onSelect, selectedIds]
  );

  const activeNode = activeId ? nodes.find((n) => n.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="select-none">
        {flattened.map(({ node, depth }) => {
          const hasChildren = nodes.some((n) => n.parentId === node.id);
          return (
            <TreeNodeWrapper
              key={node.id}
              node={node}
              depth={depth}
              indentPx={indentPx}
              isSelected={selectedIds.includes(node.id)}
              isExpanded={expandedIds.has(node.id)}
              hasChildren={hasChildren}
              isDragSource={activeId === node.id}
              dropPosition={dropTarget?.nodeId === node.id ? dropTarget.position : null}
              onToggleExpand={handleToggleExpand}
              renderNode={renderNode}
              onSelect={handleSelect}
            />
          );
        })}
      </div>

      <DragOverlay>
        {activeNode ? (
          <div className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm text-slate-700 shadow-lg ring-1 ring-slate-200">
            {renderNode(activeNode, 0)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
