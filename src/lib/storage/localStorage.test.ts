/**
 * LocalStorage 一時保存プロバイダーのテスト
 */
import {
  LocalStorageProvider,
  getLocalStorage,
  resetLocalStorage,
  calculateDataSize,
} from './localStorage';
import type { TempSaveData } from './types';

// モック用のlocalStorage
const createMockLocalStorage = () => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index: number) => Object.keys(store)[index] ?? null),
  };
};

describe('LocalStorageProvider', () => {
  let mockStorage: ReturnType<typeof createMockLocalStorage>;
  let provider: LocalStorageProvider;

  beforeEach(() => {
    mockStorage = createMockLocalStorage();
    Object.defineProperty(window, 'localStorage', {
      value: mockStorage,
      writable: true,
    });
    resetLocalStorage();
    provider = new LocalStorageProvider();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('saveTempData', () => {
    it('一時データを保存できる', () => {
      const tempData: TempSaveData = {
        timestamp: Date.now(),
        projectId: 'proj_001',
        data: {
          gameSettings: {
            title: 'Test Game',
            version: '1.0.0',
            author: 'Test Author',
            description: 'Test Description',
            resolution: { width: 1280, height: 720 },
            startMapId: 'map_001',
          },
        },
      };

      provider.saveTempData(tempData);

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'rpg-box-temp-save',
        JSON.stringify(tempData)
      );
    });

    it('サイズ制限を超えるとエラー', () => {
      const smallProvider = new LocalStorageProvider({ maxSize: 100 });
      const largeData: TempSaveData = {
        timestamp: Date.now(),
        projectId: 'proj_001',
        data: {
          gameSettings: {
            title: 'A'.repeat(200),
            version: '1.0.0',
            author: 'Test',
            description: 'Test',
            resolution: { width: 1280, height: 720 },
            startMapId: 'map_001',
          },
        },
      };

      expect(() => smallProvider.saveTempData(largeData)).toThrow(/exceeds maximum allowed size/);
    });

    it('QuotaExceededErrorをハンドリングする', () => {
      const quotaError = new DOMException('Quota exceeded', 'QuotaExceededError');
      // isLocalStorageAvailableのテスト用setItemは成功し、実際のデータ保存時のみ失敗
      mockStorage.setItem.mockImplementation((key: string) => {
        if (key !== '__storage_test__') {
          throw quotaError;
        }
      });

      const tempData: TempSaveData = {
        timestamp: Date.now(),
        projectId: 'proj_001',
        data: {},
      };

      expect(() => provider.saveTempData(tempData)).toThrow('LocalStorage quota exceeded');
    });
  });

  describe('loadTempData', () => {
    it('保存されたデータを読み込める', () => {
      const tempData: TempSaveData = {
        timestamp: 1704067200000,
        projectId: 'proj_001',
        data: {
          maps: [],
        },
      };

      mockStorage.getItem.mockReturnValue(JSON.stringify(tempData));

      const loaded = provider.loadTempData();

      expect(loaded).toEqual(tempData);
    });

    it('データがない場合はnullを返す', () => {
      mockStorage.getItem.mockReturnValue(null);

      const loaded = provider.loadTempData();

      expect(loaded).toBeNull();
    });

    it('無効なJSONの場合はnullを返す', () => {
      mockStorage.getItem.mockReturnValue('invalid json {{{');

      const loaded = provider.loadTempData();

      expect(loaded).toBeNull();
    });

    it('不正な形式のデータの場合はnullを返す', () => {
      mockStorage.getItem.mockReturnValue(JSON.stringify({ invalid: 'data' }));

      const loaded = provider.loadTempData();

      expect(loaded).toBeNull();
    });
  });

  describe('clearTempData', () => {
    it('一時データを削除できる', () => {
      provider.clearTempData();

      expect(mockStorage.removeItem).toHaveBeenCalledWith('rpg-box-temp-save');
    });
  });

  describe('hasTempData', () => {
    it('データがある場合はtrueを返す', () => {
      mockStorage.getItem.mockReturnValue('{"timestamp":1,"projectId":"p","data":{}}');

      expect(provider.hasTempData()).toBe(true);
    });

    it('データがない場合はfalseを返す', () => {
      mockStorage.getItem.mockReturnValue(null);

      expect(provider.hasTempData()).toBe(false);
    });
  });

  describe('getStoredDataSize', () => {
    it('保存データのサイズを返す', () => {
      const tempData: TempSaveData = {
        timestamp: Date.now(),
        projectId: 'proj_001',
        data: {},
      };
      const serialized = JSON.stringify(tempData);
      mockStorage.getItem.mockReturnValue(serialized);

      const size = provider.getStoredDataSize();

      expect(size).toBeGreaterThan(0);
    });

    it('データがない場合は0を返す', () => {
      mockStorage.getItem.mockReturnValue(null);

      const size = provider.getStoredDataSize();

      expect(size).toBe(0);
    });
  });

  describe('getDataAge', () => {
    it('データの経過時間を返す', () => {
      const timestamp = Date.now() - 60000; // 1分前
      const tempData: TempSaveData = {
        timestamp,
        projectId: 'proj_001',
        data: {},
      };
      mockStorage.getItem.mockReturnValue(JSON.stringify(tempData));

      const age = provider.getDataAge();

      expect(age).toBeGreaterThanOrEqual(60000);
      expect(age).toBeLessThan(61000); // 1秒の余裕
    });

    it('データがない場合はnullを返す', () => {
      mockStorage.getItem.mockReturnValue(null);

      const age = provider.getDataAge();

      expect(age).toBeNull();
    });
  });

  describe('カスタムオプション', () => {
    it('カスタムストレージキーを使用できる', () => {
      const customProvider = new LocalStorageProvider({
        storageKey: 'custom-key',
      });
      const tempData: TempSaveData = {
        timestamp: Date.now(),
        projectId: 'proj_001',
        data: {},
      };

      customProvider.saveTempData(tempData);

      expect(mockStorage.setItem).toHaveBeenCalledWith('custom-key', expect.any(String));
    });
  });
});

describe('シングルトン', () => {
  beforeEach(() => {
    resetLocalStorage();
    const mockStorage = createMockLocalStorage();
    Object.defineProperty(window, 'localStorage', {
      value: mockStorage,
      writable: true,
    });
  });

  it('getLocalStorage は同じインスタンスを返す', () => {
    const instance1 = getLocalStorage();
    const instance2 = getLocalStorage();
    expect(instance1).toBe(instance2);
  });

  it('resetLocalStorage でインスタンスをリセットできる', () => {
    const instance1 = getLocalStorage();
    resetLocalStorage();
    const instance2 = getLocalStorage();
    expect(instance1).not.toBe(instance2);
  });
});

describe('calculateDataSize', () => {
  it('データサイズを正しく計算する', () => {
    const tempData: TempSaveData = {
      timestamp: 1704067200000,
      projectId: 'test',
      data: { maps: [] },
    };

    const size = calculateDataSize(tempData);

    // JSON文字列のバイト数と一致
    expect(size).toBe(new Blob([JSON.stringify(tempData)]).size);
  });
});
