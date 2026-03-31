/**
 * テスト用デフォルトデータ
 *
 * 1) メッセージ表示テスト:
 *    - メッセージ UICanvas（テキスト表示 + show/hide ファンクション）
 *    - メッセージスクリプト（イベントスクリプト）
 *    - テスト用マップにプレイヤー + NPC（TalkTrigger → ScriptAction）
 *
 * 2) データ連携テスト:
 *    - デフォルトデータタイプ（character, item, skill）+ サンプルエントリ
 *    - デフォルトクラス（class_status 等）
 *    - クラス型変数（party_leader_stats）、数値変数（gold）、配列変数（inventory）
 *    - ステータス表示 UICanvas（キャラ名 + HP + ゴールド）
 *    - ステータス表示スクリプト（Data/Variable 読み書き → UI反映）
 *    - 商人NPC（アイテム購入: Variable 操作 + Data 参照）
 */

import { useStore } from '@/stores';
import type { EditorUICanvas, EditorUIObject } from '@/stores/uiEditorSlice';
import type { Script } from '@/types/script';
import type { GameMap, MapObject } from '@/types/map';
import type { DataEntry } from '@/types/data';
import type { Variable } from '@/types/variable';
import { createFieldTypeInstance } from '@/types/fields';
import { TransformComponent } from '@/types/components/TransformComponent';
import { ColliderComponent } from '@/types/components/ColliderComponent';
import { ControllerComponent } from '@/types/components/ControllerComponent';
import { TalkTriggerComponent } from '@/types/components/triggers/TalkTriggerComponent';
import { ScriptAction } from '@/engine/actions/ScriptAction';
import { SwitchAction } from '@/engine/actions/SwitchAction';
import { CameraAction } from '@/engine/actions/CameraAction';
import { ObjectAction } from '@/engine/actions/ObjectAction';
import { WaitAction } from '@/engine/actions/WaitAction';
import { VariableOpAction } from '@/engine/actions/VariableOpAction';
import { VariablesComponent } from '@/types/components/VariablesComponent';
import '@/types/ui/register';
import { getUIComponent } from '@/types/ui';
import { SpriteComponent } from '@/types/components/SpriteComponent';
import { defaultDataTypes } from './defaultDataTypes';
import { defaultClasses } from './defaultClasses';
import { importDefaultAssets } from './importDefaultAssets';

const OBJ_LAYER_ID = 'layer_obj';

/** UIComponent をインスタンス化し、プロパティを設定してシリアライズ形式で返す */
function createUIComponentData(type: string, overrides: Record<string, unknown> = {}): { type: string; data: unknown } {
  const Ctor = getUIComponent(type);
  if (!Ctor) return { type, data: overrides };
  const instance = new Ctor();
  // overrides を適用
  for (const [key, value] of Object.entries(overrides)) {
    (instance as unknown as Record<string, unknown>)[key] = value;
  }
  return { type, data: instance.serialize() };
}

// ── UICanvas: メッセージ画面 ──

const MSG_H = 200;
const MSG_SHOW_Y = 0;      // 表示位置: 画面下端にぴったり
const MSG_HIDE_Y = MSG_H;   // 隠す位置: 下に完全に隠れる

const msgBg: EditorUIObject = {
  id: 'msg_bg',
  name: 'background',
  transform: {
    x: 0, y: MSG_HIDE_Y, width: 1280, height: MSG_H,
    anchorX: 'center', anchorY: 'bottom',
    pivotX: 0.5, pivotY: 1,
    rotation: 0, scaleX: 1, scaleY: 1, visible: false,
  },
  components: [
    createUIComponentData('shape', { shapeType: 'rectangle', fillColor: '#1a1a2e', strokeColor: '#4a4a6a', strokeWidth: 2, cornerRadius: 8 }),
    createUIComponentData('animation', {
      mode: 'inline',
      autoPlay: false,
      loop: false,
      animations: [
        {
          name: 'slideIn',
          timeline: {
            tracks: [
              { property: 'transform.y', startTime: 0, duration: 300, from: MSG_HIDE_Y, to: MSG_SHOW_Y, easing: 'easeOut' },
            ],
          },
        },
        {
          name: 'slideOut',
          timeline: {
            tracks: [
              { property: 'transform.y', startTime: 0, duration: 300, from: MSG_SHOW_Y, to: MSG_HIDE_Y, easing: 'easeIn' },
            ],
          },
        },
      ],
    }),
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
    createUIComponentData('image', { imageId: '', opacity: 1 }),
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
    createUIComponentData('text', { content: '', fontSize: 24, color: '#ffffff', align: 'left', verticalAlign: 'top', lineHeight: 1.4 }),
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

// ── Script: メッセージ ──
// close: false → 確認キーで返る（開きっぱなし）
// close: true（デフォルト）→ 確認キー + 閉じて返る

const messageScript: Script = {
  id: 'message',
  name: 'メッセージ',
  callId: 'message',
  type: 'event',
  content: `// テキスト内変数展開（イベントブロックから固定テキストで渡された場合に便利）
// {変数名}            → ゲーム変数 Variable["変数名"]
// {obj:OBJ名:変数名}  → オブジェクト変数（VariablesComponent）
// {obj:self:変数名}    → トリガー元オブジェクトの変数（self_object 経由）
// スクリプトから呼ぶ場合は文字列結合で直接値を埋められるので不要
text = text.replace(/\\{obj:([^:}]+):([^}]+)\\}/g, (_, objName, varName) => {
  // "self" はトリガー元オブジェクト
  const obj = objName === "self" ? self_object : GameObject.find(objName);
  if (!obj) return "";
  const comp = obj.getComponent("variables");
  if (!comp || !comp.variables) return "";
  const entry = comp.variables[varName];
  // 新形式 { fieldType, value } か旧形式（直値）か
  if (entry && typeof entry === "object" && "value" in entry) return String(entry.value ?? "");
  return String(entry ?? "");
}).replace(/\\{([^:}]+)\\}/g, (_, name) => String(Variable[name] ?? ""));

// 顔グラの有無でテキストレイアウトを切り替え
const hasFace = face && face !== "";
const textObj = UI["message"].getObject("textLabel");
const faceObj = UI["message"].getObject("faceImage");
if (textObj) {
  if (hasFace) {
    textObj.x = 200;
    textObj.width = 1060;
  } else {
    textObj.x = 16;
    textObj.width = 1248;
  }
}
if (faceObj) {
  faceObj.visible = !!hasFace;
}

if (!UI["message"].isVisible()) {
  UI["message"].show();
  await UI["message"].call("show", { text: "", face: face || "" });
} else {
  await UI["message"].call("updateText", { text: "", face: face || "" });
}

// タイプライター効果（1文字ずつ表示、確認キーでスキップ）
if (typewriter !== false && textObj) {
  let skipped = false;
  for (let i = 1; i <= text.length; i++) {
    textObj.setProperty("text", "content", text.slice(0, i));
    await scriptAPI.waitFrames(typewriterSpeed || 2);
    if (Input.isJustPressed("confirm")) {
      skipped = true;
      break;
    }
  }
  textObj.setProperty("text", "content", text);
  if (!skipped) {
    await Input.waitKey("confirm");
  }
} else {
  if (textObj) textObj.setProperty("text", "content", text);
  await Input.waitKey("confirm");
}

if (close !== false) {
  await UI["message"].call("hide");
  UI["message"].hide();
}`,
  args: [
    { id: 'text', name: 'テキスト', fieldType: 'string', required: true, defaultValue: '' },
    { id: 'face', name: '顔グラ', fieldType: 'image', required: false, defaultValue: '' },
    { id: 'close', name: '閉じる', fieldType: 'boolean', required: false, defaultValue: true },
    { id: 'typewriter', name: 'タイプライター', fieldType: 'boolean', required: false, defaultValue: true },
    { id: 'typewriterSpeed', name: '文字速度(フレーム)', fieldType: 'number', required: false, defaultValue: 2 },
  ],
  returns: [],
  fields: [],
  isAsync: true,
};

// ── UICanvas: 選択肢画面 ──
// 最大6項目。各項目はテキスト + カーソル（▶）で構成

const CHOICE_MAX = 6;
const CHOICE_ITEM_H = 36;
const CHOICE_PAD = 12;
const CHOICE_W = 300;

function createChoiceObjects(): EditorUIObject[] {
  const objects: EditorUIObject[] = [];

  // 背景 + NavigationComponent（ナビゲーションの親）
  objects.push({
    id: 'choice_bg',
    name: 'background',
    transform: {
      x: 0, y: 0, width: CHOICE_W, height: CHOICE_PAD * 2 + CHOICE_ITEM_H * CHOICE_MAX,
      anchorX: 'center', anchorY: 'center',
      pivotX: 0.5, pivotY: 0.5,
      rotation: 0, scaleX: 1, scaleY: 1, visible: false,
    },
    components: [
      createUIComponentData('shape', { shapeType: 'rectangle', fillColor: '#1a1a2e', strokeColor: '#4a4a6a', strokeWidth: 2, cornerRadius: 8 }),
      createUIComponentData('navigation', { direction: 'vertical', wrap: true, initialIndex: 0 }),
    ],
  });

  // 各項目（テキスト + NavigationItemComponent）
  for (let i = 0; i < CHOICE_MAX; i++) {
    objects.push({
      id: `choice_item_${i}`,
      name: `item${i}`,
      parentId: 'choice_bg',
      transform: {
        x: 32, y: CHOICE_PAD + i * CHOICE_ITEM_H, width: CHOICE_W - 48, height: CHOICE_ITEM_H,
        anchorX: 'left', anchorY: 'top',
        pivotX: 0, pivotY: 0,
        rotation: 0, scaleX: 1, scaleY: 1, visible: false,
      },
      components: [
        createUIComponentData('text', { content: '', fontSize: 20, color: '#ffffff', align: 'left', verticalAlign: 'middle', lineHeight: 1.2 }),
        createUIComponentData('navigationItem', { itemId: String(i) }),
      ],
    });
  }

  // カーソル（▶）+ NavigationCursorComponent
  objects.push({
    id: 'choice_cursor',
    name: 'cursor',
    parentId: 'choice_bg',
    transform: {
      x: 10, y: CHOICE_PAD, width: 20, height: CHOICE_ITEM_H,
      anchorX: 'left', anchorY: 'top',
      pivotX: 0, pivotY: 0,
      rotation: 0, scaleX: 1, scaleY: 1, visible: true,
    },
    components: [
      createUIComponentData('text', { content: '▶', fontSize: 18, color: '#ffdd44', align: 'center', verticalAlign: 'middle', lineHeight: 1.2 }),
      createUIComponentData('navigationCursor', { offsetX: 0, offsetY: 0 }),
    ],
  });

  return objects;
}

const choiceCanvas: EditorUICanvas = {
  id: 'choice',
  name: '選択肢',
  objects: createChoiceObjects(),
  functions: [],
};

// ── Script: 選択肢 ──
// items: string[] → 選択インデックスを返す（キャンセル = -1）

const choiceScript: Script = {
  id: 'choice',
  name: '選択肢',
  callId: 'choice',
  type: 'event',
  content: `const count = Math.min(items.length, ${CHOICE_MAX});
if (count === 0) return -1;

// 背景サイズ調整 + 項目テキスト設定
const bg = UI["choice"].getObject("background");
if (bg) {
  bg.height = ${CHOICE_PAD} * 2 + count * ${CHOICE_ITEM_H};
  bg.visible = true;
}
for (let i = 0; i < ${CHOICE_MAX}; i++) {
  const item = UI["choice"].getObject("item" + i);
  if (!item) continue;
  if (i < count) {
    item.setProperty("text", "content", items[i]);
    item.visible = true;
  } else {
    item.visible = false;
  }
}

// show → コンポーネントスクリプトがコンパイルされる
UI["choice"].show();

// ナビゲーション activate → result で選択待ち
const nav = UI["choice"].getObject("background").getComponent("navigation");
nav.activate();
const selected = await nav.result();

UI["choice"].hide();
// selected は itemId (string "0","1",...) または null (cancel)
return selected === null ? -1 : parseInt(selected, 10);`,
  args: [
    { id: 'items', name: '選択肢', fieldType: 'string', required: true, isArray: true, defaultValue: [] },
  ],
  returns: [{ id: 'selected', name: '選択インデックス', fieldType: 'number', isArray: false }],
  fields: [],
  isAsync: true,
};

// ── UICanvas: 数字入力画面 ──

const NUM_DIGITS = 4;
const DIGIT_W = 36;
const DIGIT_GAP = 4;
const NUM_TOTAL_W = NUM_DIGITS * DIGIT_W + (NUM_DIGITS - 1) * DIGIT_GAP + 32;

function createNumberInputObjects(): EditorUIObject[] {
  const objects: EditorUIObject[] = [];

  // 背景
  objects.push({
    id: 'numinput_bg',
    name: 'background',
    transform: {
      x: 0, y: 0, width: NUM_TOTAL_W, height: 140,
      anchorX: 'center', anchorY: 'center',
      pivotX: 0.5, pivotY: 0.5,
      rotation: 0, scaleX: 1, scaleY: 1, visible: false,
    },
    components: [
      createUIComponentData('shape', { shapeType: 'rectangle', fillColor: '#1a1a2e', strokeColor: '#4a4a6a', strokeWidth: 2, cornerRadius: 8 }),
    ],
  });

  // ラベル
  objects.push({
    id: 'numinput_label',
    name: 'label',
    parentId: 'numinput_bg',
    transform: {
      x: 16, y: 8, width: NUM_TOTAL_W - 32, height: 28,
      anchorX: 'left', anchorY: 'top',
      pivotX: 0, pivotY: 0,
      rotation: 0, scaleX: 1, scaleY: 1, visible: true,
    },
    components: [
      createUIComponentData('text', { content: '', fontSize: 14, color: '#aaaaaa', align: 'center', verticalAlign: 'middle', lineHeight: 1.2 }),
    ],
  });

  // 各桁: ▲ + 数字 + ▼
  for (let i = 0; i < NUM_DIGITS; i++) {
    const dx = 16 + i * (DIGIT_W + DIGIT_GAP);

    // ▲ 矢印
    objects.push({
      id: `numinput_up_${i}`,
      name: `up${i}`,
      parentId: 'numinput_bg',
      transform: {
        x: dx, y: 38, width: DIGIT_W, height: 20,
        anchorX: 'left', anchorY: 'top', pivotX: 0, pivotY: 0,
        rotation: 0, scaleX: 1, scaleY: 1, visible: true,
      },
      components: [
        createUIComponentData('text', { content: '▲', fontSize: 14, color: '#666666', align: 'center', verticalAlign: 'middle', lineHeight: 1 }),
      ],
    });

    // 桁数字
    objects.push({
      id: `numinput_digit_${i}`,
      name: `digit${i}`,
      parentId: 'numinput_bg',
      transform: {
        x: dx, y: 60, width: DIGIT_W, height: 36,
        anchorX: 'left', anchorY: 'top', pivotX: 0, pivotY: 0,
        rotation: 0, scaleX: 1, scaleY: 1, visible: true,
      },
      components: [
        createUIComponentData('text', { content: '0', fontSize: 28, color: '#ffffff', align: 'center', verticalAlign: 'middle', lineHeight: 1 }),
      ],
    });

    // ▼ 矢印
    objects.push({
      id: `numinput_down_${i}`,
      name: `down${i}`,
      parentId: 'numinput_bg',
      transform: {
        x: dx, y: 98, width: DIGIT_W, height: 20,
        anchorX: 'left', anchorY: 'top', pivotX: 0, pivotY: 0,
        rotation: 0, scaleX: 1, scaleY: 1, visible: true,
      },
      components: [
        createUIComponentData('text', { content: '▼', fontSize: 14, color: '#666666', align: 'center', verticalAlign: 'middle', lineHeight: 1 }),
      ],
    });
  }

  return objects;
}

const numberInputCanvas: EditorUICanvas = {
  id: 'number_input',
  name: '数字入力',
  objects: createNumberInputObjects(),
  functions: [],
};

// ── Script: 数字入力 ──
// 上下キーで増減、確認キーで決定

const inputNumberScript: Script = {
  id: 'input_number',
  name: '数字入力',
  callId: 'input_number',
  type: 'event',
  content: `const DIGITS = ${NUM_DIGITS};
const lo = min ?? 0;
const hi = max ?? 9999;
const numDigits = Math.max(1, String(hi).length);

// UI 設定
const bg = UI["number_input"].getObject("background");
const labelObj = UI["number_input"].getObject("label");
if (bg) bg.visible = true;
if (labelObj) labelObj.setProperty("text", "content", prompt || "数値を入力");

// 桁配列を初期化（右詰め）
let digits = [];
let val = Math.max(lo, Math.min(hi, initial || 0));
for (let i = 0; i < DIGITS; i++) {
  const power = Math.pow(10, DIGITS - 1 - i);
  digits[i] = Math.floor(val / power) % 10;
}

let cursor = DIGITS - numDigits; // 最上位桁にカーソル

// 表示更新
const ACTIVE_COLOR = "#ffdd44";
const NORMAL_COLOR = "#ffffff";
const ARROW_ACTIVE = "#ffdd44";
const ARROW_NORMAL = "#666666";

function updateDisplay() {
  for (let i = 0; i < DIGITS; i++) {
    const d = UI["number_input"].getObject("digit" + i);
    const up = UI["number_input"].getObject("up" + i);
    const down = UI["number_input"].getObject("down" + i);
    if (i < DIGITS - numDigits) {
      // 使わない桁は非表示
      if (d) d.visible = false;
      if (up) up.visible = false;
      if (down) down.visible = false;
    } else {
      if (d) {
        d.visible = true;
        d.setProperty("text", "content", String(digits[i]));
        d.setProperty("text", "color", i === cursor ? ACTIVE_COLOR : NORMAL_COLOR);
      }
      if (up) {
        up.visible = true;
        up.setProperty("text", "color", i === cursor ? ARROW_ACTIVE : ARROW_NORMAL);
      }
      if (down) {
        down.visible = true;
        down.setProperty("text", "color", i === cursor ? ARROW_ACTIVE : ARROW_NORMAL);
      }
    }
  }
}

updateDisplay();
UI["number_input"].show();

while (true) {
  await scriptAPI.waitFrames(1);

  if (Input.isJustPressed("left")) {
    cursor = Math.max(DIGITS - numDigits, cursor - 1);
    updateDisplay();
  }
  if (Input.isJustPressed("right")) {
    cursor = Math.min(DIGITS - 1, cursor + 1);
    updateDisplay();
  }
  if (Input.isJustPressed("up")) {
    digits[cursor] = (digits[cursor] + 1) % 10;
    // clamp
    let v = 0;
    for (let i = 0; i < DIGITS; i++) v = v * 10 + digits[i];
    if (v > hi) { digits[cursor] = (digits[cursor] - 1 + 10) % 10; }
    updateDisplay();
  }
  if (Input.isJustPressed("down")) {
    digits[cursor] = (digits[cursor] - 1 + 10) % 10;
    let v = 0;
    for (let i = 0; i < DIGITS; i++) v = v * 10 + digits[i];
    if (v < lo) { digits[cursor] = (digits[cursor] + 1) % 10; }
    updateDisplay();
  }
  if (Input.isJustPressed("confirm")) break;
  if (Input.isJustPressed("cancel")) {
    // 初期値に戻す
    val = Math.max(lo, Math.min(hi, initial || 0));
    for (let i = 0; i < DIGITS; i++) {
      const power = Math.pow(10, DIGITS - 1 - i);
      digits[i] = Math.floor(val / power) % 10;
    }
    break;
  }
}

let result = 0;
for (let i = 0; i < DIGITS; i++) result = result * 10 + digits[i];
UI["number_input"].hide();
return result;`,
  args: [
    { id: 'prompt', name: 'ラベル', fieldType: 'string', required: false, defaultValue: '数値を入力' },
    { id: 'initial', name: '初期値', fieldType: 'number', required: false, defaultValue: 0 },
    { id: 'min', name: '最小値', fieldType: 'number', required: false, defaultValue: 0 },
    { id: 'max', name: '最大値', fieldType: 'number', required: false, defaultValue: 9999 },
  ],
  returns: [{ id: 'value', name: '入力値', fieldType: 'number', isArray: false }],
  fields: [],
  isAsync: true,
};

// ── UICanvas: 文字列入力画面 ──

const textInputBg: EditorUIObject = {
  id: 'textinput_bg',
  name: 'background',
  transform: {
    x: 0, y: 0, width: 400, height: 100,
    anchorX: 'center', anchorY: 'center',
    pivotX: 0.5, pivotY: 0.5,
    rotation: 0, scaleX: 1, scaleY: 1, visible: false,
  },
  components: [
    createUIComponentData('shape', { shapeType: 'rectangle', fillColor: '#1a1a2e', strokeColor: '#4a4a6a', strokeWidth: 2, cornerRadius: 8 }),
  ],
};

const textInputLabel: EditorUIObject = {
  id: 'textinput_label',
  name: 'label',
  parentId: 'textinput_bg',
  transform: {
    x: 16, y: 8, width: 368, height: 28,
    anchorX: 'left', anchorY: 'top',
    pivotX: 0, pivotY: 0,
    rotation: 0, scaleX: 1, scaleY: 1, visible: true,
  },
  components: [
    createUIComponentData('text', { content: '', fontSize: 14, color: '#aaaaaa', align: 'left', verticalAlign: 'middle', lineHeight: 1.2 }),
  ],
};

const textInputValue: EditorUIObject = {
  id: 'textinput_value',
  name: 'inputField',
  parentId: 'textinput_bg',
  transform: {
    x: 16, y: 40, width: 368, height: 44,
    anchorX: 'left', anchorY: 'top',
    pivotX: 0, pivotY: 0,
    rotation: 0, scaleX: 1, scaleY: 1, visible: true,
  },
  components: [
    createUIComponentData('text', { content: '', fontSize: 24, color: '#ffffff', align: 'left', verticalAlign: 'middle', lineHeight: 1.2 }),
    createUIComponentData('inputField', { maxLength: 20, cursorColor: '#ffdd44', placeholder: '' }),
  ],
};

const textInputCanvas: EditorUICanvas = {
  id: 'text_input',
  name: '文字列入力',
  objects: [textInputBg, textInputLabel, textInputValue],
  functions: [],
};

// ── Script: 文字列入力 ──
// Input.getJustPressedKeys() でキーボード直接入力

const inputTextScript: Script = {
  id: 'input_text',
  name: '文字列入力',
  callId: 'input_text',
  type: 'event',
  content: `const bg = UI["text_input"].getObject("background");
const labelObj = UI["text_input"].getObject("label");
if (bg) bg.visible = true;
if (labelObj) labelObj.setProperty("text", "content", prompt || "テキストを入力");

UI["text_input"].show();

// InputFieldComponent の activate/result で入力制御
const field = UI["text_input"].getObject("inputField");
const input = field.getComponent("inputField");
input.activate(initial || "");
const result = await input.result();

UI["text_input"].hide();
return result ?? initial ?? "";`,
  args: [
    { id: 'prompt', name: 'ラベル', fieldType: 'string', required: false, defaultValue: 'テキストを入力' },
    { id: 'initial', name: '初期値', fieldType: 'string', required: false, defaultValue: '' },
  ],
  returns: [{ id: 'text', name: '入力値', fieldType: 'string', isArray: false }],
  fields: [],
  isAsync: true,
};

// ── Map helpers ──

/** アセット名→IDのマッピング（importDefaultAssets 後に構築） */
type AssetNameToId = (name: string) => string;

function createWalkSprite(assetName: string, resolveAssetId: AssetNameToId): SpriteComponent {
  const sprite = new SpriteComponent();
  sprite.imageId = resolveAssetId(assetName);
  sprite.spriteMode = 'directional';
  sprite.frameWidth = 32;
  sprite.frameHeight = 32;
  sprite.animFrameCount = 3;
  sprite.animIntervalMs = 200;
  sprite.animFramePattern = [0, 1, 0, 2]; // RPG歩行チップ標準パターン
  return sprite;
}

function createPlayerObject(x: number, y: number, resolveAssetId: AssetNameToId): MapObject {
  const transform = new TransformComponent();
  transform.x = x;
  transform.y = y;

  const collider = new ColliderComponent();
  collider.width = 1;
  collider.height = 1;
  collider.collideLayers = [OBJ_LAYER_ID];

  const controller = new ControllerComponent();
  controller.moveSpeed = 4;
  controller.inputEnabled = true;

  return {
    id: 'player',
    name: 'プレイヤー',
    components: [transform, collider, createWalkSprite('walk_alice', resolveAssetId), controller],
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

function createNpcObject(id: string, name: string, x: number, y: number, actions: ScriptAction[], resolveAssetId: AssetNameToId): MapObject {
  const transform = new TransformComponent();
  transform.x = x;
  transform.y = y;

  const collider = new ColliderComponent();
  collider.width = 1;
  collider.height = 1;
  collider.collideLayers = [OBJ_LAYER_ID];

  const talk = new TalkTriggerComponent();
  talk.direction = 'any';
  talk.facePlayer = true;
  talk.actions = actions;

  return {
    id,
    name,
    components: [transform, collider, createWalkSprite('walk_ian', resolveAssetId), talk],
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2) データ連携テスト
// ═══════════════════════════════════════════════════════════════════════════════

// ── サンプルデータエントリ ──
// キャラクター: base_stats はクラス型（class_status）→ ネストオブジェクト

const sampleDataEntries: Record<string, DataEntry[]> = {
  character: [
    {
      id: 'alice',
      typeId: 'character',
      values: {
        name: 'アリス',
        description: '勇敢な剣士',
        face_graphic: '',
        walk_graphic: '',
        job: 'warrior',
        initial_level: 1,
        base_stats: { hp: 500, mp: 80, atk: 45, def: 30, matk: 15, mdef: 20, spd: 25, luk: 10 },
        element_resistance: [],
        status_resistance: [],
        initial_equipment: 'iron_sword',
      },
    },
    {
      id: 'bob',
      typeId: 'character',
      values: {
        name: 'ボブ',
        description: '知識豊富な魔法使い',
        face_graphic: '',
        walk_graphic: '',
        job: 'mage',
        initial_level: 1,
        base_stats: { hp: 300, mp: 200, atk: 10, def: 15, matk: 50, mdef: 40, spd: 20, luk: 15 },
        element_resistance: [],
        status_resistance: [],
        initial_equipment: '',
      },
    },
  ],
  item: [
    {
      id: 'potion_hp',
      typeId: 'item',
      values: {
        name: 'HPポーション',
        description: 'HPを50回復する',
        icon: '',
        item_type: 'consumable',
        price: 100,
        effects: [{ effect_type: 'heal', target: 'single_ally', value: 50, duration: 0 }],
        target: 'single_ally',
        equip_slot: 'none',
        status_bonus: {},
        element_bonus: '',
        status_resistance: [],
        usable_scene: 'both',
        use_se: '',
      },
    },
    {
      id: 'iron_sword',
      typeId: 'item',
      values: {
        name: '鉄の剣',
        description: '基本的な剣',
        icon: '',
        item_type: 'weapon',
        price: 300,
        effects: [],
        target: 'single_enemy',
        equip_slot: 'weapon',
        status_bonus: { hp: 0, mp: 0, atk: 15, def: 0, matk: 0, mdef: 0, spd: 0, luk: 0 },
        element_bonus: '',
        status_resistance: [],
        usable_scene: 'none',
        use_se: '',
      },
    },
    {
      id: 'magic_staff',
      typeId: 'item',
      values: {
        name: '魔法の杖',
        description: '魔力を高める杖',
        icon: '',
        item_type: 'weapon',
        price: 500,
        effects: [],
        target: 'single_enemy',
        equip_slot: 'weapon',
        status_bonus: { hp: 0, mp: 30, atk: 5, def: 0, matk: 25, mdef: 10, spd: 0, luk: 0 },
        element_bonus: '',
        status_resistance: [],
        usable_scene: 'none',
        use_se: '',
      },
    },
  ],
  skill: [
    {
      id: 'fire_ball',
      typeId: 'skill',
      values: {
        name: 'ファイアボール',
        description: '炎の魔法',
        icon: '',
        skill_type: 'magical',
        mp_cost: 10,
        target_scope: 'single',
        target_side: 'enemy',
        battle_result: { damage: 80, hit_rate: 95, crit_rate: 5, crit_multiplier: 1.5, formula: 'matk * 2 - mdef' },
        effects: [{ effect_type: 'damage', target: 'single_enemy', value: 80, duration: 0 }],
        element: 'fire',
        status_effects: [],
        se: '',
      },
    },
  ],
  element: [
    { id: 'fire', typeId: 'element', values: { name: '炎', description: '炎属性', icon: '', color: '#ff4444' } },
    { id: 'ice', typeId: 'element', values: { name: '氷', description: '氷属性', icon: '', color: '#4488ff' } },
  ],
  job: [
    {
      id: 'warrior',
      typeId: 'job',
      values: {
        name: '戦士',
        description: '近接戦闘に長けた職業',
        icon: '',
        growth_rates: { hp: 120, mp: 50, atk: 110, def: 100, matk: 40, mdef: 60, spd: 80, luk: 70 },
        learn_skills: [],
        equippable_types: [],
      },
    },
    {
      id: 'mage',
      typeId: 'job',
      values: {
        name: '魔法使い',
        description: '魔法攻撃に長けた職業',
        icon: '',
        growth_rates: { hp: 70, mp: 130, atk: 30, def: 50, matk: 120, mdef: 100, spd: 60, luk: 80 },
        learn_skills: [{ level: 3, skill: 'fire_ball' }],
        equippable_types: [],
      },
    },
  ],
};

// ── 変数 ──

function createTestVariables(): Variable[] {
  const numberType = createFieldTypeInstance('number')!;
  const classType = createFieldTypeInstance('class')!;
  Object.assign(classType, { classId: 'class_status' });
  const stringType = createFieldTypeInstance('string')!;

  return [
    {
      id: 'var_gold',
      name: 'gold',
      fieldType: numberType,
      isArray: false,
      initialValue: 1000,
      description: '所持金',
    },
    {
      id: 'var_leader_stats',
      name: 'leader_stats',
      fieldType: Object.assign(createFieldTypeInstance('class')!, { classId: 'class_status' }),
      isArray: false,
      initialValue: { hp: 500, mp: 80, atk: 45, def: 30, matk: 15, mdef: 20, spd: 25, luk: 10 },
      description: 'パーティリーダーの現在ステータス（クラス型変数テスト）',
    },
    {
      id: 'var_inventory',
      name: 'inventory',
      fieldType: stringType,
      isArray: true,
      initialValue: ['potion_hp', 'iron_sword'],
      description: '所持アイテムIDリスト（配列変数テスト）',
    },
  ];
}

// ── UICanvas: ステータス表示 ──

const statusNameText: EditorUIObject = {
  id: 'status_name',
  name: 'charName',
  parentId: 'status_bg',
  transform: {
    x: 16, y: 12, width: 300, height: 32,
    anchorX: 'left', anchorY: 'top',
    pivotX: 0, pivotY: 0,
    rotation: 0, scaleX: 1, scaleY: 1, visible: true,
  },
  components: [
    createUIComponentData('text', { content: '---', fontSize: 22, color: '#ffffff', align: 'left', verticalAlign: 'top', lineHeight: 1.2 }),
  ],
};

const statusHpText: EditorUIObject = {
  id: 'status_hp',
  name: 'hpLabel',
  parentId: 'status_bg',
  transform: {
    x: 16, y: 48, width: 300, height: 28,
    anchorX: 'left', anchorY: 'top',
    pivotX: 0, pivotY: 0,
    rotation: 0, scaleX: 1, scaleY: 1, visible: true,
  },
  components: [
    createUIComponentData('text', { content: 'HP: ---', fontSize: 18, color: '#88ff88', align: 'left', verticalAlign: 'top', lineHeight: 1.2 }),
  ],
};

const statusGoldText: EditorUIObject = {
  id: 'status_gold',
  name: 'goldLabel',
  parentId: 'status_bg',
  transform: {
    x: 16, y: 80, width: 300, height: 28,
    anchorX: 'left', anchorY: 'top',
    pivotX: 0, pivotY: 0,
    rotation: 0, scaleX: 1, scaleY: 1, visible: true,
  },
  components: [
    createUIComponentData('text', { content: 'Gold: ---', fontSize: 18, color: '#ffdd44', align: 'left', verticalAlign: 'top', lineHeight: 1.2 }),
  ],
};

const statusBg: EditorUIObject = {
  id: 'status_bg',
  name: 'background',
  transform: {
    x: 8, y: 8, width: 340, height: 120,
    anchorX: 'left', anchorY: 'top',
    pivotX: 0, pivotY: 0,
    rotation: 0, scaleX: 1, scaleY: 1, visible: false,
  },
  components: [
    createUIComponentData('shape', { shapeType: 'rectangle', fillColor: '#0a0a1e', strokeColor: '#3a3a5a', strokeWidth: 2, cornerRadius: 6 }),
  ],
};

const statusCanvas: EditorUICanvas = {
  id: 'status_hud',
  name: 'ステータスHUD',
  objects: [statusBg, statusNameText, statusHpText, statusGoldText],
  functions: [
    {
      id: 'fn_status_show',
      name: 'show',
      args: [
        { id: 'charName', name: 'キャラ名', fieldType: 'string', defaultValue: '' },
        { id: 'hp', name: 'HP', fieldType: 'string', defaultValue: '' },
        { id: 'gold', name: 'ゴールド', fieldType: 'string', defaultValue: '' },
      ],
      actions: [
        { type: 'uiSetProperty', data: { targetId: 'status_name', component: 'text', property: 'content', valueSource: { source: 'arg', argId: 'charName' } } },
        { type: 'uiSetProperty', data: { targetId: 'status_hp', component: 'text', property: 'content', valueSource: { source: 'arg', argId: 'hp' } } },
        { type: 'uiSetProperty', data: { targetId: 'status_gold', component: 'text', property: 'content', valueSource: { source: 'arg', argId: 'gold' } } },
        { type: 'uiSetVisibility', data: { targetId: 'status_bg', visible: true } },
      ],
    },
    {
      id: 'fn_status_hide',
      name: 'hide',
      args: [],
      actions: [
        { type: 'uiSetVisibility', data: { targetId: 'status_bg', visible: false } },
      ],
    },
  ],
};

// ── Script: ステータス表示スクリプト ──
// Data（キャラクターのクラス型フィールド base_stats）と Variable（gold, leader_stats）を
// 読み取って UI に表示。データ連携の動作確認用。

const showStatusScript: Script = {
  id: 'show_status',
  name: 'ステータス表示',
  callId: 'show_status',
  type: 'event',
  content: `// Data連携: キャラクターデータからクラス型フィールドを読む
const alice = Data.character["alice"];
const stats = alice.base_stats;  // クラス型（class_status）→ { hp, mp, atk, ... }

// Variable連携: 直接アクセスで読む
const leaderStats = Variable["leader_stats"];  // class_status オブジェクト
const gold = Variable["gold"];                 // 数値

// UI表示（show() で画面を表示してから call() でデータ設定）
UI["status_hud"].show();
await UI["status_hud"].call("show", {
  charName: alice.name + "（" + Data.job[alice.job].name + "）",
  hp: "HP: " + leaderStats.hp + " / " + stats.hp,
  gold: "Gold: " + gold
});
await Input.waitKey("confirm");
await UI["status_hud"].call("hide");
UI["status_hud"].hide();`,
  args: [],
  returns: [],
  fields: [],
  isAsync: true,
};

// ── Script: 商人スクリプト ──
// アイテム購入: Data参照（価格）+ Variable書き込み（gold減算、inventory追加）

const shopScript: Script = {
  id: 'shop_buy',
  name: '商人',
  callId: 'shop_buy',
  type: 'event',
  content: `await Script.message({ text: "いらっしゃい！何がほしい？", face: "", close: false });

// 選択肢テスト
const selected = await Script.choice({ items: ["HPポーション（100G）", "何もいらない"] });

if (selected === 0) {
  const potion = Data.item["potion_hp"];
  const price = potion.price;
  const gold = Variable["gold"];

  if (gold >= price) {
    Variable["gold"] = gold - price;
    Variable["inventory"].push("potion_hp");
    Variable["leader_stats"].hp = Math.min(
      Variable["leader_stats"].hp + potion.effects[0].value,
      500
    );
    await Script.message({ text: potion.name + "を買った！（残り " + Variable["gold"] + " G）", face: "" });
  } else {
    await Script.message({ text: "お金が足りない…（" + gold + " / " + price + " G）", face: "" });
  }
} else {
  await Script.message({ text: "またな。", face: "" });
}`,
  args: [],
  returns: [],
  fields: [],
  isAsync: true,
};

// ── Script: マップ情報スクリプト ──
// MapAPI テスト: 現在のマップ情報を読み取ってメッセージ表示

const mapInfoScript: Script = {
  id: 'map_info',
  name: 'マップ情報',
  callId: 'map_info',
  type: 'event',
  content: `const mapId = Map.getCurrentId();
const w = Map.getWidth();
const h = Map.getHeight();

// タイル情報の取得テスト
const tile = Map.getTile(5, 5);
const tileInfo = tile ? tile : "なし";

await Script.message({ text: "マップ: " + mapId + " (" + w + "x" + h + ")\\nタイル(5,5): " + tileInfo, face: "" });`,
  args: [],
  returns: [],
  fields: [],
  isAsync: true,
};

// ── Script: オブジェクト操作スクリプト ──
// GameObjectAPI テスト: NPC を検索・移動・向き変更・コンポーネント読み取り

const objTestScript: Script = {
  id: 'obj_test',
  name: 'オブジェクト操作テスト',
  callId: 'obj_test',
  type: 'event',
  content: `// GameObjectAPI: 名前で検索
const npc = GameObject.find("NPC");
if (!npc) {
  await Script.message({ text: "NPCが見つかりません", face: "" });
  return;
}

// 位置・向き読み取り
const pos = npc.getPosition();
const facing = npc.getFacing();
await Script.message({ text: "NPC位置: (" + pos.x + "," + pos.y + ") 向き: " + facing, face: "", close: false });

// コンポーネント読み取りテスト
const sprite = npc.getComponent("sprite");
const imgId = sprite ? sprite.imageId : "なし";
await Script.message({ text: "スプライト画像: " + imgId, face: "", close: false });

// NPC の向きを変更
npc.setFacing("left");
await Script.message({ text: "NPCの向きを left に変更しました", face: "", close: false });

// プレイヤー情報（ControllerComponent 持ちを検索）
const player = GameObject.find("プレイヤー");
if (player) {
  const pPos = player.getPosition();
  await Script.message({ text: "プレイヤー位置: (" + pPos.x + "," + pPos.y + ")", face: "" });
} else {
  await Script.message({ text: "プレイヤーが見つかりません", face: "" });
}`,
  args: [],
  returns: [],
  fields: [],
  isAsync: true,
};

// ── Script: オーディオテストスクリプト ──
// AudioAPI テスト: BGM再生/停止 + SE再生

const audioTestScript: Script = {
  id: 'audio_test',
  name: 'オーディオテスト',
  callId: 'audio_test',
  type: 'event',
  content: `// BGM再生（フェードイン 1秒）
Sound.playBGM("bgm_morning", { volume: 0.7, fadeIn: 1000 });
await Script.message({ text: "BGM再生中: bgm_morning（フェードイン1秒）", face: "", close: false });

// SE再生
Sound.playSE("se_confirm");
await Script.message({ text: "SE再生: se_confirm", face: "", close: false });

// BGM停止（フェードアウト 2秒）
Sound.stopBGM(2000);
await Script.message({ text: "BGM停止（フェードアウト2秒）", face: "" });`,
  args: [],
  returns: [],
  fields: [],
  isAsync: true,
};

// ── Script: 入力テストスクリプト ──
// 数字入力 + 文字列入力のテスト

const inputTestScript: Script = {
  id: 'input_test',
  name: '入力テスト',
  callId: 'input_test',
  type: 'event',
  content: `// 数字入力テスト
const amount = await Script.input_number({ prompt: "いくつ寄付する？", initial: 10, min: 0, max: Variable["gold"], step: 10 });
if (amount > 0) {
  Variable["gold"] = Variable["gold"] - amount;
  await Script.message({ text: amount + " G 寄付した！（残り " + Variable["gold"] + " G）", face: "" });
} else {
  await Script.message({ text: "けちだなぁ。", face: "" });
}

// 文字列入力テスト
const name = await Script.input_text({ prompt: "あなたの名前は？", initial: "勇者" });
await Script.message({ text: "よろしく、" + name + "！", face: "" });`,
  args: [],
  returns: [],
  fields: [],
  isAsync: true,
};

// ── UICanvas: エフェクトテスト画面 ──

const effectTestCanvas: EditorUICanvas = {
  id: 'effect_test',
  name: 'エフェクトテスト',
  objects: [
    {
      id: 'effect_display',
      name: 'effectDisplay',
      transform: {
        x: 0, y: 0, width: 120, height: 120,
        anchorX: 'center', anchorY: 'center',
        pivotX: 0.5, pivotY: 0.5,
        rotation: 0, scaleX: 2, scaleY: 2, visible: false,
      },
      components: [
        createUIComponentData('effect', {
          effectId: '', // スクリプトで動的に設定
          frameWidth: 120,
          frameHeight: 120,
          frameCount: 8,
          intervalMs: 80,
          loop: false,
          onComplete: 'hide',
        }),
      ],
    },
  ],
  functions: [],
};

// ── Script: エフェクトテスト ──
// 選択肢でエフェクトを選んで再生

const EFFECT_LIST = [
  { name: '炎', id: 'effect_fire', frames: 8 },
  { name: '氷', id: 'effect_ice', frames: 8 },
  { name: '雷', id: 'effect_thunder', frames: 8 },
  { name: '毒', id: 'effect_poison', frames: 8 },
  { name: '打撃', id: 'effect_hit', frames: 5 },
  { name: '爆弾', id: 'effect_firebomb', frames: 7 },
];

const effectTestScript: Script = {
  id: 'effect_test',
  name: 'エフェクトテスト',
  callId: 'effect_test',
  type: 'event',
  content: `const effects = ${JSON.stringify(EFFECT_LIST)};
const names = effects.map(e => e.name);

const idx = await Script.choice({ items: names });
if (idx < 0) return;

const eff = effects[idx];
const display = UI["effect_test"].getObject("effectDisplay");
if (!display) return;

// エフェクト画像とフレーム数を設定
display.setProperty("effect", "effectId", eff.id);
display.setProperty("effect", "frameCount", eff.frames);
display.visible = true;

// エフェクトキャンバスを表示 → onShow でタイマー開始
UI["effect_test"].show();

// エフェクトの getComponent でリセット+完了待ち
const effectComp = display.getComponent("effect");
if (effectComp && effectComp.reset) effectComp.reset();

// 完了待ち
while (effectComp && !effectComp.isFinished()) {
  await scriptAPI.waitFrames(1);
}

UI["effect_test"].hide();
await Script.message({ text: eff.name + " エフェクトを再生しました！", face: "" });`,
  args: [],
  returns: [],
  fields: [],
  isAsync: true,
};

// ── UICanvas: アニメーションテスト画面 ──
// Tween API + AnimationComponent のテスト

const animTestCanvas: EditorUICanvas = {
  id: 'anim_test',
  name: 'アニメーションテスト',
  objects: [
    // 背景
    {
      id: 'anim_bg',
      name: 'background',
      transform: {
        x: 0, y: 0, width: 400, height: 300,
        anchorX: 'center', anchorY: 'center',
        pivotX: 0.5, pivotY: 0.5,
        rotation: 0, scaleX: 1, scaleY: 1, visible: false,
      },
      components: [
        createUIComponentData('shape', { shapeType: 'rectangle', fillColor: '#0a0a1e', strokeColor: '#4a4a6a', strokeWidth: 2, cornerRadius: 8 }),
      ],
    },
    // テスト用の矩形（アニメーション対象）
    {
      id: 'anim_box',
      name: 'box',
      parentId: 'anim_bg',
      transform: {
        x: 150, y: 100, width: 100, height: 100,
        anchorX: 'left', anchorY: 'top',
        pivotX: 0.5, pivotY: 0.5,
        rotation: 0, scaleX: 1, scaleY: 1, visible: true,
      },
      components: [
        createUIComponentData('shape', { shapeType: 'rectangle', fillColor: '#4488ff', strokeColor: '#ffffff', strokeWidth: 2, cornerRadius: 4 }),
      ],
    },
    // ラベル
    {
      id: 'anim_label',
      name: 'label',
      parentId: 'anim_bg',
      transform: {
        x: 16, y: 8, width: 368, height: 28,
        anchorX: 'left', anchorY: 'top',
        pivotX: 0, pivotY: 0,
        rotation: 0, scaleX: 1, scaleY: 1, visible: true,
      },
      components: [
        createUIComponentData('text', { content: 'アニメーションテスト', fontSize: 16, color: '#aaaaaa', align: 'center', verticalAlign: 'middle', lineHeight: 1.2 }),
      ],
    },
    // AnimationComponent 付きオブジェクト（slideIn テスト用）
    {
      id: 'anim_slide_box',
      name: 'slideBox',
      parentId: 'anim_bg',
      transform: {
        x: 0, y: 250, width: 80, height: 30,
        anchorX: 'left', anchorY: 'top',
        pivotX: 0, pivotY: 0,
        rotation: 0, scaleX: 1, scaleY: 1, visible: true,
      },
      components: [
        createUIComponentData('shape', { shapeType: 'rectangle', fillColor: '#ff4444', cornerRadius: 4 }),
        createUIComponentData('text', { content: 'SLIDE', fontSize: 14, color: '#ffffff', align: 'center', verticalAlign: 'middle', lineHeight: 1 }),
        createUIComponentData('animation', {
          mode: 'inline',
          autoPlay: false,
          loop: false,
          animations: [
            {
              name: 'slideRight',
              timeline: {
                tracks: [
                  { property: 'transform.x', startTime: 0, duration: 600, from: 0, to: 320, easing: 'easeInOut' },
                ],
                loopType: 'none',
              },
            },
            {
              name: 'slideBack',
              timeline: {
                tracks: [
                  { property: 'transform.x', startTime: 0, duration: 600, from: 320, to: 0, easing: 'easeInOut' },
                ],
                loopType: 'none',
              },
            },
          ],
        }),
      ],
    },
  ],
  functions: [],
};

// ── Script: アニメーションテスト ──

const animTestScript: Script = {
  id: 'anim_test',
  name: 'アニメーションテスト',
  callId: 'anim_test',
  type: 'event',
  content: `const ANIMS = [
  "Tween: 移動",
  "Tween: 回転",
  "Tween: スケール",
  "Tween: フェード",
  "Tween: 複数同時",
  "Tween: シーケンス",
  "AnimComp: スライド",
];

const idx = await Script.choice({ items: ANIMS });
if (idx < 0) return;

// 画面表示
const bg = UI["anim_test"].getObject("background");
const box = UI["anim_test"].getObject("box");
const label = UI["anim_test"].getObject("label");
if (bg) bg.visible = true;
UI["anim_test"].show();

// ボックスをリセット
if (box) {
  box.x = 150; box.y = 100; box.width = 100; box.height = 100;
  box.scaleX = 1; box.scaleY = 1; box.rotation = 0;
  box.setProperty("shape", "fillColor", "#4488ff");
}

if (label) label.setProperty("text", "content", ANIMS[idx]);

switch (idx) {
  case 0: // 移動
    await Tween.to(box, "x", 280, 500, "easeOut");
    await Tween.to(box, "x", 20, 500, "easeOut");
    await Tween.to(box, "x", 150, 300, "easeInOut");
    break;
  case 1: // 回転
    await Tween.to(box, "rotation", 360, 800, "easeInOut");
    box.rotation = 0;
    break;
  case 2: // スケール
    await Tween.all(box, { scaleX: 2, scaleY: 2 }, 400, "easeOut");
    await Tween.all(box, { scaleX: 0.5, scaleY: 0.5 }, 400, "easeOut");
    await Tween.all(box, { scaleX: 1, scaleY: 1 }, 300, "easeInOut");
    break;
  case 3: // フェード
    await Tween.toColor(box, "shape.fillColor", "#ff4444", 500);
    await Tween.toColor(box, "shape.fillColor", "#44ff44", 500);
    await Tween.toColor(box, "shape.fillColor", "#4488ff", 500);
    break;
  case 4: // 複数同時
    await Tween.all(box, { x: 280, y: 30, rotation: 180 }, 600, "easeInOut");
    await Tween.all(box, { x: 150, y: 100, rotation: 0 }, 600, "easeInOut");
    break;
  case 5: // シーケンス
    await Tween.sequence([
      () => Tween.to(box, "x", 280, 300, "easeOut"),
      () => Tween.to(box, "y", 30, 300, "easeOut"),
      () => Tween.to(box, "x", 20, 300, "easeOut"),
      () => Tween.to(box, "y", 200, 300, "easeOut"),
      () => Tween.all(box, { x: 150, y: 100 }, 400, "easeInOut"),
    ]);
    break;
  case 6: // AnimationComponent スライド
    const slideBox = UI["anim_test"].getObject("slideBox");
    if (slideBox) {
      const anim = slideBox.getComponent("animation");
      if (anim && anim.play) {
        await anim.play("slideRight");
        await anim.play("slideBack");
      }
    }
    break;
}

UI["anim_test"].hide();
await Script.message({ text: ANIMS[idx] + " 完了！", face: "" });`,
  args: [],
  returns: [],
  fields: [],
  isAsync: true,
};

// ── 占い師NPC: イベントブロック + VariablesComponent テスト ──

function createFortunetellerObject(x: number, y: number, resolveAssetId: AssetNameToId): MapObject {
  const transform = new TransformComponent();
  transform.x = x;
  transform.y = y;

  const collider = new ColliderComponent();
  collider.width = 1;
  collider.height = 1;
  collider.collideLayers = [OBJ_LAYER_ID];

  const sprite = createWalkSprite('walk_marguerite', resolveAssetId);

  // VariablesComponent: オブジェクト変数
  const vars = new VariablesComponent();
  vars.variables = {
    talk_count: { fieldType: 'number', value: 0 },
    job_choice: { fieldType: 'number', value: -1 },
  };

  // イベントブロック構築
  // 1. ScriptAction: choice → 返り値をオブジェクト変数 job_choice に代入
  const choiceAction = new ScriptAction();
  choiceAction.scriptId = 'choice';
  choiceAction.args = { items: ['剣士', '魔法使い', '盗賊'] };
  choiceAction.resultTarget = { type: 'object', objectName: '占い師', variableName: 'job_choice' };

  // 2. VariableOpAction: オブジェクト変数 talk_count を +1
  const incAction = new VariableOpAction();
  incAction.variableId = 'talk_count';
  incAction.operation = 'add';
  incAction.value = { type: 'literal', value: 1 };
  incAction.target = { scope: 'object', objectName: '占い師' };

  // 3. SwitchAction: job_choice の値で分岐
  const switchAction = new SwitchAction();
  switchAction.operand = { type: 'objectVariable', objectName: '占い師', variableName: 'job_choice' };

  // メッセージに変数展開を使用:
  // {obj:self:talk_count} → オブジェクト変数 talk_count の値
  // {gold} → ゲーム変数 gold の値
  const msg0 = new ScriptAction();
  msg0.scriptId = 'message';
  msg0.args = { text: 'あなたは「剣士」を選びましたね。（{obj:self:talk_count}回目, 所持金:{gold}G）', face: '' };

  const msg1 = new ScriptAction();
  msg1.scriptId = 'message';
  msg1.args = { text: 'あなたは「魔法使い」を選びましたね。（{obj:self:talk_count}回目）', face: '' };

  const msg2 = new ScriptAction();
  msg2.scriptId = 'message';
  msg2.args = { text: 'あなたは「盗賊」を選びましたね。（{obj:self:talk_count}回目）', face: '' };

  switchAction.cases = [
    { value: 0, actions: [msg0] },
    { value: 1, actions: [msg1] },
    { value: 2, actions: [msg2] },
  ];

  const cancelMsg = new ScriptAction();
  cancelMsg.scriptId = 'message';
  cancelMsg.args = { text: 'キャンセルしましたね。', face: '' };
  switchAction.defaultActions = [cancelMsg];

  const talk = new TalkTriggerComponent();
  talk.direction = 'any';
  talk.facePlayer = true;
  talk.actions = [choiceAction, incAction, switchAction];

  return {
    id: 'npc_fortune',
    name: '占い師',
    components: [transform, collider, sprite, vars, talk],
  };
}

// ── 操作テストNPC: イベントブロックで Camera/Object/Map アクションをテスト ──

function createActionTestObject(x: number, y: number, resolveAssetId: AssetNameToId): MapObject {
  const transform = new TransformComponent();
  transform.x = x;
  transform.y = y;

  const collider = new ColliderComponent();
  collider.width = 1;
  collider.height = 1;
  collider.collideLayers = [OBJ_LAYER_ID];

  const sprite = createWalkSprite('walk_lex', resolveAssetId);

  // --- イベントブロック構築 ---

  // 1. メッセージ「操作テスト開始！」
  const msgStart = new ScriptAction();
  msgStart.scriptId = 'message';
  msgStart.args = { text: '操作テストを開始します。', face: '', close: false };

  // 2. ObjectAction: self の向きを右に
  const faceRight = new ObjectAction();
  faceRight.operation = 'face';
  faceRight.targetName = 'self';
  faceRight.direction = 'right';

  // 3. メッセージ
  const msgFace = new ScriptAction();
  msgFace.scriptId = 'message';
  msgFace.args = { text: '自分の向きを右に変えました。', face: '', close: false };

  // 4. ObjectAction: self の向きを下に戻す
  const faceDown = new ObjectAction();
  faceDown.operation = 'face';
  faceDown.targetName = 'self';
  faceDown.direction = 'down';

  // 5. ObjectAction: NPC を非表示
  const hideNpc = new ObjectAction();
  hideNpc.operation = 'visible';
  hideNpc.targetName = 'NPC';
  hideNpc.visible = false;

  // 6. メッセージ
  const msgHide = new ScriptAction();
  msgHide.scriptId = 'message';
  msgHide.args = { text: 'NPCを非表示にしました。', face: '', close: false };

  // 7. ObjectAction: NPC を再表示
  const showNpc = new ObjectAction();
  showNpc.operation = 'visible';
  showNpc.targetName = 'NPC';
  showNpc.visible = true;

  // 8. メッセージ
  const msgShow = new ScriptAction();
  msgShow.scriptId = 'message';
  msgShow.args = { text: 'NPCを再表示しました。', face: '', close: false };

  // 9. CameraAction: シェイク
  const shake = new CameraAction();
  shake.operation = 'effect';
  shake.effect = 'shake';
  shake.intensity = 8;
  shake.duration = 30;

  // 10. WaitAction: シェイク待ち
  const wait = new WaitAction();
  wait.frames = 30;

  // 11. メッセージ
  const msgShake = new ScriptAction();
  msgShake.scriptId = 'message';
  msgShake.args = { text: 'カメラシェイクしました。', face: '', close: false };

  // 12. ObjectAction: NPC を移動
  const moveNpc = new ObjectAction();
  moveNpc.operation = 'move';
  moveNpc.targetName = 'NPC';
  moveNpc.x = 9;
  moveNpc.y = 5;

  // 13. メッセージ
  const msgMove = new ScriptAction();
  msgMove.scriptId = 'message';
  msgMove.args = { text: 'NPCを (9,5) に移動しました。', face: '', close: false };

  // 14. ObjectAction: NPC を元の位置に戻す
  const moveNpcBack = new ObjectAction();
  moveNpcBack.operation = 'move';
  moveNpcBack.targetName = 'NPC';
  moveNpcBack.x = 7;
  moveNpcBack.y = 5;

  // 15. 完了メッセージ
  const msgDone = new ScriptAction();
  msgDone.scriptId = 'message';
  msgDone.args = { text: '操作テスト完了！', face: '' };

  const talk = new TalkTriggerComponent();
  talk.direction = 'any';
  talk.facePlayer = true;
  talk.actions = [
    msgStart, faceRight, msgFace, faceDown,
    hideNpc, msgHide, showNpc, msgShow,
    shake, wait, msgShake,
    moveNpc, msgMove, moveNpcBack,
    msgDone,
  ];

  return {
    id: 'npc_action_test',
    name: '操作テスト係',
    components: [transform, collider, sprite, talk],
  };
}

// ── Map: データ連携テスト用NPC追加 ──

function createTestMap(resolveAssetId: AssetNameToId): GameMap {
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
        id: OBJ_LAYER_ID,
        name: 'オブジェクト',
        type: 'object',
        visible: true,
        chipsetIds: [],
        objects: [
          createPlayerObject(5, 5, resolveAssetId),
          // メッセージテスト NPC（close: false で連続表示）
          createNpcObject('npc_01', 'NPC', 7, 5, createScriptActions('message', [
            { text: 'こんにちは！', face: '', close: false },
            { text: 'タイプライターのテストです。', face: '' },
          ]), resolveAssetId),
          // ステータス表示 NPC（Data + Variable → UI 連携テスト）
          createNpcObject('npc_status', 'ステータス確認', 9, 5, createScriptActions('show_status', [{}]), resolveAssetId),
          // 商人 NPC（Data参照 + Variable操作 連携テスト）
          createNpcObject('npc_shop', '商人', 11, 5, createScriptActions('shop_buy', [{}]), resolveAssetId),
          // マップ情報 NPC（MapAPI テスト）
          createNpcObject('npc_map', 'マップ案内人', 13, 5, createScriptActions('map_info', [{}]), resolveAssetId),
          // オブジェクト操作 NPC（GameObjectAPI テスト）
          createNpcObject('npc_obj_test', 'テスト係', 15, 5, createScriptActions('obj_test', [{}]), resolveAssetId),
          // オーディオ NPC（AudioAPI テスト）
          createNpcObject('npc_audio', '楽師', 17, 5, createScriptActions('audio_test', [{}]), resolveAssetId),
          // 入力テスト NPC（数字入力 + 文字列入力）
          createNpcObject('npc_input', '受付嬢', 7, 7, createScriptActions('input_test', [{}]), resolveAssetId),
          // エフェクトテスト NPC
          createNpcObject('npc_effect', '魔法使い', 9, 7, createScriptActions('effect_test', [{}]), resolveAssetId),
          // アニメーションテスト NPC
          createNpcObject('npc_anim', 'アニメーター', 11, 7, createScriptActions('anim_test', [{}]), resolveAssetId),
          // イベントブロック + VariablesComponent テスト NPC
          createFortunetellerObject(13, 7, resolveAssetId),
          // 操作テスト NPC（イベントブロックで Camera/Object アクション）
          createActionTestObject(15, 7, resolveAssetId),
        ],
      },
    ],
  };
}

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

  // サンプルデータエントリ
  for (const [typeId, entries] of Object.entries(sampleDataEntries)) {
    for (const entry of entries) {
      const existing = state.dataEntries[typeId];
      if (!existing?.find((e) => e.id === entry.id)) {
        state.addDataEntry(entry);
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

  // Script
  const scriptsToAdd = [messageScript, choiceScript, inputNumberScript, inputTextScript, showStatusScript, shopScript, mapInfoScript, objTestScript, audioTestScript, inputTestScript, effectTestScript, animTestScript];
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
  state.updateGameSettings({ startMapId: 'test_map' });
}
