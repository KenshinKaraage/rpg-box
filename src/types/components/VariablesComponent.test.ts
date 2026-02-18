import { VariablesComponent } from './VariablesComponent';

describe('VariablesComponent', () => {
  it('has type "variables"', () => {
    const c = new VariablesComponent();
    expect(c.type).toBe('variables');
  });

  it('has correct default values', () => {
    const c = new VariablesComponent();
    expect(c.variables).toEqual({});
  });

  it('round-trips serialize and deserialize', () => {
    const c = new VariablesComponent();
    c.variables = { hp: 100, name: 'hero', nested: { a: 1 } };

    const data = c.serialize();
    const c2 = new VariablesComponent();
    c2.deserialize(data);

    expect(c2.variables).toEqual({ hp: 100, name: 'hero', nested: { a: 1 } });
  });

  it('deserialize with missing props uses defaults', () => {
    const c = new VariablesComponent();
    c.deserialize({});

    expect(c.variables).toEqual({});
  });

  it('clone creates independent copy', () => {
    const c = new VariablesComponent();
    c.variables = { hp: 100, nested: { a: 1 } };

    const cloned = c.clone();
    (cloned.variables['nested'] as Record<string, unknown>)['a'] = 99;

    expect((c.variables['nested'] as Record<string, unknown>)['a']).toBe(1);
    expect((cloned.variables['nested'] as Record<string, unknown>)['a']).toBe(99);
  });
});
