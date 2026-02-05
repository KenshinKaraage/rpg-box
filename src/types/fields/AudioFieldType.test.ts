/**
 * AudioFieldType のテスト
 */
import { AudioFieldType } from './AudioFieldType';

describe('AudioFieldType', () => {
  let field: AudioFieldType;

  beforeEach(() => {
    field = new AudioFieldType();
    field.id = 'test_audio';
    field.name = 'BGM';
  });

  describe('基本プロパティ', () => {
    it('type が "audio" である', () => {
      expect(field.type).toBe('audio');
    });

    it('label が "音声" である', () => {
      expect(field.label).toBe('音声');
    });
  });

  describe('getDefaultValue', () => {
    it('null を返す（未選択状態）', () => {
      expect(field.getDefaultValue()).toBeNull();
    });
  });

  describe('validate', () => {
    it('required=false の場合、null は有効', () => {
      field.required = false;
      const result = field.validate(null);
      expect(result.valid).toBe(true);
    });

    it('required=true の場合、null は無効', () => {
      field.required = true;
      const result = field.validate(null);
      expect(result.valid).toBe(false);
      expect(result.message).toBe('音声を選択してください');
    });

    it('アセットIDがある場合は有効', () => {
      field.required = true;
      const result = field.validate('audio_001');
      expect(result.valid).toBe(true);
    });
  });

  describe('serialize / deserialize', () => {
    it('アセットIDをそのままシリアライズ', () => {
      expect(field.serialize('audio_001')).toBe('audio_001');
    });

    it('null をシリアライズ', () => {
      expect(field.serialize(null)).toBeNull();
    });

    it('デシリアライズで文字列またはnullに変換', () => {
      expect(field.deserialize('audio_001')).toBe('audio_001');
      expect(field.deserialize(null)).toBeNull();
      expect(field.deserialize(undefined)).toBeNull();
    });
  });

  describe('getValue', () => {
    it('データから値を取得', () => {
      expect(field.getValue('audio_001')).toBe('audio_001');
      expect(field.getValue(null)).toBeNull();
    });
  });
});
