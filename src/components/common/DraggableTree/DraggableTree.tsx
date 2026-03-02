'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
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

  const handlePointerZone = useCallback(
    (nodeId: string, position: DropPosition | null) => {
      if (!activeId) return;
      if (!position) {
        setDropTarget(null);
        return;
      }
      if (nodeId === activeId || isDescendant(nodes, activeId, nodeId)) {
        setDropTarget(null);
        return;
      }
      setDropTarget({ nodeId, position });
    },
    [activeId, nodes]
  );

  const handleDragEnd = useCallback(
    (_event: DragEndEvent) => {
      if (dropTarget) {
        const { newParentId, index } = resolveDropTarget(
          nodes,
          dropTarget.nodeId,
          dropTarget.position
        );
        onMove(String(activeId), newParentId, index);

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
      onDragStart={handleDragStart}
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
              onPointerZone={handlePointerZone}
              renderNode={renderNode}
              onSelect={handleSelect}
            />
          );
        })}
      </div>

      <DragOverlay>
        {activeNode ? (
          <div className="rounded bg-accent px-3 py-1 text-sm shadow-lg opacity-80">
            {renderNode(activeNode, 0)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
