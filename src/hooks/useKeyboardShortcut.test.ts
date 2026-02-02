/**
 * useKeyboardShortcut フックのテスト
 */
import { renderHook } from '@testing-library/react';
import {
  useKeyboardShortcut,
  useShortcut,
  parseShortcut,
  shortcutToString,
  shortcutManager,
  CommonShortcuts,
} from './useKeyboardShortcut';

// キーボードイベントをシミュレート
function fireKeyEvent(
  key: string,
  options: {
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    metaKey?: boolean;
  } = {}
): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {
    key,
    ctrlKey: options.ctrlKey ?? false,
    shiftKey: options.shiftKey ?? false,
    altKey: options.altKey ?? false,
    metaKey: options.metaKey ?? false,
    bubbles: true,
    cancelable: true,
  });
  window.dispatchEvent(event);
  return event;
}

describe('useKeyboardShortcut', () => {
  beforeEach(() => {
    shortcutManager.clear();
  });

  describe('基本的なショートカット登録', () => {
    it('単一キーのショートカットが動作する', () => {
      const handler = jest.fn();

      renderHook(() =>
        useKeyboardShortcut({
          keys: { key: 'Escape' },
          handler,
        })
      );

      fireKeyEvent('Escape');

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('Ctrl+キーのショートカットが動作する', () => {
      const handler = jest.fn();

      renderHook(() =>
        useKeyboardShortcut({
          keys: { key: 's', ctrl: true },
          handler,
        })
      );

      // Ctrlなしでは動作しない
      fireKeyEvent('s');
      expect(handler).not.toHaveBeenCalled();

      // Ctrl+Sで動作
      fireKeyEvent('s', { ctrlKey: true });
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('Ctrl+Shift+キーのショートカットが動作する', () => {
      const handler = jest.fn();

      renderHook(() =>
        useKeyboardShortcut({
          keys: { key: 'z', ctrl: true, shift: true },
          handler,
        })
      );

      // Ctrl+Zだけでは動作しない
      fireKeyEvent('z', { ctrlKey: true });
      expect(handler).not.toHaveBeenCalled();

      // Ctrl+Shift+Zで動作
      fireKeyEvent('z', { ctrlKey: true, shiftKey: true });
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('macOSのCmd+キーがCtrl+キーとして動作する', () => {
      const handler = jest.fn();

      renderHook(() =>
        useKeyboardShortcut({
          keys: { key: 's', ctrl: true },
          handler,
        })
      );

      // Cmd+S (metaKey) でも動作
      fireKeyEvent('s', { metaKey: true });
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('複数ショートカットの登録', () => {
    it('複数のショートカットを一括登録できる', () => {
      const saveHandler = jest.fn();
      const undoHandler = jest.fn();

      renderHook(() =>
        useKeyboardShortcut({
          shortcuts: [
            { keys: { key: 's', ctrl: true }, handler: saveHandler },
            { keys: { key: 'z', ctrl: true }, handler: undoHandler },
          ],
        })
      );

      fireKeyEvent('s', { ctrlKey: true });
      expect(saveHandler).toHaveBeenCalledTimes(1);
      expect(undoHandler).not.toHaveBeenCalled();

      fireKeyEvent('z', { ctrlKey: true });
      expect(undoHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('優先度制御', () => {
    it('高い優先度のショートカットが先に実行される', () => {
      const lowPriorityHandler = jest.fn();
      const highPriorityHandler = jest.fn();

      renderHook(() =>
        useKeyboardShortcut({
          keys: { key: 'Escape' },
          handler: lowPriorityHandler,
          priority: 0,
        })
      );

      renderHook(() =>
        useKeyboardShortcut({
          keys: { key: 'Escape' },
          handler: highPriorityHandler,
          priority: 100,
        })
      );

      fireKeyEvent('Escape');

      // 高優先度のみ実行
      expect(highPriorityHandler).toHaveBeenCalledTimes(1);
      expect(lowPriorityHandler).not.toHaveBeenCalled();
    });
  });

  describe('preventDefault / stopPropagation', () => {
    it('デフォルトでpreventDefaultが呼ばれる', () => {
      const handler = jest.fn();

      renderHook(() =>
        useKeyboardShortcut({
          keys: { key: 's', ctrl: true },
          handler,
        })
      );

      const event = fireKeyEvent('s', { ctrlKey: true });
      expect(event.defaultPrevented).toBe(true);
    });

    it('preventDefault: false でpreventDefaultが呼ばれない', () => {
      const handler = jest.fn();

      renderHook(() =>
        useKeyboardShortcut({
          keys: { key: 's', ctrl: true },
          handler,
          preventDefault: false,
        })
      );

      const event = fireKeyEvent('s', { ctrlKey: true });
      expect(event.defaultPrevented).toBe(false);
    });
  });

  describe('入力要素での動作', () => {
    it('デフォルトでは入力要素内でショートカットが無効', () => {
      const handler = jest.fn();

      // input要素をフォーカス状態にシミュレート
      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      renderHook(() =>
        useKeyboardShortcut({
          keys: { key: 's', ctrl: true },
          handler,
        })
      );

      fireKeyEvent('s', { ctrlKey: true });
      expect(handler).not.toHaveBeenCalled();

      document.body.removeChild(input);
    });

    it('enableInInputs: true で入力要素内でも有効', () => {
      const handler = jest.fn();

      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      renderHook(() =>
        useKeyboardShortcut({
          keys: { key: 's', ctrl: true },
          handler,
          enableInInputs: true,
        })
      );

      fireKeyEvent('s', { ctrlKey: true });
      expect(handler).toHaveBeenCalledTimes(1);

      document.body.removeChild(input);
    });
  });

  describe('enabled オプション', () => {
    it('enabled: false でショートカットが無効', () => {
      const handler = jest.fn();

      renderHook(() =>
        useKeyboardShortcut({
          keys: { key: 'Escape' },
          handler,
          enabled: false,
        })
      );

      fireKeyEvent('Escape');
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('クリーンアップ', () => {
    it('アンマウント時にショートカットが解除される', () => {
      const handler = jest.fn();

      const { unmount } = renderHook(() =>
        useKeyboardShortcut({
          keys: { key: 'Escape' },
          handler,
        })
      );

      fireKeyEvent('Escape');
      expect(handler).toHaveBeenCalledTimes(1);

      unmount();

      fireKeyEvent('Escape');
      expect(handler).toHaveBeenCalledTimes(1); // 増えない
    });
  });
});

describe('useShortcut', () => {
  beforeEach(() => {
    shortcutManager.clear();
  });

  it('文字列形式でショートカットを登録できる', () => {
    const handler = jest.fn();

    renderHook(() => useShortcut('ctrl+s', handler));

    fireKeyEvent('s', { ctrlKey: true });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('ShortcutKey形式でも登録できる', () => {
    const handler = jest.fn();

    renderHook(() => useShortcut(CommonShortcuts.undo, handler));

    fireKeyEvent('z', { ctrlKey: true });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('オプションを渡せる', () => {
    const handler = jest.fn();

    renderHook(() => useShortcut('escape', handler, { priority: 100 }));

    fireKeyEvent('Escape');
    expect(handler).toHaveBeenCalledTimes(1);
  });
});

describe('parseShortcut', () => {
  it('単一キーを解析できる', () => {
    expect(parseShortcut('escape')).toEqual({ key: 'escape' });
    expect(parseShortcut('Enter')).toEqual({ key: 'enter' });
  });

  it('Ctrl+キーを解析できる', () => {
    expect(parseShortcut('ctrl+s')).toEqual({ key: 's', ctrl: true });
    expect(parseShortcut('Ctrl+S')).toEqual({ key: 's', ctrl: true });
  });

  it('複数の修飾キーを解析できる', () => {
    expect(parseShortcut('ctrl+shift+z')).toEqual({
      key: 'z',
      ctrl: true,
      shift: true,
    });
  });

  it('Alt, Metaを解析できる', () => {
    expect(parseShortcut('alt+a')).toEqual({ key: 'a', alt: true });
    expect(parseShortcut('meta+s')).toEqual({ key: 's', meta: true });
    expect(parseShortcut('cmd+s')).toEqual({ key: 's', meta: true });
  });
});

describe('shortcutToString', () => {
  it('ショートカットを文字列に変換できる', () => {
    expect(shortcutToString({ key: 's', ctrl: true })).toBe('Ctrl+S');
    expect(shortcutToString({ key: 'z', ctrl: true, shift: true })).toBe('Ctrl+Shift+Z');
    expect(shortcutToString({ key: 'Escape' })).toBe('ESCAPE');
  });
});

describe('CommonShortcuts', () => {
  it('よく使うショートカットが定義されている', () => {
    expect(CommonShortcuts.save).toEqual({ key: 's', ctrl: true });
    expect(CommonShortcuts.undo).toEqual({ key: 'z', ctrl: true });
    expect(CommonShortcuts.redo).toEqual({ key: 'z', ctrl: true, shift: true });
    expect(CommonShortcuts.escape).toEqual({ key: 'Escape' });
  });
});
