/**
 * アクションプレビュー実行
 *
 * エディタ上でアクションリストをテスト実行し、結果をキャンバスに即時反映する。
 * 実行前の状態をスナップショットして「戻す」機能を提供する。
 */
import { useStore } from '@/stores';
import { deserializeActions } from './actionBridge';
import type { EditableAction } from '@/types/ui/actions/UIAction';
import type { SerializedAction } from '@/types/ui/components/ActionComponent';
import type { SetPropertyAction } from '@/types/ui/actions/SetPropertyAction';
import type { SetVisibilityAction } from '@/types/ui/actions/SetVisibilityAction';
import type { NavigateAction } from '@/types/ui/actions/NavigateAction';
import type { CallFunctionAction } from '@/types/ui/actions/CallFunctionAction';
import type { TriggerObjectActionAction } from '@/types/ui/actions/TriggerObjectActionAction';
import type { EditorUIObject } from '@/stores/uiEditorSlice';

/** スナップショット: 影響を受けたオブジェクトの元の状態 */
interface PreviewSnapshot {
  canvasId: string;
  /** objectId → 元のオブジェクト (structuredClone) */
  objects: Map<string, EditorUIObject>;
  /** 元のキャンバスID（Navigate用） */
  originalCanvasId: string | null;
}

/**
 * アクションリストをプレビュー実行する
 *
 * @returns revert関数（元の状態に戻す）。実行失敗時はnull。
 */
export function executeActionPreview(
  actions: EditableAction[],
  canvasId: string
): (() => void) | null {
  const state = useStore.getState();
  const canvas = state.uiCanvases.find((c) => c.id === canvasId);
  if (!canvas) return null;

  const snapshot: PreviewSnapshot = {
    canvasId,
    objects: new Map(),
    originalCanvasId: state.selectedCanvasId,
  };

  for (const action of actions) {
    executeSingle(action, canvasId, snapshot, 0);
  }

  // revert 関数を返す
  return () => revertSnapshot(snapshot);
}

/**
 * SerializedAction[] 版（FunctionsPanelなどで使用）
 */
export function executeSerializedActionPreview(
  serializedActions: SerializedAction[],
  canvasId: string
): (() => void) | null {
  const actions = deserializeActions(serializedActions);
  return executeActionPreview(actions, canvasId);
}

const MAX_DEPTH = 10;

function executeSingle(
  action: EditableAction,
  canvasId: string,
  snapshot: PreviewSnapshot,
  depth: number
): void {
  if (depth > MAX_DEPTH) return;

  const store = useStore.getState();
  const canvas = store.uiCanvases.find((c) => c.id === canvasId);
  if (!canvas) return;

  switch (action.type) {
    case 'uiSetProperty': {
      const a = action as SetPropertyAction;
      const targetId = a.targetId;
      if (!targetId) break;

      const obj = canvas.objects.find((o) => o.id === targetId);
      if (!obj) break;
      captureObject(canvas.objects, targetId, snapshot);

      if (a.component === 'transform') {
        useStore.getState().updateUIObject(canvasId, targetId, {
          transform: { ...obj.transform, [a.property]: a.value },
        });
      } else {
        const comp = obj.components.find((c) => c.type === a.component);
        if (!comp) break;
        const newData = structuredClone(comp.data) as Record<string, unknown>;
        newData[a.property] = a.value;
        useStore.getState().updateUIComponent(canvasId, targetId, a.component, newData);
      }
      break;
    }

    case 'uiSetVisibility': {
      const a = action as SetVisibilityAction;
      const targetId = a.targetId;
      if (!targetId) break;

      const visObj = canvas.objects.find((o) => o.id === targetId);
      if (!visObj) break;
      captureObject(canvas.objects, targetId, snapshot);

      // scaleX/Y を 0 にして非表示をシミュレート、復元は snapshot から
      if (!a.visible) {
        useStore.getState().updateUIObject(canvasId, targetId, {
          transform: { ...visObj.transform, scaleX: 0, scaleY: 0 },
        });
      }
      break;
    }

    case 'uiNavigate': {
      const a = action as NavigateAction;
      if (a.canvasId) {
        useStore.getState().selectUICanvas(a.canvasId);
      }
      break;
    }

    case 'uiCallFunction': {
      const a = action as CallFunctionAction;
      const fn = canvas.functions.find((f) => f.name === a.functionName);
      if (!fn) break;
      const fnActions = deserializeActions(fn.actions);
      for (const fnAction of fnActions) {
        executeSingle(fnAction, canvasId, snapshot, depth + 1);
      }
      break;
    }

    case 'uiTriggerObjectAction': {
      const a = action as TriggerObjectActionAction;
      if (!a.targetId || !a.actionEntryName) break;
      const obj = canvas.objects.find((o) => o.id === a.targetId);
      if (!obj) break;
      for (const comp of obj.components) {
        if (comp.type === 'action') {
          const data = comp.data as { actions?: Array<{ name: string; blocks: SerializedAction[] }> };
          const entry = data?.actions?.find((e) => e.name === a.actionEntryName);
          if (entry) {
            const entryActions = deserializeActions(entry.blocks);
            for (const entryAction of entryActions) {
              executeSingle(entryAction, canvasId, snapshot, depth + 1);
            }
          }
        }
      }
      break;
    }

    // uiPlayAnimation: スキップ（ランタイム専用）
  }
}

function captureObject(
  objects: EditorUIObject[],
  objectId: string,
  snapshot: PreviewSnapshot
): void {
  if (snapshot.objects.has(objectId)) return; // 二重キャプチャ防止
  const obj = objects.find((o) => o.id === objectId);
  if (obj) {
    snapshot.objects.set(objectId, structuredClone(obj));
  }
}

function revertSnapshot(snapshot: PreviewSnapshot): void {
  const { canvasId, objects, originalCanvasId } = snapshot;

  // オブジェクトを元に戻す
  for (const [objectId, original] of Array.from(objects.entries())) {
    useStore.getState().updateUIObject(canvasId, objectId, {
      name: original.name,
      transform: original.transform,
    });
    // コンポーネントも復元
    for (const comp of original.components) {
      useStore.getState().updateUIComponent(canvasId, objectId, comp.type, comp.data);
    }
  }

  // キャンバス遷移を戻す
  const currentCanvasId = useStore.getState().selectedCanvasId;
  if (currentCanvasId !== originalCanvasId && originalCanvasId !== null) {
    useStore.getState().selectUICanvas(originalCanvasId);
  }
}
