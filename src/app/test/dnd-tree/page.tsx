'use client';

import { useState, useCallback, useRef } from 'react';
import {
  GripVertical,
  RotateCcw,
  Square,
  Layout,
  Layers,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';
import { DraggableTree } from '@/components/common/DraggableTree';
import type { TreeNode } from '@/components/common/DraggableTree';

// ──────────────────────────────────────────────
// Sample data
// ──────────────────────────────────────────────

const INITIAL_NODES: TreeNode[] = [
  { id: 'root1', name: 'Window', icon: 'layout' },
  { id: 'child1', parentId: 'root1', name: 'Header', icon: 'square' },
  { id: 'child2', parentId: 'root1', name: 'Body', icon: 'square' },
  { id: 'gc1', parentId: 'child2', name: 'Label', icon: 'square' },
  { id: 'gc2', parentId: 'child2', name: 'Button', icon: 'square' },
  { id: 'root2', name: 'HUD', icon: 'layers' },
  { id: 'child3', parentId: 'root2', name: 'HP Bar', icon: 'square' },
  { id: 'child4', parentId: 'root2', name: 'MP Bar', icon: 'square' },
  { id: 'child5', parentId: 'root2', name: 'Status Icons', icon: 'layers' },
  { id: 'gc3', parentId: 'child5', name: 'Poison', icon: 'square' },
  { id: 'gc4', parentId: 'child5', name: 'Sleep', icon: 'square' },
  { id: 'root3', name: 'Dialog Box', icon: 'message' },
];

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  layout: Layout,
  layers: Layers,
  message: MessageSquare,
  square: Square,
};

interface LogEntry {
  time: string;
  action: 'move' | 'reset';
  from: string;
  to: string;
  index?: number;
}

// ──────────────────────────────────────────────
// Page
// ──────────────────────────────────────────────

export default function DndTreeTestPage() {
  const [nodes, setNodes] = useState<TreeNode[]>(INITIAL_NODES);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((entry: Omit<LogEntry, 'time'>) => {
    const now = new Date();
    const time = now.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    setLogs((prev) => [...prev, { ...entry, time }]);
    setTimeout(() => {
      if (logContainerRef.current) {
        logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
      }
    }, 0);
  }, []);

  const handleMove = useCallback(
    (id: string, newParentId: string | undefined, index: number) => {
      const movedName = (nodes.find((n) => n.id === id)?.name as string) ?? id;
      const parentName = newParentId
        ? ((nodes.find((n) => n.id === newParentId)?.name as string) ?? newParentId)
        : 'Root';
      addLog({ action: 'move', from: movedName, to: parentName, index });

      setNodes((prev) => {
        const updated = prev.map((n) =>
          n.id === id ? { ...n, parentId: newParentId } : n
        );
        const movedNode = updated.find((n) => n.id === id);
        if (!movedNode) return prev;

        const siblings = updated.filter(
          (n) => n.parentId === newParentId && n.id !== id
        );
        siblings.splice(index, 0, movedNode);

        const siblingIds = new Set(siblings.map((n) => n.id));
        const result: TreeNode[] = [];
        let siblingsInserted = false;

        for (const n of updated) {
          if (siblingIds.has(n.id)) {
            if (!siblingsInserted) {
              result.push(...siblings);
              siblingsInserted = true;
            }
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
    addLog({ action: 'reset', from: '', to: '' });
  };

  // Build a simple tree structure for JSON display
  const buildTreeJson = (parentId?: string): object[] => {
    return nodes
      .filter((n) => n.parentId === parentId)
      .map((n) => {
        const children = buildTreeJson(n.id);
        return children.length > 0
          ? { id: n.id, name: n.name, children }
          : { id: n.id, name: n.name };
      });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <nav className="sticky top-0 z-10 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500 text-white">
              <GripVertical className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold leading-tight">
                DraggableTree <span className="text-blue-500">Test</span>
              </h1>
              <p className="text-[10px] font-medium text-slate-400">
                @dnd-kit Component Playground
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-[10px] font-semibold text-slate-500">
                {nodes.length} nodes
              </span>
            </div>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 py-8 lg:grid-cols-5">
        {/* Tree Panel */}
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Object Tree
              </span>
              <span className="h-2 w-2 rounded-full bg-green-500" />
            </div>
            <div className="p-4">
              <DraggableTree
                nodes={nodes}
                renderNode={(node) => {
                  const iconKey = (node.icon as string) ?? 'square';
                  const Icon = ICON_MAP[iconKey] ?? Square;
                  return (
                    <div className="flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="truncate text-[13px]">
                        {node.name as string}
                      </span>
                    </div>
                  );
                }}
                onMove={handleMove}
                onSelect={setSelectedIds}
                selectedIds={selectedIds}
              />
            </div>
            <div className="border-t border-slate-100 px-5 py-3">
              <p className="text-[10px] text-slate-400">
                Drag nodes to reparent or reorder. Drop on center to nest, edge to insert as sibling.
              </p>
            </div>
          </div>
        </div>

        {/* Right panels */}
        <div className="flex flex-col gap-6 lg:col-span-3">
          {/* Tree Structure JSON */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Tree Structure
              </span>
              <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-500">
                LIVE
              </span>
            </div>
            <div className="max-h-80 overflow-auto p-5">
              <pre className="text-xs leading-relaxed text-slate-600">
                {JSON.stringify(buildTreeJson(), null, 2)}
              </pre>
            </div>
          </div>

          {/* Event Log */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Event Log
              </span>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                {logs.length} events
              </span>
            </div>
            <div
              ref={logContainerRef}
              className="h-56 overflow-auto p-2"
            >
              {logs.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-xs text-slate-300">
                    Drag nodes to see events here
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {logs.map((entry, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition-colors hover:bg-slate-50"
                    >
                      <span className="shrink-0 text-[10px] text-slate-300">
                        {entry.time}
                      </span>
                      {entry.action === 'move' ? (
                        <>
                          <span className="shrink-0 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-500">
                            MOVE
                          </span>
                          <span className="font-medium text-slate-700">
                            {entry.from}
                          </span>
                          <ArrowRight className="h-3 w-3 shrink-0 text-slate-300" />
                          <span className="font-medium text-blue-600">
                            {entry.to}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            [{entry.index}]
                          </span>
                        </>
                      ) : (
                        <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-500">
                          RESET
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
