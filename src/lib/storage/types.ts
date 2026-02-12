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
  fields: FieldDefinition[];
  maxEntries?: number;
}

/**
 * データエントリ（データベースのレコード）
 */
export interface DataEntry {
  id: string;
  typeId: string;
  values: Record<string, unknown>;
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
 * 変数で使用するカスタム構造体
 */
export interface CustomClass {
  id: string;
  name: string;
  fields: FieldDefinition[];
}

/**
 * シリアライズ済みフィールドタイプ
 * FieldType クラスインスタンスの保存形式
 */
export interface SerializedFieldType {
  type: string;
  config?: Record<string, unknown>;
}

/**
 * 変数定義
 */
export interface Variable {
  id: string;
  name: string;
  fieldType: SerializedFieldType;
  isArray: boolean;
  initialValue: unknown;
}

/**
 * ゲームマップ
 */
export interface GameMap {
  id: string;
  name: string;
  width: number;
  height: number;
  layers: MapLayer[];
  bgmId?: string;
  backgroundImageId?: string;
}

/**
 * マップレイヤー
 */
export interface MapLayer {
  id: string;
  name: string;
  type: 'tile' | 'object';
  tiles?: string[][]; // tiles[y][x] = chipId（例: "chipset001:42"）
  objects?: MapObject[];
}

/**
 * マップオブジェクト
 * 位置情報はTransformコンポーネント内に保持
 */
export interface MapObject {
  id: string;
  name: string;
  prefabId?: string;
  components: SerializedComponent[];
  overrides?: Record<string, unknown>;
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
  imageId: string;
  tileWidth: number;
  tileHeight: number;
  chips: ChipProperty[];
}

/**
 * チッププロパティ
 */
export interface ChipProperty {
  index: number;
  passable: boolean;
  footstepType?: string;
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
 * トリガーコンポーネント内で定義されるイベント
 */
export interface GameEvent {
  id: string;
  name: string;
  actions: SerializedAction[];
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
  args: TemplateArg[];
  actions: SerializedAction[];
}

/**
 * テンプレート引数
 */
export interface TemplateArg {
  id: string;
  name: string;
  fieldType: SerializedFieldType;
  required: boolean;
}

/**
 * UIキャンバス
 */
export interface UICanvas {
  id: string;
  name: string;
  objects: UIObject[];
  functions: UIFunction[];
}

/**
 * UIオブジェクト
 */
export interface UIObject {
  id: string;
  name: string;
  parentId?: string;
  transform: RectTransform;
  components: SerializedComponent[];
}

/**
 * RectTransform（UI用トランスフォーム）
 */
export interface RectTransform {
  anchorMin: { x: number; y: number };
  anchorMax: { x: number; y: number };
  offsetMin: { x: number; y: number };
  offsetMax: { x: number; y: number };
  pivot: { x: number; y: number };
}

/**
 * UIファンクション
 */
export interface UIFunction {
  id: string;
  name: string;
  args: TemplateArg[];
  actions: SerializedAction[];
}

/**
 * UIテンプレート
 */
export interface UITemplate {
  id: string;
  name: string;
  rootObject: UIObject;
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
  type: 'image' | 'audio' | 'font';
  folderId?: string;
  data: string; // URL or base64
  metadata: AssetMetadata;
}

/**
 * アセットメタデータ
 */
export interface AssetMetadata {
  width?: number;
  height?: number;
  duration?: number;
  fileSize: number;
}

/**
 * ゲーム設定
 */
export interface GameSettings {
  title: string;
  version: string;
  author: string;
  description: string;
  resolution: { width: number; height: number };
  startMapId: string;
  startPosition: { x: number; y: number };
  defaultBGM?: string;
}

/**
 * プロジェクトデータ
 * プロジェクト全体のデータを保持する構造
 */
export interface ProjectData {
  // データ設定
  dataTypes: DataType[];
  dataEntries: Record<string, DataEntry[]>;
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
 * キー: [projectId, pageId]
 */
export interface UndoHistory {
  states: unknown[];
  currentIndex: number;
}

// =============================================================================
// ゲームセーブデータ
// =============================================================================

/**
 * ゲームセーブデータ
 * キー: [projectId, slotId]
 */
export interface GameSaveData {
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
   * @param projectId プロジェクトID
   * @param pageId ページID
   * @param history 履歴データ
   */
  saveUndoHistory(projectId: string, pageId: string, history: UndoHistory): Promise<void>;

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
   * @param projectId プロジェクトID
   * @param save セーブデータ
   */
  saveGameData(projectId: string, save: GameSaveData): Promise<void>;

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
