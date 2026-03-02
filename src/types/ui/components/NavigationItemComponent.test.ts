import { NavigationItemComponent } from './NavigationItemComponent';

describe('NavigationItemComponent', () => {
  it('has type "navigationItem"', () => {
    const c = new NavigationItemComponent();
    expect(c.type).toBe('navigationItem');
  });

  it('has label "ナビゲーション項目"', () => {
    const c = new NavigationItemComponent();
    expect(c.label).toBe('ナビゲーション項目');
  });

  it('round-trips serialize and deserialize', () => {
    const c = new NavigationItemComponent();
    const data = c.serialize();
    const c2 = new NavigationItemComponent();
    c2.deserialize(data);
    expect(c2.type).toBe('navigationItem');
  });

  it('deserialize with empty object works', () => {
    const c = new NavigationItemComponent();
    c.deserialize({});
    expect(c.type).toBe('navigationItem');
  });

  it('clone creates independent copy', () => {
    const c = new NavigationItemComponent();
    const cloned = c.clone();
    expect(cloned).not.toBe(c);
    expect(cloned.type).toBe('navigationItem');
  });
});
