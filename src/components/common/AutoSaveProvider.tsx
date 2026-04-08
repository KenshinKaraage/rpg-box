'use client';

import { useEffect, useRef } from 'react';
import { useStore } from '@/stores';
import { buildProjectData } from '@/features/test-play/buildProjectData';
import { IndexedDBStorageProvider } from '@/lib/storage/indexedDB';
import type { ProjectData } from '@/lib/storage/types';

const DEBOUNCE_MS = 1000;
const SAVE_ID_STRUCTURE = 'autosave';
const SAVE_ID_ASSETS = 'autosave_assets';

const storage = new IndexedDBStorageProvider();

/** アセットデータを除いた軽量版を作る */
function buildLightProjectData(): ProjectData {
  const full = buildProjectData();
  return {
    ...full,
    assets: full.assets.map((a) => ({ ...a, data: '' })),
  };
}

/** アセットデータだけ抽出 */
function buildAssetData(): ProjectData['assets'] {
  const state = useStore.getState();
  return state.assets as unknown as ProjectData['assets'];
}

/**
 * ストアの変更を検知してIndexedDBに自動保存するプロバイダ。
 * 構造データ（軽量）とアセットデータ（重い）を分けて保存する。
 * 起動時は構造データを先にロードし、アセットは非同期で後からロード。
 */
export function AutoSaveProvider() {
  const hasRestored = useRef(false);

  // 起動時に復元: 構造データ → アセットデータ
  useEffect(() => {
    if (hasRestored.current) return;
    hasRestored.current = true;

    (async () => {
      try {
        const t0 = performance.now();

        // 1. 構造データを先にロード
        const saved = await storage.loadProject(SAVE_ID_STRUCTURE);
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
        console.log(`[AutoSave] Structure restored (${Math.round(performance.now() - t0)}ms)`);

        // 2. アセットデータを後からロード
        const t1 = performance.now();
        const assetSaved = await storage.loadProject(SAVE_ID_ASSETS);
        if (assetSaved?.data?.assets) {
          const assets = assetSaved.data.assets as unknown as typeof state.assets;
          for (const asset of assets) {
            if (asset.data) {
              const existing = useStore.getState().assets.find((a) => a.id === asset.id);
              if (existing && !existing.data) {
                useStore.getState().updateAsset(asset.id, { data: asset.data });
              }
            }
          }
          console.log(`[AutoSave] Assets restored (${Math.round(performance.now() - t1)}ms)`);
        }

        console.log(`[AutoSave] Total restore: ${Math.round(performance.now() - t0)}ms`);
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

      const assetsChanged = state.assets !== prevState.assets;

      timeoutId = setTimeout(() => {
        isSaving = true;
        const now = new Date();

        // 構造データは毎回保存（軽い）
        const lightData = buildLightProjectData();
        const structurePromise = storage.saveProject({
          id: SAVE_ID_STRUCTURE,
          name: lightData.gameSettings?.title || 'Untitled',
          createdAt: now,
          updatedAt: now,
          data: lightData,
        });

        // アセットは変更があった時だけ保存
        const assetPromise = assetsChanged
          ? storage.saveProject({
              id: SAVE_ID_ASSETS,
              name: 'assets',
              createdAt: now,
              updatedAt: now,
              data: { assets: buildAssetData() } as unknown as ProjectData,
            })
          : Promise.resolve();

        Promise.all([structurePromise, assetPromise])
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
