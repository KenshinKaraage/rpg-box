import { deserializeActions, serializeActions } from './actionBridge';
import { registerAction, clearActionRegistry, EventAction } from '@/engine/actions';
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
  registerAction('wait', TestWaitAction);
});

afterEach(() => {
  clearActionRegistry();
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
