import { TemplateControllerComponent } from './TemplateControllerComponent';

describe('TemplateControllerComponent', () => {
  it('has type "templateController"', () => {
    const c = new TemplateControllerComponent();
    expect(c.type).toBe('templateController');
  });

  it('has label "テンプレートコントローラー"', () => {
    const c = new TemplateControllerComponent();
    expect(c.label).toBe('テンプレートコントローラー');
  });

  it('has correct default values', () => {
    const c = new TemplateControllerComponent();
    expect(c.args).toEqual([]);
    expect(c.onSpawnActions).toEqual([]);
  });

  it('round-trips serialize and deserialize', () => {
    const c = new TemplateControllerComponent();
    c.args = [
      { id: 'arg1', name: 'color', fieldType: 'string', defaultValue: '#ff0000' },
      { id: 'arg2', name: 'speed', fieldType: 'number', defaultValue: 5 },
    ];
    c.onSpawnActions = [
      { type: 'wait', data: { frames: 30 } },
    ];

    const data = c.serialize();
    const c2 = new TemplateControllerComponent();
    c2.deserialize(data);

    expect(c2.args).toEqual(c.args);
    expect(c2.onSpawnActions).toEqual(c.onSpawnActions);
  });

  it('deserialize with empty object uses defaults', () => {
    const c = new TemplateControllerComponent();
    c.deserialize({});

    expect(c.args).toEqual([]);
    expect(c.onSpawnActions).toEqual([]);
  });

  it('clone creates independent copy', () => {
    const c = new TemplateControllerComponent();
    c.args = [{ id: 'a1', name: 'x', fieldType: 'number', defaultValue: 0 }];
    c.onSpawnActions = [{ type: 'wait', data: { frames: 60 } }];

    const cloned = c.clone();

    // Modify clone
    cloned.args[0]!.name = 'y';
    cloned.onSpawnActions[0]!.data.frames = 120;

    // Original unchanged
    expect(c.args[0]!.name).toBe('x');
    expect(c.onSpawnActions[0]!.data.frames).toBe(60);
  });

  it('clone deep-clones args and onSpawnActions', () => {
    const c = new TemplateControllerComponent();
    c.args = [{ id: 'a1', name: 'hp', fieldType: 'number', defaultValue: 100 }];

    const cloned = c.clone();

    expect(cloned.args).toEqual(c.args);
    expect(cloned.args).not.toBe(c.args);
  });
});
