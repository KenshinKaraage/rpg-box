/**
 * Zustand ストア
 *
 * 各スライスを統合してストアを作成
 */
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { createUISlice, UISlice } from './uiSlice';
import { createGameSettingsSlice, GameSettingsSlice } from './gameSettingsSlice';
import { createVariableSlice, VariableSlice } from './variableSlice';
import { createClassSlice, ClassSlice } from './classSlice';
import { createAssetSlice, AssetSlice } from './assetSlice';
import { createDataSlice, DataSlice } from './dataSlice';
import { createScriptSlice, ScriptSlice } from './scriptSlice';

// 全スライスを統合した型
type StoreState = UISlice &
  GameSettingsSlice &
  VariableSlice &
  ClassSlice &
  AssetSlice &
  DataSlice &
  ScriptSlice;

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
  }))
);
