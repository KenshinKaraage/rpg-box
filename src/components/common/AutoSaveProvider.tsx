'use client';

import { useEffect, useRef } from 'react';
import { useStore } from '@/stores';
import { buildProjectData } from '@/features/test-play/buildProjectData';
import { getLocalStorage } from '@/lib/storage/localStorage';
import type { ProjectData } from '@/lib/storage/types';

const DEBOUNCE_MS = 1000;
const PROJECT_ID = 'default';

/**
 * ストアの変更を検知してLocalStorageに自動保存するプロバイダ。
 * 起動時にLocalStorageから復元も行う。
 */
export function AutoSaveProvider() {
  const hasRestored = useRef(false);

  // 起動時に一時保存データを復元
  useEffect(() => {
    if (hasRestored.current) return;
    hasRestored.current = true;

    const storage = getLocalStorage();
    const tempData = storage.loadTempData();
    if (!tempData?.data) return;

    const state = useStore.getState();
    if (state.dataTypes.length > 0 || state.maps.length > 0) return;

    try {
      state.loadProjectData(tempData.data as ProjectData);
      console.log(
        '[AutoSave] Restored from temp save',
        new Date(tempData.timestamp).toLocaleString()
      );
    } catch (e) {
      console.warn('[AutoSave] Failed to restore temp data:', e);
    }
  }, []);

  // ストア変更を検知して自動保存
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let isSaving = false;

    const unsubscribe = useStore.subscribe((state, prevState) => {
      // saveStatus の変更だけなら無視（自分自身のmarkAsUnsaved/Savedによるループ防止）
      if (state.saveStatus !== prevState.saveStatus) {
        // saveStatus 以外に変更があるかチェック
        const keys = Object.keys(state) as (keyof typeof state)[];
        const hasOtherChange = keys.some((k) => k !== 'saveStatus' && state[k] !== prevState[k]);
        if (!hasOtherChange) return;
      }

      // 保存処理中の再帰呼び出しを防止
      if (isSaving) return;

      if (timeoutId) clearTimeout(timeoutId);

      // 即座に未保存マークをつける
      isSaving = true;
      state.markAsUnsaved();
      isSaving = false;

      timeoutId = setTimeout(() => {
        try {
          isSaving = true;
          const data = buildProjectData();
          const storage = getLocalStorage();
          storage.saveTempData({
            timestamp: Date.now(),
            projectId: PROJECT_ID,
            data,
          });
          useStore.getState().markAsSaved();
          isSaving = false;
        } catch (e) {
          isSaving = false;
          console.warn('[AutoSave] Save failed:', e);
        }
      }, DEBOUNCE_MS);
    });

    return () => {
      unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  return null;
}
