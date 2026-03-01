/* eslint-disable @typescript-eslint/no-require-imports */
describe('UIComponent registration', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('registers all 11 built-in UIComponents', () => {
    const { getUIComponentNames } = require('./index');
    require('./register');
    const names = getUIComponentNames();
    expect(names).toHaveLength(11);
    const expected = [
      'image',
      'text',
      'shape',
      'fillMask',
      'colorMask',
      'layoutGroup',
      'gridLayout',
      'navigation',
      'navigationItem',
      'navigationCursor',
      'animation',
    ];
    for (const name of expected) {
      expect(names).toContain(name);
    }
  });

  it('can instantiate each registered UIComponent', () => {
    const { getUIComponent, getUIComponentNames } = require('./index');
    require('./register');
    for (const name of getUIComponentNames()) {
      const Cls = getUIComponent(name)!;
      expect(Cls).toBeDefined();
      const instance = new Cls();
      expect(instance.type).toBe(name);
    }
  });
});
