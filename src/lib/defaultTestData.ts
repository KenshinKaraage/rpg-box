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
  content: `// 変数埋め込み: \\v{name} → Variable["name"] の値に置換
const resolved = text.replace(/\\\\v\\{(\\w+)\\}/g, (_, name) => String(Variable[name] ?? ""));

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
  for (let i = 1; i <= resolved.length; i++) {
    textObj.setProperty("text", "content", resolved.slice(0, i));
    await scriptAPI.waitFrames(typewriterSpeed || 2);
    if (Input.isJustPressed("confirm")) {
      skipped = true;
      break;
    }
  }
  textObj.setProperty("text", "content", resolved);
  if (!skipped) {
    await Input.waitKey("confirm");
  }
} else {
  if (textObj) textObj.setProperty("text", "content", resolved);
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
  content: `// Data連携: アイテムデータ参照（クラスリスト型 effects 含む）
const potion = Data.item["potion_hp"];
const price = potion.price;  // 100
const gold = Variable["gold"];

if (gold >= price) {
  // Variable操作: 数値の直接代入
  Variable["gold"] = gold - price;

  // Variable操作: 配列変数に追加
  Variable["inventory"].push("potion_hp");

  // Variable操作: クラス型変数のフィールド更新
  Variable["leader_stats"].hp = Math.min(
    Variable["leader_stats"].hp + potion.effects[0].value,  // クラスリスト→ネストアクセス
    500
  );

  // メッセージスクリプトを再利用して結果表示
  await Script.message({ text: potion.name + "を買った！（残り " + Variable["gold"] + " G）", face: "" });
} else {
  // 連続メッセージテスト: close: false で開きっぱなし、最後だけ閉じる
  await Script.message({ text: "あ？金を持ってない？（" + gold + " / " + price + " G）", face: "", close: false });
  await Script.message({ text: "視界から失せろ。この貧乏人が", face: "" });
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
            { text: 'こんにちは！所持金は \\v{gold} G だよ。', face: '', close: false },
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

  // Script
  const scriptsToAdd = [messageScript, showStatusScript, shopScript, mapInfoScript, objTestScript, audioTestScript];
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
