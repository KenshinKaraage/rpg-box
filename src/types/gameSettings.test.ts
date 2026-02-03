import type { GameSettings, Resolution, Position } from './gameSettings';
import { DEFAULT_GAME_SETTINGS, RESOLUTION_PRESETS } from './gameSettings';

describe('GameSettings type', () => {
  describe('Resolution type', () => {
    it('has width and height properties', () => {
      const resolution: Resolution = {
        width: 1280,
        height: 720,
      };
      expect(resolution.width).toBe(1280);
      expect(resolution.height).toBe(720);
    });
  });

  describe('Position type', () => {
    it('has x and y properties', () => {
      const position: Position = {
        x: 10,
        y: 20,
      };
      expect(position.x).toBe(10);
      expect(position.y).toBe(20);
    });
  });

  describe('GameSettings type', () => {
    it('has all required properties', () => {
      const settings: GameSettings = {
        title: 'My RPG Game',
        version: '1.0.0',
        author: 'Game Developer',
        description: 'An epic adventure',
        resolution: { width: 1280, height: 720 },
        startMapId: 'map_001',
        startPosition: { x: 5, y: 10 },
      };

      expect(settings.title).toBe('My RPG Game');
      expect(settings.version).toBe('1.0.0');
      expect(settings.author).toBe('Game Developer');
      expect(settings.description).toBe('An epic adventure');
      expect(settings.resolution.width).toBe(1280);
      expect(settings.resolution.height).toBe(720);
      expect(settings.startMapId).toBe('map_001');
      expect(settings.startPosition.x).toBe(5);
      expect(settings.startPosition.y).toBe(10);
    });

    it('allows optional defaultBGM', () => {
      const settingsWithBGM: GameSettings = {
        title: 'My RPG Game',
        version: '1.0.0',
        author: 'Game Developer',
        description: '',
        resolution: { width: 1280, height: 720 },
        startMapId: 'map_001',
        startPosition: { x: 0, y: 0 },
        defaultBGM: 'bgm/title.mp3',
      };

      expect(settingsWithBGM.defaultBGM).toBe('bgm/title.mp3');
    });

    it('allows optional icon', () => {
      const settingsWithIcon: GameSettings = {
        title: 'My RPG Game',
        version: '1.0.0',
        author: 'Game Developer',
        description: '',
        resolution: { width: 1280, height: 720 },
        startMapId: 'map_001',
        startPosition: { x: 0, y: 0 },
        icon: 'images/icon.png',
      };

      expect(settingsWithIcon.icon).toBe('images/icon.png');
    });
  });

  describe('DEFAULT_GAME_SETTINGS', () => {
    it('has sensible default values', () => {
      expect(DEFAULT_GAME_SETTINGS.title).toBe('無題のゲーム');
      expect(DEFAULT_GAME_SETTINGS.version).toBe('0.1.0');
      expect(DEFAULT_GAME_SETTINGS.author).toBe('');
      expect(DEFAULT_GAME_SETTINGS.description).toBe('');
      expect(DEFAULT_GAME_SETTINGS.resolution).toEqual({ width: 1280, height: 720 });
      expect(DEFAULT_GAME_SETTINGS.startMapId).toBe('');
      expect(DEFAULT_GAME_SETTINGS.startPosition).toEqual({ x: 0, y: 0 });
    });

    it('does not have optional fields set', () => {
      expect(DEFAULT_GAME_SETTINGS.defaultBGM).toBeUndefined();
      expect(DEFAULT_GAME_SETTINGS.icon).toBeUndefined();
    });
  });

  describe('RESOLUTION_PRESETS', () => {
    it('contains common resolution options', () => {
      expect(RESOLUTION_PRESETS.length).toBeGreaterThan(0);

      const hdPreset = RESOLUTION_PRESETS.find((p) => p.resolution.width === 1280);
      expect(hdPreset).toBeDefined();
      expect(hdPreset?.resolution.height).toBe(720);
    });

    it('each preset has label and resolution', () => {
      RESOLUTION_PRESETS.forEach((preset) => {
        expect(preset.label).toBeTruthy();
        expect(preset.resolution.width).toBeGreaterThan(0);
        expect(preset.resolution.height).toBeGreaterThan(0);
      });
    });
  });
});
