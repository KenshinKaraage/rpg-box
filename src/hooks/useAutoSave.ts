'use client';

/**
 * useAutoSave フック
 *
 * 編集中のデータを自動的にLocalStorageに保存
 * クラッシュ復旧用の一時保存を担当
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { getLocalStorage } from '@/lib/storage/localStorage';
import type { ProjectData } from '@/lib/storage/types';

// =============================================================================
// 型定義
// =============================================================================

export type AutoSaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

export interface UseAutoSaveOptions {
  /** デバウンス時間（ミリ秒）デフォルト: 500ms */
  debounceMs?: number;
  /** 自動保存を有効にするかどうか デフォルト: true */
  enabled?: boolean;
  /** 保存成功時のコールバック */
  onSaveSuccess?: () => void;
  /** 保存失敗時のコールバック */
  onSaveError?: (error: Error) => void;
}

export interface UseAutoSaveReturn {
  /** 現在の保存ステータス */
  status: AutoSaveStatus;
  /** 最後に保存した時刻 */
  lastSavedAt: number | null;
  /** 未保存の変更があるか */
  hasUnsavedChanges: boolean;
  /** 手動で保存をトリガー（デバウンスなし） */
  saveNow: () => void;
  /** 一時保存データをクリア */
  clearTempData: () => void;
}

// =============================================================================
// デバウンス関数
// =============================================================================

function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number
): { debounced: (...args: Parameters<T>) => void; cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };

  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return { debounced, cancel };
}

// =============================================================================
// useAutoSave フック
// =============================================================================

/**
 * 自動保存フック
 *
 * @param projectId 保存対象のプロジェクトID
 * @param data 保存するデータ（Partial<ProjectData>）
 * @param options オプション設定
 * @returns 保存ステータスと制御関数
 *
 * @example
 * ```tsx
 * const { status, hasUnsavedChanges, saveNow } = useAutoSave(
 *   'proj_001',
 *   projectData,
 *   { debounceMs: 500 }
 * );
 *
 * // ステータスをUIに表示
 * <SaveIndicator status={status} />
 *
 * // 手動保存ボタン
 * <button onClick={saveNow} disabled={!hasUnsavedChanges}>
 *   今すぐ保存
 * </button>
 * ```
 */
export function useAutoSave(
  projectId: string | null,
  data: Partial<ProjectData> | null,
  options: UseAutoSaveOptions = {}
): UseAutoSaveReturn {
  const { debounceMs = 500, enabled = true, onSaveSuccess, onSaveError } = options;

  const [status, setStatus] = useState<AutoSaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // データの前回値を保持（変更検出用）
  const prevDataRef = useRef<string | null>(null);
  const debouncedSaveRef = useRef<{ debounced: () => void; cancel: () => void } | null>(null);

  // 保存処理
  const performSave = useCallback(() => {
    if (!projectId || !data) {
      return;
    }

    setStatus('saving');

    try {
      const storage = getLocalStorage();
      storage.saveTempData({
        timestamp: Date.now(),
        projectId,
        data,
      });

      const now = Date.now();
      setLastSavedAt(now);
      setStatus('saved');
      setHasUnsavedChanges(false);
      onSaveSuccess?.();

      // 2秒後にidleに戻す
      setTimeout(() => {
        setStatus((current) => (current === 'saved' ? 'idle' : current));
      }, 2000);
    } catch (error) {
      setStatus('error');
      onSaveError?.(error instanceof Error ? error : new Error('Unknown save error'));
    }
  }, [projectId, data, onSaveSuccess, onSaveError]);

  // 即座に保存（デバウンスなし）
  const saveNow = useCallback(() => {
    debouncedSaveRef.current?.cancel();
    performSave();
  }, [performSave]);

  // 一時データをクリア
  const clearTempData = useCallback(() => {
    const storage = getLocalStorage();
    storage.clearTempData();
    setHasUnsavedChanges(false);
    setLastSavedAt(null);
    setStatus('idle');
  }, []);

  // デバウンス保存の設定
  useEffect(() => {
    const { debounced, cancel } = debounce(performSave, debounceMs);
    debouncedSaveRef.current = { debounced, cancel };

    return () => {
      cancel();
    };
  }, [performSave, debounceMs]);

  // データ変更の検出と自動保存トリガー
  useEffect(() => {
    if (!enabled || !projectId || !data) {
      return;
    }

    const currentDataStr = JSON.stringify(data);

    // 初回または変更がない場合はスキップ
    if (prevDataRef.current === null) {
      prevDataRef.current = currentDataStr;
      return;
    }

    if (prevDataRef.current === currentDataStr) {
      return;
    }

    // データが変更された
    prevDataRef.current = currentDataStr;
    setHasUnsavedChanges(true);
    setStatus('pending');

    // デバウンス保存をトリガー
    debouncedSaveRef.current?.debounced();
  }, [enabled, projectId, data]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      debouncedSaveRef.current?.cancel();
    };
  }, []);

  return {
    status,
    lastSavedAt,
    hasUnsavedChanges,
    saveNow,
    clearTempData,
  };
}

// =============================================================================
// 一時データ復旧フック
// =============================================================================

export interface TempDataRecovery {
  /** 復旧可能なデータがあるか */
  hasRecoverableData: boolean;
  /** 一時保存データのタイムスタンプ */
  timestamp: number | null;
  /** 一時保存データのプロジェクトID */
  projectId: string | null;
  /** データを復旧 */
  recover: () => Partial<ProjectData> | null;
  /** 一時データを破棄 */
  discard: () => void;
}

/**
 * 一時保存データの復旧フック
 *
 * @example
 * ```tsx
 * const { hasRecoverableData, timestamp, recover, discard } = useTempDataRecovery();
 *
 * if (hasRecoverableData) {
 *   // 復旧ダイアログを表示
 *   <RecoveryDialog
 *     timestamp={timestamp}
 *     onRecover={() => {
 *       const data = recover();
 *       // データを適用
 *     }}
 *     onDiscard={discard}
 *   />
 * }
 * ```
 */
export function useTempDataRecovery(): TempDataRecovery {
  const [hasRecoverableData, setHasRecoverableData] = useState(false);
  const [timestamp, setTimestamp] = useState<number | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);

  // 初期化時にチェック
  useEffect(() => {
    const storage = getLocalStorage();
    const tempData = storage.loadTempData();

    if (tempData) {
      setHasRecoverableData(true);
      setTimestamp(tempData.timestamp);
      setProjectId(tempData.projectId);
    }
  }, []);

  const recover = useCallback((): Partial<ProjectData> | null => {
    const storage = getLocalStorage();
    const tempData = storage.loadTempData();
    return tempData?.data ?? null;
  }, []);

  const discard = useCallback(() => {
    const storage = getLocalStorage();
    storage.clearTempData();
    setHasRecoverableData(false);
    setTimestamp(null);
    setProjectId(null);
  }, []);

  return {
    hasRecoverableData,
    timestamp,
    projectId,
    recover,
    discard,
  };
}
