/**
 * IndexedDB ストレージプロバイダー
 *
 * プロジェクトデータ、Undo履歴、ゲームセーブの永続化を担当
 */
import { openDB, type IDBPDatabase } from 'idb';

import type {
  StorageProvider,
  SavedProject,
  ProjectMeta,
  UndoHistory,
  GameSaveData,
  StorageError,
} from './types';

// =============================================================================
// データベース定義
// =============================================================================

const DB_NAME = 'rpg-box';
const DB_VERSION = 1;

/**
 * IndexedDB スキーマ定義
 * design.md に準拠
 */
interface RPGBoxDBSchema {
  projects: {
    key: string; // projectId
    value: SavedProject;
    indexes: { 'by-updated': Date };
  };
  undoHistory: {
    key: [string, string]; // [projectId, pageId]
    value: UndoHistory;
  };
  gameSaves: {
    key: [string, number]; // [projectId, slotId]
    value: GameSaveData;
    indexes: { 'by-project': string };
  };
}

type RPGBoxDB = IDBPDatabase<RPGBoxDBSchema>;

// =============================================================================
// ヘルパー関数
// =============================================================================

/**
 * StorageError を生成
 */
function createStorageError(
  type: StorageError['type'],
  message: string,
  cause?: unknown
): StorageError {
  return { type, message, cause };
}

/**
 * エラーをStorageErrorに変換
 */
function toStorageError(error: unknown): StorageError {
  if (error instanceof DOMException) {
    if (error.name === 'QuotaExceededError') {
      return createStorageError('QUOTA_EXCEEDED', 'Storage quota exceeded', error);
    }
    if (error.name === 'NotFoundError') {
      return createStorageError('NOT_FOUND', 'Resource not found', error);
    }
  }
  return createStorageError(
    'UNKNOWN',
    error instanceof Error ? error.message : 'Unknown error',
    error
  );
}

// =============================================================================
// IndexedDBStorageProvider クラス
// =============================================================================

/**
 * IndexedDB を使用したストレージプロバイダー
 */
export class IndexedDBStorageProvider implements StorageProvider {
  private db: RPGBoxDB | null = null;
  private initPromise: Promise<RPGBoxDB> | null = null;

  /**
   * データベースを初期化
   */
  private async getDB(): Promise<RPGBoxDB> {
    if (this.db) {
      return this.db;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = openDB<RPGBoxDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // projects ストア
        if (!db.objectStoreNames.contains('projects')) {
          const projectStore = db.createObjectStore('projects', { keyPath: 'id' });
          projectStore.createIndex('by-updated', 'updatedAt');
        }

        // undoHistory ストア（複合キー）
        if (!db.objectStoreNames.contains('undoHistory')) {
          db.createObjectStore('undoHistory');
        }

        // gameSaves ストア（複合キー）
        if (!db.objectStoreNames.contains('gameSaves')) {
          const saveStore = db.createObjectStore('gameSaves');
          // projectId でインデックスを作成するため、キーの最初の要素を使用
          saveStore.createIndex('by-project', '', {
            // カスタムキー抽出はできないので、別の方法で対応
          });
        }
      },
    });

    this.db = await this.initPromise;
    return this.db;
  }

  // ===========================================================================
  // プロジェクト操作
  // ===========================================================================

  async saveProject(project: SavedProject): Promise<void> {
    const db = await this.getDB();
    await db.put('projects', project);
  }

  async loadProject(projectId: string): Promise<SavedProject | null> {
    const db = await this.getDB();
    const project = await db.get('projects', projectId);
    return project ?? null;
  }

  async deleteProject(projectId: string): Promise<void> {
    const db = await this.getDB();

    // トランザクションで関連データも削除
    const tx = db.transaction(['projects', 'undoHistory', 'gameSaves'], 'readwrite');

    // プロジェクト削除
    await tx.objectStore('projects').delete(projectId);

    // 関連するUndo履歴を削除（複合キーの最初の要素で検索）
    const undoStore = tx.objectStore('undoHistory');
    const undoCursor = await undoStore.openCursor();
    let cursor = undoCursor;
    while (cursor) {
      const key = cursor.key as [string, string];
      if (key[0] === projectId) {
        await cursor.delete();
      }
      cursor = await cursor.continue();
    }

    // 関連するゲームセーブを削除（複合キーの最初の要素で検索）
    const saveStore = tx.objectStore('gameSaves');
    const saveCursor = await saveStore.openCursor();
    let sCursor = saveCursor;
    while (sCursor) {
      const key = sCursor.key as [string, number];
      if (key[0] === projectId) {
        await sCursor.delete();
      }
      sCursor = await sCursor.continue();
    }

    await tx.done;
  }

  async listProjects(): Promise<ProjectMeta[]> {
    const db = await this.getDB();
    const projects = await db.getAllFromIndex('projects', 'by-updated');

    // 新しい順にソート（降順）
    projects.reverse();

    return projects.map((p) => ({
      id: p.id,
      name: p.name,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));
  }

  async projectExists(projectId: string): Promise<boolean> {
    const db = await this.getDB();
    const key = await db.getKey('projects', projectId);
    return key !== undefined;
  }

  // ===========================================================================
  // Undo/Redo 履歴操作
  // ===========================================================================

  async saveUndoHistory(projectId: string, pageId: string, history: UndoHistory): Promise<void> {
    const db = await this.getDB();
    const key: [string, string] = [projectId, pageId];
    await db.put('undoHistory', history, key);
  }

  async loadUndoHistory(projectId: string, pageId: string): Promise<UndoHistory | null> {
    const db = await this.getDB();
    const key: [string, string] = [projectId, pageId];
    const history = await db.get('undoHistory', key);
    return history ?? null;
  }

  async clearUndoHistory(projectId: string): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction('undoHistory', 'readwrite');
    const store = tx.objectStore('undoHistory');

    const cursor = await store.openCursor();
    let c = cursor;
    while (c) {
      const key = c.key as [string, string];
      if (key[0] === projectId) {
        await c.delete();
      }
      c = await c.continue();
    }

    await tx.done;
  }

  // ===========================================================================
  // ゲームセーブ操作
  // ===========================================================================

  async saveGameData(projectId: string, save: GameSaveData): Promise<void> {
    const db = await this.getDB();
    const key: [string, number] = [projectId, save.slotId];
    await db.put('gameSaves', save, key);
  }

  async loadGameData(projectId: string, slotId: number): Promise<GameSaveData | null> {
    const db = await this.getDB();
    const key: [string, number] = [projectId, slotId];
    const save = await db.get('gameSaves', key);
    return save ?? null;
  }

  async deleteGameData(projectId: string, slotId: number): Promise<void> {
    const db = await this.getDB();
    const key: [string, number] = [projectId, slotId];
    await db.delete('gameSaves', key);
  }

  async listGameSaves(projectId: string): Promise<GameSaveData[]> {
    const db = await this.getDB();
    const tx = db.transaction('gameSaves', 'readonly');
    const store = tx.objectStore('gameSaves');

    const saves: GameSaveData[] = [];
    const cursor = await store.openCursor();
    let c = cursor;
    while (c) {
      const key = c.key as [string, number];
      if (key[0] === projectId) {
        saves.push(c.value);
      }
      c = await c.continue();
    }

    // スロットID順にソート
    return saves.sort((a, b) => a.slotId - b.slotId);
  }

  // ===========================================================================
  // ユーティリティ
  // ===========================================================================

  /**
   * データベース接続を閉じる
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
    }
  }

  /**
   * 全データを削除（テスト用）
   */
  async clearAll(): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction(['projects', 'undoHistory', 'gameSaves'], 'readwrite');
    await tx.objectStore('projects').clear();
    await tx.objectStore('undoHistory').clear();
    await tx.objectStore('gameSaves').clear();
    await tx.done;
  }
}

// =============================================================================
// シングルトンインスタンス
// =============================================================================

let instance: IndexedDBStorageProvider | null = null;

/**
 * IndexedDBStorageProvider のシングルトンインスタンスを取得
 */
export function getIndexedDBStorage(): IndexedDBStorageProvider {
  if (!instance) {
    instance = new IndexedDBStorageProvider();
  }
  return instance;
}

/**
 * シングルトンインスタンスをリセット（テスト用）
 */
export function resetIndexedDBStorage(): void {
  if (instance) {
    instance.close();
    instance = null;
  }
}

// エラー変換関数をエクスポート（テスト用）
export { toStorageError, createStorageError };
