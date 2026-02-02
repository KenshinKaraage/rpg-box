import type {
  ProjectData,
  SavedProject,
  StorageProvider,
  TempStorageProvider,
  TempSaveData,
  GameSaveData,
  UndoHistory,
  SaveResult,
  LoadResult,
  StorageError,
} from './types';

describe('Storage types', () => {
  describe('ProjectData', () => {
    it('can be created with all required fields', () => {
      const projectData: ProjectData = {
        dataTypes: [],
        dataEntries: {},
        fieldSets: [],
        classes: [],
        variables: [],
        maps: [],
        chipsets: [],
        prefabs: [],
        events: [],
        eventTemplates: [],
        uiCanvases: [],
        objectUIs: [],
        uiTemplates: [],
        scripts: [],
        assets: [],
        gameSettings: {
          title: 'Test Game',
          version: '1.0.0',
          author: 'Test Author',
          description: 'Test Description',
          resolution: { width: 1280, height: 720 },
          startMapId: 'map_001',
          startPosition: { x: 0, y: 0 },
        },
      };

      expect(projectData.gameSettings.title).toBe('Test Game');
      expect(projectData.maps).toEqual([]);
    });

    it('can include data types and entries', () => {
      const projectData: ProjectData = {
        dataTypes: [
          {
            id: 'character',
            name: 'キャラクター',
            fields: [
              { id: 'name', name: '名前', type: 'string', required: true },
              { id: 'hp', name: 'HP', type: 'number', required: true },
              { id: 'mp', name: 'MP', type: 'number', required: false },
            ],
            maxEntries: 100,
          },
        ],
        dataEntries: {
          character: [
            {
              id: 'char_001',
              typeId: 'character',
              values: {
                name: '勇者',
                hp: 100,
                mp: 50,
              },
            },
          ],
        },
        fieldSets: [
          {
            id: 'fs_basic_stats',
            name: '基本ステータス',
            fields: [
              { id: 'max_hp', name: '最大HP', type: 'number', required: true },
              { id: 'max_mp', name: '最大MP', type: 'number', required: true },
              { id: 'attack', name: '攻撃力', type: 'number', required: true },
              { id: 'defense', name: '防御力', type: 'number', required: true },
            ],
          },
        ],
        classes: [],
        variables: [],
        maps: [],
        chipsets: [],
        prefabs: [],
        events: [],
        eventTemplates: [],
        uiCanvases: [],
        objectUIs: [],
        uiTemplates: [],
        scripts: [],
        assets: [],
        gameSettings: {
          title: 'Test Game',
          version: '1.0.0',
          author: 'Test Author',
          description: 'Test Description',
          resolution: { width: 1280, height: 720 },
          startMapId: 'map_001',
          startPosition: { x: 0, y: 0 },
        },
      };

      expect(projectData.dataTypes).toHaveLength(1);
      expect(projectData.dataEntries['character']).toHaveLength(1);
      expect(projectData.dataEntries['character']?.[0]?.values['name']).toBe('勇者');
    });
  });

  describe('SavedProject', () => {
    it('includes meta data and project data', () => {
      const savedProject: SavedProject = {
        id: 'proj_001',
        name: 'My RPG',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
        data: {
          dataTypes: [],
          dataEntries: {},
          fieldSets: [],
          classes: [],
          variables: [],
          maps: [],
          chipsets: [],
          prefabs: [],
          events: [],
          eventTemplates: [],
          uiCanvases: [],
          objectUIs: [],
          uiTemplates: [],
          scripts: [],
          assets: [],
          gameSettings: {
            title: 'My RPG',
            version: '1.0.0',
            author: 'Test Author',
            description: 'My RPG Description',
            resolution: { width: 1280, height: 720 },
            startMapId: 'map_001',
            startPosition: { x: 5, y: 10 },
          },
        },
      };

      expect(savedProject.id).toBe('proj_001');
      expect(savedProject.name).toBe('My RPG');
      expect(savedProject.data.gameSettings.title).toBe('My RPG');
    });
  });

  describe('StorageProvider interface', () => {
    it('can be implemented as a mock', async () => {
      const mockStorage: StorageProvider = {
        saveProject: jest.fn().mockResolvedValue(undefined),
        loadProject: jest.fn().mockResolvedValue(null),
        deleteProject: jest.fn().mockResolvedValue(undefined),
        listProjects: jest.fn().mockResolvedValue([]),
        projectExists: jest.fn().mockResolvedValue(false),
        saveUndoHistory: jest.fn().mockResolvedValue(undefined),
        loadUndoHistory: jest.fn().mockResolvedValue(null),
        clearUndoHistory: jest.fn().mockResolvedValue(undefined),
        saveGameData: jest.fn().mockResolvedValue(undefined),
        loadGameData: jest.fn().mockResolvedValue(null),
        deleteGameData: jest.fn().mockResolvedValue(undefined),
        listGameSaves: jest.fn().mockResolvedValue([]),
      };

      const projects = await mockStorage.listProjects();
      expect(projects).toEqual([]);
      expect(mockStorage.listProjects).toHaveBeenCalled();
    });
  });

  describe('TempStorageProvider interface', () => {
    it('can be implemented as a mock', () => {
      const tempData: TempSaveData = {
        timestamp: Date.now(),
        projectId: 'proj_001',
        data: {
          gameSettings: {
            title: 'Temp Save',
            version: '1.0.0',
            author: 'Test',
            description: 'Temp',
            resolution: { width: 1280, height: 720 },
            startMapId: 'map_001',
            startPosition: { x: 0, y: 0 },
          },
        },
      };

      const mockTempStorage: TempStorageProvider = {
        saveTempData: jest.fn(),
        loadTempData: jest.fn().mockReturnValue(tempData),
        clearTempData: jest.fn(),
        hasTempData: jest.fn().mockReturnValue(true),
      };

      expect(mockTempStorage.hasTempData()).toBe(true);
      expect(mockTempStorage.loadTempData()).toEqual(tempData);
    });
  });

  describe('GameSaveData', () => {
    it('represents a game save slot', () => {
      const gameSave: GameSaveData = {
        slotId: 1,
        savedAt: new Date(),
        playtime: 3600000, // 1 hour in ms
        variables: {
          gold: 1000,
          playerName: 'Hero',
        },
        partyState: {
          members: ['hero', 'mage'],
        },
        currentMapId: 'map_dungeon_01',
        position: { x: 15, y: 20 },
        customMeta: {
          chapter: 3,
        },
      };

      expect(gameSave.slotId).toBe(1);
      expect(gameSave.playtime).toBe(3600000);
      expect(gameSave.variables['gold']).toBe(1000);
    });
  });

  describe('UndoHistory', () => {
    it('tracks state history for a page', () => {
      const undoHistory: UndoHistory = {
        states: [{ zoom: 1 }, { zoom: 1.5 }, { zoom: 2 }],
        currentIndex: 2,
      };

      expect(undoHistory.states).toHaveLength(3);
      expect(undoHistory.currentIndex).toBe(2);
    });
  });

  describe('SaveResult', () => {
    it('represents a successful save', () => {
      const result: SaveResult = { success: true };
      expect(result.success).toBe(true);
    });

    it('represents a failed save with error', () => {
      const error: StorageError = {
        type: 'QUOTA_EXCEEDED',
        message: 'Storage quota exceeded',
      };
      const result: SaveResult = { success: false, error };

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('QUOTA_EXCEEDED');
      }
    });
  });

  describe('LoadResult', () => {
    it('represents a successful load with data', () => {
      const result: LoadResult<{ name: string }> = {
        success: true,
        data: { name: 'Test Project' },
      };

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Test Project');
      }
    });

    it('represents a failed load with error', () => {
      const error: StorageError = {
        type: 'NOT_FOUND',
        message: 'Project not found',
      };
      const result: LoadResult<{ name: string }> = { success: false, error };

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('NOT_FOUND');
      }
    });
  });
});
