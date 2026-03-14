/**
 * gameSettingsSlice のテスト
 */
import { act, renderHook } from '@testing-library/react';
import { useStore } from './index';
import { DEFAULT_GAME_SETTINGS } from '@/types/gameSettings';

describe('gameSettingsSlice', () => {
  beforeEach(() => {
    // ストアをリセット
    act(() => {
      useStore.getState().resetGameSettings();
    });
  });

  describe('initial state', () => {
    it('has default game settings', () => {
      const { result } = renderHook(() => useStore((state) => state.gameSettings));
      expect(result.current).toEqual(DEFAULT_GAME_SETTINGS);
    });
  });

  describe('updateGameSettings', () => {
    it('updates title', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.updateGameSettings({ title: 'New Title' });
      });

      expect(result.current.gameSettings.title).toBe('New Title');
    });

    it('updates version', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.updateGameSettings({ version: '2.0.0' });
      });

      expect(result.current.gameSettings.version).toBe('2.0.0');
    });

    it('updates author', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.updateGameSettings({ author: 'John Doe' });
      });

      expect(result.current.gameSettings.author).toBe('John Doe');
    });

    it('updates description', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.updateGameSettings({ description: 'An epic adventure' });
      });

      expect(result.current.gameSettings.description).toBe('An epic adventure');
    });

    it('updates resolution', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.updateGameSettings({ resolution: { width: 1920, height: 1080 } });
      });

      expect(result.current.gameSettings.resolution).toEqual({ width: 1920, height: 1080 });
    });

    it('updates startMapId', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.updateGameSettings({ startMapId: 'map_forest' });
      });

      expect(result.current.gameSettings.startMapId).toBe('map_forest');
    });

    it('updates defaultBGM', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.updateGameSettings({ defaultBGM: 'bgm/main.mp3' });
      });

      expect(result.current.gameSettings.defaultBGM).toBe('bgm/main.mp3');
    });

    it('updates icon', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.updateGameSettings({ icon: 'images/icon.png' });
      });

      expect(result.current.gameSettings.icon).toBe('images/icon.png');
    });

    it('updates multiple fields at once', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.updateGameSettings({
          title: 'My Game',
          version: '1.0.0',
          author: 'Developer',
        });
      });

      expect(result.current.gameSettings.title).toBe('My Game');
      expect(result.current.gameSettings.version).toBe('1.0.0');
      expect(result.current.gameSettings.author).toBe('Developer');
    });

    it('preserves existing values when updating partial', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.updateGameSettings({ title: 'First Title' });
      });

      act(() => {
        result.current.updateGameSettings({ version: '2.0.0' });
      });

      expect(result.current.gameSettings.title).toBe('First Title');
      expect(result.current.gameSettings.version).toBe('2.0.0');
    });
  });

  describe('resetGameSettings', () => {
    it('resets to default values', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.updateGameSettings({
          title: 'Custom Title',
          version: '5.0.0',
          author: 'Custom Author',
        });
      });

      act(() => {
        result.current.resetGameSettings();
      });

      expect(result.current.gameSettings).toEqual(DEFAULT_GAME_SETTINGS);
    });
  });
});
