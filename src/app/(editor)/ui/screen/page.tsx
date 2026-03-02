'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ThreeColumnLayout } from '@/components/common/ThreeColumnLayout';
import { useStore } from '@/stores';
import { generateId } from '@/lib/utils';
import { Plus } from 'lucide-react';
import type { LeftPanelMode, EditorUICanvas } from '@/stores/uiEditorSlice';

const LEFT_PANEL_OPTIONS: { value: LeftPanelMode; label: string }[] = [
  { value: 'canvasList', label: '画面一覧' },
  { value: 'elements', label: 'エレメント' },
  { value: 'templates', label: 'テンプレート' },
  { value: 'functions', label: 'ファンクション' },
];

export default function UIScreenDesignPage() {
  // Canvas state
  const uiCanvases = useStore((s) => s.uiCanvases);
  const selectedCanvasId = useStore((s) => s.selectedCanvasId);
  const addUICanvas = useStore((s) => s.addUICanvas);
  const deleteUICanvas = useStore((s) => s.deleteUICanvas);
  const selectUICanvas = useStore((s) => s.selectUICanvas);

  // Editor state
  const leftPanelMode = useStore((s) => s.leftPanelMode);
  const setLeftPanelMode = useStore((s) => s.setLeftPanelMode);

  // Template state
  const uiTemplates = useStore((s) => s.uiTemplates);

  // Function state (from selected canvas)
  const selectedCanvas = uiCanvases.find((c) => c.id === selectedCanvasId) ?? null;

  const handleAddCanvas = () => {
    const id = generateId(
      'ui_canvas',
      uiCanvases.map((c) => c.id)
    );
    const newCanvas: EditorUICanvas = {
      id,
      name: '新しい画面',
      objects: [],
      functions: [],
    };
    addUICanvas(newCanvas);
    selectUICanvas(id);
  };

  return (
    <ThreeColumnLayout
      left={
        <div className="flex h-full flex-col bg-muted/20">
          {/* Mode selector */}
          <div className="shrink-0 border-b px-2 py-2">
            <Select
              value={leftPanelMode}
              onValueChange={(v) => setLeftPanelMode(v as LeftPanelMode)}
            >
              <SelectTrigger className="h-8 text-xs" aria-label="左パネルモード">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEFT_PANEL_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Panel content */}
          <div className="min-h-0 flex-1 overflow-auto">
            {leftPanelMode === 'canvasList' && (
              <CanvasListPanel
                canvases={uiCanvases}
                selectedId={selectedCanvasId}
                onSelect={selectUICanvas}
                onAdd={handleAddCanvas}
                onDelete={deleteUICanvas}
              />
            )}
            {leftPanelMode === 'elements' && (
              <ElementsPanel objects={selectedCanvas?.objects ?? []} />
            )}
            {leftPanelMode === 'templates' && (
              <TemplatesPanel templates={uiTemplates} />
            )}
            {leftPanelMode === 'functions' && (
              <FunctionsPanel functions={selectedCanvas?.functions ?? []} />
            )}
          </div>
        </div>
      }
      center={
        <div className="flex h-full flex-col">
          <div className="flex-1 overflow-hidden bg-neutral-800">
            {selectedCanvasId ? (
              <div
                className="flex h-full items-center justify-center text-sm text-muted-foreground"
                data-testid="ui-canvas-placeholder"
              >
                UICanvas (T189c で実装)
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                画面を選択してください
              </div>
            )}
          </div>
        </div>
      }
      right={
        <div className="h-full overflow-auto bg-muted/20">
          <div className="p-4 text-sm text-muted-foreground">
            UIPropertyPanel (T191 で実装)
          </div>
        </div>
      }
      leftDefaultWidth={240}
      rightDefaultWidth={300}
      leftMinWidth={160}
      leftMaxWidth={400}
      rightMinWidth={200}
      rightMaxWidth={450}
    />
  );
}

// ──────────────────────────────────────────────
// Sub-panels (will be extracted to features/ in later tasks)
// ──────────────────────────────────────────────

interface CanvasListPanelProps {
  canvases: EditorUICanvas[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
}

function CanvasListPanel({ canvases, selectedId, onSelect, onAdd, onDelete }: CanvasListPanelProps) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b px-2 py-1">
        <span className="text-xs font-semibold text-muted-foreground">画面一覧</span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onAdd} aria-label="画面を追加">
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
      {canvases.length === 0 ? (
        <div className="p-4 text-center text-xs text-muted-foreground">
          画面がありません
        </div>
      ) : (
        <ul role="listbox" aria-label="画面一覧">
          {canvases.map((canvas) => (
            <li
              key={canvas.id}
              role="option"
              aria-selected={canvas.id === selectedId}
              className={`flex cursor-pointer items-center justify-between px-3 py-1.5 text-sm hover:bg-accent ${
                canvas.id === selectedId ? 'bg-accent font-medium' : ''
              }`}
              onClick={() => onSelect(canvas.id)}
            >
              <span className="truncate">{canvas.name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 shrink-0 opacity-0 hover:opacity-100 group-hover:opacity-100 [li:hover_&]:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(canvas.id);
                }}
                aria-label={`${canvas.name} を削除`}
              >
                <span className="text-xs text-destructive">×</span>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ElementsPanel({ objects }: { objects: { id: string; name: string }[] }) {
  return (
    <div className="p-2 text-xs text-muted-foreground">
      {objects.length === 0 ? (
        <div className="text-center">エレメントなし</div>
      ) : (
        <ul>
          {objects.map((obj) => (
            <li key={obj.id} className="px-2 py-1">
              {obj.name}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-2 text-center text-muted-foreground">
        UIObjectTree (T190 で実装)
      </div>
    </div>
  );
}

function TemplatesPanel({ templates }: { templates: { id: string; name: string }[] }) {
  return (
    <div className="p-2 text-xs text-muted-foreground">
      {templates.length === 0 ? (
        <div className="text-center">テンプレートなし</div>
      ) : (
        <ul>
          {templates.map((tmpl) => (
            <li key={tmpl.id} className="px-2 py-1">
              {tmpl.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FunctionsPanel({ functions }: { functions: { id: string; name: string }[] }) {
  return (
    <div className="p-2 text-xs text-muted-foreground">
      {functions.length === 0 ? (
        <div className="text-center">ファンクションなし</div>
      ) : (
        <ul>
          {functions.map((fn) => (
            <li key={fn.id} className="px-2 py-1">
              {fn.name}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-2 text-center text-muted-foreground">
        UIFunctionEditor (T197a で実装)
      </div>
    </div>
  );
}
