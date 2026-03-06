import { GameLoop } from './GameLoop';

// Mock rAF/cAF
let rafCallback: ((timestamp: number) => void) | null = null;
let rafId = 0;

beforeEach(() => {
  rafCallback = null;
  rafId = 0;
  jest.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb) => {
    rafCallback = cb;
    return ++rafId;
  });
  jest.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {
    rafCallback = null;
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

function simulateFrame(timestamp: number) {
  const cb = rafCallback;
  if (cb) cb(timestamp);
}

describe('GameLoop', () => {
  it('calls update at fixed timestep and render once per frame', () => {
    const update = jest.fn();
    const render = jest.fn();
    const loop = new GameLoop({ update, render });

    loop.start();
    expect(loop.isRunning()).toBe(true);

    // First frame: sets lastTime, no update/render yet
    simulateFrame(0);
    expect(update).not.toHaveBeenCalled();

    // Second frame: 16.67ms later → 1 update + 1 render
    simulateFrame(16.67);
    expect(update).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith(expect.closeTo(1 / 60, 5));
    expect(render).toHaveBeenCalledTimes(1);
  });

  it('catches up with multiple updates for large delta', () => {
    const update = jest.fn();
    const render = jest.fn();
    const loop = new GameLoop({ update, render });

    loop.start();
    simulateFrame(0);

    // 50ms delta → 3 updates (50 / 16.67 ≈ 3)
    simulateFrame(50);
    expect(update).toHaveBeenCalledTimes(3);
    expect(render).toHaveBeenCalledTimes(1);
  });

  it('caps delta at 100ms', () => {
    const update = jest.fn();
    const render = jest.fn();
    const loop = new GameLoop({ update, render });

    loop.start();
    simulateFrame(0);

    // 500ms delta → capped to 100ms → 6 updates (100 / 16.67 ≈ 6)
    simulateFrame(500);
    expect(update).toHaveBeenCalledTimes(6);
  });

  it('stop cancels the loop', () => {
    const update = jest.fn();
    const render = jest.fn();
    const loop = new GameLoop({ update, render });

    loop.start();
    loop.stop();

    expect(loop.isRunning()).toBe(false);
    expect(cancelAnimationFrame).toHaveBeenCalled();
  });

  it('pause/resume works', () => {
    const update = jest.fn();
    const render = jest.fn();
    const loop = new GameLoop({ update, render });

    loop.start();
    simulateFrame(0);
    simulateFrame(16.67);
    expect(update).toHaveBeenCalledTimes(1);

    loop.pause();
    expect(loop.isPaused()).toBe(true);

    // While paused, no updates
    simulateFrame(100);
    simulateFrame(200);
    expect(update).toHaveBeenCalledTimes(1);

    loop.resume();
    expect(loop.isPaused()).toBe(false);

    // After resume, first frame resets lastTime
    simulateFrame(300);
    expect(update).toHaveBeenCalledTimes(1); // still 1 (resetting)

    // Next frame triggers update normally
    simulateFrame(316.67);
    expect(update).toHaveBeenCalledTimes(2);
  });

  it('does not double-start', () => {
    const loop = new GameLoop({ update: jest.fn(), render: jest.fn() });
    loop.start();
    loop.start(); // no-op
    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
  });
});
