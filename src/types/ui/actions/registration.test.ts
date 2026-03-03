/* eslint-disable @typescript-eslint/no-require-imports */
describe('UIAction registration', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('registers all 6 built-in UIActions', () => {
    const { getUIActionNames } = require('./index');
    require('./register');
    const names = getUIActionNames();
    expect(names).toHaveLength(6);
    const expected = [
      'uiSetProperty',
      'uiSetVisibility',
      'uiPlayAnimation',
      'uiCallFunction',
      'uiNavigate',
      'uiTriggerObjectAction',
    ];
    for (const name of expected) {
      expect(names).toContain(name);
    }
  });

  it('can instantiate each registered UIAction', () => {
    const { getUIAction, getUIActionNames } = require('./index');
    require('./register');
    for (const name of getUIActionNames()) {
      const Cls = getUIAction(name)!;
      expect(Cls).toBeDefined();
      const instance = new Cls();
      expect(instance.type).toBe(name);
    }
  });
});
