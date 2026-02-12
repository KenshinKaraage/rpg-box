/**
 * ゲーム設定スライス
 */
import { DEFAULT_GAME_SETTINGS } from '@/types/gameSettings';
import type { GameSettings } from '@/types/gameSettings';

export interface GameSettingsSlice {
  /** ゲーム設定 */
  gameSettings: GameSettings;

  /** ゲーム設定を部分更新 */
  updateGameSettings: (updates: Partial<GameSettings>) => void;

  /** ゲーム設定をデフォルト値にリセット */
  resetGameSettings: () => void;
}

export const createGameSettingsSlice = <T extends GameSettingsSlice>(
  set: (fn: (state: T) => void) => void
): GameSettingsSlice => ({
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
