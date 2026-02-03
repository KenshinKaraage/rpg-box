import { createGameSettingsSlice, GameSettingsSlice } from './gameSettingsSlice';
import { DEFAULT_GAME_SETTINGS } from '@/types/gameSettings';

// Zustandのスライステスト用のモックストア
function createMockStore(): GameSettingsSlice {
  // immer互換のsetを模倣
  const set = (fn: (state: GameSettingsSlice) => void) => {
    fn(store);
  };

  const getState = () => store;

  const store = createGameSettingsSlice(set as never, getState as never, {} as never);

  return store;
}

describe('gameSettingsSlice', () => {
  describe('initial state', () => {
    it('has default game settings', () => {
      const store = createMockStore();
      expect(store.gameSettings).toEqual(DEFAULT_GAME_SETTINGS);
    });
  });

  describe('updateGameSettings', () => {
    it('updates title', () => {
      const store = createMockStore();
      store.updateGameSettings({ title: 'New Title' });
      expect(store.gameSettings.title).toBe('New Title');
    });

    it('updates version', () => {
      const store = createMockStore();
      store.updateGameSettings({ version: '2.0.0' });
      expect(store.gameSettings.version).toBe('2.0.0');
    });

    it('updates author', () => {
      const store = createMockStore();
      store.updateGameSettings({ author: 'John Doe' });
      expect(store.gameSettings.author).toBe('John Doe');
    });

    it('updates description', () => {
      const store = createMockStore();
      store.updateGameSettings({ description: 'An epic adventure' });
      expect(store.gameSettings.description).toBe('An epic adventure');
    });

    it('updates resolution', () => {
      const store = createMockStore();
      store.updateGameSettings({ resolution: { width: 1920, height: 1080 } });
      expect(store.gameSettings.resolution).toEqual({ width: 1920, height: 1080 });
    });

    it('updates startMapId', () => {
      const store = createMockStore();
      store.updateGameSettings({ startMapId: 'map_forest' });
      expect(store.gameSettings.startMapId).toBe('map_forest');
    });

    it('updates startPosition', () => {
      const store = createMockStore();
      store.updateGameSettings({ startPosition: { x: 10, y: 20 } });
      expect(store.gameSettings.startPosition).toEqual({ x: 10, y: 20 });
    });

    it('updates defaultBGM', () => {
      const store = createMockStore();
      store.updateGameSettings({ defaultBGM: 'bgm/main.mp3' });
      expect(store.gameSettings.defaultBGM).toBe('bgm/main.mp3');
    });

    it('updates icon', () => {
      const store = createMockStore();
      store.updateGameSettings({ icon: 'images/icon.png' });
      expect(store.gameSettings.icon).toBe('images/icon.png');
    });

    it('updates multiple fields at once', () => {
      const store = createMockStore();
      store.updateGameSettings({
        title: 'My Game',
        version: '1.0.0',
        author: 'Developer',
      });
      expect(store.gameSettings.title).toBe('My Game');
      expect(store.gameSettings.version).toBe('1.0.0');
      expect(store.gameSettings.author).toBe('Developer');
    });

    it('preserves existing values when updating partial', () => {
      const store = createMockStore();
      store.updateGameSettings({ title: 'First Title' });
      store.updateGameSettings({ version: '2.0.0' });

      expect(store.gameSettings.title).toBe('First Title');
      expect(store.gameSettings.version).toBe('2.0.0');
    });
  });

  describe('resetGameSettings', () => {
    it('resets to default values', () => {
      const store = createMockStore();
      store.updateGameSettings({
        title: 'Custom Title',
        version: '5.0.0',
        author: 'Custom Author',
      });

      store.resetGameSettings();

      expect(store.gameSettings).toEqual(DEFAULT_GAME_SETTINGS);
    });
  });
});
