import { getAction, getActionNames } from './index';

// Import to trigger registration
import './register';

describe('Action registration', () => {
  it('all 10 action types are registered', () => {
    const names = getActionNames();
    expect(names).toContain('variableOp');
    expect(names).toContain('conditional');
    expect(names).toContain('loop');
    expect(names).toContain('audio');
    expect(names).toContain('camera');
    expect(names).toContain('script');
    expect(names).toContain('callTemplate');
    expect(names).toContain('wait');
    expect(names).toContain('object');
    expect(names).toContain('map');
    expect(names).toHaveLength(10);
  });

  it('each registered action can be instantiated', () => {
    for (const name of getActionNames()) {
      const ActionClass = getAction(name);
      expect(ActionClass).toBeDefined();
      const instance = new ActionClass!();
      expect(instance.type).toBe(name);
    }
  });
});
