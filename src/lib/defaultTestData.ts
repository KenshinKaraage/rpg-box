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
import { applyLayoutOverrides } from '@/features/ui-editor/renderer/layoutResolver';
import type { EditorUICanvas } from '@/stores/uiEditorSlice';
import { defaultDataTypes } from './defaultDataTypes';
import { defaultClasses } from './defaultClasses';
import { importDefaultAssets } from './importDefaultAssets';

import {
  messageCanvas,
  choiceCanvas,
  numberInputCanvas,
  textInputCanvas,
  statusCanvas,
  effectTestCanvas,
  animTestCanvas,
  partyStatusCanvas,
  menuCanvas,
  itemScreenCanvas,
  equipScreenCanvas,
  shopCanvas,
  skillScreenCanvas,
  battleCanvas,
} from './defaultTestCanvases';
import {
  messageScript,
  choiceScript,
  inputNumberScript,
  inputTextScript,
  showStatusScript,
  mapInfoScript,
  objTestScript,
  audioTestScript,
  inputTestScript,
  effectTestScript,
  animTestScript,
  partyStatusScript,
  itemAddScript,
  itemRemoveScript,
  useItemScript,
  equipItemScript,
  unequipItemScript,
  initPartyScript,
  levelUpScript,
  healAllScript,
  levelUpAllScript,
  shopOpenScript,
  menuOpenScript,
  itemScreenScript,
  equipScreenScript,
  skillScreenScript,
  statusScreenScript,
  battleScript,
  battleCommandScript,
  battleSkillScript,
  battleItemScript,
  battleTargetEnemyScript,
  battleTargetAllyScript,
  battleTurnOrderScript,
  battleFleeScript,
  battleEnemyAIScript,
  battleExecuteScript,
  battleResultScript,
} from './defaultTestScripts';
import { sampleDataEntries, createTestVariables } from './defaultTestEntries';
import { createTestMap, createNpcPrefabs } from './defaultTestMap';
import type { AssetNameToId } from './defaultTestMap';

// ── Store に投入 ──

/** キャンバスのオブジェクトをレイアウトコンポーネントに従って整列する */
function alignCanvas(canvas: EditorUICanvas): EditorUICanvas {
  const clone = structuredClone(canvas);
  const overrides = applyLayoutOverrides(clone.objects);
  for (const obj of clone.objects) {
    const pos = overrides.get(obj.id);
    if (pos) {
      obj.transform.x = pos.x;
      obj.transform.y = pos.y;
    }
  }
  return clone;
}

export async function loadDefaultTestData(): Promise<void> {
  const state = useStore.getState();

  // デフォルトアセット（マップチップ + 歩行キャラ）をインポート
  await importDefaultAssets(state.assets, state.addAsset, state.addFolder, state.assetFolders);

  // アセット名→IDリゾルバ（インポート後の最新 state を再取得）
  const freshState = useStore.getState();
  const resolveAssetId: AssetNameToId = (name) => {
    const asset = freshState.assets.find((a) => a.name === name);
    return asset?.id ?? name; // 見つからなければ name をそのまま返す
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
  const EFFECT_FIELDS = ['visual_effect', 'use_effect'];
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
        for (const field of EFFECT_FIELDS) {
          const eff = resolved.values[field];
          if (eff && typeof eff === 'object' && (eff as Record<string, unknown>).imageId) {
            resolved.values[field] = {
              ...(eff as Record<string, unknown>),
              imageId: resolveAssetId((eff as Record<string, unknown>).imageId as string),
            };
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
    state.addUICanvas(alignCanvas(messageCanvas));
  }
  if (!state.uiCanvases.find((c) => c.id === 'status_hud')) {
    state.addUICanvas(alignCanvas(statusCanvas));
  }
  if (!state.uiCanvases.find((c) => c.id === 'choice')) {
    state.addUICanvas(alignCanvas(choiceCanvas));
  }
  if (!state.uiCanvases.find((c) => c.id === 'number_input')) {
    state.addUICanvas(alignCanvas(numberInputCanvas));
  }
  if (!state.uiCanvases.find((c) => c.id === 'text_input')) {
    state.addUICanvas(alignCanvas(textInputCanvas));
  }
  if (!state.uiCanvases.find((c) => c.id === 'effect_test')) {
    state.addUICanvas(alignCanvas(effectTestCanvas));
  }
  if (!state.uiCanvases.find((c) => c.id === 'anim_test')) {
    state.addUICanvas(alignCanvas(animTestCanvas));
  }
  if (!state.uiCanvases.find((c) => c.id === 'party_status')) {
    state.addUICanvas(alignCanvas(partyStatusCanvas));
  }
  if (!state.uiCanvases.find((c) => c.id === 'menu')) {
    state.addUICanvas(alignCanvas(menuCanvas));
  }
  if (!state.uiCanvases.find((c) => c.id === 'item_screen')) {
    state.addUICanvas(alignCanvas(itemScreenCanvas));
  }
  if (!state.uiCanvases.find((c) => c.id === 'equip_screen')) {
    state.addUICanvas(alignCanvas(equipScreenCanvas));
  }
  if (!state.uiCanvases.find((c) => c.id === 'shop')) {
    state.addUICanvas(alignCanvas(shopCanvas));
  }
  if (!state.uiCanvases.find((c) => c.id === 'skill_screen')) {
    state.addUICanvas(alignCanvas(skillScreenCanvas));
  }
  if (!state.uiCanvases.find((c) => c.id === 'battle')) {
    state.addUICanvas(alignCanvas(battleCanvas));
  }

  // Prefab（NPC テンプレート）
  const npcPrefabs = createNpcPrefabs(resolveAssetId);
  for (const prefab of npcPrefabs) {
    if (!state.prefabs.find((p) => p.id === prefab.id)) {
      state.addPrefab(prefab);
    }
  }

  // Script (ordered by category for display)
  const scriptsToAdd = [
    // UI基盤（event）
    messageScript,
    choiceScript,
    inputNumberScript,
    inputTextScript,
    // パーティ
    initPartyScript,
    levelUpScript,
    levelUpAllScript,
    healAllScript,
    partyStatusScript,
    // アイテム
    itemAddScript,
    itemRemoveScript,
    useItemScript,
    // 装備
    equipItemScript,
    unequipItemScript,
    // メニュー画面
    menuOpenScript,
    itemScreenScript,
    equipScreenScript,
    skillScreenScript,
    statusScreenScript,
    // ショップ
    shopOpenScript,
    // バトル
    battleScript,
    battleCommandScript,
    battleSkillScript,
    battleItemScript,
    battleTargetEnemyScript,
    battleTargetAllyScript,
    battleTurnOrderScript,
    battleFleeScript,
    battleEnemyAIScript,
    battleExecuteScript,
    battleResultScript,
    // テスト用
    showStatusScript,
    mapInfoScript,
    objTestScript,
    audioTestScript,
    inputTestScript,
    effectTestScript,
    animTestScript,
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
  state.updateGameSettings({
    startMapId: 'test_map',
    menuScriptId: 'menu_open',
    startScriptId: 'init_party',
  });
}
