import { ActionComponent } from './ActionComponent';
import type { UIActionEntry } from './ActionComponent';

describe('ActionComponent', () => {
  it('has type "action"', () => {
    const c = new ActionComponent();
    expect(c.type).toBe('action');
  });

  it('has label "アクション"', () => {
    const c = new ActionComponent();
    expect(c.label).toBe('アクション');
  });

  it('has correct default values', () => {
    const c = new ActionComponent();
    expect(c.actions).toEqual([]);
  });

  it('round-trips serialize and deserialize', () => {
    const actions: UIActionEntry[] = [
      {
        id: 'onClick',
        name: 'クリック時',
        blocks: [
          { type: 'playSound', data: { soundId: 'se_confirm' } },
          { type: 'showMessage', data: { text: 'Hello' } },
        ],
      },
      {
        id: 'onSelect',
        name: '選択時',
        blocks: [{ type: 'highlight', data: { color: '#ff0' } }],
      },
    ];

    const c = new ActionComponent();
    c.actions = actions;

    const data = c.serialize();
    const c2 = new ActionComponent();
    c2.deserialize(data);

    expect(c2.actions).toEqual(actions);
  });

  it('deserialize with empty object uses defaults', () => {
    const c = new ActionComponent();
    c.deserialize({});
    expect(c.actions).toEqual([]);
  });

  it('serialized data is a deep copy', () => {
    const c = new ActionComponent();
    c.actions = [
      { id: 'onClick', name: 'クリック', blocks: [{ type: 'playSound', data: { soundId: 'se_1' } }] },
    ];

    const serialized = c.serialize() as { actions: UIActionEntry[] };
    serialized.actions[0]!.blocks[0]!.data.soundId = 'se_2';

    expect(c.actions[0]!.blocks[0]!.data.soundId).toBe('se_1');
  });

  it('deserialized data is a deep copy', () => {
    const sourceActions: UIActionEntry[] = [
      { id: 'onClick', name: 'クリック', blocks: [{ type: 'playSound', data: { soundId: 'se_1' } }] },
    ];

    const c = new ActionComponent();
    c.deserialize({ actions: sourceActions });

    sourceActions[0]!.blocks[0]!.data.soundId = 'se_2';

    expect(c.actions[0]!.blocks[0]!.data.soundId).toBe('se_1');
  });

  it('clone creates independent copy', () => {
    const c = new ActionComponent();
    c.actions = [
      { id: 'onSelect', name: '選択', blocks: [{ type: 'highlight', data: { color: '#ff0' } }] },
    ];

    const cloned = c.clone();
    cloned.actions[0]!.blocks[0]!.data.color = '#0ff';

    expect(c.actions[0]!.blocks[0]!.data.color).toBe('#ff0');
    expect(cloned.actions[0]!.blocks[0]!.data.color).toBe('#0ff');
  });

  it("clone's actions array is independent", () => {
    const c = new ActionComponent();
    c.actions = [
      { id: 'onClick', name: 'クリック', blocks: [] },
    ];

    const cloned = c.clone();
    cloned.actions.push({ id: 'onHover', name: 'ホバー', blocks: [] });

    expect(c.actions).toHaveLength(1);
    expect(cloned.actions).toHaveLength(2);
  });
});
