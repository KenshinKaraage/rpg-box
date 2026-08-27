'use client';

import { useEffect, useRef } from 'react';
import { useStore } from '@/stores';
import { IndexedDBStorageProvider } from '@/lib/storage/indexedDB';
import type { UndoHistory } from '@/lib/storage/types';
import { hydrateDataType } from '@/types/data';
import { hydrateCustomClass } from '@/types/customClass';
import { hydrateVariable } from '@/types/variable';
import { hydrateGameMap, hydrateChipset, hydratePrefab } from '@/types/map';
import type { DataType } from '@/types/data';
import type { CustomClass } from '@/types/customClass';
import type { Variable } from '@/types/variable';
import type { GameMap, Chipset, Prefab } from '@/types/map';

// AutoSaveProvider と同じ単一プロジェクトID
// （複数プロジェクト管理は T248 で対応予定のためまだ実在の projectId 概念がない）
const SAVE_ID = 'autosave';
const SAVE_DEBOUNCE_MS = 800;

const storage = new IndexedDBStorageProvider();

/**
 * editorSlice の undoStacks[page]/redoStacks[page]（2本のスタック）を、
 * design.md#ストレージ設計 で定義された `{ states, currentIndex }` 形式に変換する。
 *
 * undoStack は古い順に並んだ配列（push で末尾に追加）、redoStack は新しい順
 * （直近にUndoしたものが末尾）なので、redoStack を反転して undoStack の後ろに
 * 繋げれば時系列順の1本の履歴になる。currentIndex は「undo可能な件数」を表す境界。
 */
export function encodeUndoHistory(undoStack: unknown[], redoStack: unknown[]): UndoHistory {
  return {
    states: [...undoStack, ...[...redoStack].reverse()],
    currentIndex: undoStack.length,
  };
}

/** encodeUndoHistory の逆変換 */
export function decodeUndoHistory(history: UndoHistory): {
  undoStack: unknown[];
  redoStack: unknown[];
} {
  const idx = Math.min(Math.max(history.currentIndex, 0), history.states.length);
  return {
    undoStack: history.states.slice(0, idx),
    redoStack: [...history.states.slice(idx)].reverse(),
  };
}

/**
 * pushUndoState() が積んだ Partial<StoreState> スナップショットを、
 * stores/index.ts の loadProjectData() と同じ規則で FieldType/Component の
 * クラスインスタンスへ復元する。
 *
 * IndexedDB（structuredClone）に保存する際、クラスインスタンスは own property
 * のみが複製されプロトタイプ（メソッド）は失われるため、読み込み後は
 * hydrateXxx() で明示的に復元し直す必要がある（loadProjectData と同じ理由）。
 * 該当しないキー（dataEntries, eventTemplates, scripts, uiCanvases 等）は
 * loadProjectData でもそのまま代入されているプレーンなデータなので変更しない。
 */
export function hydratePartialState(snapshot: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = { ...snapshot };
  if (Array.isArray(result.dataTypes)) {
    result.dataTypes = (result.dataTypes as DataType[]).map(hydrateDataType);
  }
  if (Array.isArray(result.classes)) {
    result.classes = (result.classes as CustomClass[]).map(hydrateCustomClass);
  }
  if (Array.isArray(result.variables)) {
    result.variables = (result.variables as Variable[]).map(hydrateVariable);
  }
  if (Array.isArray(result.maps)) {
    result.maps = (result.maps as GameMap[]).map(hydrateGameMap);
  }
  if (Array.isArray(result.chipsets)) {
    result.chipsets = (result.chipsets as Chipset[]).map(hydrateChipset);
  }
  if (Array.isArray(result.prefabs)) {
    result.prefabs = (result.prefabs as Prefab[]).map(hydratePrefab);
  }
  return result;
}

/**
 * ページごとのUndo/Redo履歴をIndexedDBへ永続化するプロバイダ。
 *
 * AutoSaveProvider と同じ subscribe + debounce パターン:
 * - currentPage が切り替わったら、そのページの履歴が未読込なら IndexedDB から読み込む
 *   （読込完了までにユーザーが既に編集を始めていた場合は上書きしない）
 * - 現在のページの undoStacks/redoStacks が変化したらデバウンスして保存する
 */
export function UndoHistoryProvider() {
  const hydratedPages = useRef(new Set<string>());

  useEffect(() => {
    let saveTimeoutId: ReturnType<typeof setTimeout> | null = null;

    const hydratePage = async (page: string) => {
      if (!page || hydratedPages.current.has(page)) return;
      hydratedPages.current.add(page);
      try {
        const history = await storage.loadUndoHistory(SAVE_ID, page);
        if (!history || history.states.length === 0) return;

        const state = useStore.getState();
        // 読込中にユーザーが既に編集を始めていたら、その履歴を優先して上書きしない
        if (
          (state.undoStacks[page]?.length ?? 0) > 0 ||
          (state.redoStacks[page]?.length ?? 0) > 0
        ) {
          return;
        }

        const { undoStack, redoStack } = decodeUndoHistory(history);
        state.hydratePageHistory(
          page,
          undoStack.map((s) => hydratePartialState(s as Record<string, unknown>)),
          redoStack.map((s) => hydratePartialState(s as Record<string, unknown>))
        );
      } catch (e) {
        console.warn(`[UndoHistory] Failed to load history for page "${page}":`, e);
      }
    };

    // マウント時点で既に currentPage が設定されているケースをカバー
    void hydratePage(useStore.getState().currentPage);

    const unsubscribe = useStore.subscribe((state, prevState) => {
      if (state.currentPage !== prevState.currentPage) {
        void hydratePage(state.currentPage);
      }

      const page = state.currentPage;
      if (!page) return;
      const undoChanged = state.undoStacks[page] !== prevState.undoStacks[page];
      const redoChanged = state.redoStacks[page] !== prevState.redoStacks[page];
      if (!undoChanged && !redoChanged) return;

      if (saveTimeoutId) clearTimeout(saveTimeoutId);
      saveTimeoutId = setTimeout(() => {
        const s = useStore.getState();
        const history = encodeUndoHistory(s.undoStacks[page] ?? [], s.redoStacks[page] ?? []);
        storage.saveUndoHistory(SAVE_ID, page, history).catch((e) => {
          console.warn(`[UndoHistory] Failed to save history for page "${page}":`, e);
        });
      }, SAVE_DEBOUNCE_MS);
    });

    return () => {
      unsubscribe();
      if (saveTimeoutId) clearTimeout(saveTimeoutId);
    };
  }, []);

  return null;
}
