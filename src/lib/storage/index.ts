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
  Variable,
  GameMap,
  MapLayer,
  MapObject,
  SerializedComponent,
  Chipset,
  Prefab,
  GameEvent,
  EventTrigger,
  EventCondition,
  SerializedAction,
  EventTemplate,
  TemplateParameter,
  UICanvas,
  UIObjectData,
  UITemplate,
  Script,
  AssetReference,
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
