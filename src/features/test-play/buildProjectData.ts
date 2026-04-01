/**
 * Build a complete ProjectData snapshot from the Zustand store state.
 * Used by test play to capture the current editor state.
 *
 * Note: Store types (src/types/) differ slightly from storage types
 * (src/lib/storage/types.ts) but are compatible at runtime.
 */

import type { ProjectData } from '@/lib/storage/types';
import { useStore } from '@/stores';

export function buildProjectData(): ProjectData {
  const state = useStore.getState();

  return {
    // Data
    dataTypes: state.dataTypes,
    dataEntries: state.dataEntries,
    classes: state.classes,
    variables: state.variables,

    // Maps
    maps: state.maps as unknown as ProjectData['maps'],
    chipsets: state.chipsets,
    prefabs: state.prefabs.map((p) => ({
      id: p.id,
      name: p.name,
      prefab: {
        components: p.prefab.components.map((c) => ({
          type: c.type,
          data: c.serialize() as Record<string, unknown>,
        })),
      },
    })),

    // Events (stored on map objects, top-level list not used yet)
    events: [],
    eventTemplates: state.eventTemplates as unknown as ProjectData['eventTemplates'],

    // UI — structuredClone で Immer frozen proxy を解除（UICanvasManager が直接変更する）
    uiCanvases: structuredClone(state.uiCanvases) as unknown as ProjectData['uiCanvases'],
    objectUIs: [],
    uiTemplates: state.uiTemplates as unknown as ProjectData['uiTemplates'],

    // Scripts & Assets — 参照のまま（変更しない、Blob を壊さない）
    scripts: state.scripts,
    assets: state.assets as unknown as ProjectData['assets'],

    // Settings
    gameSettings: state.gameSettings,
  };
}
