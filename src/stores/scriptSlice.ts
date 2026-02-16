/**
 * スクリプトスライス
 */
import type { Script, ScriptType } from '@/types/script';

export interface ScriptSlice {
  /** スクリプト一覧 */
  scripts: Script[];

  /** 選択中のスクリプトID */
  selectedScriptId: string | null;

  /** スクリプトを追加 */
  addScript: (script: Script) => void;

  /** スクリプトを更新 */
  updateScript: (id: string, updates: Partial<Script>) => void;

  /** スクリプトを削除（内部スクリプトも連鎖削除） */
  deleteScript: (id: string) => void;

  /** スクリプトを選択 */
  selectScript: (id: string | null) => void;

  /** IDでスクリプトを取得 */
  getScriptById: (id: string) => Script | undefined;

  /** タイプでスクリプトを取得（トップレベルのみ） */
  getScriptsByType: (type: ScriptType) => Script[];

  /** 親スクリプトの内部スクリプトを取得 */
  getInternalScripts: (parentId: string) => Script[];
}

export const createScriptSlice = <T extends ScriptSlice>(
  set: (fn: (state: T) => void) => void,
  get: () => T
): ScriptSlice => ({
  scripts: [],
  selectedScriptId: null,

  addScript: (script: Script) =>
    set((state) => {
      state.scripts.push(script);
    }),

  updateScript: (id: string, updates: Partial<Script>) =>
    set((state) => {
      const index = state.scripts.findIndex((s) => s.id === id);
      if (index !== -1) {
        state.scripts[index] = { ...state.scripts[index], ...updates } as Script;
        if (updates.id && updates.id !== id && state.selectedScriptId === id) {
          state.selectedScriptId = updates.id;
        }
      }
    }),

  deleteScript: (id: string) =>
    set((state) => {
      // 内部スクリプトも連鎖削除
      state.scripts = state.scripts.filter((s) => s.id !== id && s.parentId !== id);
      if (state.selectedScriptId === id) {
        state.selectedScriptId = null;
      }
    }),

  selectScript: (id: string | null) =>
    set((state) => {
      state.selectedScriptId = id;
    }),

  getScriptById: (id: string) => {
    return get().scripts.find((s) => s.id === id);
  },

  getScriptsByType: (type: ScriptType) => {
    return get().scripts.filter((s) => s.type === type && !s.parentId);
  },

  getInternalScripts: (parentId: string) => {
    return get().scripts.filter((s) => s.parentId === parentId);
  },
});
