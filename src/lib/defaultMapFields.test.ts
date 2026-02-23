import { createDefaultMapFields } from './defaultMapFields';

describe('createDefaultMapFields', () => {
  it('returns BGM and background image fields', () => {
    const fields = createDefaultMapFields();
    expect(fields).toHaveLength(2);

    expect(fields[0]!.id).toBe('bgm');
    expect(fields[0]!.type).toBe('audio');
    expect(fields[0]!.name).toBe('BGM');

    expect(fields[1]!.id).toBe('background_image');
    expect(fields[1]!.type).toBe('image');
    expect(fields[1]!.name).toBe('背景画像');
  });

  it('returns new instances each call', () => {
    const a = createDefaultMapFields();
    const b = createDefaultMapFields();
    expect(a[0]).not.toBe(b[0]);
  });
});
