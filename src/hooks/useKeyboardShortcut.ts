'use client';

/**
 * useKeyboardShortcut フック
 *
 * キーボードショートカットの登録と管理
 * コンテキスト（ページ/モーダル）による優先度制御に対応
 *
 * @see CLAUDE.md#アクセシビリティ
 */

import { useCallback, useEffect, useRef } from 'react';

// =============================================================================
// 型定義
// =============================================================================

export type ModifierKey = 'ctrl' | 'shift' | 'alt' | 'meta';

export interface ShortcutKey {
  /** メインキー（例: 's', 'z', 'Enter', 'ArrowUp'） */
  key: string;
  /** 修飾キー */
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
}

export interface ShortcutConfig {
  /** ショートカットキー設定 */
  keys: ShortcutKey;
  /** ハンドラー関数 */
  handler: (event: KeyboardEvent) => void;
  /** コンテキスト（優先度制御用、数字が大きいほど優先） */
  priority?: number;
  /** デフォルトのブラウザ動作を防止するか（デフォルト: true） */
  preventDefault?: boolean;
  /** イベント伝播を停止するか（デフォルト: false） */
  stopPropagation?: boolean;
  /** 入力要素（input, textarea）でも有効にするか（デフォルト: false） */
  enableInInputs?: boolean;
  /** 有効/無効（デフォルト: true） */
  enabled?: boolean;
}

export interface UseKeyboardShortcutOptions {
  /** 複数のショートカットを一括登録 */
  shortcuts?: ShortcutConfig[];
  /** グローバルに適用するか（デフォルト: true） */
  global?: boolean;
  /** 対象要素（global=falseの場合） */
  targetRef?: React.RefObject<HTMLElement>;
}

// =============================================================================
// ヘルパー関数
// =============================================================================

/**
 * キーボードイベントがショートカットにマッチするかチェック
 */
function matchesShortcut(event: KeyboardEvent, keys: ShortcutKey): boolean {
  // メインキーのチェック（大文字小文字を区別しない）
  const eventKey = event.key.toLowerCase();
  const targetKey = keys.key.toLowerCase();

  if (eventKey !== targetKey) {
    return false;
  }

  // 修飾キーのチェック
  const ctrlRequired = keys.ctrl ?? false;
  const shiftRequired = keys.shift ?? false;
  const altRequired = keys.alt ?? false;
  const metaRequired = keys.meta ?? false;

  // macOSではCtrl+キーの代わりにCmd+キーを使う場合が多いので、
  // ctrlがtrueの場合はmetaKeyもチェック
  const ctrlOrMeta = event.ctrlKey || event.metaKey;

  if (ctrlRequired && !ctrlOrMeta) return false;
  if (!ctrlRequired && ctrlOrMeta) return false;

  if (shiftRequired !== event.shiftKey) return false;
  if (altRequired !== event.altKey) return false;
  if (metaRequired && !event.metaKey) return false;

  return true;
}

/**
 * 現在のフォーカス要素が入力要素かチェック
 */
function isInputElement(element: Element | null): boolean {
  if (!element) return false;

  const tagName = element.tagName.toLowerCase();
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
    return true;
  }

  // contenteditable属性を持つ要素
  if (element.getAttribute('contenteditable') === 'true') {
    return true;
  }

  return false;
}

/**
 * ショートカットキーを文字列表現に変換（デバッグ用）
 */
export function shortcutToString(keys: ShortcutKey): string {
  const parts: string[] = [];

  if (keys.ctrl) parts.push('Ctrl');
  if (keys.shift) parts.push('Shift');
  if (keys.alt) parts.push('Alt');
  if (keys.meta) parts.push('Meta');
  parts.push(keys.key.toUpperCase());

  return parts.join('+');
}

/**
 * 文字列からShortcutKeyを解析
 */
export function parseShortcut(shortcut: string): ShortcutKey {
  const parts = shortcut
    .toLowerCase()
    .split('+')
    .map((p) => p.trim());
  const result: ShortcutKey = { key: '' };

  for (const part of parts) {
    switch (part) {
      case 'ctrl':
      case 'control':
        result.ctrl = true;
        break;
      case 'shift':
        result.shift = true;
        break;
      case 'alt':
        result.alt = true;
        break;
      case 'meta':
      case 'cmd':
      case 'command':
        result.meta = true;
        break;
      default:
        result.key = part;
    }
  }

  return result;
}

// =============================================================================
// グローバルショートカットマネージャー
// =============================================================================

type ShortcutEntry = ShortcutConfig & { id: string };

class ShortcutManager {
  private shortcuts: Map<string, ShortcutEntry> = new Map();
  private idCounter = 0;
  private isListening = false;

  private handleKeyDown = (event: KeyboardEvent) => {
    // 入力要素でのショートカットをフィルタリング
    const inInput = isInputElement(document.activeElement);

    // 優先度でソートされたショートカットリスト
    const sortedShortcuts = Array.from(this.shortcuts.values())
      .filter((s) => s.enabled !== false)
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

    for (const shortcut of sortedShortcuts) {
      if (!matchesShortcut(event, shortcut.keys)) {
        continue;
      }

      // 入力要素でのショートカットをスキップ
      if (inInput && !shortcut.enableInInputs) {
        continue;
      }

      // デフォルト動作の防止
      if (shortcut.preventDefault !== false) {
        event.preventDefault();
      }

      // イベント伝播の停止
      if (shortcut.stopPropagation) {
        event.stopPropagation();
      }

      // ハンドラー実行
      shortcut.handler(event);

      // 最初にマッチしたショートカットのみ実行
      break;
    }
  };

  register(config: ShortcutConfig): string {
    const id = `shortcut_${++this.idCounter}`;
    this.shortcuts.set(id, { ...config, id });

    if (!this.isListening && this.shortcuts.size > 0) {
      window.addEventListener('keydown', this.handleKeyDown);
      this.isListening = true;
    }

    return id;
  }

  unregister(id: string): void {
    this.shortcuts.delete(id);

    if (this.isListening && this.shortcuts.size === 0) {
      window.removeEventListener('keydown', this.handleKeyDown);
      this.isListening = false;
    }
  }

  updateEnabled(id: string, enabled: boolean): void {
    const shortcut = this.shortcuts.get(id);
    if (shortcut) {
      shortcut.enabled = enabled;
    }
  }

  clear(): void {
    this.shortcuts.clear();
    if (this.isListening) {
      window.removeEventListener('keydown', this.handleKeyDown);
      this.isListening = false;
    }
  }
}

// シングルトンインスタンス
const shortcutManager = new ShortcutManager();

// テスト用にエクスポート
export { shortcutManager };

// =============================================================================
// useKeyboardShortcut フック
// =============================================================================

/**
 * キーボードショートカットフック
 *
 * @example
 * ```tsx
 * // 単一ショートカット
 * useKeyboardShortcut({
 *   keys: { key: 's', ctrl: true },
 *   handler: () => saveProject(),
 * });
 *
 * // 文字列形式
 * useKeyboardShortcut({
 *   keys: parseShortcut('ctrl+z'),
 *   handler: () => undo(),
 * });
 *
 * // 複数ショートカット
 * useKeyboardShortcut({
 *   shortcuts: [
 *     { keys: { key: 's', ctrl: true }, handler: save },
 *     { keys: { key: 'z', ctrl: true }, handler: undo },
 *     { keys: { key: 'z', ctrl: true, shift: true }, handler: redo },
 *   ],
 * });
 *
 * // モーダル内で優先度を上げる
 * useKeyboardShortcut({
 *   keys: { key: 'Escape' },
 *   handler: closeModal,
 *   priority: 100,
 * });
 * ```
 */
export function useKeyboardShortcut(
  configOrOptions: ShortcutConfig | UseKeyboardShortcutOptions
): void {
  const registeredIds = useRef<string[]>([]);

  // 設定を正規化
  const shortcuts: ShortcutConfig[] =
    'shortcuts' in configOrOptions
      ? (configOrOptions.shortcuts ?? [])
      : [configOrOptions as ShortcutConfig];

  useEffect(() => {
    // 既存の登録をクリア
    for (const id of registeredIds.current) {
      shortcutManager.unregister(id);
    }
    registeredIds.current = [];

    // 新しいショートカットを登録
    for (const shortcut of shortcuts) {
      const id = shortcutManager.register(shortcut);
      registeredIds.current.push(id);
    }

    // クリーンアップ
    return () => {
      for (const id of registeredIds.current) {
        shortcutManager.unregister(id);
      }
      registeredIds.current = [];
    };
  }, [shortcuts]);
}

// =============================================================================
// 便利なショートカット定義
// =============================================================================

/** よく使うショートカットキーの定義 */
export const CommonShortcuts = {
  save: { key: 's', ctrl: true } as ShortcutKey,
  undo: { key: 'z', ctrl: true } as ShortcutKey,
  redo: { key: 'z', ctrl: true, shift: true } as ShortcutKey,
  redoAlt: { key: 'y', ctrl: true } as ShortcutKey,
  copy: { key: 'c', ctrl: true } as ShortcutKey,
  paste: { key: 'v', ctrl: true } as ShortcutKey,
  cut: { key: 'x', ctrl: true } as ShortcutKey,
  selectAll: { key: 'a', ctrl: true } as ShortcutKey,
  delete: { key: 'Delete' } as ShortcutKey,
  deleteAlt: { key: 'Backspace' } as ShortcutKey,
  escape: { key: 'Escape' } as ShortcutKey,
  enter: { key: 'Enter' } as ShortcutKey,
  arrowUp: { key: 'ArrowUp' } as ShortcutKey,
  arrowDown: { key: 'ArrowDown' } as ShortcutKey,
  arrowLeft: { key: 'ArrowLeft' } as ShortcutKey,
  arrowRight: { key: 'ArrowRight' } as ShortcutKey,
};

// =============================================================================
// 単一ショートカット用のシンプルなフック
// =============================================================================

/**
 * 単一のキーボードショートカットを登録するシンプルなフック
 *
 * @param shortcut ショートカットキー文字列（例: 'ctrl+s'）またはShortcutKey
 * @param handler ハンドラー関数
 * @param options オプション
 *
 * @example
 * ```tsx
 * useShortcut('ctrl+s', () => save());
 * useShortcut('escape', () => close(), { priority: 100 });
 * ```
 */
export function useShortcut(
  shortcut: string | ShortcutKey,
  handler: (event: KeyboardEvent) => void,
  options?: Omit<ShortcutConfig, 'keys' | 'handler'>
): void {
  const keys = typeof shortcut === 'string' ? parseShortcut(shortcut) : shortcut;

  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  const stableHandler = useCallback((event: KeyboardEvent) => {
    handlerRef.current(event);
  }, []);

  useKeyboardShortcut({
    keys,
    handler: stableHandler,
    ...options,
  });
}
