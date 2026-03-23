/**
 * テスト用デフォルトデータ
 *
 * メッセージ表示の動作確認に必要な最小セット:
 * - メッセージ UICanvas（テキスト表示 + show/hide ファンクション）
 * - メッセージスクリプト（イベントスクリプト）
 * - テスト用マップにNPC（TalkTrigger → ScriptAction）
 */

import { useStore } from '@/stores';
import type { EditorUICanvas, EditorUIObject } from '@/stores/uiEditorSlice';
import type { Script } from '@/types/script';
// GameMap の型は Component クラスインスタンスを要求するが、
// ランタイムではシリアライズされた形式で扱われるため unknown でキャストする

// ── UICanvas: メッセージ画面 ──

const msgBg: EditorUIObject = {
  id: 'msg_bg',
  name: 'background',
  transform: {
    x: 0, y: 480, width: 1280, height: 240,
    anchorX: 'left', anchorY: 'top',
    pivotX: 0.5, pivotY: 0.5,
    rotation: 0, scaleX: 1, scaleY: 1, visible: true,
  },
  components: [
    { type: 'shape', data: { shapeType: 'rectangle', fillColor: '#1a1a2e', strokeColor: '#4a4a6a', strokeWidth: 2, cornerRadius: 8 } },
  ],
};

const msgText: EditorUIObject = {
  id: 'msg_text',
  name: 'textLabel',
  parentId: 'msg_bg',
  transform: {
    x: 20, y: 20, width: 1240, height: 200,
    anchorX: 'left', anchorY: 'top',
    pivotX: 0, pivotY: 0,
    rotation: 0, scaleX: 1, scaleY: 1, visible: true,
  },
  components: [
    { type: 'text', data: { content: '', fontSize: 24, color: '#ffffff', fontId: '', align: 'left', verticalAlign: 'top', lineHeight: 1.4 } },
  ],
};

const messageCanvas: EditorUICanvas = {
  id: 'message',
  name: 'メッセージ',
  objects: [msgBg, msgText],
  functions: [
    {
      id: 'fn_show',
      name: 'show',
      args: [
        { id: 'text', name: 'テキスト', fieldType: 'string', defaultValue: '' },
      ],
      actions: [
        // テキストを設定
        {
          type: 'uiSetProperty',
          data: {
            targetId: 'msg_text',
            component: 'text',
            property: 'content',
            valueSource: { source: 'arg', argId: 'text' },
          },
        },
        // キャンバス表示（SetVisibility で bg を表示）
        {
          type: 'uiSetVisibility',
          data: { targetId: 'msg_bg', visible: true },
        },
      ],
    },
    {
      id: 'fn_hide',
      name: 'hide',
      args: [],
      actions: [
        {
          type: 'uiSetVisibility',
          data: { targetId: 'msg_bg', visible: false },
        },
      ],
    },
  ],
};

// ── Script: メッセージスクリプト ──

const messageScript: Script = {
  id: 'message',
  name: 'メッセージ',
  callId: 'message',
  type: 'event',
  content: `// メッセージ表示 → キー入力待ち → 次がメッセージでなければ閉じる
UI["message"].show();
await UI["message"].call("show", { text });
await Input.waitKey("confirm");
if (currentEvent.nextAction?.scriptId !== "message") {
  await UI["message"].call("hide");
  UI["message"].hide();
}`,
  args: [
    { id: 'text', name: 'テキスト', fieldType: 'string', required: true, defaultValue: '' },
  ],
  returns: [],
  fields: [],
  isAsync: true,
};

// ── Map: テスト用マップ ──

const testMap = {
  id: 'test_map',
  name: 'テストマップ',
  width: 20,
  height: 15,
  fields: [],
  values: {},
  layers: [
    {
      id: 'layer_tile',
      name: 'タイル',
      type: 'tile',
      visible: true,
      chipsetIds: [],
      tiles: [],
    },
    {
      id: 'layer_obj',
      name: 'オブジェクト',
      type: 'object',
      visible: true,
      chipsetIds: [],
      objects: [
        // プレイヤー
        {
          id: 'player',
          name: 'プレイヤー',
          components: [
            { type: 'transform', data: { x: 5, y: 5, rotation: 0, scaleX: 1, scaleY: 1 } },
            { type: 'collider', data: { width: 1, height: 1, passable: false, layer: 'default' } },
            { type: 'controller', data: { moveSpeed: 4, dashEnabled: false, inputEnabled: true } },
          ],
        },
        // NPC（話しかけるとメッセージ表示）
        {
          id: 'npc_01',
          name: 'NPC',
          components: [
            { type: 'transform', data: { x: 7, y: 5, rotation: 0, scaleX: 1, scaleY: 1 } },
            { type: 'collider', data: { width: 1, height: 1, passable: false, layer: 'default' } },
            {
              type: 'talkTrigger',
              data: {
                direction: 'front',
                facePlayer: true,
                actions: [
                  {
                    type: 'script',
                    data: { scriptId: 'message', args: { text: 'こんにちは！' } },
                  },
                  {
                    type: 'script',
                    data: { scriptId: 'message', args: { text: 'テストメッセージです。' } },
                  },
                ],
              },
            },
          ],
        },
      ],
    },
  ],
};

// ── Store に投入 ──

export function loadDefaultTestData(): void {
  const state = useStore.getState();

  // UICanvas
  if (!state.uiCanvases.find((c) => c.id === 'message')) {
    state.addUICanvas(messageCanvas);
  }

  // Script
  if (!state.scripts.find((s) => s.id === 'message')) {
    state.addScript(messageScript);
  }

  // Map（Component はクラスインスタンスが要求されるが、ランタイムではシリアライズ形式で動作する）
  if (!state.maps.find((m) => m.id === 'test_map')) {
    state.addMap(testMap as unknown as import('@/types/map').GameMap);
  }

  // ゲーム設定: 開始マップを設定
  state.updateGameSettings({ startMapId: 'test_map' });
}
