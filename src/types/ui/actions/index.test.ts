import {
  registerUIAction,
  getUIAction,
  getAllUIActions,
  getUIActionNames,
  clearUIActionRegistry,
  UIAction,
} from './index';

class DummyAction extends UIAction {
  readonly type = 'dummy';
  value = 0;
  toJSON(): Record<string, unknown> {
    return { value: this.value };
  }
  fromJSON(data: Record<string, unknown>): void {
    this.value = (data.value as number) ?? 0;
  }
}

class DummyAction2 extends UIAction {
  readonly type = 'dummy2';
  toJSON(): Record<string, unknown> {
    return {};
  }
  fromJSON(): void {
    /* noop */
  }
}

describe('UIAction registry', () => {
  beforeEach(() => {
    clearUIActionRegistry();
  });

  it('registers and retrieves a UIAction', () => {
    registerUIAction('dummy', DummyAction);
    const Ctor = getUIAction('dummy');
    expect(Ctor).toBe(DummyAction);
  });

  it('returns undefined for unregistered type', () => {
    expect(getUIAction('nonexistent')).toBeUndefined();
  });

  it('returns all registered UIActions', () => {
    registerUIAction('dummy', DummyAction);
    registerUIAction('dummy2', DummyAction2);
    const all = getAllUIActions();
    expect(all).toHaveLength(2);
    expect(all.map(([t]) => t)).toEqual(['dummy', 'dummy2']);
  });

  it('returns all registered names', () => {
    registerUIAction('dummy', DummyAction);
    registerUIAction('dummy2', DummyAction2);
    expect(getUIActionNames()).toEqual(['dummy', 'dummy2']);
  });

  it('clears registry', () => {
    registerUIAction('dummy', DummyAction);
    clearUIActionRegistry();
    expect(getUIAction('dummy')).toBeUndefined();
    expect(getUIActionNames()).toHaveLength(0);
  });

  it('warns on duplicate registration', () => {
    const spy = jest.spyOn(console, 'warn').mockImplementation();
    registerUIAction('dummy', DummyAction);
    registerUIAction('dummy', DummyAction2);
    expect(spy).toHaveBeenCalledWith(
      'UIAction "dummy" is already registered. Overwriting.'
    );
    spy.mockRestore();
  });

  it('can instantiate a registered UIAction', () => {
    registerUIAction('dummy', DummyAction);
    const Ctor = getUIAction('dummy')!;
    const instance = new Ctor();
    expect(instance.type).toBe('dummy');
  });
});
