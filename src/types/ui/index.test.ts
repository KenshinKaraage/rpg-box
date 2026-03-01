import {
  UIComponent,
  registerUIComponent,
  getUIComponent,
  getAllUIComponents,
  getUIComponentNames,
  clearUIComponentRegistry,
} from './index';

// テスト用の具象クラス
class TestUIComponent extends UIComponent {
  readonly type = 'test';
  readonly label = 'Test';
  value: string = '';

  serialize(): unknown {
    return { value: this.value };
  }

  deserialize(data: unknown): void {
    const d = data as { value: string };
    this.value = d.value;
  }

  clone(): TestUIComponent {
    const c = new TestUIComponent();
    c.value = this.value;
    return c;
  }
}

class AnotherUIComponent extends UIComponent {
  readonly type = 'another';
  readonly label = 'Another';
  count: number = 0;

  serialize(): unknown {
    return { count: this.count };
  }

  deserialize(data: unknown): void {
    const d = data as { count: number };
    this.count = d.count;
  }

  clone(): AnotherUIComponent {
    const c = new AnotherUIComponent();
    c.count = this.count;
    return c;
  }
}

describe('UIComponent registry', () => {
  beforeEach(() => {
    clearUIComponentRegistry();
  });

  describe('registerUIComponent', () => {
    it('registers a component', () => {
      registerUIComponent('test', TestUIComponent);
      expect(getUIComponent('test')).toBe(TestUIComponent);
    });

    it('overwrites existing registration with warning', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      registerUIComponent('test', TestUIComponent);
      registerUIComponent('test', AnotherUIComponent);

      expect(warnSpy).toHaveBeenCalledWith(
        'UIComponent "test" is already registered. Overwriting.'
      );
      expect(getUIComponent('test')).toBe(AnotherUIComponent);

      warnSpy.mockRestore();
    });
  });

  describe('getUIComponent', () => {
    it('returns undefined for unregistered type', () => {
      expect(getUIComponent('nonexistent')).toBeUndefined();
    });

    it('returns registered component', () => {
      registerUIComponent('test', TestUIComponent);
      expect(getUIComponent('test')).toBe(TestUIComponent);
    });
  });

  describe('getAllUIComponents', () => {
    it('returns empty array when no components registered', () => {
      expect(getAllUIComponents()).toEqual([]);
    });

    it('returns all registered components', () => {
      registerUIComponent('test', TestUIComponent);
      registerUIComponent('another', AnotherUIComponent);

      const components = getAllUIComponents();
      expect(components).toHaveLength(2);
      expect(components).toContainEqual(['test', TestUIComponent]);
      expect(components).toContainEqual(['another', AnotherUIComponent]);
    });
  });

  describe('getUIComponentNames', () => {
    it('returns empty array when no components registered', () => {
      expect(getUIComponentNames()).toEqual([]);
    });

    it('returns all component names', () => {
      registerUIComponent('test', TestUIComponent);
      registerUIComponent('another', AnotherUIComponent);

      const names = getUIComponentNames();
      expect(names).toHaveLength(2);
      expect(names).toContain('test');
      expect(names).toContain('another');
    });
  });

  describe('clearUIComponentRegistry', () => {
    it('clears all registrations', () => {
      registerUIComponent('test', TestUIComponent);
      registerUIComponent('another', AnotherUIComponent);

      clearUIComponentRegistry();

      expect(getAllUIComponents()).toEqual([]);
    });
  });
});
