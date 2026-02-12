/**
 * AudioAssetType のテスト
 */
import { AudioAssetType, type AudioMetadata } from './AudioAssetType';

// URL APIのモック
const mockCreateObjectURL = jest.fn().mockReturnValue('blob:mock-url');
const mockRevokeObjectURL = jest.fn();

// Audioクラスのモック
class MockAudio {
  src = '';
  duration = 0;
  private listeners: { [event: string]: (() => void)[] } = {};

  addEventListener(event: string, callback: () => void) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);

    // srcが設定されたらloadedmetadataを発火
    if (event === 'loadedmetadata') {
      setTimeout(() => {
        this.duration = 120.5;
        this.listeners['loadedmetadata']?.forEach((cb) => cb());
      }, 0);
    }
  }
}

describe('AudioAssetType', () => {
  let assetType: AudioAssetType;
  const OriginalAudio = global.Audio;

  beforeEach(() => {
    assetType = new AudioAssetType();
    // URL APIのモック設定
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;
    // Audioのモック設定
    global.Audio = MockAudio as unknown as typeof Audio;
  });

  afterEach(() => {
    jest.clearAllMocks();
    global.Audio = OriginalAudio;
  });

  describe('基本プロパティ', () => {
    it('type が "audio" である', () => {
      expect(assetType.type).toBe('audio');
    });

    it('label が "音声" である', () => {
      expect(assetType.label).toBe('音声');
    });

    it('対応拡張子が正しい', () => {
      expect(assetType.extensions).toContain('.mp3');
      expect(assetType.extensions).toContain('.wav');
      expect(assetType.extensions).toContain('.ogg');
      expect(assetType.extensions).toContain('.m4a');
    });
  });

  describe('validate', () => {
    it('対応拡張子のファイルは有効', () => {
      const file = new File([''], 'bgm.mp3', { type: 'audio/mpeg' });
      const result = assetType.validate(file);
      expect(result.valid).toBe(true);
    });

    it('非対応拡張子のファイルは無効', () => {
      const file = new File([''], 'image.png', { type: 'image/png' });
      const result = assetType.validate(file);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('.mp3');
    });
  });

  describe('extractMetadata', () => {
    it('ファイルサイズと再生時間を取得する', async () => {
      const content = new ArrayBuffer(1024);
      const file = new File([content], 'test.mp3', { type: 'audio/mpeg' });

      const metadata = await assetType.extractMetadata(file);
      expect(metadata.fileSize).toBe(1024);
      expect(metadata.duration).toBe(120.5);
    });
  });

  describe('serializeMetadata / deserializeMetadata', () => {
    it('メタデータを正しくシリアライズ/デシリアライズする', () => {
      const metadata: AudioMetadata = {
        fileSize: 1024,
        duration: 120.5,
      };

      const serialized = assetType.serializeMetadata(metadata);
      expect(serialized).toEqual(metadata);

      const deserialized = assetType.deserializeMetadata(serialized);
      expect(deserialized).toEqual(metadata);
    });
  });
});
