/**
 * テスト用デフォルトデータ
 *
 * メッセージ表示の動作確認に必要な最小セット:
 * - メッセージ UICanvas（テキスト表示 + show/hide ファンクション）
 * - メッセージスクリプト（イベントスクリプト）
 * - テスト用マップにプレイヤー + NPC（TalkTrigger → ScriptAction）
 */

import { useStore } from '@/stores';
import type { EditorUICanvas, EditorUIObject } from '@/stores/uiEditorSlice';
import type { Script } from '@/types/script';
import type { GameMap, MapObject } from '@/types/map';
import { TransformComponent } from '@/types/components/TransformComponent';
import { ColliderComponent } from '@/types/components/ColliderComponent';
import { ControllerComponent } from '@/types/components/ControllerComponent';
import { TalkTriggerComponent } from '@/types/components/triggers/TalkTriggerComponent';
import { ScriptAction } from '@/engine/actions/ScriptAction';

// ── UICanvas: メッセージ画面 ──

// 解像度 1280x720 基準
const SCREEN_H = 720;
const MSG_H = 200;

const msgBg: EditorUIObject = {
  id: 'msg_bg',
  name: 'background',
  transform: {
    x: 0, y: SCREEN_H, width: 1280, height: MSG_H,
    anchorX: 'center', anchorY: 'bottom',
    pivotX: 0.5, pivotY: 1,
    rotation: 0, scaleX: 1, scaleY: 1, visible: false,
  },
  components: [
    { type: 'shape', data: { shapeType: 'rectangle', fillColor: '#1a1a2e', strokeColor: '#4a4a6a', strokeWidth: 2, cornerRadius: 8 } },
    {
      type: 'animation',
      data: {
        mode: 'inline',
        autoPlay: false,
        loop: false,
        animations: [
          {
            name: 'slideIn',
            timeline: {
              tracks: [
                { property: 'transform.y', startTime: 0, duration: 300, from: SCREEN_H + MSG_H, to: SCREEN_H, easing: 'easeOut' },
              ],
            },
          },
          {
            name: 'slideOut',
            timeline: {
              tracks: [
                { property: 'transform.y', startTime: 0, duration: 300, from: SCREEN_H, to: SCREEN_H + MSG_H, easing: 'easeIn' },
              ],
            },
          },
        ],
      },
    },
  ],
};

const msgFace: EditorUIObject = {
  id: 'msg_face',
  name: 'faceImage',
  parentId: 'msg_bg',
  transform: {
    x: 16, y: 16, width: 168, height: 168,
    anchorX: 'left', anchorY: 'top',
    pivotX: 0, pivotY: 0,
    rotation: 0, scaleX: 1, scaleY: 1, visible: true,
  },
  components: [
    { type: 'image', data: { imageId: '', tint: '', opacity: 1, sliceMode: 'none' } },
  ],
};

const msgText: EditorUIObject = {
  id: 'msg_text',
  name: 'textLabel',
  parentId: 'msg_bg',
  transform: {
    x: 200, y: 16, width: 1060, height: 168,
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
  objects: [msgBg, msgFace, msgText],
  functions: [
    {
      id: 'fn_show',
      name: 'show',
      args: [
        { id: 'text', name: 'テキスト', fieldType: 'string', defaultValue: '' },
        { id: 'face', name: '顔グラ', fieldType: 'image', defaultValue: '' },
      ],
      actions: [
        // テキスト設定
        {
          type: 'uiSetProperty',
          data: {
            targetId: 'msg_text',
            component: 'text',
            property: 'content',
            valueSource: { source: 'arg', argId: 'text' },
          },
        },
        // 顔グラ設定
        {
          type: 'uiSetProperty',
          data: {
            targetId: 'msg_face',
            component: 'image',
            property: 'imageId',
            valueSource: { source: 'arg', argId: 'face' },
          },
        },
        // 表示 + スライドイン
        { type: 'uiSetVisibility', data: { targetId: 'msg_bg', visible: true } },
        { type: 'uiPlayAnimation', data: { targetId: 'msg_bg', animationName: 'slideIn', wait: true } },
      ],
    },
    {
      id: 'fn_update',
      name: 'updateText',
      args: [
        { id: 'text', name: 'テキスト', fieldType: 'string', defaultValue: '' },
        { id: 'face', name: '顔グラ', fieldType: 'image', defaultValue: '' },
      ],
      actions: [
        // テキスト更新
        {
          type: 'uiSetProperty',
          data: {
            targetId: 'msg_text',
            component: 'text',
            property: 'content',
            valueSource: { source: 'arg', argId: 'text' },
          },
        },
        // 顔グラ更新
        {
          type: 'uiSetProperty',
          data: {
            targetId: 'msg_face',
            component: 'image',
            property: 'imageId',
            valueSource: { source: 'arg', argId: 'face' },
          },
        },
      ],
    },
    {
      id: 'fn_hide',
      name: 'hide',
      args: [],
      actions: [
        // スライドアウト + 非表示
        { type: 'uiPlayAnimation', data: { targetId: 'msg_bg', animationName: 'slideOut', wait: true } },
        { type: 'uiSetVisibility', data: { targetId: 'msg_bg', visible: false } },
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
  content: `if (!UI["message"].isVisible()) {
  UI["message"].show();
  await UI["message"].call("show", { text, face });
} else {
  await UI["message"].call("updateText", { text, face });
}
await Input.waitKey("confirm");
if (currentEvent.nextAction?.scriptId !== "message") {
  await UI["message"].call("hide");
  UI["message"].hide();
}`,
  args: [
    { id: 'text', name: 'テキスト', fieldType: 'string', required: true, defaultValue: '' },
    { id: 'face', name: '顔グラ', fieldType: 'image', required: false, defaultValue: '' },
  ],
  returns: [],
  fields: [],
  isAsync: true,
};

// ── Map helpers ──

function createPlayerObject(x: number, y: number): MapObject {
  const transform = new TransformComponent();
  transform.x = x;
  transform.y = y;

  const collider = new ColliderComponent();
  collider.width = 1;
  collider.height = 1;

  const controller = new ControllerComponent();
  controller.moveSpeed = 4;
  controller.inputEnabled = true;

  return {
    id: 'player',
    name: 'プレイヤー',
    components: [transform, collider, controller],
  };
}

function createScriptActions(scriptId: string, argsList: Record<string, unknown>[]): ScriptAction[] {
  return argsList.map((args) => {
    const action = new ScriptAction();
    action.scriptId = scriptId;
    action.args = args;
    return action;
  });
}

function createNpcObject(id: string, name: string, x: number, y: number, actions: ScriptAction[]): MapObject {
  const transform = new TransformComponent();
  transform.x = x;
  transform.y = y;

  const collider = new ColliderComponent();
  collider.width = 1;
  collider.height = 1;

  const talk = new TalkTriggerComponent();
  talk.direction = 'any';
  talk.facePlayer = true;
  talk.actions = actions;

  return {
    id,
    name,
    components: [transform, collider, talk],
  };
}

function createTestMap(): GameMap {
  return {
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
          createPlayerObject(5, 5),
          createNpcObject('npc_01', 'NPC', 7, 5, createScriptActions('message', [
            { text: 'こんにちは！', face: '' },
            { text: 'テストメッセージです。', face: '' },
          ])),
        ],
      },
    ],
  };
}

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

  // Map
  if (!state.maps.find((m) => m.id === 'test_map')) {
    state.addMap(createTestMap());
  }

  // ゲーム設定: 開始マップを設定
  state.updateGameSettings({ startMapId: 'test_map' });
}
