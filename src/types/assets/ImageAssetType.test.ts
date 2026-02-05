/**
 * ImageAssetType のテスト
 */
import { ImageAssetType, type ImageMetadata } from './ImageAssetType';

describe('ImageAssetType', () => {
  let assetType: ImageAssetType;

  beforeEach(() => {
    assetType = new ImageAssetType();
  });

  describe('基本プロパティ', () => {
    it('type が "image" である', () => {
      expect(assetType.type).toBe('image');
    });

    it('label が "画像" である', () => {
      expect(assetType.label).toBe('画像');
    });

    it('対応拡張子が正しい', () => {
      expect(assetType.extensions).toContain('.png');
      expect(assetType.extensions).toContain('.jpg');
      expect(assetType.extensions).toContain('.jpeg');
      expect(assetType.extensions).toContain('.gif');
      expect(assetType.extensions).toContain('.webp');
    });
  });

  describe('validate', () => {
    it('PNGファイルは有効', () => {
      const file = new File([''], 'image.png', { type: 'image/png' });
      const result = assetType.validate(file);
      expect(result.valid).toBe(true);
    });

    it('JPGファイルは有効', () => {
      const file = new File([''], 'image.jpg', { type: 'image/jpeg' });
      const result = assetType.validate(file);
      expect(result.valid).toBe(true);
    });

    it('TXTファイルは無効', () => {
      const file = new File([''], 'file.txt', { type: 'text/plain' });
      const result = assetType.validate(file);
      expect(result.valid).toBe(false);
    });
  });

  describe('extractMetadata', () => {
    it('ファイルからメタデータを抽出（モック）', async () => {
      // 実際の画像読み込みはブラウザ環境が必要なのでスキップ
      // E2Eテストで検証
      expect(assetType.extractMetadata).toBeDefined();
    });
  });

  describe('renderPreview', () => {
    it('プレビュー要素を返す', () => {
      const metadata: ImageMetadata = {
        fileSize: 1000,
        width: 100,
        height: 100,
      };
      const preview = assetType.renderPreview('data:image/png;base64,xxx', metadata);
      expect(preview).not.toBeNull();
    });
  });
});
