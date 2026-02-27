import { getDefaultComponentScripts } from './defaultComponentScripts';

describe('getDefaultComponentScripts', () => {
  it('全ビルトインコンポーネントを含む', () => {
    const scripts = getDefaultComponentScripts();
    expect(scripts.length).toBeGreaterThanOrEqual(13);
  });

  it('transform スクリプトが含まれる', () => {
    const scripts = getDefaultComponentScripts();
    const transform = scripts.find((s) => s.id === 'transform');
    expect(transform).toBeDefined();
    expect(transform?.type).toBe('component');
    expect(transform?.fields.length).toBeGreaterThan(0);
  });

  it('sprite スクリプトが含まれる', () => {
    const scripts = getDefaultComponentScripts();
    expect(scripts.find((s) => s.id === 'sprite')).toBeDefined();
  });

  it('talkTrigger スクリプトが含まれる', () => {
    const scripts = getDefaultComponentScripts();
    expect(scripts.find((s) => s.id === 'talkTrigger')).toBeDefined();
  });

  it('各スクリプトは content に export default を含む', () => {
    const scripts = getDefaultComponentScripts();
    for (const script of scripts) {
      expect(script.content).toContain('export default');
    }
  });

  it('各スクリプトは重複なし（id がユニーク）', () => {
    const scripts = getDefaultComponentScripts();
    const ids = scripts.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
