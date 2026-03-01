import { NavigationItemComponent, SerializedAction } from './NavigationItemComponent';

describe('NavigationItemComponent', () => {
  it('has type "navigationItem"', () => {
    const c = new NavigationItemComponent();
    expect(c.type).toBe('navigationItem');
  });

  it('has label "ナビゲーション項目"', () => {
    const c = new NavigationItemComponent();
    expect(c.label).toBe('ナビゲーション項目');
  });

  it('has correct default values', () => {
    const c = new NavigationItemComponent();
    expect(c.onSelectActions).toEqual([]);
  });

  it('round-trips serialize and deserialize', () => {
    const actions: SerializedAction[] = [
      { type: 'playSound', data: { soundId: 'se_confirm' } },
      { type: 'showMessage', data: { text: 'Hello' } },
    ];

    const c = new NavigationItemComponent();
    c.onSelectActions = actions;

    const data = c.serialize();
    const c2 = new NavigationItemComponent();
    c2.deserialize(data);

    expect(c2.onSelectActions).toEqual(actions);
  });

  it('deserialize with empty object uses defaults', () => {
    const c = new NavigationItemComponent();
    c.deserialize({});

    expect(c.onSelectActions).toEqual([]);
  });

  it('serialized actions are deep copies (modifying serialized data does not affect original)', () => {
    const c = new NavigationItemComponent();
    c.onSelectActions = [{ type: 'playSound', data: { soundId: 'se_confirm' } }];

    const serialized = c.serialize() as { onSelectActions: SerializedAction[] };
    serialized.onSelectActions[0]!.data.soundId = 'se_cancel';

    expect(c.onSelectActions[0]!.data.soundId).toBe('se_confirm');
  });

  it('deserialized actions are deep copies (modifying source does not affect deserialized)', () => {
    const sourceActions: SerializedAction[] = [
      { type: 'playSound', data: { soundId: 'se_confirm' } },
    ];

    const c = new NavigationItemComponent();
    c.deserialize({ onSelectActions: sourceActions });

    sourceActions[0]!.data.soundId = 'se_cancel';

    expect(c.onSelectActions[0]!.data.soundId).toBe('se_confirm');
  });

  it('clone creates independent copy', () => {
    const c = new NavigationItemComponent();
    c.onSelectActions = [{ type: 'playSound', data: { soundId: 'se_confirm' } }];

    const cloned = c.clone();
    cloned.onSelectActions[0]!.data.soundId = 'se_cancel';

    expect(c.onSelectActions[0]!.data.soundId).toBe('se_confirm');
    expect(cloned.onSelectActions[0]!.data.soundId).toBe('se_cancel');
  });

  it("clone's actions array is independent from original", () => {
    const c = new NavigationItemComponent();
    c.onSelectActions = [{ type: 'playSound', data: { soundId: 'se_confirm' } }];

    const cloned = c.clone();
    cloned.onSelectActions.push({ type: 'showMessage', data: { text: 'Added' } });

    expect(c.onSelectActions).toHaveLength(1);
    expect(cloned.onSelectActions).toHaveLength(2);
  });
});
