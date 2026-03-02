'use client';

import { useState, useCallback, useRef } from 'react';
import { DraggableTree } from '@/components/common/DraggableTree';
import type { TreeNode } from '@/components/common/DraggableTree';
import { Button } from '@/components/ui/button';

const INITIAL_NODES: TreeNode[] = [
  { id: 'root1', name: 'Window' },
  { id: 'child1', parentId: 'root1', name: 'Header' },
  { id: 'child2', parentId: 'root1', name: 'Body' },
  { id: 'gc1', parentId: 'child2', name: 'Label' },
  { id: 'gc2', parentId: 'child2', name: 'Button' },
  { id: 'root2', name: 'HUD' },
  { id: 'child3', parentId: 'root2', name: 'HP Bar' },
  { id: 'child4', parentId: 'root2', name: 'MP Bar' },
  { id: 'child5', parentId: 'root2', name: 'Status Icons' },
  { id: 'gc3', parentId: 'child5', name: 'Poison' },
  { id: 'gc4', parentId: 'child5', name: 'Sleep' },
  { id: 'root3', name: 'Dialog Box' },
];

interface LogEntry {
  time: string;
  message: string;
}

export default function DndTreeTestPage() {
  const [nodes, setNodes] = useState<TreeNode[]>(INITIAL_NODES);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((message: string) => {
    const now = new Date();
    const time = now.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    setLogs((prev) => [...prev, { time, message }]);
    // Scroll to bottom after state update
    setTimeout(() => {
      if (logContainerRef.current) {
        logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
      }
    }, 0);
  }, []);

  const handleMove = useCallback(
    (id: string, newParentId: string | undefined, index: number) => {
      // 1. Log it
      const movedName = nodes.find((n) => n.id === id)?.name as string;
      const parentName = newParentId
        ? ((nodes.find((n) => n.id === newParentId)?.name as string) ?? newParentId)
        : '(root)';
      addLog(`Move "${movedName}" -> parent="${parentName}", index=${index}`);

      // 2. Update state
      setNodes((prev) => {
        // Change parentId
        const updated = prev.map((n) =>
          n.id === id ? { ...n, parentId: newParentId } : n
        );

        // Reorder: remove moved node from siblings, re-insert at index
        const movedNode = updated.find((n) => n.id === id);
        if (!movedNode) return prev;

        const siblings = updated.filter(
          (n) => n.parentId === newParentId && n.id !== id
        );
        siblings.splice(index, 0, movedNode);

        // Rebuild: keep non-siblings as-is, replace siblings in order
        const siblingIds = new Set(siblings.map((n) => n.id));
        const result: TreeNode[] = [];
        let siblingsInserted = false;

        for (const n of updated) {
          if (siblingIds.has(n.id)) {
            if (!siblingsInserted) {
              result.push(...siblings);
              siblingsInserted = true;
            }
            // skip individual siblings (already batch-inserted)
          } else {
            result.push(n);
          }
        }
        if (!siblingsInserted) result.push(...siblings);

        return result;
      });
    },
    [nodes, addLog]
  );

  const handleReset = () => {
    setNodes(INITIAL_NODES);
    setSelectedIds([]);
    setLogs([]);
  };

  const nodesJson = nodes.map((n) => ({
    id: n.id,
    parentId: n.parentId ?? null,
    name: n.name,
  }));

  return (
    <div className="flex h-screen">
      {/* Left panel: DraggableTree */}
      <div className="w-80 shrink-0 border-r p-4">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-sm font-bold">DraggableTree Test</h1>
          <Button variant="outline" size="sm" onClick={handleReset}>
            Reset
          </Button>
        </div>
        <div className="rounded border p-2">
          <DraggableTree
            nodes={nodes}
            renderNode={(node) => <span>{node.name as string}</span>}
            onMove={handleMove}
            onSelect={setSelectedIds}
            selectedIds={selectedIds}
          />
        </div>
      </div>

      {/* Right panel: JSON + Logs */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top: Current nodes JSON */}
        <div className="flex-1 overflow-auto border-b p-4">
          <h2 className="mb-2 text-sm font-semibold">Current Nodes</h2>
          <pre className="overflow-auto rounded bg-muted p-3 text-xs">
            {JSON.stringify(nodesJson, null, 2)}
          </pre>
        </div>

        {/* Bottom: Move log */}
        <div className="flex h-64 shrink-0 flex-col p-4">
          <h2 className="mb-2 text-sm font-semibold">
            Move Log ({logs.length})
          </h2>
          <div
            ref={logContainerRef}
            className="flex-1 overflow-auto rounded bg-muted p-3"
          >
            {logs.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Drag nodes to see move operations logged here.
              </p>
            ) : (
              logs.map((entry, i) => (
                <div key={i} className="text-xs">
                  <span className="text-muted-foreground">[{entry.time}]</span>{' '}
                  {entry.message}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
