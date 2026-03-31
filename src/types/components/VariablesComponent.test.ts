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

  it('round-trips serialize and deserialize (new format)', () => {
    const c = new VariablesComponent();
    c.variables = {
      hp: { fieldType: 'number', value: 100 },
      name: { fieldType: 'string', value: 'hero' },
      active: { fieldType: 'boolean', value: true },
    };

    const data = c.serialize();
    const c2 = new VariablesComponent();
    c2.deserialize(data as Record<string, unknown>);

    expect(c2.variables['hp']).toEqual({ fieldType: 'number', value: 100 });
    expect(c2.variables['name']).toEqual({ fieldType: 'string', value: 'hero' });
    expect(c2.variables['active']).toEqual({ fieldType: 'boolean', value: true });
  });

  it('deserialize legacy format (plain values)', () => {
    const c = new VariablesComponent();
    c.deserialize({ variables: { hp: 100, name: 'hero', flag: true } });

    expect(c.variables['hp']).toEqual({ fieldType: 'number', value: 100 });
    expect(c.variables['name']).toEqual({ fieldType: 'string', value: 'hero' });
    expect(c.variables['flag']).toEqual({ fieldType: 'boolean', value: true });
  });

  it('deserialize with missing props uses defaults', () => {
    const c = new VariablesComponent();
    c.deserialize({});
    expect(c.variables).toEqual({});
  });

  it('clone creates independent copy', () => {
    const c = new VariablesComponent();
    c.variables = {
      hp: { fieldType: 'number', value: 100 },
    };

    const cloned = c.clone();
    cloned.variables['hp']!.value = 999;

    expect(c.variables['hp']!.value).toBe(100);
    expect(cloned.variables['hp']!.value).toBe(999);
  });
});
