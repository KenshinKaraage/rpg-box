/**
 * useStorage フックのテスト
 */
import { renderHook, act } from '@testing-library/react';
import { useStorage } from './useStorage';
import { resetIndexedDBStorage } from '@/lib/storage/indexedDB';
import type { SavedProject, ProjectData } from '@/lib/storage/types';

// fake-indexeddb を使用
import 'fake-indexeddb/auto';

// テスト用ヘルパー
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

describe('useStorage', () => {
  beforeEach(() => {
    resetIndexedDBStorage();
  });

  describe('初期状態', () => {
    it('operation は idle で error は null', () => {
      const { result } = renderHook(() => useStorage());

      expect(result.current.operation).toBe('idle');
      expect(result.current.error).toBeNull();
      expect(result.current.lastSavedAt).toBeNull();
    });
  });

  describe('save', () => {
    it('プロジェクトを保存できる', async () => {
      const { result } = renderHook(() => useStorage());
      const project = createTestProject('proj_001', 'My RPG');

      let success: boolean = false;
      await act(async () => {
        success = await result.current.save(project);
      });

      expect(success).toBe(true);
      expect(result.current.error).toBeNull();
      expect(result.current.lastSavedAt).not.toBeNull();
      expect(result.current.operation).toBe('idle');
    });
  });

  describe('load', () => {
    it('保存したプロジェクトを読み込める', async () => {
      const { result } = renderHook(() => useStorage());
      const project = createTestProject('proj_001', 'My RPG');

      await act(async () => {
        await result.current.save(project);
      });

      const container: { loaded: SavedProject | null } = { loaded: null };
      await act(async () => {
        container.loaded = await result.current.load('proj_001');
      });

      expect(container.loaded).not.toBeNull();
      expect(container.loaded?.id).toBe('proj_001');
      expect(container.loaded?.name).toBe('My RPG');
      expect(result.current.operation).toBe('idle');
    });

    it('存在しないプロジェクトは null を返しエラーを設定', async () => {
      const { result } = renderHook(() => useStorage());

      const container: { loaded: SavedProject | null } = { loaded: null };
      await act(async () => {
        container.loaded = await result.current.load('nonexistent');
      });

      expect(container.loaded).toBeNull();
      expect(result.current.error).not.toBeNull();
      expect(result.current.error?.type).toBe('NOT_FOUND');
    });
  });

  describe('listProjects', () => {
    it('プロジェクト一覧を取得できる', async () => {
      const { result } = renderHook(() => useStorage());

      await act(async () => {
        await result.current.save(createTestProject('proj_001', 'RPG 1'));
        await result.current.save(createTestProject('proj_002', 'RPG 2'));
      });

      let projects: Awaited<ReturnType<typeof result.current.listProjects>> = [];
      await act(async () => {
        projects = await result.current.listProjects();
      });

      expect(projects).toHaveLength(2);
    });
  });

  describe('deleteProject', () => {
    it('プロジェクトを削除できる', async () => {
      const { result } = renderHook(() => useStorage());
      const project = createTestProject('proj_001', 'My RPG');

      await act(async () => {
        await result.current.save(project);
      });

      let success: boolean = false;
      await act(async () => {
        success = await result.current.deleteProject('proj_001');
      });

      expect(success).toBe(true);

      const container: { loaded: SavedProject | null } = { loaded: null };
      await act(async () => {
        container.loaded = await result.current.load('proj_001');
      });

      expect(container.loaded).toBeNull();
    });
  });

  describe('projectExists', () => {
    it('プロジェクトの存在確認ができる', async () => {
      const { result } = renderHook(() => useStorage());
      const project = createTestProject('proj_001', 'My RPG');

      await act(async () => {
        await result.current.save(project);
      });

      let exists: boolean = false;
      await act(async () => {
        exists = await result.current.projectExists('proj_001');
      });

      expect(exists).toBe(true);

      await act(async () => {
        exists = await result.current.projectExists('nonexistent');
      });

      expect(exists).toBe(false);
    });
  });

  describe('exportProject', () => {
    let mockClick: jest.Mock;
    let originalCreateElement: typeof document.createElement;

    beforeEach(() => {
      mockClick = jest.fn();
      originalCreateElement = document.createElement.bind(document);

      jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName === 'a') {
          return {
            href: '',
            download: '',
            click: mockClick,
          } as unknown as HTMLAnchorElement;
        }
        return originalCreateElement(tagName);
      });

      jest.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
      jest.spyOn(document.body, 'removeChild').mockImplementation((node) => node);
      global.URL.createObjectURL = jest.fn().mockReturnValue('blob:test');
      global.URL.revokeObjectURL = jest.fn();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('プロジェクトをエクスポートできる', async () => {
      const { result } = renderHook(() => useStorage());
      const project = createTestProject('proj_001', 'My RPG');

      let success: boolean = false;
      await act(async () => {
        success = await result.current.exportProject(project);
      });

      expect(success).toBe(true);
      expect(mockClick).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalled();
      expect(result.current.operation).toBe('idle');
    });

    it('カスタムファイル名でエクスポートできる', async () => {
      const { result } = renderHook(() => useStorage());
      const project = createTestProject('proj_001', 'My RPG');

      await act(async () => {
        await result.current.exportProject(project, 'custom-name.json');
      });

      expect(mockClick).toHaveBeenCalled();
    });
  });

  describe('importProject', () => {
    it('有効なJSONファイルをインポートできる', async () => {
      const { result } = renderHook(() => useStorage());

      const projectData = createTestProject('proj_import', 'Imported RPG');
      const json = JSON.stringify(projectData);

      // File.prototype.text をモック
      const mockFile = {
        text: jest.fn().mockResolvedValue(json),
      } as unknown as File;

      const container: { imported: SavedProject | null } = { imported: null };
      await act(async () => {
        container.imported = await result.current.importProject(mockFile);
      });

      expect(container.imported).not.toBeNull();
      expect(container.imported?.id).toBe('proj_import');
      expect(container.imported?.name).toBe('Imported RPG');
      expect(result.current.error).toBeNull();
    });

    it('無効なJSONはエラーを返す', async () => {
      const { result } = renderHook(() => useStorage());

      const mockFile = {
        text: jest.fn().mockResolvedValue('invalid json {{{'),
      } as unknown as File;

      const container: { imported: SavedProject | null } = { imported: null };
      await act(async () => {
        container.imported = await result.current.importProject(mockFile);
      });

      expect(container.imported).toBeNull();
      expect(result.current.error).not.toBeNull();
      expect(result.current.error?.type).toBe('INVALID_DATA');
    });

    it('不正な形式のデータはエラーを返す', async () => {
      const { result } = renderHook(() => useStorage());

      const invalidData = { id: 'test', name: 'Test', data: {} };
      const json = JSON.stringify(invalidData);

      const mockFile = {
        text: jest.fn().mockResolvedValue(json),
      } as unknown as File;

      const container: { imported: SavedProject | null } = { imported: null };
      await act(async () => {
        container.imported = await result.current.importProject(mockFile);
      });

      expect(container.imported).toBeNull();
      expect(result.current.error).not.toBeNull();
      expect(result.current.error?.type).toBe('INVALID_DATA');
    });
  });

  describe('clearError', () => {
    it('エラーをクリアできる', async () => {
      const { result } = renderHook(() => useStorage());

      // エラーを発生させる
      await act(async () => {
        await result.current.load('nonexistent');
      });

      expect(result.current.error).not.toBeNull();

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});
