'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ThreeColumnLayout } from '@/components/common/ThreeColumnLayout';
import { useStore } from '@/stores';
import { generateId } from '@/lib/utils';
import { CanvasListPanel } from '@/features/ui-editor/components/CanvasListPanel';
import { ElementsPanel } from '@/features/ui-editor/components/ElementsPanel';
import { TemplatesPanel } from '@/features/ui-editor/components/TemplatesPanel';
import { FunctionsPanel } from '@/features/ui-editor/components/FunctionsPanel';
import { UICanvas } from '@/features/ui-editor/components/UICanvas';
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
              <UICanvas />
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
