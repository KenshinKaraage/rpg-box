/**
 * Zustand ストア
 *
 * 各スライスを統合してストアを作成
 */
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import type { ProjectData } from '@/lib/storage/types';
import { hydrateDataType } from '@/types/data';
import { hydrateCustomClass } from '@/types/customClass';
import { hydrateVariable } from '@/types/variable';
import { hydrateGameMap, hydrateChipset, hydratePrefab } from '@/types/map';

import { createUISlice, UISlice } from './uiSlice';
import { createGameSettingsSlice, GameSettingsSlice } from './gameSettingsSlice';
import { createVariableSlice, VariableSlice } from './variableSlice';
import { createClassSlice, ClassSlice } from './classSlice';
import { createAssetSlice, AssetSlice } from './assetSlice';
import { createDataSlice, DataSlice } from './dataSlice';
import { createScriptSlice, ScriptSlice } from './scriptSlice';
import { createMapSlice, MapSlice } from './mapSlice';
import { createPrefabSlice, PrefabSlice } from './prefabSlice';
import { createMapEditorSlice, MapEditorSlice } from './mapEditorSlice';
import { createEventSlice, EventSlice } from './eventSlice';
import { createUIEditorSlice, UIEditorSlice } from './uiEditorSlice';

// プロジェクトデータの一括読み込み
interface ProjectDataSlice {
  /** ProjectData を一括でストアに読み込む */
  loadProjectData: (data: ProjectData) => void;
}

// 全スライスを統合した型
type StoreState = UISlice &
  GameSettingsSlice &
  VariableSlice &
  ClassSlice &
  AssetSlice &
  DataSlice &
  ScriptSlice &
  MapSlice &
  PrefabSlice &
  MapEditorSlice &
  EventSlice &
  UIEditorSlice &
  ProjectDataSlice;

// ストア作成
export const useStore = create<StoreState>()(
  immer((set, get) => ({
    ...createUISlice(set),
    ...createGameSettingsSlice(set),
    ...createVariableSlice(set, get),
    ...createClassSlice(set),
    ...createAssetSlice(set, get),
    ...createDataSlice(set, get),
    ...createScriptSlice(set, get),
    ...createMapSlice(set, get),
    ...createPrefabSlice(set, get),
    ...createMapEditorSlice(set, get),
    ...createEventSlice(set),
    ...createUIEditorSlice(set, get),

    loadProjectData: (data: ProjectData) =>
      set((state) => {
        // Hydrate FieldType class instances from plain JSON objects
        state.dataTypes = data.dataTypes.map(hydrateDataType) as typeof state.dataTypes;
        state.dataEntries = data.dataEntries as typeof state.dataEntries;
        state.classes = data.classes.map(hydrateCustomClass) as typeof state.classes;
        state.variables = data.variables.map(hydrateVariable) as typeof state.variables;
        state.maps = data.maps.map(hydrateGameMap) as typeof state.maps;
        state.chipsets = data.chipsets.map(hydrateChipset) as typeof state.chipsets;
        state.prefabs = data.prefabs.map(hydratePrefab) as unknown as typeof state.prefabs;
        state.eventTemplates = data.eventTemplates as unknown as typeof state.eventTemplates;
        state.uiCanvases = data.uiCanvases as unknown as typeof state.uiCanvases;
        state.uiTemplates = data.uiTemplates as unknown as typeof state.uiTemplates;
        state.scripts = data.scripts as typeof state.scripts;
        state.assets = data.assets as unknown as typeof state.assets;
        state.gameSettings = data.gameSettings;
      }),
  }))
);
