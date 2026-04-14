/**
 * SnapshotManager — プレビュー実行時のオブジェクト状態をIDベースで管理
 *
 * プレビュー実行前にスナップショットを保存し、「戻す」時に復元する。
 * 同じIDで再実行した場合は先に前回のスナップショットを復元してから再保存する。
 */
import { useStore } from '@/stores';
import type { EditorUIObject } from '@/stores/uiEditorSlice';
import type { AnimationPlaybackHandle } from './animationPlayer';

export interface PreviewSnapshot {
  canvasId: string;
  /** objectId → 元のオブジェクト (structuredClone) */
  objects: Map<string, EditorUIObject>;
  /** 元のキャンバスID（Navigate用） */
  originalCanvasId: string | null;
  /** 実行中のアニメーション再生ハンドル */
  animations: AnimationPlaybackHandle[];
}

const snapshots = new Map<string, PreviewSnapshot>();

/** 指定IDのスナップショットが存在するか */
export function hasSnapshot(id: string): boolean {
  return snapshots.has(id);
}

/** スナップショットを保存（同じIDが既にあれば先にrevertしてから保存） */
export function storeSnapshot(id: string, snapshot: PreviewSnapshot): void {
  if (snapshots.has(id)) {
    revertSnapshot(id);
  }
  snapshots.set(id, snapshot);
}

/** 指定IDのスナップショットを復元して削除 */
export function revertSnapshot(id: string): void {
  const snapshot = snapshots.get(id);
  if (!snapshot) return;
  snapshots.delete(id);
  applyRevert(snapshot);
}

/** 全スナップショットを復元して削除 */
export function revertAll(): void {
  for (const [id] of snapshots) {
    revertSnapshot(id);
  }
}

/** 指定IDのスナップショットを削除（復元せずに破棄） */
export function discardSnapshot(id: string): void {
  const snapshot = snapshots.get(id);
  if (!snapshot) return;
  // アニメーションだけ停止（オブジェクトは復元しない）
  for (const handle of snapshot.animations) {
    handle.stop();
  }
  snapshots.delete(id);
}

/** 新しい空のスナップショットを作成 */
export function createSnapshot(canvasId: string): PreviewSnapshot {
  return {
    canvasId,
    objects: new Map(),
    originalCanvasId: useStore.getState().selectedCanvasId,
    animations: [],
  };
}

/** スナップショットにオブジェクトをキャプチャ（二重キャプチャ防止） */
export function captureObject(
  objects: EditorUIObject[],
  objectId: string,
  snapshot: PreviewSnapshot
): void {
  if (snapshot.objects.has(objectId)) return;
  const obj = objects.find((o) => o.id === objectId);
  if (obj) {
    snapshot.objects.set(objectId, structuredClone(obj));
  }
}

// ── 内部 ──

function applyRevert(snapshot: PreviewSnapshot): void {
  const { canvasId, objects, originalCanvasId, animations } = snapshot;

  // 実行中のアニメーションを停止
  for (const handle of animations) {
    handle.stop();
  }

  // オブジェクトを元に戻す
  const store = useStore.getState();
  for (const [objectId, original] of objects.entries()) {
    store.updateUIObject(canvasId, objectId, {
      name: original.name,
      transform: original.transform,
    });
    for (const comp of original.components) {
      store.updateUIComponent(canvasId, objectId, comp.type, comp.data);
    }
  }

  // キャンバス遷移を戻す
  const currentCanvasId = store.selectedCanvasId;
  if (currentCanvasId !== originalCanvasId && originalCanvasId !== null) {
    store.selectUICanvas(originalCanvasId);
  }
}
