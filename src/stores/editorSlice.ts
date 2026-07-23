/**
 * エディタ共通スライス
 *
 * ページ単位の Undo/Redo 履歴管理（design.md#EditorSlice 準拠）
 *
 * @see docs/design.md
 */

/** requirements.md: 履歴100件 */
const MAX_HISTORY = 100;

export interface EditorSlice {
  /** 現在アクティブなページID（例: 'map', 'data'） */
  currentPage: string;
  /** 未保存の変更があるか */
  unsavedChanges: boolean;
  /** ページごとのUndo履歴 */
  undoStacks: Record<string, unknown[]>;
  /** ページごとのRedo履歴 */
  redoStacks: Record<string, unknown[]>;

  setCurrentPage: (page: string) => void;
  markUnsaved: () => void;
  markSaved: () => void;
  /** 現在のページの履歴に状態を積む（変更を適用する前に呼ぶ） */
  pushUndoState: (page: string, state: unknown) => void;
  /** 現在のページを一段階Undo */
  undo: () => void;
  /** 現在のページを一段階Redo */
  redo: () => void;
}

export const createEditorSlice = <T extends EditorSlice>(
  set: (fn: (state: T) => void) => void
): EditorSlice => ({
  currentPage: '',
  unsavedChanges: false,
  undoStacks: {},
  redoStacks: {},

  setCurrentPage: (page) =>
    set((state) => {
      state.currentPage = page;
    }),

  markUnsaved: () =>
    set((state) => {
      state.unsavedChanges = true;
    }),

  markSaved: () =>
    set((state) => {
      state.unsavedChanges = false;
    }),

  pushUndoState: (page, pageState) =>
    set((state) => {
      const stack = state.undoStacks[page] ?? (state.undoStacks[page] = []);
      stack.push(pageState);
      if (stack.length > MAX_HISTORY) stack.shift();
      // 新しい変更が入ったのでRedo履歴は無効
      state.redoStacks[page] = [];
    }),

  undo: () =>
    set((state) => {
      const stack = state.undoStacks[state.currentPage];
      const popped = stack?.pop() as Record<string, unknown> | undefined;
      if (!popped) return;

      const before: Record<string, unknown> = {};
      for (const key of Object.keys(popped)) {
        before[key] = (state as unknown as Record<string, unknown>)[key];
      }
      const redoStack =
        state.redoStacks[state.currentPage] ?? (state.redoStacks[state.currentPage] = []);
      redoStack.push(before);

      Object.assign(state, popped);
    }),

  redo: () =>
    set((state) => {
      const stack = state.redoStacks[state.currentPage];
      const popped = stack?.pop() as Record<string, unknown> | undefined;
      if (!popped) return;

      const before: Record<string, unknown> = {};
      for (const key of Object.keys(popped)) {
        before[key] = (state as unknown as Record<string, unknown>)[key];
      }
      const undoStack =
        state.undoStacks[state.currentPage] ?? (state.undoStacks[state.currentPage] = []);
      undoStack.push(before);

      Object.assign(state, popped);
    }),
});
