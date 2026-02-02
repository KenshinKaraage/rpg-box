import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

type SaveStatus = 'saved' | 'unsaved' | 'saving';

interface UISlice {
  saveStatus: SaveStatus;
  setSaveStatus: (status: SaveStatus) => void;
  markAsUnsaved: () => void;
  markAsSaving: () => void;
  markAsSaved: () => void;
}

export const useStore = create<UISlice>()(
  immer((set) => ({
    // UI Slice
    saveStatus: 'saved' as SaveStatus,
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
  }))
);
