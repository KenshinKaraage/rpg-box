/**
 * AssetType 基底クラスとレジストリのテスト
 */
import type { ReactNode } from 'react';

import {
  AssetType,
  type BaseAssetMetadata,
  registerAssetType,
  getAssetType,
  getAllAssetTypes,
  getAssetTypeNames,
  clearAssetTypeRegistry,
  createAssetTypeInstance,
  getAssetTypeOptions,
} from './index';

// テスト用の具象クラス
interface TestMetadata extends BaseAssetMetadata {
  testProp: string;
}

class TestAssetType extends AssetType<TestMetadata> {
  readonly type = 'test';
  readonly label = 'テスト';
  readonly extensions = ['.test', '.tst'];

  async extractMetadata(file: File): Promise<TestMetadata> {
    return {
      fileSize: file.size,
      testProp: 'extracted',
    };
  }

  renderPreview(_data: string, _metadata: TestMetadata): ReactNode {
    return null;
  }
}

interface AnotherMetadata extends BaseAssetMetadata {
  anotherProp: number;
}

class AnotherAssetType extends AssetType<AnotherMetadata> {
  readonly type = 'another';
  readonly label = '別のタイプ';
  readonly extensions = ['.ano'];

  async extractMetadata(file: File): Promise<AnotherMetadata> {
    return {
      fileSize: file.size,
      anotherProp: 42,
    };
  }

  renderPreview(_data: string, _metadata: AnotherMetadata): ReactNode {
    return null;
  }
}

describe('AssetType registry', () => {
  beforeEach(() => {
    clearAssetTypeRegistry();
  });

  describe('registerAssetType', () => {
    it('アセットタイプを登録できる', () => {
      registerAssetType('test', TestAssetType);
      expect(getAssetType('test')).toBe(TestAssetType);
    });

    it('重複登録は警告を出して上書き', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      registerAssetType('test', TestAssetType);
      registerAssetType('test', AnotherAssetType);

      expect(warnSpy).toHaveBeenCalledWith('AssetType "test" is already registered. Overwriting.');
      expect(getAssetType('test')).toBe(AnotherAssetType);

      warnSpy.mockRestore();
    });
  });

  describe('getAssetType', () => {
    it('未登録のタイプはundefinedを返す', () => {
      expect(getAssetType('nonexistent')).toBeUndefined();
    });

    it('登録済みのタイプを取得できる', () => {
      registerAssetType('test', TestAssetType);
      expect(getAssetType('test')).toBe(TestAssetType);
    });
  });

  describe('getAllAssetTypes', () => {
    it('登録がない場合は空配列', () => {
      expect(getAllAssetTypes()).toEqual([]);
    });

    it('全ての登録済みタイプを取得', () => {
      registerAssetType('test', TestAssetType);
      registerAssetType('another', AnotherAssetType);

      const types = getAllAssetTypes();
      expect(types).toHaveLength(2);
      expect(types).toContainEqual(['test', TestAssetType]);
      expect(types).toContainEqual(['another', AnotherAssetType]);
    });
  });

  describe('getAssetTypeNames', () => {
    it('登録がない場合は空配列', () => {
      expect(getAssetTypeNames()).toEqual([]);
    });

    it('全てのタイプ名を取得', () => {
      registerAssetType('test', TestAssetType);
      registerAssetType('another', AnotherAssetType);

      const names = getAssetTypeNames();
      expect(names).toHaveLength(2);
      expect(names).toContain('test');
      expect(names).toContain('another');
    });
  });

  describe('createAssetTypeInstance', () => {
    it('登録済みタイプのインスタンスを生成', () => {
      registerAssetType('test', TestAssetType);

      const instance = createAssetTypeInstance('test');

      expect(instance).toBeInstanceOf(TestAssetType);
      expect(instance?.type).toBe('test');
    });

    it('未登録タイプはundefinedを返す', () => {
      expect(createAssetTypeInstance('nonexistent')).toBeUndefined();
    });
  });

  describe('getAssetTypeOptions', () => {
    it('全タイプのオプションを取得', () => {
      registerAssetType('test', TestAssetType);
      registerAssetType('another', AnotherAssetType);

      const options = getAssetTypeOptions();

      expect(options).toHaveLength(2);
      expect(options).toContainEqual({ type: 'test', label: 'テスト' });
      expect(options).toContainEqual({ type: 'another', label: '別のタイプ' });
    });

    it('登録がない場合は空配列', () => {
      expect(getAssetTypeOptions()).toEqual([]);
    });
  });
});

describe('AssetType abstract class', () => {
  let assetType: TestAssetType;

  beforeEach(() => {
    assetType = new TestAssetType();
  });

  describe('validate', () => {
    it('対応拡張子のファイルは有効', () => {
      const file = new File([''], 'test.test', { type: 'application/octet-stream' });
      const result = assetType.validate(file);
      expect(result.valid).toBe(true);
    });

    it('大文字拡張子も有効', () => {
      const file = new File([''], 'test.TEST', { type: 'application/octet-stream' });
      const result = assetType.validate(file);
      expect(result.valid).toBe(true);
    });

    it('非対応拡張子のファイルは無効', () => {
      const file = new File([''], 'test.unknown', { type: 'application/octet-stream' });
      const result = assetType.validate(file);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('.test');
    });
  });

  describe('extractMetadata', () => {
    it('ファイルからメタデータを抽出', async () => {
      const file = new File(['content'], 'test.test', { type: 'application/octet-stream' });
      const metadata = await assetType.extractMetadata(file);

      expect(metadata.fileSize).toBe(7); // 'content'.length
      expect(metadata.testProp).toBe('extracted');
    });
  });

  describe('serializeMetadata / deserializeMetadata', () => {
    it('メタデータをシリアライズ・デシリアライズ', () => {
      const metadata: TestMetadata = { fileSize: 100, testProp: 'value' };

      const serialized = assetType.serializeMetadata(metadata);
      const deserialized = assetType.deserializeMetadata(serialized);

      expect(deserialized).toEqual(metadata);
    });
  });
});
