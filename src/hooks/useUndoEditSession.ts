'use client';
import { useEffect, useRef } from 'react';
import { useStore } from '@/stores';

/**
 * 連続した入力（1文字ごとのonChange等）をUndo1件にまとめるためのフック。
 *
 * 同一セッション中（フォーカスが外れる/resetKeyが変わるまで）は
 * 最初の変更時にだけ pushUndoState を呼ぶ。それ以降の変更はまとめて
 * 1回のUndoで戻せるようにする。
 *
 * @param page editorSlice の currentPage と対応するページID
 * @param resetKey これが変わったらセッションをリセットする値（例: 選択中のエンティティID）
 */
export function useUndoEditSession(page: string, resetKey: unknown) {
  const pushUndoState = useStore((s) => s.pushUndoState);
  const editingRef = useRef(false);

  useEffect(() => {
    editingRef.current = false;
  }, [resetKey]);

  const beginEditIfNeeded = (snapshot: unknown) => {
    if (!editingRef.current) {
      pushUndoState(page, snapshot);
      editingRef.current = true;
    }
  };

  /** 単発の操作（追加/削除など）の前後で呼び、セッションを断ち切る */
  const endEditSession = () => {
    editingRef.current = false;
  };

  return { beginEditIfNeeded, endEditSession };
}
