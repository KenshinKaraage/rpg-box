/**
 * ストレージモジュール
 *
 * プロジェクトデータの永続化を担当
 */
export type {
  // プロジェクトデータ構造
  DataType,
  DataEntry,
  FieldSet,
  FieldDefinition,
  CustomClass,
  SerializedFieldType,
  Variable,
  GameMap,
  MapLayer,
  MapObject,
  SerializedComponent,
  Chipset,
  ChipProperty,
  Prefab,
  GameEvent,
  SerializedAction,
  EventTemplate,
  TemplateArg,
  UICanvas,
  UIObject,
  RectTransform,
  UIFunction,
  UITemplate,
  Script,
  AssetReference,
  AssetMetadata,
  GameSettings,
  ProjectData,
  // プロジェクトメタデータ
  ProjectMeta,
  SavedProject,
  // Undo/Redo
  UndoHistory,
  // ゲームセーブ
  GameSaveData,
  // 操作結果
  StorageErrorType,
  StorageError,
  SaveResult,
  LoadResult,
  // ストレージプロバイダー
  StorageProvider,
  // 一時保存
  TempSaveData,
  TempStorageProvider,
} from './types';
