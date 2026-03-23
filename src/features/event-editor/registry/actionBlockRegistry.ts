import type React from 'react';

import type { EditableAction } from '@/types/ui/actions/UIAction';

export interface FunctionArgDef {
  id: string;
  name: string;
  fieldType: string;
}

export interface ActionBlockProps {
  action: EditableAction;
  onChange: (action: EditableAction) => void;
  onDelete: () => void;
  /** UIFunction の引数定義（UIFunction 内のブロックでのみ渡される） */
  functionArgs?: FunctionArgDef[];
}

export interface ActionBlockDefinition {
  type: string;
  label: string;
  category: 'logic' | 'basic' | 'script' | 'template' | 'ui';
  BlockComponent: React.ComponentType<ActionBlockProps>;
}

const blockRegistry = new Map<string, ActionBlockDefinition>();

export function registerActionBlock(def: ActionBlockDefinition): void {
  if (blockRegistry.has(def.type)) {
    console.warn(`ActionBlock "${def.type}" is already registered. Overwriting.`);
  }
  blockRegistry.set(def.type, def);
}

export function getActionBlock(type: string): ActionBlockDefinition | undefined {
  return blockRegistry.get(type);
}

export function getAllActionBlocks(): ActionBlockDefinition[] {
  return Array.from(blockRegistry.values());
}

export function getActionBlocksByCategory(): Record<string, ActionBlockDefinition[]> {
  const result: Record<string, ActionBlockDefinition[]> = {};
  for (const def of Array.from(blockRegistry.values())) {
    const list = result[def.category];
    if (!list) {
      result[def.category] = [def];
    } else {
      list.push(def);
    }
  }
  return result;
}

export function clearActionBlockRegistry(): void {
  blockRegistry.clear();
}
