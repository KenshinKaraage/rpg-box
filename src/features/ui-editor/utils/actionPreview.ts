/**
 * アクションプレビュー実行
 *
 * エディタ上でアクションリストをテスト実行し、結果をキャンバスに即時反映する。
 * 実行前の状態をスナップショットして「戻す」機能を提供する。
 *
 * PlayAnimationAction の wait フラグに対応するため非同期実行。
 */
import { useStore } from '@/stores';
import { deserializeActions } from './actionBridge';
import { startAnimationPlayback, type AnimationPlaybackHandle } from './animationPlayer';
import type { EditableAction } from '@/types/ui/actions/UIAction';
import type { SerializedAction } from '@/types/ui/components/ActionTypes';
import type { SetPropertyAction } from '@/types/ui/actions/SetPropertyAction';
import type { SetVisibilityAction } from '@/types/ui/actions/SetVisibilityAction';
import type { NavigateAction } from '@/types/ui/actions/NavigateAction';
import type { CallFunctionAction } from '@/types/ui/actions/CallFunctionAction';
import type { PlayAnimationAction } from '@/types/ui/actions/PlayAnimationAction';
import type { NamedAnimation } from '@/types/ui/components/AnimationComponent';
import type { EditorUIObject } from '@/stores/uiEditorSlice';

/** スナップショット: 影響を受けたオブジェクトの元の状態 */
interface PreviewSnapshot {
  canvasId: string;
  /** objectId → 元のオブジェクト (structuredClone) */
  objects: Map<string, EditorUIObject>;
  /** 元のキャンバスID（Navigate用） */
  originalCanvasId: string | null;
  /** 実行中のアニメーション再生ハンドル */
  animations: AnimationPlaybackHandle[];
}

/**
 * アクションリストをプレビュー実行する（非同期）
 *
 * PlayAnimation(wait=true) がある場合、アニメーション完了を待ってから次のアクションへ進む。
 *
 * @returns revert関数（元の状態に戻す）。実行失敗時はnull。
 */
export async function executeActionPreview(
  actions: EditableAction[],
  canvasId: string
): Promise<(() => void) | null> {
  const state = useStore.getState();
  const canvas = state.uiCanvases.find((c) => c.id === canvasId);
  if (!canvas) return null;

  const snapshot: PreviewSnapshot = {
    canvasId,
    objects: new Map(),
    originalCanvasId: state.selectedCanvasId,
    animations: [],
  };

  for (const action of actions) {
    await executeSingle(action, canvasId, snapshot, 0);
  }

  // revert 関数を返す
  return () => revertSnapshot(snapshot);
}

/**
 * SerializedAction[] 版（FunctionsPanelなどで使用）
 */
export async function executeSerializedActionPreview(
  serializedActions: SerializedAction[],
  canvasId: string
): Promise<(() => void) | null> {
  const actions = deserializeActions(serializedActions);
  return executeActionPreview(actions, canvasId);
}

const MAX_DEPTH = 10;

async function executeSingle(
  action: EditableAction,
  canvasId: string,
  snapshot: PreviewSnapshot,
  depth: number
): Promise<void> {
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

      useStore.getState().updateUIObject(canvasId, targetId, {
        transform: { ...visObj.transform, visible: a.visible },
      });
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
        await executeSingle(fnAction, canvasId, snapshot, depth + 1);
      }
      break;
    }

    case 'uiPlayAnimation': {
      const a = action as PlayAnimationAction;
      if (!a.targetId || !a.animationName) break;

      const animObj = canvas.objects.find((o) => o.id === a.targetId);
      if (!animObj) break;
      captureObject(canvas.objects, a.targetId, snapshot);

      // AnimationComponent からアニメーションを取得
      const animComp = animObj.components.find((c) => c.type === 'animation');
      if (!animComp) break;
      const animData = animComp.data as { animations?: NamedAnimation[] };
      const namedAnim = animData.animations?.find((an) => an.name === a.animationName);
      if (!namedAnim) break;

      const handle = startAnimationPlayback(canvasId, a.targetId, namedAnim, a.loop);
      if (handle) {
        snapshot.animations.push(handle);
        if (a.wait) {
          await handle.finished;
        }
      }
      break;
    }
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
  const { canvasId, objects, originalCanvasId, animations } = snapshot;

  // 実行中のアニメーションを停止（reset ではなく stop — オブジェクト復元は下で一括）
  for (const handle of animations) {
    handle.stop();
  }

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
