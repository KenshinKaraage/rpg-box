import type { ReactNode } from 'react';

/**
 * イベント実行時のコンテキスト
 * EventActionが実行時にアクセスできるゲーム状態
 */
export interface EventContext {
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
   * マップチップの値を取得
   * @param mapId マップID
   * @param x X座標
   * @param y Y座標
   * @param layer レイヤー
   * @returns チップID
   */
  getMapChip(mapId: string, x: number, y: number, layer?: number): number;

  /**
   * オブジェクトを取得
   * @param objectId オブジェクトID
   * @returns オブジェクト参照
   */
  getObject(objectId: string): GameObjectRef | undefined;

  /**
   * 現在のマップID
   */
  currentMapId: string;

  /**
   * カメラ制御
   */
  camera: CameraController;

  /**
   * オーディオ制御
   */
  audio: AudioController;

  /**
   * 指定フレーム数待機
   * @param frames 待機フレーム数
   */
  wait(frames: number): Promise<void>;

  /**
   * マップ移動
   * @param mapId 移動先マップID
   * @param x 移動先X座標
   * @param y 移動先Y座標
   * @param transition トランジション種類
   */
  changeMap(mapId: string, x: number, y: number, transition?: 'fade' | 'none'): Promise<void>;

  /**
   * テンプレートを呼び出し
   * @param templateId テンプレートID
   * @param args 引数
   */
  callTemplate(templateId: string, args: Record<string, unknown>): Promise<void>;

  /**
   * スクリプトAPI（ScriptAction専用）
   */
  scriptAPI: ScriptAPI;
}

/**
 * ゲームオブジェクトへの参照
 */
export interface GameObjectRef {
  id: string;
  x: number;
  y: number;
  rotation: number;

  /**
   * オブジェクトを移動
   * @param x 目標X座標
   * @param y 目標Y座標
   * @param speed 移動速度
   */
  moveTo(x: number, y: number, speed?: number): Promise<void>;

  /**
   * オブジェクトを回転
   * @param angle 目標角度
   * @param duration 回転時間（フレーム）
   */
  rotateTo(angle: number, duration?: number): Promise<void>;

  /**
   * 自動歩行を設定
   * @param enabled 有効/無効
   * @param pattern 歩行パターン
   */
  setAutoWalk(enabled: boolean, pattern?: AutoWalkPattern): void;
}

/**
 * 自動歩行パターン
 */
export interface AutoWalkPattern {
  type: 'random' | 'route' | 'follow';
  route?: { x: number; y: number }[];
  targetId?: string;
  speed?: number;
}

/**
 * カメラ制御インターフェース
 */
export interface CameraController {
  /**
   * ズーム
   * @param scale ズーム倍率
   * @param duration 時間（フレーム）
   */
  zoom(scale: number, duration?: number): Promise<void>;

  /**
   * パン（移動）
   * @param x 目標X座標
   * @param y 目標Y座標
   * @param duration 時間（フレーム）
   */
  pan(x: number, y: number, duration?: number): Promise<void>;

  /**
   * エフェクト適用
   * @param effect エフェクト種類
   * @param options オプション
   */
  applyEffect(
    effect: 'shake' | 'flash' | 'fadeIn' | 'fadeOut',
    options?: { intensity?: number; duration?: number; color?: string }
  ): Promise<void>;

  /**
   * カメラをリセット
   * @param duration 時間（フレーム）
   */
  reset(duration?: number): Promise<void>;
}

/**
 * オーディオ制御インターフェース
 */
export interface AudioController {
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

  /**
   * 効果音を再生
   * @param audioId 音声ID
   * @param options 再生オプション
   */
  playSE(audioId: string, options?: { volume?: number; pitch?: number }): void;
}

/**
 * スクリプト実行用API（ScriptAction内のJavaScriptから呼び出し可能）
 *
 * メッセージ表示や選択肢表示など、UIインタラクションを伴う機能は
 * EventActionとしてではなく、ScriptAction内からこのAPIを通じて呼び出す
 */
export interface ScriptAPI {
  /**
   * メッセージを表示
   * @param text 表示するテキスト
   * @param options 表示オプション
   */
  showMessage(
    text: string,
    options?: {
      face?: string;
      faceName?: string;
      position?: 'top' | 'center' | 'bottom';
    }
  ): Promise<void>;

  /**
   * 選択肢を表示
   * @param choices 選択肢のリスト
   * @param options 表示オプション
   * @returns 選択されたインデックス（キャンセル時は-1）
   */
  showChoice(
    choices: string[],
    options?: {
      cancelIndex?: number;
      defaultIndex?: number;
    }
  ): Promise<number>;

  /**
   * 数値入力を表示
   * @param options 入力オプション
   * @returns 入力された数値
   */
  showNumberInput(options?: { min?: number; max?: number; default?: number }): Promise<number>;

  /**
   * テキスト入力を表示
   * @param options 入力オプション
   * @returns 入力されたテキスト
   */
  showTextInput(options?: {
    maxLength?: number;
    default?: string;
    placeholder?: string;
  }): Promise<string>;

  /**
   * 変数の値を取得（スクリプト内から便利にアクセス）
   */
  getVar(variableId: string): unknown;

  /**
   * 変数の値を設定（スクリプト内から便利にアクセス）
   */
  setVar(variableId: string, value: unknown): void;
}

/**
 * イベントアクションの基底抽象クラス
 *
 * イベントスクリプトを構成するアクションの基盤。
 * 各アクションタイプ（VariableOp, Object, Camera等）はこのクラスを継承して実装する。
 *
 * @example
 * ```typescript
 * class ObjectAction extends EventAction {
 *   readonly type = 'object';
 *   operation: 'move' | 'rotate' | 'autoWalk' = 'move';
 *   targetId: string = '';
 *   // operation別のプロパティ...
 *
 *   async execute(context: EventContext): Promise<void> {
 *     const obj = context.getObject(this.targetId);
 *     if (!obj) return;
 *
 *     switch (this.operation) {
 *       case 'move':
 *         await obj.moveTo(this.x, this.y, this.speed);
 *         break;
 *       case 'rotate':
 *         await obj.rotateTo(this.angle, this.duration);
 *         break;
 *       case 'autoWalk':
 *         obj.setAutoWalk(this.enabled, this.pattern);
 *         break;
 *     }
 *   }
 *   // ...
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
