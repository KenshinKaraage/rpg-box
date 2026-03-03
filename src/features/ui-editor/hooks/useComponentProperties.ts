import { useMemo } from 'react';
import { useStore } from '@/stores';
import { getUIComponent } from '@/types/ui';
import {
  getRectTransformPropertyDefs,
  getRectTransformAnimatablePropertyDefs,
  type PropertyDef,
  type AnimatablePropertyDef,
} from '@/types/ui/UIComponent';

// ──────────────────────────────────────────────
// Shared types
// ──────────────────────────────────────────────

export interface ComponentOption {
  type: string;
  label: string;
}

// ──────────────────────────────────────────────
// useComponentOptions
// ──────────────────────────────────────────────

/**
 * 対象オブジェクトが持つコンポーネント一覧を返す。
 * transform は常に含む。
 *
 * @param targetId 対象オブジェクトID（'' = 現在の選択オブジェクト）
 * @param mode 'all' = getPropertyDefs, 'animatable' = getAnimatablePropertyDefs
 */
export function useComponentOptions(
  targetId: string,
  mode: 'all' | 'animatable' = 'all'
): ComponentOption[] {
  const selectedCanvasId = useStore((s) => s.selectedCanvasId);
  const selectedObjectIds = useStore((s) => s.selectedObjectIds);
  const uiCanvases = useStore((s) => s.uiCanvases);
  const canvas = uiCanvases.find((c) => c.id === selectedCanvasId);
  const resolvedId = targetId === '' ? selectedObjectIds[0] : targetId;
  const obj = resolvedId ? canvas?.objects.find((o) => o.id === resolvedId) : undefined;

  return useMemo(() => {
    const result: ComponentOption[] = [{ type: 'transform', label: 'Transform' }];
    if (!obj) return result;

    for (const comp of obj.components) {
      const Ctor = getUIComponent(comp.type);
      if (!Ctor) continue;
      const instance = new Ctor();
      const hasDefs =
        mode === 'animatable'
          ? instance.getAnimatablePropertyDefs().length > 0
          : instance.getPropertyDefs().length > 0;
      if (hasDefs) {
        result.push({ type: comp.type, label: instance.label });
      }
    }

    return result;
  }, [obj, mode]);
}

// ──────────────────────────────────────────────
// Property defs lookup
// ──────────────────────────────────────────────

/** Get PropertyDef[] for editor forms */
export function getPropertyDefsForComponent(componentType: string): PropertyDef[] {
  if (componentType === 'transform') {
    return getRectTransformPropertyDefs();
  }
  const Ctor = getUIComponent(componentType);
  if (!Ctor) return [];
  return new Ctor().getPropertyDefs();
}

/** Get AnimatablePropertyDef[] for animation tracks */
export function getAnimatableDefsForComponent(componentType: string): AnimatablePropertyDef[] {
  if (componentType === 'transform') {
    return getRectTransformAnimatablePropertyDefs();
  }
  const Ctor = getUIComponent(componentType);
  if (!Ctor) return [];
  return new Ctor().getAnimatablePropertyDefs();
}
