import { create, StateCreator } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createGameSettingsSlice, GameSettingsSlice } from './gameSettingsSlice';

type SaveStatus = 'saved' | 'unsaved' | 'saving';

interface UISlice {
  saveStatus: SaveStatus;
  setSaveStatus: (status: SaveStatus) => void;
  markAsUnsaved: () => void;
  markAsSaving: () => void;
  markAsSaved: () => void;
}

const createUISlice: StateCreator<StoreState, [['zustand/immer', never]], [], UISlice> = (set) => ({
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
});

type StoreState = UISlice & GameSettingsSlice;

export const useStore = create<StoreState>()(
  immer((...args) => ({
    ...createUISlice(...args),
    ...createGameSettingsSlice(...args),
  }))
);
