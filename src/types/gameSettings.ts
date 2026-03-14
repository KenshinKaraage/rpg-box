/**
 * 画面解像度
 */
export interface Resolution {
  /** 幅（ピクセル） */
  width: number;
  /** 高さ（ピクセル） */
  height: number;
}

/**
 * ゲーム設定
 *
 * ゲームの基本情報と初期設定を保持する
 */
export interface GameSettings {
  /** ゲームタイトル */
  title: string;

  /** バージョン（例: "1.0.0"） */
  version: string;

  /** 作者名 */
  author: string;

  /** ゲームの説明文 */
  description: string;

  /** 画面解像度 */
  resolution: Resolution;

  /** ゲーム開始時のマップID */
  startMapId: string;

  /** デフォルトBGMのアセットパス（オプション） */
  defaultBGM?: string;

  /** ゲームアイコンのアセットパス（オプション） */
  icon?: string;
}

/**
 * ゲーム設定のデフォルト値
 */
export const DEFAULT_GAME_SETTINGS: GameSettings = {
  title: '無題のゲーム',
  version: '0.1.0',
  author: '',
  description: '',
  resolution: { width: 1280, height: 720 },
  startMapId: '',
};

/**
 * 一般的な解像度のプリセット
 */
export const RESOLUTION_PRESETS: { label: string; resolution: Resolution }[] = [
  { label: '1920x1080 (Full HD)', resolution: { width: 1920, height: 1080 } },
  { label: '1280x720 (HD)', resolution: { width: 1280, height: 720 } },
  { label: '960x540', resolution: { width: 960, height: 540 } },
  { label: '640x480 (VGA)', resolution: { width: 640, height: 480 } },
  { label: '320x240 (レトロ)', resolution: { width: 320, height: 240 } },
];
