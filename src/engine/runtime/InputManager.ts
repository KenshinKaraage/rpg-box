/**
 * Keyboard input mapped to game buttons.
 * Call update() at the start of each frame to sync state.
 */

export type GameButton = 'up' | 'down' | 'left' | 'right' | 'confirm' | 'cancel' | 'menu';

const DEFAULT_KEY_MAP: Record<string, GameButton> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  W: 'up',
  s: 'down',
  S: 'down',
  a: 'left',
  A: 'left',
  d: 'right',
  D: 'right',
  Enter: 'confirm',
  ' ': 'confirm',
  z: 'confirm',
  Z: 'confirm',
  Escape: 'cancel',
  x: 'cancel',
  X: 'cancel',
  m: 'menu',
  M: 'menu',
};

export class InputManager {
  private keyMap: Record<string, GameButton>;
  private currentState = new Set<GameButton>();
  private previousState = new Set<GameButton>();
  private rawKeysDown = new Set<string>();
  private target: HTMLElement | null = null;

  constructor(keyMap?: Record<string, GameButton>) {
    this.keyMap = keyMap ?? { ...DEFAULT_KEY_MAP };
  }

  attach(target: HTMLElement): void {
    this.detach();
    this.target = target;
    target.addEventListener('keydown', this.onKeyDown);
    target.addEventListener('keyup', this.onKeyUp);
    target.addEventListener('blur', this.onBlur);
  }

  detach(): void {
    if (this.target) {
      this.target.removeEventListener('keydown', this.onKeyDown);
      this.target.removeEventListener('keyup', this.onKeyUp);
      this.target.removeEventListener('blur', this.onBlur);
      this.target = null;
    }
    this.rawKeysDown.clear();
    this.currentState.clear();
    this.previousState.clear();
  }

  /** Call at the start of each frame to latch state. */
  update(): void {
    this.previousState = new Set(this.currentState);
    this.currentState.clear();
    this.rawKeysDown.forEach((key) => {
      const button = this.keyMap[key];
      if (button) this.currentState.add(button);
    });
  }

  isDown(button: GameButton): boolean {
    return this.currentState.has(button);
  }

  isJustPressed(button: GameButton): boolean {
    return this.currentState.has(button) && !this.previousState.has(button);
  }

  isJustReleased(button: GameButton): boolean {
    return !this.currentState.has(button) && this.previousState.has(button);
  }

  /**
   * Returns a Promise that resolves when the specified button is just pressed.
   * Used by ScriptAPI: `await Input.pressed('confirm')`
   */
  pressed(button: GameButton): Promise<void> {
    return new Promise<void>((resolve) => {
      const check = () => {
        if (this.isJustPressed(button)) {
          resolve();
        } else {
          requestAnimationFrame(check);
        }
      };
      requestAnimationFrame(check);
    });
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    if (this.keyMap[e.key]) {
      e.preventDefault();
      this.rawKeysDown.add(e.key);
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.rawKeysDown.delete(e.key);
  };

  private onBlur = (): void => {
    this.rawKeysDown.clear();
  };
}
