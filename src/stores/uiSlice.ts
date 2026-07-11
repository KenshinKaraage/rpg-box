/**
 * UIスライス
 *
 * 保存状態などのUI関連の状態管理
 */

export type SaveStatus = 'saved' | 'unsaved' | 'saving';

export interface UISlice {
  saveStatus: SaveStatus;
  isRestoring: boolean;
  isImportingAssets: boolean;
  setSaveStatus: (status: SaveStatus) => void;
  setIsRestoring: (value: boolean) => void;
  setIsImportingAssets: (value: boolean) => void;
  markAsUnsaved: () => void;
  markAsSaving: () => void;
  markAsSaved: () => void;
}

export const createUISlice = <T extends UISlice>(
  set: (fn: (state: T) => void) => void
): UISlice => ({
  saveStatus: 'saved',
  isRestoring: true,
  isImportingAssets: false,

  setSaveStatus: (status) =>
    set((state) => {
      state.saveStatus = status;
    }),

  setIsRestoring: (value) =>
    set((state) => {
      state.isRestoring = value;
    }),

  setIsImportingAssets: (value) =>
    set((state) => {
      state.isImportingAssets = value;
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
