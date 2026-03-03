export type { FieldRendererProps, FieldRenderer } from './types';
export { VertexField } from './VertexField';
export { InlineAnimationEditor } from './InlineAnimationEditor';

import type { FieldRenderer } from './types';

// ──────────────────────────────────────────────
// Property field renderer registry
// ──────────────────────────────────────────────

const fieldRendererRegistry = new Map<string, FieldRenderer>();

export function registerPropertyField(type: string, renderer: FieldRenderer): void {
  fieldRendererRegistry.set(type, renderer);
}

export function getPropertyField(type: string): FieldRenderer | undefined {
  return fieldRendererRegistry.get(type);
}
