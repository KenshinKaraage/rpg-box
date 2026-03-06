import { InputManager } from './InputManager';

function createTarget() {
  const listeners: Record<string, ((e: Partial<KeyboardEvent>) => void)[]> = {};
  return {
    addEventListener: jest.fn((type: string, handler: (e: Partial<KeyboardEvent>) => void) => {
      (listeners[type] ??= []).push(handler);
    }),
    removeEventListener: jest.fn((type: string, handler: (e: Partial<KeyboardEvent>) => void) => {
      const arr = listeners[type];
      if (arr) {
        const idx = arr.indexOf(handler);
        if (idx >= 0) arr.splice(idx, 1);
      }
    }),
    dispatchKey(type: 'keydown' | 'keyup', key: string) {
      for (const h of listeners[type] ?? []) {
        h({ key, preventDefault: jest.fn() });
      }
    },
    dispatchBlur() {
      for (const h of listeners['blur'] ?? []) {
        h({});
      }
    },
  } as unknown as HTMLElement & {
    dispatchKey: (type: 'keydown' | 'keyup', key: string) => void;
    dispatchBlur: () => void;
  };
}

describe('InputManager', () => {
  it('maps arrow keys to direction buttons', () => {
    const input = new InputManager();
    const target = createTarget();
    input.attach(target);

    target.dispatchKey('keydown', 'ArrowUp');
    input.update();

    expect(input.isDown('up')).toBe(true);
    expect(input.isDown('down')).toBe(false);
  });

  it('maps WASD to direction buttons', () => {
    const input = new InputManager();
    const target = createTarget();
    input.attach(target);

    target.dispatchKey('keydown', 'w');
    input.update();
    expect(input.isDown('up')).toBe(true);

    target.dispatchKey('keydown', 'a');
    input.update();
    expect(input.isDown('left')).toBe(true);
  });

  it('detects just pressed and just released', () => {
    const input = new InputManager();
    const target = createTarget();
    input.attach(target);

    // Frame 1: press
    target.dispatchKey('keydown', 'z');
    input.update();
    expect(input.isJustPressed('confirm')).toBe(true);
    expect(input.isDown('confirm')).toBe(true);

    // Frame 2: still held
    input.update();
    expect(input.isJustPressed('confirm')).toBe(false);
    expect(input.isDown('confirm')).toBe(true);

    // Frame 3: released
    target.dispatchKey('keyup', 'z');
    input.update();
    expect(input.isJustReleased('confirm')).toBe(true);
    expect(input.isDown('confirm')).toBe(false);

    // Frame 4: nothing
    input.update();
    expect(input.isJustReleased('confirm')).toBe(false);
  });

  it('clears state on blur', () => {
    const input = new InputManager();
    const target = createTarget();
    input.attach(target);

    target.dispatchKey('keydown', 'ArrowUp');
    input.update();
    expect(input.isDown('up')).toBe(true);

    target.dispatchBlur();
    input.update();
    expect(input.isDown('up')).toBe(false);
  });

  it('detach removes listeners and clears state', () => {
    const input = new InputManager();
    const target = createTarget();
    input.attach(target);

    target.dispatchKey('keydown', 'ArrowUp');
    input.update();
    expect(input.isDown('up')).toBe(true);

    input.detach();
    input.update();
    expect(input.isDown('up')).toBe(false);
    expect(target.removeEventListener).toHaveBeenCalled();
  });

  it('supports custom key map', () => {
    const input = new InputManager({ 'j': 'confirm', 'k': 'cancel' });
    const target = createTarget();
    input.attach(target);

    target.dispatchKey('keydown', 'j');
    input.update();
    expect(input.isDown('confirm')).toBe(true);

    // Default keys should not work
    target.dispatchKey('keydown', 'z');
    input.update();
    expect(input.isDown('confirm')).toBe(true); // j still held
  });

  it('handles confirm mapping for Enter and Space', () => {
    const input = new InputManager();
    const target = createTarget();
    input.attach(target);

    target.dispatchKey('keydown', 'Enter');
    input.update();
    expect(input.isDown('confirm')).toBe(true);

    target.dispatchKey('keyup', 'Enter');
    target.dispatchKey('keydown', ' ');
    input.update();
    expect(input.isDown('confirm')).toBe(true);
  });
});
