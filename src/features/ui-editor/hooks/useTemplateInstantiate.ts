'use client';

import { useCallback } from 'react';
import { useStore } from '@/stores';
import { generateId } from '@/lib/utils';
import type { EditorUIObject, EditorUITemplate } from '@/stores/uiEditorSlice';

/**
 * テンプレートのオブジェクトツリーを新しいIDで複製する。
 * parentId の参照も新しいIDにマッピングする。
 */
export function instantiateObjects(
  templateObjects: EditorUIObject[],
  existingIds: string[]
): EditorUIObject[] {
  // 旧ID → 新ID のマッピングを作成
  const idMap = new Map<string, string>();
  const allIds = [...existingIds];

  for (const obj of templateObjects) {
    const newId = generateId('obj', allIds);
    idMap.set(obj.id, newId);
    allIds.push(newId);
  }

  // ディープコピーしてID差し替え
  return structuredClone(templateObjects).map((obj) => ({
    ...obj,
    id: idMap.get(obj.id) ?? obj.id,
    parentId: obj.parentId ? idMap.get(obj.parentId) : undefined,
  }));
}

/**
 * テンプレートインスタンス化フック
 *
 * テンプレートからオブジェクトツリーを複製してキャンバスに配置する。
 */
export function useTemplateInstantiate() {
  const selectedCanvasId = useStore((s) => s.selectedCanvasId);
  const uiCanvases = useStore((s) => s.uiCanvases);
  const addUIObject = useStore((s) => s.addUIObject);

  const selectedCanvas = uiCanvases.find((c) => c.id === selectedCanvasId) ?? null;

  const canInstantiate = selectedCanvasId !== null;

  const instantiateTemplate = useCallback(
    (template: EditorUITemplate) => {
      if (!selectedCanvasId || !selectedCanvas) return [];

      const existingIds = selectedCanvas.objects.map((o) => o.id);
      const newObjects = instantiateObjects(template.objects, existingIds);

      for (const obj of newObjects) {
        addUIObject(selectedCanvasId, obj);
      }

      return newObjects.map((o) => o.id);
    },
    [selectedCanvasId, selectedCanvas, addUIObject]
  );

  return { canInstantiate, instantiateTemplate };
}
