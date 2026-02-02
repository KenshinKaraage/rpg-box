import type { ReactNode } from 'react';

/**
 * イベント実行時のコンテキスト
 * ゲームエンジンとイベントアクション間のインターフェース
 */
export interface EventContext {
  /**
   * メッセージを表示
   * @param text 表示するテキスト
   * @param options 表示オプション
   */
  showMessage(
    text: string,
    options?: {
      face?: string;
      position?: 'top' | 'center' | 'bottom';
    }
  ): Promise<void>;

  /**
   * 選択肢を表示
   * @param choices 選択肢のリスト
   * @returns 選択されたインデックス
   */
  showChoice(choices: string[]): Promise<number>;

  /**
   * 選択結果を設定
   * @param index 選択されたインデックス
   */
  setChoiceResult(index: number): void;

  /**
   * 変数の値を取得
   * @param variableId 変数ID
   * @returns 変数の値
   */
  getVariable(variableId: string): unknown;

  /**
   * 変数の値を設定
   * @param variableId 変数ID
   * @param value 設定する値
   */
  setVariable(variableId: string, value: unknown): void;

  /**
   * 指定フレーム数待機
   * @param frames 待機フレーム数
   */
  wait(frames: number): Promise<void>;

  /**
   * テンプレートを呼び出し
   * @param templateId テンプレートID
   * @param args 引数
   */
  callTemplate(templateId: string, args: Record<string, unknown>): Promise<void>;

  /**
   * サウンド関連のAPI
   */
  sound: {
    /**
     * 効果音を再生
     * @param audioId 音声ID
     * @param options 再生オプション
     */
    playSE(audioId: string, options?: { volume?: number; pitch?: number }): void;

    /**
     * BGMを再生
     * @param audioId 音声ID
     * @param options 再生オプション
     */
    playBGM(audioId: string, options?: { volume?: number; fadeIn?: number }): void;

    /**
     * BGMを停止
     * @param options 停止オプション
     */
    stopBGM(options?: { fadeOut?: number }): void;
  };
}

/**
 * イベントアクションの基底抽象クラス
 *
 * イベントスクリプトを構成するアクションの基盤。
 * Message、Choice、VariableOp等の各アクションはこのクラスを継承して実装する。
 *
 * @example
 * ```typescript
 * class MessageAction extends EventAction {
 *   readonly type = 'message';
 *   text: string = '';
 *   position: 'top' | 'center' | 'bottom' = 'bottom';
 *
 *   async execute(context: EventContext): Promise<void> {
 *     await context.showMessage(this.text, { position: this.position });
 *   }
 *
 *   serialize(): unknown {
 *     return { text: this.text, position: this.position };
 *   }
 *
 *   deserialize(data: unknown): void {
 *     const d = data as { text: string; position: 'top' | 'center' | 'bottom' };
 *     this.text = d.text;
 *     this.position = d.position;
 *   }
 *
 *   renderBlock(): ReactNode {
 *     // ブロックエディタ用のUI
 *   }
 *
 *   renderPropertyPanel(): ReactNode {
 *     // プロパティパネル用のUI
 *   }
 * }
 * ```
 */
export abstract class EventAction {
  /**
   * アクションタイプの識別子
   * 各サブクラスで固有の値を定義する
   */
  abstract readonly type: string;

  /**
   * アクションを実行
   * @param context イベント実行コンテキスト
   */
  abstract execute(context: EventContext): Promise<void>;

  /**
   * アクションをシリアライズ（保存用の形式に変換）
   * @returns シリアライズされたデータ
   */
  abstract serialize(): unknown;

  /**
   * データをデシリアライズ（保存形式から復元）
   * @param data デシリアライズするデータ
   */
  abstract deserialize(data: unknown): void;

  /**
   * ブロックエディタ用のUIをレンダリング
   * スクリプトエディタでブロックとして表示されるUI
   * @returns Reactノード
   */
  abstract renderBlock(): ReactNode;

  /**
   * プロパティパネルUIをレンダリング
   * アクションの詳細設定を編集するためのUI
   * @returns Reactノード
   */
  abstract renderPropertyPanel(): ReactNode;
}
