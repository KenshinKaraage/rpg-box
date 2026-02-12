/**
 * UIスライス
 *
 * 保存状態などのUI関連の状態管理
 */

export type SaveStatus = 'saved' | 'unsaved' | 'saving';

export interface UISlice {
  saveStatus: SaveStatus;
  setSaveStatus: (status: SaveStatus) => void;
  markAsUnsaved: () => void;
  markAsSaving: () => void;
  markAsSaved: () => void;
}

export const createUISlice = <T extends UISlice>(
  set: (fn: (state: T) => void) => void
): UISlice => ({
  saveStatus: 'saved',

  setSaveStatus: (status) =>
    set((state) => {
      state.saveStatus = status;
    }),

  markAsUnsaved: () =>
    set((state) => {
      state.saveStatus = 'unsaved';
    }),

  markAsSaving: () =>
    set((state) => {
      state.saveStatus = 'saving';
    }),

  markAsSaved: () =>
    set((state) => {
      state.saveStatus = 'saved';
    }),
});
