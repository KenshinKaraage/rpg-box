import { UIComponent } from './UIComponent';

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

describe('UIComponent abstract class', () => {
  it('can be instantiated through subclass', () => {
    const component = new TestUIComponent();
    expect(component.type).toBe('test');
    expect(component.label).toBe('Test');
    expect(component.value).toBe('');
  });

  describe('serialize/deserialize', () => {
    it('serializes component state', () => {
      const component = new TestUIComponent();
      component.value = 'test value';

      expect(component.serialize()).toEqual({ value: 'test value' });
    });

    it('deserializes component state', () => {
      const component = new TestUIComponent();
      component.deserialize({ value: 'loaded' });

      expect(component.value).toBe('loaded');
    });

    it('round-trips serialize and deserialize', () => {
      const original = new TestUIComponent();
      original.value = 'round-trip';

      const data = original.serialize();
      const restored = new TestUIComponent();
      restored.deserialize(data);

      expect(restored.value).toBe('round-trip');
    });
  });

  describe('clone', () => {
    it('creates a copy of the component', () => {
      const original = new TestUIComponent();
      original.value = 'original';

      const cloned = original.clone();

      expect(cloned).not.toBe(original);
      expect(cloned.value).toBe('original');
      expect(cloned.type).toBe('test');
      expect(cloned.label).toBe('Test');
    });

    it('cloned component is independent', () => {
      const original = new TestUIComponent();
      original.value = 'original';

      const cloned = original.clone();
      cloned.value = 'modified';

      expect(original.value).toBe('original');
      expect(cloned.value).toBe('modified');
    });
  });

  describe('renderPropertyPanel', () => {
    it('returns null by default', () => {
      const component = new TestUIComponent();
      expect(component.renderPropertyPanel()).toBeNull();
    });
  });
});
