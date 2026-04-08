'use client';

import { useEffect, useRef } from 'react';
import { useStore } from '@/stores';
import { buildProjectData } from '@/features/test-play/buildProjectData';
import { IndexedDBStorageProvider } from '@/lib/storage/indexedDB';
import type { ProjectData } from '@/lib/storage/types';

const DEBOUNCE_MS = 1000;
const SAVE_ID = 'autosave';

const storage = new IndexedDBStorageProvider();

/**
 * ストアの変更を検知してIndexedDBに自動保存するプロバイダ。
 * 起動時にIndexedDBから復元も行う。
 */
export function AutoSaveProvider() {
  const hasRestored = useRef(false);

  // 起動時に復元
  useEffect(() => {
    if (hasRestored.current) return;
    hasRestored.current = true;

    (async () => {
      try {
        const t0 = performance.now();

        const saved = await storage.loadProject(SAVE_ID);
        if (!saved?.data) {
          useStore.getState().setIsRestoring(false);
          return;
        }

        const state = useStore.getState();
        if (state.dataTypes.length > 0 || state.maps.length > 0) {
          state.setIsRestoring(false);
          return;
        }

        state.loadProjectData(saved.data as ProjectData);
        state.setIsRestoring(false);
        console.log(`[AutoSave] Restored (${Math.round(performance.now() - t0)}ms)`);
      } catch (e) {
        console.warn('[AutoSave] Failed to restore:', e);
        useStore.getState().setIsRestoring(false);
      }
    })();
  }, []);

  // ストア変更を検知して自動保存
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let isSaving = false;

    const unsubscribe = useStore.subscribe((state, prevState) => {
      if (state.saveStatus !== prevState.saveStatus) {
        const keys = Object.keys(state) as (keyof typeof state)[];
        const hasOtherChange = keys.some((k) => k !== 'saveStatus' && state[k] !== prevState[k]);
        if (!hasOtherChange) return;
      }

      if (isSaving) return;

      if (timeoutId) clearTimeout(timeoutId);

      isSaving = true;
      state.markAsUnsaved();
      isSaving = false;

      timeoutId = setTimeout(() => {
        isSaving = true;
        const now = new Date();
        const data = buildProjectData();

        storage
          .saveProject({
            id: SAVE_ID,
            name: data.gameSettings?.title || 'Untitled',
            createdAt: now,
            updatedAt: now,
            data,
          })
          .then(() => {
            useStore.getState().markAsSaved();
            isSaving = false;
          })
          .catch((e) => {
            isSaving = false;
            console.warn('[AutoSave] Save failed:', e);
          });
      }, DEBOUNCE_MS);
    });

    return () => {
      unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  return null;
}
