import type { ReactNode } from 'react';

import {
  Component,
  registerComponent,
  getComponent,
  getAllComponents,
  getComponentNames,
  clearComponentRegistry,
} from './index';

// テスト用の具象クラス
class TestComponent extends Component {
  readonly type = 'test';
  value: string = '';

  serialize(): unknown {
    return { value: this.value };
  }

  deserialize(data: unknown): void {
    const d = data as { value: string };
    this.value = d.value;
  }

  clone(): TestComponent {
    const c = new TestComponent();
    c.value = this.value;
    return c;
  }

  renderPropertyPanel(): ReactNode {
    return null;
  }
}

class AnotherComponent extends Component {
  readonly type = 'another';
  count: number = 0;

  serialize(): unknown {
    return { count: this.count };
  }

  deserialize(data: unknown): void {
    const d = data as { count: number };
    this.count = d.count;
  }

  clone(): AnotherComponent {
    const c = new AnotherComponent();
    c.count = this.count;
    return c;
  }

  renderPropertyPanel(): ReactNode {
    return null;
  }
}

describe('Component registry', () => {
  beforeEach(() => {
    clearComponentRegistry();
  });

  describe('registerComponent', () => {
    it('registers a component', () => {
      registerComponent('test', TestComponent);
      expect(getComponent('test')).toBe(TestComponent);
    });

    it('overwrites existing registration with warning', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      registerComponent('test', TestComponent);
      registerComponent('test', AnotherComponent);

      expect(warnSpy).toHaveBeenCalledWith('Component "test" is already registered. Overwriting.');
      expect(getComponent('test')).toBe(AnotherComponent);

      warnSpy.mockRestore();
    });
  });

  describe('getComponent', () => {
    it('returns undefined for unregistered type', () => {
      expect(getComponent('nonexistent')).toBeUndefined();
    });

    it('returns registered component', () => {
      registerComponent('test', TestComponent);
      expect(getComponent('test')).toBe(TestComponent);
    });
  });

  describe('getAllComponents', () => {
    it('returns empty array when no components registered', () => {
      expect(getAllComponents()).toEqual([]);
    });

    it('returns all registered components', () => {
      registerComponent('test', TestComponent);
      registerComponent('another', AnotherComponent);

      const components = getAllComponents();
      expect(components).toHaveLength(2);
      expect(components).toContainEqual(['test', TestComponent]);
      expect(components).toContainEqual(['another', AnotherComponent]);
    });
  });

  describe('getComponentNames', () => {
    it('returns empty array when no components registered', () => {
      expect(getComponentNames()).toEqual([]);
    });

    it('returns all component names', () => {
      registerComponent('test', TestComponent);
      registerComponent('another', AnotherComponent);

      const names = getComponentNames();
      expect(names).toHaveLength(2);
      expect(names).toContain('test');
      expect(names).toContain('another');
    });
  });

  describe('clearComponentRegistry', () => {
    it('clears all registrations', () => {
      registerComponent('test', TestComponent);
      registerComponent('another', AnotherComponent);

      clearComponentRegistry();

      expect(getAllComponents()).toEqual([]);
    });
  });
});

describe('Component abstract class', () => {
  it('can be instantiated through subclass', () => {
    const component = new TestComponent();
    expect(component.type).toBe('test');
    expect(component.value).toBe('');
  });

  describe('serialize/deserialize', () => {
    it('serializes component state', () => {
      const component = new TestComponent();
      component.value = 'test value';

      expect(component.serialize()).toEqual({ value: 'test value' });
    });

    it('deserializes component state', () => {
      const component = new TestComponent();
      component.deserialize({ value: 'loaded' });

      expect(component.value).toBe('loaded');
    });
  });

  describe('clone', () => {
    it('creates a copy of the component', () => {
      const original = new TestComponent();
      original.value = 'original';

      const cloned = original.clone();

      expect(cloned).not.toBe(original);
      expect(cloned.value).toBe('original');
      expect(cloned.type).toBe('test');
    });

    it('cloned component is independent', () => {
      const original = new TestComponent();
      original.value = 'original';

      const cloned = original.clone();
      cloned.value = 'modified';

      expect(original.value).toBe('original');
      expect(cloned.value).toBe('modified');
    });
  });
});
