import type { Monaco } from '@monaco-editor/react';

/**
 * TypeScript type definitions for the script editor's autocomplete.
 * These are registered with Monaco Editor as extra libraries so users
 * get IntelliSense and hover documentation when editing scripts.
 */
export const SCRIPT_API_DECLARATIONS = `
/** スクリプトAPI - メッセージ表示や変数操作を提供 */
declare const scriptAPI: {
  /** メッセージを表示する */
  showMessage(
    text: string,
    options?: {
      /** 表情画像のアセットID */
      face?: string;
      /** 表情画像の表示名 */
      faceName?: string;
      /** メッセージウィンドウの表示位置 */
      position?: 'top' | 'center' | 'bottom';
    }
  ): Promise<void>;

  /** 選択肢を表示し、選択されたインデックスを返す */
  showChoice(
    choices: string[],
    options?: {
      /** キャンセル時に返すインデックス (-1でキャンセル無効) */
      cancelIndex?: number;
      /** デフォルトで選択されるインデックス */
      defaultIndex?: number;
    }
  ): Promise<number>;

  /** 数値入力ダイアログを表示 */
  showNumberInput(options?: {
    /** 最小値 */
    min?: number;
    /** 最大値 */
    max?: number;
    /** デフォルト値 */
    default?: number;
  }): Promise<number>;

  /** テキスト入力ダイアログを表示 */
  showTextInput(options?: {
    /** 最大文字数 */
    maxLength?: number;
    /** デフォルト値 */
    default?: string;
  }): Promise<string>;

  /** 変数の値を取得 */
  getVar(variableId: string): unknown;

  /** 変数の値を設定 */
  setVar(variableId: string, value: unknown): void;
};

/** コンソール出力 (デバッグ用) */
declare const console: {
  log(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
};
`;

const LIB_URI = 'ts:filename/scriptAPI.d.ts';

/**
 * Register API type definitions with Monaco Editor.
 * Call this in the `beforeMount` callback of the Monaco Editor.
 */
export function registerApiDefinitions(monaco: Monaco): void {
  // Avoid registering duplicates
  const existingLibs = monaco.languages.typescript.javascriptDefaults.getExtraLibs();
  if (existingLibs[LIB_URI]) return;

  monaco.languages.typescript.javascriptDefaults.addExtraLib(SCRIPT_API_DECLARATIONS, LIB_URI);
}
