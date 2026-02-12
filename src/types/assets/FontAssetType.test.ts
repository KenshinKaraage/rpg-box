/**
 * FontAssetType のテスト
 */
import { FontAssetType, type FontMetadata } from './FontAssetType';

describe('FontAssetType', () => {
  let assetType: FontAssetType;

  beforeEach(() => {
    assetType = new FontAssetType();
  });

  describe('基本プロパティ', () => {
    it('type が "font" である', () => {
      expect(assetType.type).toBe('font');
    });

    it('label が "フォント" である', () => {
      expect(assetType.label).toBe('フォント');
    });

    it('対応拡張子が正しい', () => {
      expect(assetType.extensions).toContain('.ttf');
      expect(assetType.extensions).toContain('.otf');
      expect(assetType.extensions).toContain('.woff');
      expect(assetType.extensions).toContain('.woff2');
    });
  });

  describe('validate', () => {
    it('対応拡張子のファイルは有効', () => {
      const file = new File([''], 'myfont.ttf', { type: 'font/ttf' });
      const result = assetType.validate(file);
      expect(result.valid).toBe(true);
    });

    it('非対応拡張子のファイルは無効', () => {
      const file = new File([''], 'image.png', { type: 'image/png' });
      const result = assetType.validate(file);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('.ttf');
    });
  });

  describe('extractMetadata', () => {
    it('ファイルサイズを取得する', async () => {
      const content = new ArrayBuffer(2048);
      const file = new File([content], 'test.ttf', { type: 'font/ttf' });

      const metadata = await assetType.extractMetadata(file);
      expect(metadata.fileSize).toBe(2048);
    });
  });

  describe('serializeMetadata / deserializeMetadata', () => {
    it('メタデータを正しくシリアライズ/デシリアライズする', () => {
      const metadata: FontMetadata = {
        fileSize: 2048,
      };

      const serialized = assetType.serializeMetadata(metadata);
      expect(serialized).toEqual(metadata);

      const deserialized = assetType.deserializeMetadata(serialized);
      expect(deserialized).toEqual(metadata);
    });
  });
});
