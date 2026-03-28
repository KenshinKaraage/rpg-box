'use client';

// Side-effect: レジストリ登録
import '@/types/ui/register';
import '@/types/ui/actions/register';
import '@/engine/actions/register';
import '@/features/event-editor/registry/register';
import '@/features/ui-editor/registry/uiActionBlockRegister';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ThreeColumnLayout } from '@/components/common/ThreeColumnLayout';
import { useStore } from '@/stores';
import { generateId } from '@/lib/utils';
import { CanvasListPanel } from '@/features/ui-editor/components/CanvasListPanel';
import { ElementsPanel } from '@/features/ui-editor/components/ElementsPanel';
import { TemplatesPanel } from '@/features/ui-editor/components/TemplatesPanel';
import { FunctionsPanel } from '@/features/ui-editor/components/FunctionsPanel';
import { UICanvas } from '@/features/ui-editor/components/UICanvas';
import { UIPropertyPanel } from '@/features/ui-editor/components/UIPropertyPanel';
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
        <Tabs
          value={leftPanelMode}
          onValueChange={(v) => setLeftPanelMode(v as LeftPanelMode)}
          className="flex h-full flex-col bg-muted/20"
        >
          <TabsList className="flex h-auto w-full shrink-0 flex-wrap rounded-none border-b bg-transparent p-0">
            {LEFT_PANEL_OPTIONS.map((opt) => (
              <TabsTrigger key={opt.value} value={opt.value} className="px-3 py-1.5 text-xs">
                {opt.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="canvasList" className="mt-0 min-h-0 flex-1 overflow-auto">
            <CanvasListPanel
              canvases={uiCanvases}
              selectedId={selectedCanvasId}
              onSelect={selectUICanvas}
              onAdd={handleAddCanvas}
              onDelete={deleteUICanvas}
            />
          </TabsContent>
          <TabsContent value="elements" className="mt-0 min-h-0 flex-1 overflow-auto">
            <ElementsPanel />
          </TabsContent>
          <TabsContent value="templates" className="mt-0 min-h-0 flex-1 overflow-auto">
            <TemplatesPanel templates={uiTemplates} />
          </TabsContent>
          <TabsContent value="functions" className="mt-0 min-h-0 flex-1 overflow-auto">
            <FunctionsPanel functions={selectedCanvas?.functions ?? []} />
          </TabsContent>
        </Tabs>
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
          <UIPropertyPanel />
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
