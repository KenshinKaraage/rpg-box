/**
 * LayoutGroup / GridLayout の子オブジェクト配置計算
 *
 * 実際の計算ロジックは各コンポーネントクラスの static メソッドに委譲する。
 */
import type { EditorUIObject, SerializedUIComponent } from '@/stores/uiEditorSlice';
import { LayoutGroupComponent } from '@/types/ui/components/LayoutGroupComponent';
import { GridLayoutComponent } from '@/types/ui/components/GridLayoutComponent';

/**
 * オブジェクト配列の中から Layout コンポーネントを持つ親を探し、
 * 子の配置を計算する。
 *
 * @returns objectId → { x, y } のオーバーライドマップ
 */
export function applyLayoutOverrides(
  objects: EditorUIObject[]
): Map<string, { x: number; y: number }> {
  const overrides = new Map<string, { x: number; y: number }>();

  // 親→子のマップ
  const childrenMap = new Map<string, EditorUIObject[]>();
  for (const obj of objects) {
    if (!obj.parentId) continue;
    const siblings = childrenMap.get(obj.parentId);
    if (siblings) {
      siblings.push(obj);
    } else {
      childrenMap.set(obj.parentId, [obj]);
    }
  }

  for (const obj of objects) {
    const layoutComp = findComponent(obj, 'layoutGroup');
    const gridComp = findComponent(obj, 'gridLayout');
    const children = childrenMap.get(obj.id) ?? [];

    if (children.length === 0) continue;

    let positions: Map<string, { x: number; y: number }>;
    if (layoutComp) {
      positions = LayoutGroupComponent.alignChildren(
        children,
        layoutComp.data as Record<string, unknown>,
        obj.transform.width,
        obj.transform.height
      );
    } else if (gridComp) {
      positions = GridLayoutComponent.alignChildren(
        children,
        gridComp.data as Record<string, unknown>
      );
    } else {
      continue;
    }

    for (const [id, pos] of Array.from(positions)) {
      overrides.set(id, pos);
    }
  }

  return overrides;
}

function findComponent(obj: EditorUIObject, type: string): SerializedUIComponent | undefined {
  return obj.components.find((c) => c.type === type);
}
