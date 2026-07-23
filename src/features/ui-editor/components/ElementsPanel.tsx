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
  const pushUndoState = useStore((s) => s.pushUndoState);

  const selectedCanvas = uiCanvases.find((c) => c.id === selectedCanvasId) ?? null;

  // 追加/削除/名前変更/親付け替えは単発操作なので、都度 Undo を1件積む
  function withUndo<Args extends unknown[]>(fn: (...args: Args) => void): (...args: Args) => void {
    return (...args: Args) => {
      pushUndoState('ui-screens', { uiCanvases });
      fn(...args);
    };
  }

  return (
    <UIObjectTree
      objects={selectedCanvas?.objects ?? []}
      selectedObjectIds={selectedObjectIds}
      canvasId={selectedCanvasId}
      onSelectObjects={selectUIObjects}
      onAddObject={withUndo(addUIObject)}
      onDeleteObject={withUndo(deleteUIObject)}
      onUpdateObject={withUndo(updateUIObject)}
      onReparentObject={withUndo(reparentUIObject)}
    />
  );
}
