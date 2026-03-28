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

interface ButtonWaiter {
  button: GameButton;
  resolve: () => void;
}

export class InputManager {
  private keyMap: Record<string, GameButton>;
  private currentState = new Set<GameButton>();
  private previousState = new Set<GameButton>();
  private rawKeysDown = new Set<string>();
  private target: HTMLElement | null = null;
  private waiters: ButtonWaiter[] = [];
  /** 今フレームで押されたキー（e.key そのまま） */
  private justPressedKeys: string[] = [];
  private justPressedKeysBuffer: string[] = [];

  /** テキスト入力用の隠し input 要素 */
  private hiddenInput: HTMLInputElement | null = null;
  private _textInputActive = false;
  private _textValue = '';
  private _textConfirmed = false;
  private _textCancelled = false;

  constructor(keyMap?: Record<string, GameButton>) {
    this.keyMap = keyMap ?? { ...DEFAULT_KEY_MAP };
  }

  attach(target: HTMLElement): void {
    this.detach();
    this.target = target;
    target.addEventListener('keydown', this.onKeyDown);
    target.addEventListener('keyup', this.onKeyUp);
    target.addEventListener('blur', this.onBlur);

    // 隠し input（IME 対応テキスト入力用）
    const input = document.createElement('input');
    input.type = 'text';
    input.style.cssText = 'position:absolute;left:-9999px;top:0;width:1px;height:1px;opacity:0;';
    input.addEventListener('keydown', this.onHiddenInputKeyDown);
    target.parentElement?.appendChild(input);
    this.hiddenInput = input;
  }

  detach(): void {
    if (this.target) {
      this.target.removeEventListener('keydown', this.onKeyDown);
      this.target.removeEventListener('keyup', this.onKeyUp);
      this.target.removeEventListener('blur', this.onBlur);
      this.target = null;
    }
    if (this.hiddenInput) {
      this.hiddenInput.removeEventListener('keydown', this.onHiddenInputKeyDown);
      this.hiddenInput.remove();
      this.hiddenInput = null;
    }
    this.rawKeysDown.clear();
    this.currentState.clear();
    this.previousState.clear();
    this.waiters = [];
    this._textInputActive = false;
  }

  /** Call at the start of each frame to latch state. */
  update(): void {
    this.previousState = new Set(this.currentState);
    this.currentState.clear();
    this.rawKeysDown.forEach((key) => {
      const button = this.keyMap[key];
      if (button) this.currentState.add(button);
    });
    // 生キー入力をフレーム単位で確定
    this.justPressedKeys = this.justPressedKeysBuffer;
    this.justPressedKeysBuffer = [];
  }

  /** 今フレームで押されたキー一覧（e.key そのまま） */
  getJustPressedKeys(): string[] {
    return this.justPressedKeys;
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
   * Game-loop synced: processWaiters() must be called each frame after update().
   */
  pressed(button: GameButton): Promise<void> {
    return new Promise<void>((resolve) => {
      this.waiters.push({ button, resolve });
    });
  }

  /**
   * Resolve waiters for buttons that were just pressed this frame.
   * Called by GameRuntime each frame after update().
   */
  processWaiters(): void {
    if (this.waiters.length === 0) return;
    this.waiters = this.waiters.filter((w) => {
      if (this.isJustPressed(w.button)) {
        w.resolve();
        return false;
      }
      return true;
    });
  }

  /** テキスト入力を開始（隠し input にフォーカス） */
  startTextInput(initialValue = ''): void {
    if (!this.hiddenInput) return;
    this._textInputActive = true;
    this._textValue = initialValue;
    this._textConfirmed = false;
    this._textCancelled = false;
    this.hiddenInput.value = initialValue;
    this.hiddenInput.focus();
  }

  /** テキスト入力を終了（canvas にフォーカスを戻す） */
  stopTextInput(): void {
    this._textInputActive = false;
    if (this.hiddenInput) this.hiddenInput.blur();
    if (this.target) this.target.focus();
  }

  /** 現在のテキスト値を取得 */
  getTextValue(): string {
    if (this._textInputActive && this.hiddenInput) {
      this._textValue = this.hiddenInput.value;
    }
    return this._textValue;
  }

  /** Enter が押されたか */
  isTextConfirmed(): boolean { return this._textConfirmed; }

  /** Escape が押されたか */
  isTextCancelled(): boolean { return this._textCancelled; }

  get textInputActive(): boolean { return this._textInputActive; }

  private onHiddenInputKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Enter') {
      e.preventDefault();
      this._textValue = this.hiddenInput?.value ?? '';
      this._textConfirmed = true;
    } else if (e.key === 'Escape') {
      e.preventDefault();
      this._textCancelled = true;
    }
  };

  private onKeyDown = (e: KeyboardEvent): void => {
    // 生キー入力をバッファに蓄積（全キー）
    this.justPressedKeysBuffer.push(e.key);
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
