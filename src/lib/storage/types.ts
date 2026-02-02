/**
 * ストレージ関連の型定義
 *
 * RPG Boxのデータ永続化のためのインターフェースを定義
 * - ProjectData: プロジェクト全体のデータ構造
 * - StorageProvider: ストレージ操作の抽象インターフェース
 */

// =============================================================================
// プロジェクトデータ構造
// =============================================================================

/**
 * データ型定義（データベースのスキーマ）
 */
export interface DataType {
  id: string;
  name: string;
  fieldSetId: string;
  maxEntries?: number;
}

/**
 * データエントリ（データベースのレコード）
 */
export interface DataEntry {
  id: string;
  dataTypeId: string;
  values: Record<string, unknown>;
}

/**
 * フィールドセット（フィールドのグループ定義）
 */
export interface FieldSet {
  id: string;
  name: string;
  fields: FieldDefinition[];
}

/**
 * フィールド定義
 */
export interface FieldDefinition {
  id: string;
  name: string;
  type: string;
  required: boolean;
  config?: Record<string, unknown>;
  displayCondition?: {
    fieldId: string;
    value: unknown;
  };
}

/**
 * カスタムクラス定義
 */
export interface CustomClass {
  id: string;
  name: string;
  baseClass?: string;
  fieldSetId: string;
}

/**
 * 変数定義
 */
export interface Variable {
  id: string;
  name: string;
  type: 'number' | 'string' | 'boolean' | 'array' | 'object';
  scope: 'global' | 'map' | 'event';
  defaultValue?: unknown;
}

/**
 * ゲームマップ
 */
export interface GameMap {
  id: string;
  name: string;
  width: number;
  height: number;
  chipsetId: string;
  layers: MapLayer[];
  objects: MapObject[];
}

/**
 * マップレイヤー
 */
export interface MapLayer {
  id: string;
  name: string;
  type: 'tile' | 'object' | 'collision';
  data: number[][];
  visible: boolean;
}

/**
 * マップオブジェクト
 */
export interface MapObject {
  id: string;
  name: string;
  x: number;
  y: number;
  components: SerializedComponent[];
}

/**
 * シリアライズ済みコンポーネント
 */
export interface SerializedComponent {
  type: string;
  data: unknown;
}

/**
 * チップセット
 */
export interface Chipset {
  id: string;
  name: string;
  imageAssetId: string;
  tileWidth: number;
  tileHeight: number;
  passabilityData?: number[];
}

/**
 * プレハブ（再利用可能なオブジェクトテンプレート）
 */
export interface Prefab {
  id: string;
  name: string;
  components: SerializedComponent[];
}

/**
 * ゲームイベント
 */
export interface GameEvent {
  id: string;
  name: string;
  trigger: EventTrigger;
  conditions: EventCondition[];
  actions: SerializedAction[];
}

/**
 * イベントトリガー
 */
export interface EventTrigger {
  type: 'talk' | 'touch' | 'autorun' | 'parallel' | 'custom';
  config?: Record<string, unknown>;
}

/**
 * イベント条件
 */
export interface EventCondition {
  type: string;
  config: Record<string, unknown>;
}

/**
 * シリアライズ済みアクション
 */
export interface SerializedAction {
  type: string;
  data: unknown;
}

/**
 * イベントテンプレート
 */
export interface EventTemplate {
  id: string;
  name: string;
  parameters: TemplateParameter[];
  actions: SerializedAction[];
}

/**
 * テンプレートパラメータ
 */
export interface TemplateParameter {
  id: string;
  name: string;
  type: string;
  defaultValue?: unknown;
}

/**
 * UIキャンバス
 */
export interface UICanvas {
  id: string;
  name: string;
  width: number;
  height: number;
  objects: UIObjectData[];
}

/**
 * UIオブジェクトデータ
 */
export interface UIObjectData {
  id: string;
  name: string;
  parentId?: string;
  transform: {
    anchorMin: { x: number; y: number };
    anchorMax: { x: number; y: number };
    offsetMin: { x: number; y: number };
    offsetMax: { x: number; y: number };
    pivot: { x: number; y: number };
  };
  components: SerializedComponent[];
}

/**
 * UIテンプレート
 */
export interface UITemplate {
  id: string;
  name: string;
  canvas: UICanvas;
}

/**
 * スクリプト
 */
export interface Script {
  id: string;
  name: string;
  content: string;
  type: 'action' | 'condition' | 'utility';
}

/**
 * アセット参照
 */
export interface AssetReference {
  id: string;
  name: string;
  type: 'image' | 'audio' | 'video' | 'font' | 'data';
  path: string;
  metadata?: Record<string, unknown>;
}

/**
 * ゲーム設定
 */
export interface GameSettings {
  title: string;
  version: string;
  screenWidth: number;
  screenHeight: number;
  startMapId: string;
  startPosition: { x: number; y: number };
  defaultFont?: string;
  customSettings?: Record<string, unknown>;
}

/**
 * プロジェクトデータ
 * プロジェクト全体のデータを保持する構造
 */
export interface ProjectData {
  // データ設定
  dataTypes: DataType[];
  dataEntries: Record<string, DataEntry[]>;
  fieldSets: FieldSet[];
  classes: CustomClass[];
  variables: Variable[];

  // マップ
  maps: GameMap[];
  chipsets: Chipset[];
  prefabs: Prefab[];

  // イベント
  events: GameEvent[];
  eventTemplates: EventTemplate[];

  // UI
  uiCanvases: UICanvas[];
  objectUIs: UICanvas[];
  uiTemplates: UITemplate[];

  // スクリプト・アセット
  scripts: Script[];
  assets: AssetReference[];

  // 設定
  gameSettings: GameSettings;
}

// =============================================================================
// プロジェクトメタデータ
// =============================================================================

/**
 * プロジェクトメタデータ
 */
export interface ProjectMeta {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 保存済みプロジェクト（メタデータ + データ）
 */
export interface SavedProject extends ProjectMeta {
  data: ProjectData;
}

// =============================================================================
// Undo/Redo履歴
// =============================================================================

/**
 * Undo/Redo履歴
 */
export interface UndoHistory {
  projectId: string;
  pageId: string;
  states: unknown[];
  currentIndex: number;
}

// =============================================================================
// ゲームセーブデータ
// =============================================================================

/**
 * ゲームセーブデータ
 */
export interface GameSaveData {
  projectId: string;
  slotId: number;
  savedAt: Date;
  playtime: number;
  variables: Record<string, unknown>;
  partyState: unknown;
  currentMapId: string;
  position: { x: number; y: number };
  customMeta?: Record<string, unknown>;
}

// =============================================================================
// 操作結果型
// =============================================================================

/**
 * ストレージエラーの種類
 */
export type StorageErrorType =
  | 'NOT_FOUND'
  | 'ALREADY_EXISTS'
  | 'QUOTA_EXCEEDED'
  | 'INVALID_DATA'
  | 'PERMISSION_DENIED'
  | 'NETWORK_ERROR'
  | 'UNKNOWN';

/**
 * ストレージエラー
 */
export interface StorageError {
  type: StorageErrorType;
  message: string;
  cause?: unknown;
}

/**
 * 保存操作の結果
 */
export type SaveResult = { success: true } | { success: false; error: StorageError };

/**
 * 読み込み操作の結果
 */
export type LoadResult<T> = { success: true; data: T } | { success: false; error: StorageError };

// =============================================================================
// ストレージプロバイダー
// =============================================================================

/**
 * ストレージプロバイダーインターフェース
 * IndexedDB、LocalStorage、クラウドストレージなどの抽象化
 */
export interface StorageProvider {
  // プロジェクト操作
  /**
   * プロジェクトを保存
   */
  saveProject(project: SavedProject): Promise<void>;

  /**
   * プロジェクトを読み込み
   */
  loadProject(projectId: string): Promise<SavedProject | null>;

  /**
   * プロジェクトを削除
   */
  deleteProject(projectId: string): Promise<void>;

  /**
   * 全プロジェクトのメタデータを取得
   */
  listProjects(): Promise<ProjectMeta[]>;

  /**
   * プロジェクトの存在確認
   */
  projectExists(projectId: string): Promise<boolean>;

  // Undo/Redo履歴操作
  /**
   * Undo履歴を保存
   */
  saveUndoHistory(history: UndoHistory): Promise<void>;

  /**
   * Undo履歴を読み込み
   */
  loadUndoHistory(projectId: string, pageId: string): Promise<UndoHistory | null>;

  /**
   * Undo履歴を削除
   */
  clearUndoHistory(projectId: string): Promise<void>;

  // ゲームセーブ操作
  /**
   * ゲームセーブを保存
   */
  saveGameData(save: GameSaveData): Promise<void>;

  /**
   * ゲームセーブを読み込み
   */
  loadGameData(projectId: string, slotId: number): Promise<GameSaveData | null>;

  /**
   * ゲームセーブを削除
   */
  deleteGameData(projectId: string, slotId: number): Promise<void>;

  /**
   * 全ゲームセーブスロットを取得
   */
  listGameSaves(projectId: string): Promise<GameSaveData[]>;
}

// =============================================================================
// 一時保存（LocalStorage用）
// =============================================================================

/**
 * 一時保存データ（クラッシュ復旧用）
 */
export interface TempSaveData {
  timestamp: number;
  projectId: string;
  data: Partial<ProjectData>;
}

/**
 * 一時保存プロバイダーインターフェース
 */
export interface TempStorageProvider {
  /**
   * 一時データを保存
   */
  saveTempData(data: TempSaveData): void;

  /**
   * 一時データを読み込み
   */
  loadTempData(): TempSaveData | null;

  /**
   * 一時データをクリア
   */
  clearTempData(): void;

  /**
   * 一時データの存在確認
   */
  hasTempData(): boolean;
}
