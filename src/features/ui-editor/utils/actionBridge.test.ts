import { deserializeActions, serializeActions } from './actionBridge';
import { registerAction, clearActionRegistry, EventAction } from '@/engine/actions';
import { registerUIAction, clearUIActionRegistry } from '@/types/ui/actions';
import { SetVisibilityAction } from '@/types/ui/actions/SetVisibilityAction';
import type { GameContext } from '@/engine/runtime/GameContext';

// Test action class
class TestWaitAction extends EventAction {
  readonly type = 'wait';
  frames = 60;

  async execute(
    _context: GameContext,
    _run: (actions: EventAction[]) => Promise<void>
  ): Promise<void> {
    // noop
  }

  toJSON(): Record<string, unknown> {
    return { frames: this.frames };
  }

  fromJSON(data: Record<string, unknown>): void {
    this.frames = (data.frames as number) ?? 60;
  }
}

beforeEach(() => {
  clearActionRegistry();
  clearUIActionRegistry();
  registerAction('wait', TestWaitAction);
  registerUIAction('uiSetVisibility', SetVisibilityAction);
});

afterEach(() => {
  clearActionRegistry();
  clearUIActionRegistry();
});

describe('deserializeActions', () => {
  it('converts SerializedAction[] to EventAction[]', () => {
    const serialized = [{ type: 'wait', data: { frames: 30 } }];
    const actions = deserializeActions(serialized);

    expect(actions).toHaveLength(1);
    expect(actions[0]!.type).toBe('wait');
    expect((actions[0] as TestWaitAction).frames).toBe(30);
  });

  it('skips unknown action types', () => {
    const serialized = [
      { type: 'wait', data: { frames: 10 } },
      { type: 'unknown_action', data: {} },
    ];
    const actions = deserializeActions(serialized);

    expect(actions).toHaveLength(1);
    expect(actions[0]!.type).toBe('wait');
  });

  it('returns empty array for empty input', () => {
    const actions = deserializeActions([]);
    expect(actions).toHaveLength(0);
  });
});

describe('serializeActions', () => {
  it('converts EventAction[] to SerializedAction[]', () => {
    const action = new TestWaitAction();
    action.frames = 45;

    const serialized = serializeActions([action]);

    expect(serialized).toEqual([{ type: 'wait', data: { frames: 45 } }]);
  });

  it('returns empty array for empty input', () => {
    const serialized = serializeActions([]);
    expect(serialized).toEqual([]);
  });
});

describe('round-trip', () => {
  it('preserves data through serialize -> deserialize', () => {
    const action = new TestWaitAction();
    action.frames = 120;

    const serialized = serializeActions([action]);
    const deserialized = deserializeActions(serialized);

    expect(deserialized).toHaveLength(1);
    expect((deserialized[0] as TestWaitAction).frames).toBe(120);
  });
});

describe('UIAction support', () => {
  it('deserializes UIAction types from UIAction registry', () => {
    const serialized = [{ type: 'uiSetVisibility', data: { targetId: 'panel', visible: false } }];
    const actions = deserializeActions(serialized);

    expect(actions).toHaveLength(1);
    expect(actions[0]!.type).toBe('uiSetVisibility');
    const vis = actions[0] as SetVisibilityAction;
    expect(vis.targetId).toBe('panel');
    expect(vis.visible).toBe(false);
  });

  it('handles mixed EventAction and UIAction', () => {
    const serialized = [
      { type: 'wait', data: { frames: 30 } },
      { type: 'uiSetVisibility', data: { targetId: 'obj1', visible: true } },
    ];
    const actions = deserializeActions(serialized);

    expect(actions).toHaveLength(2);
    expect(actions[0]!.type).toBe('wait');
    expect(actions[1]!.type).toBe('uiSetVisibility');
  });

  it('round-trips UIAction through serialize -> deserialize', () => {
    const action = new SetVisibilityAction();
    action.targetId = 'menu-panel';
    action.visible = false;

    const serialized = serializeActions([action]);
    const deserialized = deserializeActions(serialized);

    expect(deserialized).toHaveLength(1);
    const restored = deserialized[0] as SetVisibilityAction;
    expect(restored.targetId).toBe('menu-panel');
    expect(restored.visible).toBe(false);
  });
});
