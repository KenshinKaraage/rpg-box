export type { ArgFieldProps, ArgFieldRenderer } from './types';

import type { ArgFieldRenderer } from './types';

const argFieldRegistry = new Map<string, ArgFieldRenderer>();

export function registerArgField(fieldType: string, renderer: ArgFieldRenderer): void {
  argFieldRegistry.set(fieldType, renderer);
}

export function getArgField(fieldType: string): ArgFieldRenderer | undefined {
  return argFieldRegistry.get(fieldType);
}
