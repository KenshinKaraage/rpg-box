/* eslint-disable @typescript-eslint/no-require-imports */
describe('Component registration', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('registers all 13 built-in components', () => {
    const { getComponentNames } = require('./index');
    require('./register');
    const names = getComponentNames();
    expect(names).toHaveLength(13);
    const expected = [
      'transform',
      'sprite',
      'collider',
      'movement',
      'variables',
      'controller',
      'effect',
      'objectCanvas',
      'talkTrigger',
      'touchTrigger',
      'stepTrigger',
      'autoTrigger',
      'inputTrigger',
    ];
    for (const name of expected) {
      expect(names).toContain(name);
    }
  });

  it('can instantiate each registered component', () => {
    const { getComponent, getComponentNames } = require('./index');
    require('./register');
    for (const name of getComponentNames()) {
      const Cls = getComponent(name)!;
      expect(Cls).toBeDefined();
      const instance = new Cls();
      expect(instance.type).toBe(name);
    }
  });
});
