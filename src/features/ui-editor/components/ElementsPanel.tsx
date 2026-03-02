'use client';

import { UIObjectTree } from './UIObjectTree';
import { useStore } from '@/stores';

export function ElementsPanel() {
  const selectedCanvasId = useStore((s) => s.selectedCanvasId);
  const uiCanvases = useStore((s) => s.uiCanvases);
  const selectedObjectIds = useStore((s) => s.selectedObjectIds);
  const selectUIObjects = useStore((s) => s.selectUIObjects);
  const addUIObject = useStore((s) => s.addUIObject);
  const deleteUIObject = useStore((s) => s.deleteUIObject);
  const updateUIObject = useStore((s) => s.updateUIObject);
  const reparentUIObject = useStore((s) => s.reparentUIObject);

  const selectedCanvas = uiCanvases.find((c) => c.id === selectedCanvasId) ?? null;

  return (
    <UIObjectTree
      objects={selectedCanvas?.objects ?? []}
      selectedObjectIds={selectedObjectIds}
      canvasId={selectedCanvasId}
      onSelectObjects={selectUIObjects}
      onAddObject={addUIObject}
      onDeleteObject={deleteUIObject}
      onUpdateObject={updateUIObject}
      onReparentObject={reparentUIObject}
    />
  );
}
