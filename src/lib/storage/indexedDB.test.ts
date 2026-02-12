/**
 * IndexedDB ストレージプロバイダーのテスト
 */
import 'fake-indexeddb/auto';

import { IndexedDBStorageProvider, getIndexedDBStorage, resetIndexedDBStorage } from './indexedDB';
import type { SavedProject, UndoHistory, GameSaveData, ProjectData } from './types';

// テスト用のヘルパー関数
function createTestProjectData(): ProjectData {
  return {
    dataTypes: [],
    dataEntries: {},
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
}

function createTestProject(id: string, name: string): SavedProject {
  return {
    id,
    name,
    createdAt: new Date(),
    updatedAt: new Date(),
    data: createTestProjectData(),
  };
}

describe('IndexedDBStorageProvider', () => {
  let storage: IndexedDBStorageProvider;

  beforeEach(async () => {
    resetIndexedDBStorage();
    storage = new IndexedDBStorageProvider();
    await storage.clearAll();
  });

  afterEach(() => {
    storage.close();
  });

  describe('プロジェクト操作', () => {
    it('プロジェクトを保存して読み込める', async () => {
      const project = createTestProject('proj_001', 'My RPG');

      await storage.saveProject(project);
      const loaded = await storage.loadProject('proj_001');

      expect(loaded).not.toBeNull();
      expect(loaded?.id).toBe('proj_001');
      expect(loaded?.name).toBe('My RPG');
      expect(loaded?.data.gameSettings.title).toBe('Test Game');
    });

    it('存在しないプロジェクトはnullを返す', async () => {
      const loaded = await storage.loadProject('nonexistent');
      expect(loaded).toBeNull();
    });

    it('プロジェクトを更新できる', async () => {
      const project = createTestProject('proj_001', 'My RPG');
      await storage.saveProject(project);

      project.name = 'Updated RPG';
      project.updatedAt = new Date();
      await storage.saveProject(project);

      const loaded = await storage.loadProject('proj_001');
      expect(loaded?.name).toBe('Updated RPG');
    });

    it('プロジェクトを削除できる', async () => {
      const project = createTestProject('proj_001', 'My RPG');
      await storage.saveProject(project);

      await storage.deleteProject('proj_001');

      const loaded = await storage.loadProject('proj_001');
      expect(loaded).toBeNull();
    });

    it('プロジェクト一覧を取得できる', async () => {
      const project1 = createTestProject('proj_001', 'RPG 1');
      project1.updatedAt = new Date('2024-01-01');

      const project2 = createTestProject('proj_002', 'RPG 2');
      project2.updatedAt = new Date('2024-01-02');

      await storage.saveProject(project1);
      await storage.saveProject(project2);

      const projects = await storage.listProjects();

      expect(projects).toHaveLength(2);
      // 新しい順
      expect(projects[0]?.id).toBe('proj_002');
      expect(projects[1]?.id).toBe('proj_001');
    });

    it('プロジェクトの存在確認ができる', async () => {
      const project = createTestProject('proj_001', 'My RPG');
      await storage.saveProject(project);

      expect(await storage.projectExists('proj_001')).toBe(true);
      expect(await storage.projectExists('nonexistent')).toBe(false);
    });

    it('プロジェクト削除時に関連データも削除される', async () => {
      const project = createTestProject('proj_001', 'My RPG');
      await storage.saveProject(project);

      // 関連データを追加
      const undoHistory: UndoHistory = {
        states: [{ test: 1 }],
        currentIndex: 0,
      };
      await storage.saveUndoHistory('proj_001', 'map_editor', undoHistory);

      const gameSave: GameSaveData = {
        slotId: 1,
        savedAt: new Date(),
        playtime: 1000,
        variables: {},
        partyState: {},
        currentMapId: 'map_001',
        position: { x: 0, y: 0 },
      };
      await storage.saveGameData('proj_001', gameSave);

      // プロジェクト削除
      await storage.deleteProject('proj_001');

      // 関連データも削除されていることを確認
      const loadedUndo = await storage.loadUndoHistory('proj_001', 'map_editor');
      expect(loadedUndo).toBeNull();

      const loadedSave = await storage.loadGameData('proj_001', 1);
      expect(loadedSave).toBeNull();
    });
  });

  describe('Undo/Redo履歴操作', () => {
    it('Undo履歴を保存して読み込める', async () => {
      const history: UndoHistory = {
        states: [{ zoom: 1 }, { zoom: 1.5 }, { zoom: 2 }],
        currentIndex: 2,
      };

      await storage.saveUndoHistory('proj_001', 'map_editor', history);
      const loaded = await storage.loadUndoHistory('proj_001', 'map_editor');

      expect(loaded).not.toBeNull();
      expect(loaded?.states).toHaveLength(3);
      expect(loaded?.currentIndex).toBe(2);
    });

    it('存在しないUndo履歴はnullを返す', async () => {
      const loaded = await storage.loadUndoHistory('nonexistent', 'page');
      expect(loaded).toBeNull();
    });

    it('プロジェクトのUndo履歴をクリアできる', async () => {
      const history1: UndoHistory = {
        states: [{ test: 1 }],
        currentIndex: 0,
      };
      const history2: UndoHistory = {
        states: [{ test: 2 }],
        currentIndex: 0,
      };
      const history3: UndoHistory = {
        states: [{ test: 3 }],
        currentIndex: 0,
      };

      await storage.saveUndoHistory('proj_001', 'map_editor', history1);
      await storage.saveUndoHistory('proj_001', 'data_editor', history2);
      await storage.saveUndoHistory('proj_002', 'map_editor', history3);

      await storage.clearUndoHistory('proj_001');

      // proj_001 の履歴は削除
      expect(await storage.loadUndoHistory('proj_001', 'map_editor')).toBeNull();
      expect(await storage.loadUndoHistory('proj_001', 'data_editor')).toBeNull();

      // proj_002 の履歴は残っている
      expect(await storage.loadUndoHistory('proj_002', 'map_editor')).not.toBeNull();
    });
  });

  describe('ゲームセーブ操作', () => {
    it('ゲームセーブを保存して読み込める', async () => {
      const save: GameSaveData = {
        slotId: 1,
        savedAt: new Date(),
        playtime: 3600000,
        variables: { gold: 1000 },
        partyState: { members: ['hero'] },
        currentMapId: 'map_dungeon',
        position: { x: 10, y: 20 },
      };

      await storage.saveGameData('proj_001', save);
      const loaded = await storage.loadGameData('proj_001', 1);

      expect(loaded).not.toBeNull();
      expect(loaded?.playtime).toBe(3600000);
      expect(loaded?.variables).toEqual({ gold: 1000 });
    });

    it('存在しないゲームセーブはnullを返す', async () => {
      const loaded = await storage.loadGameData('nonexistent', 1);
      expect(loaded).toBeNull();
    });

    it('ゲームセーブを削除できる', async () => {
      const save: GameSaveData = {
        slotId: 1,
        savedAt: new Date(),
        playtime: 1000,
        variables: {},
        partyState: {},
        currentMapId: 'map_001',
        position: { x: 0, y: 0 },
      };

      await storage.saveGameData('proj_001', save);
      await storage.deleteGameData('proj_001', 1);

      const loaded = await storage.loadGameData('proj_001', 1);
      expect(loaded).toBeNull();
    });

    it('プロジェクトのゲームセーブ一覧を取得できる', async () => {
      const save1: GameSaveData = {
        slotId: 1,
        savedAt: new Date(),
        playtime: 1000,
        variables: {},
        partyState: {},
        currentMapId: 'map_001',
        position: { x: 0, y: 0 },
      };
      const save2: GameSaveData = {
        slotId: 3,
        savedAt: new Date(),
        playtime: 2000,
        variables: {},
        partyState: {},
        currentMapId: 'map_002',
        position: { x: 5, y: 5 },
      };
      const save3: GameSaveData = {
        slotId: 1,
        savedAt: new Date(),
        playtime: 500,
        variables: {},
        partyState: {},
        currentMapId: 'map_001',
        position: { x: 0, y: 0 },
      };

      await storage.saveGameData('proj_001', save1);
      await storage.saveGameData('proj_001', save2);
      await storage.saveGameData('proj_002', save3);

      const saves = await storage.listGameSaves('proj_001');

      expect(saves).toHaveLength(2);
      // スロットID順
      expect(saves[0]?.slotId).toBe(1);
      expect(saves[1]?.slotId).toBe(3);
    });
  });

  describe('シングルトン', () => {
    it('getIndexedDBStorage は同じインスタンスを返す', () => {
      resetIndexedDBStorage();
      const instance1 = getIndexedDBStorage();
      const instance2 = getIndexedDBStorage();
      expect(instance1).toBe(instance2);
    });

    it('resetIndexedDBStorage でインスタンスをリセットできる', () => {
      const instance1 = getIndexedDBStorage();
      resetIndexedDBStorage();
      const instance2 = getIndexedDBStorage();
      expect(instance1).not.toBe(instance2);
    });
  });
});
