import { StateCreator } from 'zustand';
import { GameSettings, DEFAULT_GAME_SETTINGS } from '@/types/gameSettings';

/**
 * ゲーム設定スライスの状態とアクション
 */
export interface GameSettingsSlice {
  /** ゲーム設定 */
  gameSettings: GameSettings;

  /** ゲーム設定を部分更新 */
  updateGameSettings: (updates: Partial<GameSettings>) => void;

  /** ゲーム設定をデフォルト値にリセット */
  resetGameSettings: () => void;
}

/**
 * ゲーム設定スライスの作成
 */
export const createGameSettingsSlice: StateCreator<
  GameSettingsSlice,
  [['zustand/immer', never]],
  [],
  GameSettingsSlice
> = (set) => ({
  gameSettings: { ...DEFAULT_GAME_SETTINGS },

  updateGameSettings: (updates) =>
    set((state) => {
      state.gameSettings = {
        ...state.gameSettings,
        ...updates,
      };
    }),

  resetGameSettings: () =>
    set((state) => {
      state.gameSettings = { ...DEFAULT_GAME_SETTINGS };
    }),
});
