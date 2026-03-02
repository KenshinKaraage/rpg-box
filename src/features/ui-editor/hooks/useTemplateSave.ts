'use client';

import { useCallback } from 'react';
import { useStore } from '@/stores';
import { generateId } from '@/lib/utils';
import { TemplateControllerComponent } from '@/types/ui/components/TemplateControllerComponent';
import type { EditorUIObject, EditorUITemplate } from '@/stores/uiEditorSlice';

/**
 * 指定オブジェクトとその全子孫をディープコピーして返す。
 * ルートの parentId は undefined に差し替える。
 */
export function collectObjectTree(
  rootId: string,
  allObjects: EditorUIObject[]
): EditorUIObject[] {
  const result: EditorUIObject[] = [];
  const queue = [rootId];

  while (queue.length > 0) {
    const id = queue.shift()!;
    const obj = allObjects.find((o) => o.id === id);
    if (!obj) continue;

    result.push(obj);

    // 子オブジェクトを収集
    for (const child of allObjects) {
      if (child.parentId === id) {
        queue.push(child.id);
      }
    }
  }

  // ディープコピー + ルートの parentId を除去
  return structuredClone(result).map((obj) =>
    obj.id === rootId ? { ...obj, parentId: undefined } : obj
  );
}

/**
 * ルートオブジェクトに TemplateControllerComponent がなければ自動追加する。
 * 既にあれば何もしない。引数の objects は in-place で変更される。
 */
export function ensureTemplateController(objects: EditorUIObject[], rootId: string): void {
  const root = objects.find((o) => o.id === rootId);
  if (!root) return;
  if (root.components.some((c) => c.type === 'templateController')) return;
  const tc = new TemplateControllerComponent();
  root.components.push({ type: tc.type, data: tc.serialize() });
}

/**
 * テンプレート保存フック
 *
 * 選択中のオブジェクト（と子孫）をテンプレートとして保存する。
 * 単一選択のみ対応。
 */
export function useTemplateSave() {
  const selectedCanvasId = useStore((s) => s.selectedCanvasId);
  const uiCanvases = useStore((s) => s.uiCanvases);
  const selectedObjectIds = useStore((s) => s.selectedObjectIds);
  const uiTemplates = useStore((s) => s.uiTemplates);
  const addUITemplate = useStore((s) => s.addUITemplate);

  const selectedCanvas = uiCanvases.find((c) => c.id === selectedCanvasId) ?? null;

  const canSave = selectedObjectIds.length === 1 && selectedCanvas !== null;

  const saveAsTemplate = useCallback(
    (name?: string) => {
      if (!canSave || !selectedCanvas) return null;

      const objectId = selectedObjectIds[0]!;
      const objects = collectObjectTree(objectId, selectedCanvas.objects);
      ensureTemplateController(objects, objectId);
      const root = objects.find((o) => o.id === objectId);

      const id = generateId(
        'ui_tmpl',
        uiTemplates.map((t) => t.id)
      );

      const template: EditorUITemplate = {
        id,
        name: name ?? root?.name ?? 'テンプレート',
        objects,
      };

      addUITemplate(template);
      return id;
    },
    [canSave, selectedCanvas, selectedObjectIds, uiTemplates, addUITemplate]
  );

  return { canSave, saveAsTemplate };
}
