/**
 * アセットタイプレジストリのテスト
 */
import {
  registerAssetType,
  getAssetType,
  getAllAssetTypes,
  getAssetTypeNames,
  clearAssetTypeRegistry,
  createAssetTypeInstance,
  getAssetTypeOptions,
  getAssetTypeByExtension,
  getAllSupportedExtensions,
} from './registry';
import { AssetType, type BaseAssetMetadata, type ValidationResult } from './AssetType';

// テスト用のモックアセットタイプ
class MockAssetType extends AssetType<BaseAssetMetadata> {
  readonly type = 'mock';
  readonly label = 'モック';
  readonly extensions = ['.mock', '.mck'];

  async extractMetadata(file: File): Promise<BaseAssetMetadata> {
    return { fileSize: file.size };
  }

  renderPreview(): React.ReactNode {
    return null;
  }

  validate(file: File): ValidationResult {
    const ext = '.' + (file.name.split('.').pop()?.toLowerCase() ?? '');
    if (!this.extensions.includes(ext)) {
      return { valid: false, message: `対応形式: ${this.extensions.join(', ')}` };
    }
    return { valid: true };
  }
}

class AnotherMockAssetType extends AssetType<BaseAssetMetadata> {
  readonly type = 'another';
  readonly label = 'アナザー';
  readonly extensions = ['.ano', '.anr'];

  async extractMetadata(file: File): Promise<BaseAssetMetadata> {
    return { fileSize: file.size };
  }

  renderPreview(): React.ReactNode {
    return null;
  }

  validate(file: File): ValidationResult {
    const ext = '.' + (file.name.split('.').pop()?.toLowerCase() ?? '');
    if (!this.extensions.includes(ext)) {
      return { valid: false, message: `対応形式: ${this.extensions.join(', ')}` };
    }
    return { valid: true };
  }
}

describe('アセットタイプレジストリ', () => {
  beforeEach(() => {
    clearAssetTypeRegistry();
  });

  describe('registerAssetType', () => {
    it('アセットタイプを登録できる', () => {
      registerAssetType('mock', MockAssetType);
      expect(getAssetType('mock')).toBe(MockAssetType);
    });

    it('同じタイプを再登録すると上書きされる', () => {
      registerAssetType('mock', MockAssetType);
      registerAssetType('mock', AnotherMockAssetType);
      expect(getAssetType('mock')).toBe(AnotherMockAssetType);
    });
  });

  describe('getAssetType', () => {
    it('登録されたタイプを取得できる', () => {
      registerAssetType('mock', MockAssetType);
      expect(getAssetType('mock')).toBe(MockAssetType);
    });

    it('未登録のタイプはundefinedを返す', () => {
      expect(getAssetType('nonexistent')).toBeUndefined();
    });
  });

  describe('getAllAssetTypes', () => {
    it('全てのアセットタイプを取得できる', () => {
      registerAssetType('mock', MockAssetType);
      registerAssetType('another', AnotherMockAssetType);

      const all = getAllAssetTypes();
      expect(all).toHaveLength(2);
      expect(all).toContainEqual(['mock', MockAssetType]);
      expect(all).toContainEqual(['another', AnotherMockAssetType]);
    });
  });

  describe('getAssetTypeNames', () => {
    it('全てのタイプ名を取得できる', () => {
      registerAssetType('mock', MockAssetType);
      registerAssetType('another', AnotherMockAssetType);

      const names = getAssetTypeNames();
      expect(names).toContain('mock');
      expect(names).toContain('another');
    });
  });

  describe('createAssetTypeInstance', () => {
    it('インスタンスを生成できる', () => {
      registerAssetType('mock', MockAssetType);
      const instance = createAssetTypeInstance('mock');
      expect(instance).toBeInstanceOf(MockAssetType);
    });

    it('未登録のタイプはundefinedを返す', () => {
      expect(createAssetTypeInstance('nonexistent')).toBeUndefined();
    });
  });

  describe('getAssetTypeOptions', () => {
    it('ドロップダウン用オプションを取得できる', () => {
      registerAssetType('mock', MockAssetType);
      registerAssetType('another', AnotherMockAssetType);

      const options = getAssetTypeOptions();
      expect(options).toContainEqual({ type: 'mock', label: 'モック' });
      expect(options).toContainEqual({ type: 'another', label: 'アナザー' });
    });
  });

  describe('getAssetTypeByExtension', () => {
    beforeEach(() => {
      registerAssetType('mock', MockAssetType);
      registerAssetType('another', AnotherMockAssetType);
    });

    it('拡張子からアセットタイプを取得できる', () => {
      expect(getAssetTypeByExtension('.mock')).toBe('mock');
      expect(getAssetTypeByExtension('.mck')).toBe('mock');
      expect(getAssetTypeByExtension('.ano')).toBe('another');
      expect(getAssetTypeByExtension('.anr')).toBe('another');
    });

    it('大文字小文字を区別しない', () => {
      expect(getAssetTypeByExtension('.MOCK')).toBe('mock');
      expect(getAssetTypeByExtension('.Mock')).toBe('mock');
    });

    it('未対応の拡張子はundefinedを返す', () => {
      expect(getAssetTypeByExtension('.unknown')).toBeUndefined();
      expect(getAssetTypeByExtension('.xyz')).toBeUndefined();
    });
  });

  describe('getAllSupportedExtensions', () => {
    beforeEach(() => {
      registerAssetType('mock', MockAssetType);
      registerAssetType('another', AnotherMockAssetType);
    });

    it('全ての対応拡張子を取得できる', () => {
      const extensions = getAllSupportedExtensions();
      expect(extensions).toContain('.mock');
      expect(extensions).toContain('.mck');
      expect(extensions).toContain('.ano');
      expect(extensions).toContain('.anr');
    });
  });

  describe('clearAssetTypeRegistry', () => {
    it('レジストリをクリアできる', () => {
      registerAssetType('mock', MockAssetType);
      clearAssetTypeRegistry();
      expect(getAssetType('mock')).toBeUndefined();
    });
  });
});
