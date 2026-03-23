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

  // structuredClone でディープコピー — Immer の frozen proxy を解除し、
  // ランタイムでデータを直接変更可能にする（UICanvasManager 等）
  return structuredClone({
    // Data
    dataTypes: state.dataTypes,
    dataEntries: state.dataEntries,
    classes: state.classes,
    variables: state.variables,

    // Maps
    maps: state.maps,
    chipsets: state.chipsets,
    prefabs: state.prefabs,

    // Events (stored on map objects, top-level list not used yet)
    events: [],
    eventTemplates: state.eventTemplates as unknown as ProjectData['eventTemplates'],

    // UI
    uiCanvases: state.uiCanvases as unknown as ProjectData['uiCanvases'],
    objectUIs: [],
    uiTemplates: state.uiTemplates as unknown as ProjectData['uiTemplates'],

    // Scripts & Assets
    scripts: state.scripts,
    assets: state.assets as unknown as ProjectData['assets'],

    // Settings
    gameSettings: state.gameSettings,
  });
}
