/**
 * テスト用デフォルトデータ — ロード関数
 *
 * 分割ファイル:
 * - defaultTestCanvases.ts: UICanvas 定義
 * - defaultTestScripts.ts: スクリプト定義
 * - defaultTestEntries.ts: サンプルデータエントリ + 変数
 * - defaultTestMap.ts: マップ + NPC + プレハブ生成
 */

import { useStore } from '@/stores';
import { defaultDataTypes } from './defaultDataTypes';
import { defaultClasses } from './defaultClasses';
import { importDefaultAssets } from './importDefaultAssets';

import {
  messageCanvas, choiceCanvas, numberInputCanvas, textInputCanvas,
  statusCanvas, effectTestCanvas, animTestCanvas, partyStatusCanvas,
  menuCanvas,
} from './defaultTestCanvases';
import {
  messageScript, choiceScript, inputNumberScript, inputTextScript,
  showStatusScript, shopScript, mapInfoScript, objTestScript,
  audioTestScript, inputTestScript, effectTestScript, animTestScript,
  partyStatusScript, itemAddScript, itemRemoveScript, useItemScript,
  equipItemScript, unequipItemScript, menuOpenScript,
} from './defaultTestScripts';
import { sampleDataEntries, createTestVariables } from './defaultTestEntries';
import { createTestMap, createNpcPrefabs } from './defaultTestMap';
import type { AssetNameToId } from './defaultTestMap';

// ── Store に投入 ──

export async function loadDefaultTestData(): Promise<void> {
  const state = useStore.getState();

  // デフォルトアセット（マップチップ + 歩行キャラ）をインポート
  await importDefaultAssets(state.assets, state.addAsset, state.addFolder, state.assetFolders);

  // アセット名→IDリゾルバ（インポート後の最新 state を再取得）
  const freshState = useStore.getState();
  const resolveAssetId: AssetNameToId = (name) => {
    const asset = freshState.assets.find((a) => a.name === name);
    return asset?.id ?? name;  // 見つからなければ name をそのまま返す
  };

  // デフォルトクラス
  for (const cls of defaultClasses) {
    if (!state.classes.find((c) => c.id === cls.id)) {
      state.addClass(cls);
    }
  }

  // デフォルトデータタイプ
  for (const dt of defaultDataTypes) {
    if (!state.dataTypes.find((t) => t.id === dt.id)) {
      state.addDataType(dt);
    }
  }

  // サンプルデータエントリ（画像フィールドのアセット名→IDを解決）
  const IMAGE_FIELDS = ['face_graphic', 'walk_graphic', 'icon', 'graphic'];
  for (const [typeId, entries] of Object.entries(sampleDataEntries)) {
    for (const entry of entries) {
      const existing = state.dataEntries[typeId];
      if (!existing?.find((e) => e.id === entry.id)) {
        const resolved = { ...entry, values: { ...entry.values } };
        for (const field of IMAGE_FIELDS) {
          if (resolved.values[field] && typeof resolved.values[field] === 'string') {
            resolved.values[field] = resolveAssetId(resolved.values[field] as string);
          }
        }
        state.addDataEntry(resolved);
      }
    }
  }

  // テスト用変数
  for (const v of createTestVariables()) {
    if (!state.variables.find((sv) => sv.id === v.id)) {
      state.addVariable(v);
    }
  }

  // UICanvas（structuredClone で渡して Immer との参照共有を防ぐ）
  if (!state.uiCanvases.find((c) => c.id === 'message')) {
    state.addUICanvas(structuredClone(messageCanvas));
  }
  if (!state.uiCanvases.find((c) => c.id === 'status_hud')) {
    state.addUICanvas(structuredClone(statusCanvas));
  }
  if (!state.uiCanvases.find((c) => c.id === 'choice')) {
    state.addUICanvas(structuredClone(choiceCanvas));
  }
  if (!state.uiCanvases.find((c) => c.id === 'number_input')) {
    state.addUICanvas(structuredClone(numberInputCanvas));
  }
  if (!state.uiCanvases.find((c) => c.id === 'text_input')) {
    state.addUICanvas(structuredClone(textInputCanvas));
  }
  if (!state.uiCanvases.find((c) => c.id === 'effect_test')) {
    state.addUICanvas(structuredClone(effectTestCanvas));
  }
  if (!state.uiCanvases.find((c) => c.id === 'anim_test')) {
    state.addUICanvas(structuredClone(animTestCanvas));
  }
  if (!state.uiCanvases.find((c) => c.id === 'party_status')) {
    state.addUICanvas(structuredClone(partyStatusCanvas));
  }
  if (!state.uiCanvases.find((c) => c.id === 'menu')) {
    state.addUICanvas(structuredClone(menuCanvas));
  }

  // Prefab（NPC テンプレート）
  const npcPrefabs = createNpcPrefabs(resolveAssetId);
  for (const prefab of npcPrefabs) {
    if (!state.prefabs.find((p) => p.id === prefab.id)) {
      state.addPrefab(prefab);
    }
  }

  // Script
  const scriptsToAdd = [
    messageScript, choiceScript, inputNumberScript, inputTextScript,
    showStatusScript, shopScript, mapInfoScript, objTestScript,
    audioTestScript, inputTestScript, effectTestScript, animTestScript,
    partyStatusScript, itemAddScript, itemRemoveScript, useItemScript,
    equipItemScript, unequipItemScript, menuOpenScript,
  ];
  for (const script of scriptsToAdd) {
    if (!state.scripts.find((s) => s.id === script.id)) {
      state.addScript(script);
    }
  }

  // Map
  if (!freshState.maps.find((m) => m.id === 'test_map')) {
    freshState.addMap(createTestMap(resolveAssetId));
  }

  // ゲーム設定: 開始マップを設定
  state.updateGameSettings({ startMapId: 'test_map', menuScriptId: 'menu_open' });
}
