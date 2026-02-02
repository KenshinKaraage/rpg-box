'use client';

/**
 * useUndo フック
 *
 * Undo/Redo 機能を提供する汎用フック
 * ページ単位の履歴管理に対応
 *
 * @see design.md#EditorSlice
 */

import { useCallback, useRef, useState } from 'react';

// =============================================================================
// 型定義
// =============================================================================

export interface UseUndoOptions<T> {
  /** 履歴の最大サイズ（デフォルト: 50） */
  maxHistorySize?: number;
  /** 初期状態 */
  initialState?: T;
  /** 状態変更時のコールバック */
  onChange?: (state: T) => void;
}

export interface UseUndoReturn<T> {
  /** 現在の状態 */
  state: T | undefined;
  /** Undoが可能か */
  canUndo: boolean;
  /** Redoが可能か */
  canRedo: boolean;
  /** Undo履歴の数 */
  undoCount: number;
  /** Redo履歴の数 */
  redoCount: number;
  /** 新しい状態をプッシュ */
  pushState: (newState: T) => void;
  /** Undoを実行 */
  undo: () => T | undefined;
  /** Redoを実行 */
  redo: () => T | undefined;
  /** 履歴をクリア（現在の状態は保持） */
  clearHistory: () => void;
  /** 完全にリセット */
  reset: (newInitialState?: T) => void;
}

// =============================================================================
// useUndo フック
// =============================================================================

/**
 * Undo/Redo フック
 *
 * @param options オプション設定
 * @returns Undo/Redo 操作と状態
 *
 * @example
 * ```tsx
 * const {
 *   state,
 *   canUndo,
 *   canRedo,
 *   pushState,
 *   undo,
 *   redo,
 * } = useUndo<MapData>({ maxHistorySize: 100 });
 *
 * // 状態を更新
 * const handleTileChange = (newMapData: MapData) => {
 *   pushState(newMapData);
 * };
 *
 * // Undo/Redo ボタン
 * <button onClick={undo} disabled={!canUndo}>Undo</button>
 * <button onClick={redo} disabled={!canRedo}>Redo</button>
 * ```
 */
export function useUndo<T>(options: UseUndoOptions<T> = {}): UseUndoReturn<T> {
  const { maxHistorySize = 50, initialState, onChange } = options;

  // 現在の状態（useRefで管理して同期的なアクセスを可能に）
  const stateRef = useRef<T | undefined>(initialState);

  // Undo/Redo スタック
  const undoStackRef = useRef<T[]>([]);
  const redoStackRef = useRef<T[]>([]);

  // 再レンダリング用のカウンター
  const [, forceUpdate] = useState(0);
  const triggerUpdate = useCallback(() => forceUpdate((n) => n + 1), []);

  // -------------------------------------------------------------------------
  // pushState
  // -------------------------------------------------------------------------
  const pushState = useCallback(
    (newState: T) => {
      // 現在の状態をUndoスタックに追加
      if (stateRef.current !== undefined) {
        undoStackRef.current = [...undoStackRef.current, stateRef.current];

        // 最大サイズを超えたら古いものを削除
        if (undoStackRef.current.length > maxHistorySize) {
          undoStackRef.current = undoStackRef.current.slice(-maxHistorySize);
        }
      }

      // Redoスタックをクリア（新しい操作が行われたため）
      redoStackRef.current = [];

      // 新しい状態を設定
      stateRef.current = newState;
      onChange?.(newState);
      triggerUpdate();
    },
    [maxHistorySize, onChange, triggerUpdate]
  );

  // -------------------------------------------------------------------------
  // undo
  // -------------------------------------------------------------------------
  const undo = useCallback((): T | undefined => {
    if (undoStackRef.current.length === 0) {
      return undefined;
    }

    // Undoスタックから状態を取り出し
    const previousState = undoStackRef.current[undoStackRef.current.length - 1];
    undoStackRef.current = undoStackRef.current.slice(0, -1);

    // 現在の状態をRedoスタックに追加
    if (stateRef.current !== undefined) {
      redoStackRef.current = [...redoStackRef.current, stateRef.current];
    }

    // 状態を復元
    stateRef.current = previousState;
    onChange?.(previousState!);
    triggerUpdate();

    return previousState;
  }, [onChange, triggerUpdate]);

  // -------------------------------------------------------------------------
  // redo
  // -------------------------------------------------------------------------
  const redo = useCallback((): T | undefined => {
    if (redoStackRef.current.length === 0) {
      return undefined;
    }

    // Redoスタックから状態を取り出し
    const nextState = redoStackRef.current[redoStackRef.current.length - 1];
    redoStackRef.current = redoStackRef.current.slice(0, -1);

    // 現在の状態をUndoスタックに追加
    if (stateRef.current !== undefined) {
      undoStackRef.current = [...undoStackRef.current, stateRef.current];
    }

    // 状態を復元
    stateRef.current = nextState;
    onChange?.(nextState!);
    triggerUpdate();

    return nextState;
  }, [onChange, triggerUpdate]);

  // -------------------------------------------------------------------------
  // clearHistory
  // -------------------------------------------------------------------------
  const clearHistory = useCallback(() => {
    undoStackRef.current = [];
    redoStackRef.current = [];
    triggerUpdate();
  }, [triggerUpdate]);

  // -------------------------------------------------------------------------
  // reset
  // -------------------------------------------------------------------------
  const reset = useCallback(
    (newInitialState?: T) => {
      undoStackRef.current = [];
      redoStackRef.current = [];
      const resetState = newInitialState ?? initialState;
      stateRef.current = resetState;
      if (resetState !== undefined) {
        onChange?.(resetState);
      }
      triggerUpdate();
    },
    [initialState, onChange, triggerUpdate]
  );

  return {
    state: stateRef.current,
    canUndo: undoStackRef.current.length > 0,
    canRedo: redoStackRef.current.length > 0,
    undoCount: undoStackRef.current.length,
    redoCount: redoStackRef.current.length,
    pushState,
    undo,
    redo,
    clearHistory,
    reset,
  };
}

// =============================================================================
// useUndoWithKey フック（ページ単位の履歴管理）
// =============================================================================

export interface UseUndoWithKeyReturn<T> {
  /** 指定キーの現在の状態を取得 */
  getState: (key: string) => T | undefined;
  /** 指定キーでUndoが可能か */
  canUndo: (key: string) => boolean;
  /** 指定キーでRedoが可能か */
  canRedo: (key: string) => boolean;
  /** 新しい状態をプッシュ */
  pushState: (key: string, newState: T) => void;
  /** Undoを実行 */
  undo: (key: string) => T | undefined;
  /** Redoを実行 */
  redo: (key: string) => T | undefined;
  /** 指定キーの履歴をクリア */
  clearHistory: (key: string) => void;
  /** 全履歴をクリア */
  clearAllHistory: () => void;
}

interface UndoState<T> {
  current: T | undefined;
  undoStack: T[];
  redoStack: T[];
}

/**
 * キー（ページID）単位でUndo/Redo履歴を管理するフック
 *
 * @param maxHistorySize 履歴の最大サイズ
 * @returns キー単位のUndo/Redo操作
 *
 * @example
 * ```tsx
 * const undoManager = useUndoWithKey<EditorState>(50);
 *
 * // マップエディタページの履歴
 * undoManager.pushState('map_editor', newMapState);
 * undoManager.undo('map_editor');
 *
 * // データエディタページの履歴（別管理）
 * undoManager.pushState('data_editor', newDataState);
 * ```
 */
export function useUndoWithKey<T>(maxHistorySize: number = 50): UseUndoWithKeyReturn<T> {
  const statesRef = useRef<Record<string, UndoState<T>>>({});
  const [, forceUpdate] = useState(0);
  const triggerUpdate = useCallback(() => forceUpdate((n) => n + 1), []);

  const getOrCreateState = useCallback((key: string): UndoState<T> => {
    if (!statesRef.current[key]) {
      statesRef.current[key] = {
        current: undefined,
        undoStack: [],
        redoStack: [],
      };
    }
    return statesRef.current[key];
  }, []);

  const getState = useCallback(
    (key: string): T | undefined => {
      return getOrCreateState(key).current;
    },
    [getOrCreateState]
  );

  const canUndo = useCallback(
    (key: string): boolean => {
      return getOrCreateState(key).undoStack.length > 0;
    },
    [getOrCreateState]
  );

  const canRedo = useCallback(
    (key: string): boolean => {
      return getOrCreateState(key).redoStack.length > 0;
    },
    [getOrCreateState]
  );

  const pushState = useCallback(
    (key: string, newState: T) => {
      const state = getOrCreateState(key);

      if (state.current !== undefined) {
        state.undoStack = [...state.undoStack, state.current];
        if (state.undoStack.length > maxHistorySize) {
          state.undoStack = state.undoStack.slice(-maxHistorySize);
        }
      }

      state.redoStack = [];
      state.current = newState;
      triggerUpdate();
    },
    [getOrCreateState, maxHistorySize, triggerUpdate]
  );

  const undo = useCallback(
    (key: string): T | undefined => {
      const state = getOrCreateState(key);

      if (state.undoStack.length === 0) {
        return undefined;
      }

      const previousState = state.undoStack[state.undoStack.length - 1];
      state.undoStack = state.undoStack.slice(0, -1);

      if (state.current !== undefined) {
        state.redoStack = [...state.redoStack, state.current];
      }

      state.current = previousState;
      triggerUpdate();

      return previousState;
    },
    [getOrCreateState, triggerUpdate]
  );

  const redo = useCallback(
    (key: string): T | undefined => {
      const state = getOrCreateState(key);

      if (state.redoStack.length === 0) {
        return undefined;
      }

      const nextState = state.redoStack[state.redoStack.length - 1];
      state.redoStack = state.redoStack.slice(0, -1);

      if (state.current !== undefined) {
        state.undoStack = [...state.undoStack, state.current];
      }

      state.current = nextState;
      triggerUpdate();

      return nextState;
    },
    [getOrCreateState, triggerUpdate]
  );

  const clearHistory = useCallback(
    (key: string) => {
      const state = getOrCreateState(key);
      state.undoStack = [];
      state.redoStack = [];
      triggerUpdate();
    },
    [getOrCreateState, triggerUpdate]
  );

  const clearAllHistory = useCallback(() => {
    statesRef.current = {};
    triggerUpdate();
  }, [triggerUpdate]);

  return {
    getState,
    canUndo,
    canRedo,
    pushState,
    undo,
    redo,
    clearHistory,
    clearAllHistory,
  };
}
