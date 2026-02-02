'use client';

/**
 * useStorage フック
 *
 * プロジェクトデータの永続化操作を提供
 * - IndexedDB への保存/読み込み
 * - JSON ファイルへのエクスポート/インポート
 *
 * @see design.md#6-ストレージ設計
 */

import { useCallback, useState } from 'react';
import { IndexedDBStorageProvider, getIndexedDBStorage } from '@/lib/storage/indexedDB';
import type { SavedProject, ProjectMeta, ProjectData, StorageError } from '@/lib/storage/types';

// =============================================================================
// 型定義
// =============================================================================

export type StorageOperation = 'idle' | 'loading' | 'saving' | 'exporting' | 'importing';

export interface StorageState {
  /** 現在の操作状態 */
  operation: StorageOperation;
  /** エラー情報 */
  error: StorageError | null;
  /** 最後に保存した時刻 */
  lastSavedAt: Date | null;
}

export interface UseStorageReturn extends StorageState {
  /**
   * プロジェクトを IndexedDB に保存
   */
  save: (project: SavedProject) => Promise<boolean>;

  /**
   * プロジェクトを IndexedDB から読み込み
   */
  load: (projectId: string) => Promise<SavedProject | null>;

  /**
   * プロジェクト一覧を取得
   */
  listProjects: () => Promise<ProjectMeta[]>;

  /**
   * プロジェクトを削除
   */
  deleteProject: (projectId: string) => Promise<boolean>;

  /**
   * プロジェクトの存在確認
   */
  projectExists: (projectId: string) => Promise<boolean>;

  /**
   * プロジェクトを JSON ファイルとしてエクスポート
   */
  exportProject: (project: SavedProject, filename?: string) => Promise<boolean>;

  /**
   * JSON ファイルからプロジェクトをインポート
   */
  importProject: (file: File) => Promise<SavedProject | null>;

  /**
   * エラーをクリア
   */
  clearError: () => void;
}

// =============================================================================
// バリデーション
// =============================================================================

/**
 * インポートされたデータがSavedProject形式か検証
 */
function isValidSavedProject(data: unknown): data is SavedProject {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;

  // 必須フィールドのチェック
  if (typeof obj['id'] !== 'string' || obj['id'].length === 0) {
    return false;
  }
  if (typeof obj['name'] !== 'string') {
    return false;
  }
  if (typeof obj['data'] !== 'object' || obj['data'] === null) {
    return false;
  }

  // ProjectData の基本構造チェック
  const projectData = obj['data'] as Record<string, unknown>;
  const requiredArrays = [
    'dataTypes',
    'fieldSets',
    'classes',
    'variables',
    'maps',
    'chipsets',
    'prefabs',
    'events',
    'eventTemplates',
    'uiCanvases',
    'objectUIs',
    'uiTemplates',
    'scripts',
    'assets',
  ];

  for (const key of requiredArrays) {
    if (!Array.isArray(projectData[key])) {
      return false;
    }
  }

  if (typeof projectData['dataEntries'] !== 'object') {
    return false;
  }

  if (typeof projectData['gameSettings'] !== 'object' || projectData['gameSettings'] === null) {
    return false;
  }

  return true;
}

/**
 * インポートデータをSavedProject形式に正規化
 */
function normalizeSavedProject(data: Record<string, unknown>): SavedProject {
  return {
    id: data['id'] as string,
    name: data['name'] as string,
    createdAt: data['createdAt'] ? new Date(data['createdAt'] as string | number) : new Date(),
    updatedAt: data['updatedAt'] ? new Date(data['updatedAt'] as string | number) : new Date(),
    data: data['data'] as ProjectData,
  };
}

// =============================================================================
// useStorage フック
// =============================================================================

/**
 * ストレージ操作フック
 *
 * @example
 * ```tsx
 * const {
 *   operation,
 *   error,
 *   save,
 *   load,
 *   exportProject,
 *   importProject,
 * } = useStorage();
 *
 * // 保存
 * const success = await save(project);
 *
 * // 読み込み
 * const project = await load('proj_001');
 *
 * // エクスポート
 * await exportProject(project, 'my-rpg.json');
 *
 * // インポート
 * const imported = await importProject(file);
 * ```
 */
export function useStorage(): UseStorageReturn {
  const [operation, setOperation] = useState<StorageOperation>('idle');
  const [error, setError] = useState<StorageError | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const getStorage = useCallback((): IndexedDBStorageProvider => {
    return getIndexedDBStorage();
  }, []);

  const createError = useCallback(
    (type: StorageError['type'], message: string, cause?: unknown): StorageError => ({
      type,
      message,
      cause,
    }),
    []
  );

  // -------------------------------------------------------------------------
  // save
  // -------------------------------------------------------------------------
  const save = useCallback(
    async (project: SavedProject): Promise<boolean> => {
      setOperation('saving');
      setError(null);

      try {
        const storage = getStorage();
        await storage.saveProject(project);
        setLastSavedAt(new Date());
        setOperation('idle');
        return true;
      } catch (err) {
        const storageError = createError(
          'UNKNOWN',
          err instanceof Error ? err.message : 'Failed to save project',
          err
        );
        setError(storageError);
        setOperation('idle');
        return false;
      }
    },
    [getStorage, createError]
  );

  // -------------------------------------------------------------------------
  // load
  // -------------------------------------------------------------------------
  const load = useCallback(
    async (projectId: string): Promise<SavedProject | null> => {
      setOperation('loading');
      setError(null);

      try {
        const storage = getStorage();
        const project = await storage.loadProject(projectId);

        if (!project) {
          setError(createError('NOT_FOUND', `Project not found: ${projectId}`));
        }

        setOperation('idle');
        return project;
      } catch (err) {
        const storageError = createError(
          'UNKNOWN',
          err instanceof Error ? err.message : 'Failed to load project',
          err
        );
        setError(storageError);
        setOperation('idle');
        return null;
      }
    },
    [getStorage, createError]
  );

  // -------------------------------------------------------------------------
  // listProjects
  // -------------------------------------------------------------------------
  const listProjects = useCallback(async (): Promise<ProjectMeta[]> => {
    setOperation('loading');
    setError(null);

    try {
      const storage = getStorage();
      const projects = await storage.listProjects();
      setOperation('idle');
      return projects;
    } catch (err) {
      const storageError = createError(
        'UNKNOWN',
        err instanceof Error ? err.message : 'Failed to list projects',
        err
      );
      setError(storageError);
      setOperation('idle');
      return [];
    }
  }, [getStorage, createError]);

  // -------------------------------------------------------------------------
  // deleteProject
  // -------------------------------------------------------------------------
  const deleteProject = useCallback(
    async (projectId: string): Promise<boolean> => {
      setOperation('loading');
      setError(null);

      try {
        const storage = getStorage();
        await storage.deleteProject(projectId);
        setOperation('idle');
        return true;
      } catch (err) {
        const storageError = createError(
          'UNKNOWN',
          err instanceof Error ? err.message : 'Failed to delete project',
          err
        );
        setError(storageError);
        setOperation('idle');
        return false;
      }
    },
    [getStorage, createError]
  );

  // -------------------------------------------------------------------------
  // projectExists
  // -------------------------------------------------------------------------
  const projectExists = useCallback(
    async (projectId: string): Promise<boolean> => {
      try {
        const storage = getStorage();
        return await storage.projectExists(projectId);
      } catch {
        return false;
      }
    },
    [getStorage]
  );

  // -------------------------------------------------------------------------
  // exportProject
  // -------------------------------------------------------------------------
  const exportProject = useCallback(
    async (project: SavedProject, filename?: string): Promise<boolean> => {
      setOperation('exporting');
      setError(null);

      try {
        const exportData = {
          ...project,
          exportedAt: new Date().toISOString(),
          version: '1.0.0',
        };

        const json = JSON.stringify(exportData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = filename ?? `${project.name.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
        setOperation('idle');
        return true;
      } catch (err) {
        const storageError = createError(
          'UNKNOWN',
          err instanceof Error ? err.message : 'Failed to export project',
          err
        );
        setError(storageError);
        setOperation('idle');
        return false;
      }
    },
    [createError]
  );

  // -------------------------------------------------------------------------
  // importProject
  // -------------------------------------------------------------------------
  const importProject = useCallback(
    async (file: File): Promise<SavedProject | null> => {
      setOperation('importing');
      setError(null);

      try {
        // ファイル読み込み
        const text = await file.text();
        let data: unknown;

        try {
          data = JSON.parse(text);
        } catch {
          setError(createError('INVALID_DATA', 'Invalid JSON format'));
          setOperation('idle');
          return null;
        }

        // バリデーション
        if (!isValidSavedProject(data)) {
          setError(createError('INVALID_DATA', 'Invalid project data format'));
          setOperation('idle');
          return null;
        }

        // 正規化
        const project = normalizeSavedProject(data as unknown as Record<string, unknown>);

        setOperation('idle');
        return project;
      } catch (err) {
        const storageError = createError(
          'UNKNOWN',
          err instanceof Error ? err.message : 'Failed to import project',
          err
        );
        setError(storageError);
        setOperation('idle');
        return null;
      }
    },
    [createError]
  );

  // -------------------------------------------------------------------------
  // clearError
  // -------------------------------------------------------------------------
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    operation,
    error,
    lastSavedAt,
    save,
    load,
    listProjects,
    deleteProject,
    projectExists,
    exportProject,
    importProject,
    clearError,
  };
}
