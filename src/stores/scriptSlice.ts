/**
 * スクリプトスライス
 */
import type { Script, ScriptType } from '@/types/script';
import { getDefaultComponentScripts } from '@/lib/defaultComponentScripts';

export interface ScriptSlice {
  /** スクリプト一覧 */
  scripts: Script[];

  /** イベントスクリプトページで選択中のスクリプトID（ページごとに独立） */
  selectedEventScriptId: string | null;

  /** コンポーネントスクリプトページで選択中のスクリプトID（ページごとに独立） */
  selectedComponentScriptId: string | null;

  /** スクリプトを追加 */
  addScript: (script: Script) => void;

  /** スクリプトを更新 */
  updateScript: (id: string, updates: Partial<Script>) => void;

  /** スクリプトを削除（内部スクリプトも連鎖削除） */
  deleteScript: (id: string) => void;

  /** イベントスクリプトページの選択を変更 */
  selectEventScript: (id: string | null) => void;

  /** コンポーネントスクリプトページの選択を変更 */
  selectComponentScript: (id: string | null) => void;

  /** IDでスクリプトを取得 */
  getScriptById: (id: string) => Script | undefined;

  /** タイプでスクリプトを取得（トップレベルのみ） */
  getScriptsByType: (type: ScriptType) => Script[];

  /** 親スクリプトの内部スクリプトを取得 */
  getInternalScripts: (parentId: string) => Script[];

  /** スクリプトを移動（D&D並び替え用） */
  moveScript: (id: string, newParentId: string | undefined, index: number) => void;

  /** ビルトインコンポーネントスクリプトをシードする（プロジェクト初期化時に呼ぶ） */
  seedDefaultComponentScripts: () => void;
}

export const createScriptSlice = <T extends ScriptSlice>(
  set: (fn: (state: T) => void) => void,
  get: () => T
): ScriptSlice => ({
  scripts: [],
  selectedEventScriptId: null,
  selectedComponentScriptId: null,

  addScript: (script: Script) =>
    set((state) => {
      state.scripts.push(script);
    }),

  updateScript: (id: string, updates: Partial<Script>) =>
    set((state) => {
      const index = state.scripts.findIndex((s) => s.id === id);
      if (index !== -1) {
        state.scripts[index] = { ...state.scripts[index], ...updates } as Script;
        if (updates.id && updates.id !== id) {
          if (state.selectedEventScriptId === id) state.selectedEventScriptId = updates.id;
          if (state.selectedComponentScriptId === id) state.selectedComponentScriptId = updates.id;
        }
      }
    }),

  deleteScript: (id: string) =>
    set((state) => {
      // Collect all descendant IDs recursively
      const idsToDelete = new Set<string>();
      const collectDescendants = (parentId: string) => {
        idsToDelete.add(parentId);
        for (const s of state.scripts) {
          if (s.parentId === parentId && !idsToDelete.has(s.id)) {
            collectDescendants(s.id);
          }
        }
      };
      collectDescendants(id);

      state.scripts = state.scripts.filter((s) => !idsToDelete.has(s.id));
      if (state.selectedEventScriptId && idsToDelete.has(state.selectedEventScriptId)) {
        state.selectedEventScriptId = null;
      }
      if (state.selectedComponentScriptId && idsToDelete.has(state.selectedComponentScriptId)) {
        state.selectedComponentScriptId = null;
      }
    }),

  selectEventScript: (id: string | null) =>
    set((state) => {
      state.selectedEventScriptId = id;
    }),

  selectComponentScript: (id: string | null) =>
    set((state) => {
      state.selectedComponentScriptId = id;
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

  moveScript: (id: string, newParentId: string | undefined, index: number) =>
    set((state) => {
      const scriptIndex = state.scripts.findIndex((s) => s.id === id);
      if (scriptIndex === -1) return;

      // Remove from current position
      const [script] = state.scripts.splice(scriptIndex, 1);
      if (!script) return;

      // Update parentId
      script.parentId = newParentId;

      // Find siblings at the target level
      const siblings = state.scripts.filter((s) =>
        newParentId ? s.parentId === newParentId : !s.parentId
      );

      if (index >= siblings.length) {
        // Insert after the last sibling
        const lastSibling = siblings[siblings.length - 1];
        const insertAt = lastSibling
          ? state.scripts.indexOf(lastSibling) + 1
          : state.scripts.length;
        state.scripts.splice(insertAt, 0, script);
      } else {
        // Insert before the sibling at `index`
        const targetSibling = siblings[index];
        const insertAt = targetSibling
          ? state.scripts.indexOf(targetSibling)
          : state.scripts.length;
        state.scripts.splice(insertAt, 0, script);
      }
    }),

  seedDefaultComponentScripts: () => {
    const defaults = getDefaultComponentScripts();
    set((state) => {
      for (const script of defaults) {
        if (!state.scripts.find((s) => s.id === script.id)) {
          state.scripts.push(script);
        }
      }
    });
  },
});
