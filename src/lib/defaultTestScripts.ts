import type { Script } from '@/types/script';

// Canvas と共有する定数（スクリプト内テンプレートリテラルで使用）
const CHOICE_MAX = 6;
const NUM_DIGITS = 4;

// ── Script: メッセージ ──
// close: false → 確認キーで返る（開きっぱなし）
// close: true（デフォルト）→ 確認キー + 閉じて返る

export const messageScript: Script = {
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

// タイプライター効果（1文字ずつ表示、確認キーで全文表示）
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
  // スキップ時: 全文表示してから1フレーム待ち（同フレームのconfirmを消化）
  if (skipped) await scriptAPI.waitFrames(1);
  await Input.waitKey("confirm");
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


// ── Script: 選択肢 ──
// items: string[] → 選択インデックスを返す（キャンセル = -1）

export const choiceScript: Script = {
  id: 'choice',
  name: '選択肢',
  callId: 'choice',
  type: 'event',
  content: `const count = Math.min(items.length, ${CHOICE_MAX});
if (count === 0) return -1;

// 項目テキスト設定（レイアウトが y を自動配置、contentFit が高さ調整）
const bg = UI["choice"].getObject("background");
if (bg) bg.visible = true;
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

// show → align + fit が自動実行される
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


// ── Script: 数字入力 ──
// 上下キーで増減、確認キーで決定

export const inputNumberScript: Script = {
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


// ── Script: 文字列入力 ──
// Input.getJustPressedKeys() でキーボード直接入力

export const inputTextScript: Script = {
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


// ── Script: ステータス表示スクリプト ──
// Data（キャラクターのクラス型フィールド base_stats）と Variable（gold, leader_stats）を
// 読み取って UI に表示。データ連携の動作確認用。

export const showStatusScript: Script = {
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

export const shopScript: Script = {
  id: 'shop_buy',
  name: '商人',
  callId: 'shop_buy',
  type: 'event',
  content: `// ショップを開く（商品IDリストはデフォルト）
await Script.shop_open({ shopItems: ["potion_hp", "potion_mp", "antidote", "iron_sword", "magic_staff", "iron_shield", "leather_hat", "leather_armor", "traveler_clothes", "power_ring"] });`,
  args: [],
  returns: [],
  fields: [],
  isAsync: true,
};

export const shopOpenScript: Script = {
  id: 'shop_open',
  name: 'ショップ',
  callId: 'shop_open',
  type: 'event',
  content: `if (!Array.isArray(shopItems) || shopItems.length === 0) return;

function setNavItemIds(win) {
  const children = win.getChildren();
  let i = 0;
  for (const c of children) {
    if (!c.visible) continue;
    const ni = c.getComponentData("navigationItem");
    if (ni) { c.setProperty("navigationItem", "itemId", String(i)); i++; }
  }
}

function updateGold() {
  const gt = UI["shop"].getObject("goldText");
  if (gt) gt.setProperty("text", "content", (Variable["gold"] ?? 0) + " G");
}

UI["shop"].show();
updateGold();

const descText = UI["shop"].getObject("descText");
const listWin = UI["shop"].getObject("listWindow");
const itemTmpl = UI["shop"].getObject("itemTemplate");
const cmdWin = UI["shop"].getObject("cmdWindow");

// コマンドループ
while (true) {
  listWin.visible = false;
  if (descText) descText.setProperty("text", "content", "いらっしゃいませ！");

  const cmdLayout = cmdWin.getComponent("layoutGroup");
  if (cmdLayout) cmdLayout.align();
  const cmdFit = cmdWin.getComponent("contentFit");
  if (cmdFit) cmdFit.fit();

  const cmdNav = cmdWin.getComponent("navigation");
  cmdNav.activate();
  const cmdSel = await cmdNav.result();
  if (cmdSel === null || cmdSel === "2") break; // やめる or cancel

  if (cmdSel === "0") {
    // ── 買う ──
    listWin.visible = true;
    const items = shopItems.map(id => {
      const it = Data.item[id];
      return { id, name: it ? it.name : id, price: it ? it.price + " G" : "?", desc: it ? it.description : "" };
    });
    const rows = items.map(i => ({ name: i.name, price: i.price }));
    if (itemTmpl) {
      const tc = itemTmpl.getComponent("templateController");
      if (tc) await tc.applyList(rows);
    }
    const grid = listWin.getComponent("gridLayout");
    if (grid) grid.align();
    setNavItemIds(listWin);

    // 初期説明
    if (items.length > 0 && descText) descText.setProperty("text", "content", items[0].desc);

    const listNav = listWin.getComponent("navigation");
    listNav.setOnIndexChange((idx) => {
      const it = items[idx];
      if (it && descText) descText.setProperty("text", "content", it.desc);
    });

    // 買い物ループ
    while (true) {
      listNav.activate();
      const sel = await listNav.result();
      if (sel === null) break;

      const idx = parseInt(sel, 10);
      const item = items[idx];
      if (!item) continue;
      const itemData = Data.item[item.id];
      if (!itemData) continue;

      const price = itemData.price || 0;
      const gold = Variable["gold"] ?? 0;
      if (gold < price) {
        await Script.message({ text: "お金が足りません。（" + gold + " / " + price + " G）", face: "" });
        continue;
      }

      Variable["gold"] = gold - price;
      await Script.item_add({ itemId: item.id, count: 1 });
      updateGold();
      await Script.message({ text: itemData.name + "を買った！", face: "" });
    }

  } else if (cmdSel === "1") {
    // ── 売る ──
    while (true) {
      const inv = Variable["inventory"];
      if (!Array.isArray(inv) || inv.filter(e => e.count > 0).length === 0) {
        await Script.message({ text: "売れるものがありません。", face: "" });
        break;
      }
      const sellable = inv.filter(e => e.count > 0);
      const sellRows = sellable.map(e => {
        const it = Data.item[e.itemId];
        const sellPrice = Math.floor((it ? it.price : 0) / 2);
        return { name: (it ? it.name : e.itemId) + " x" + e.count, price: sellPrice + " G" };
      });

      listWin.visible = true;
      if (itemTmpl) {
        const tc = itemTmpl.getComponent("templateController");
        if (tc) await tc.applyList(sellRows);
      }
      const grid = listWin.getComponent("gridLayout");
      if (grid) grid.align();
      setNavItemIds(listWin);

      if (sellable.length > 0 && descText) {
        const firstIt = Data.item[sellable[0].itemId];
        descText.setProperty("text", "content", firstIt ? firstIt.description : "");
      }

      const listNav = listWin.getComponent("navigation");
      listNav.setOnIndexChange((idx) => {
        const e = sellable[idx];
        if (e) {
          const it = Data.item[e.itemId];
          if (it && descText) descText.setProperty("text", "content", it.description);
        }
      });

      listNav.activate();
      const sel = await listNav.result();
      if (sel === null) { listWin.visible = false; break; }

      const idx = parseInt(sel, 10);
      const entry = sellable[idx];
      if (!entry) continue;
      const it = Data.item[entry.itemId];
      const sellPrice = Math.floor((it ? it.price : 0) / 2);

      const removed = await Script.item_remove({ itemId: entry.itemId, count: 1 });
      if (removed) {
        Variable["gold"] = (Variable["gold"] ?? 0) + sellPrice;
        updateGold();
        await Script.message({ text: (it ? it.name : entry.itemId) + "を" + sellPrice + " G で売った！", face: "" });
      }
    }
  }
}

UI["shop"].hide();`,
  args: [
    { id: 'shopItems', name: '商品IDリスト', fieldType: 'string', required: true, isArray: true, defaultValue: [] },
  ],
  returns: [],
  fields: [],
  isAsync: true,
};

// ── Script: マップ情報スクリプト ──
// MapAPI テスト: 現在のマップ情報を読み取ってメッセージ表示

export const mapInfoScript: Script = {
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

export const objTestScript: Script = {
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

export const audioTestScript: Script = {
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

export const inputTestScript: Script = {
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

export const effectTestScript: Script = {
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

// エフェクトキャンバスを表示
UI["effect_test"].show();

// play() で再生完了まで待機
const effectComp = display.getComponent("effect");
if (effectComp) await effectComp.play();

UI["effect_test"].hide();
await Script.message({ text: eff.name + " エフェクトを再生しました！", face: "" });`,
  args: [],
  returns: [],
  fields: [],
  isAsync: true,
};


// ── Script: アニメーションテスト ──

export const animTestScript: Script = {
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


// ── Script: パーティステータス表示 ──

export const partyStatusScript: Script = {
  id: 'party_status',
  name: 'パーティステータス表示',
  callId: 'party_status',
  type: 'event',
  content: `// パーティ配列を取得
const party = Variable["party"];
if (!party || !Array.isArray(party)) {
  await Script.message({ text: "パーティデータがありません。", face: "" });
  return;
}

// ステータスをフォーマット（Data.character から名前を取得）
const formatted = party.map(m => {
  const ch = Data.character[m.characterId];
  const name = ch ? ch.name : "???";
  return {
    name: name + "  Lv." + (m.level ?? 1),
    hp: "HP: " + (m.currentHp ?? 0) + "/" + (m.stats?.hp ?? 0),
    mp: "MP: " + (m.currentMp ?? 0) + "/" + (m.stats?.mp ?? 0),
  };
});

// UI表示
const bg = UI["party_status"].getObject("background");
if (bg) bg.visible = true;
UI["party_status"].show();

// TemplateController でメンバー一覧を生成
const template = UI["party_status"].getObject("memberTemplate");
if (template) {
  const tc = template.getComponent("templateController");
  if (tc) await tc.applyList(formatted);
}

// クローン追加後にレイアウト再配置 + サイズフィット
const layout = bg.getComponent("layoutGroup");
if (layout) layout.align();
const fit = bg.getComponent("contentFit");
if (fit) fit.fit();

// 確認キーで閉じる
await Input.waitKey("confirm");

UI["party_status"].hide();`,
  args: [],
  returns: [],
  fields: [],
  isAsync: true,
};


// ── Script: アイテム操作（内部処理） ──

export const itemAddScript: Script = {
  id: 'item_add',
  name: 'アイテム追加',
  callId: 'item_add',
  type: 'event',
  content: `// インベントリにアイテムを追加（既存なら count+、新規なら追加）
const inv = Variable["inventory"];
if (!Array.isArray(inv)) return;
const existing = inv.find(e => e.itemId === itemId);
if (existing) {
  existing.count += count;
} else {
  inv.push({ itemId, count });
}`,
  args: [
    { id: 'itemId', name: 'アイテムID', fieldType: 'string', required: true, defaultValue: '' },
    { id: 'count', name: '個数', fieldType: 'number', required: false, defaultValue: 1 },
  ],
  returns: [],
  fields: [],
  isAsync: false,
};

export const itemRemoveScript: Script = {
  id: 'item_remove',
  name: 'アイテム消費',
  callId: 'item_remove',
  type: 'event',
  content: `// インベントリからアイテムを減らす（0以下なら削除）
const inv = Variable["inventory"];
if (!Array.isArray(inv)) return false;
const idx = inv.findIndex(e => e.itemId === itemId);
if (idx < 0) return false;
const entry = inv[idx];
if (entry.count < count) return false; // 不足
entry.count -= count;
if (entry.count <= 0) inv.splice(idx, 1);
return true;`,
  args: [
    { id: 'itemId', name: 'アイテムID', fieldType: 'string', required: true, defaultValue: '' },
    { id: 'count', name: '個数', fieldType: 'number', required: false, defaultValue: 1 },
  ],
  returns: [{ id: 'success', name: '成功', fieldType: 'boolean', isArray: false }],
  fields: [],
  isAsync: false,
};

export const useItemScript: Script = {
  id: 'use_item',
  name: 'アイテム使用',
  callId: 'use_item',
  type: 'event',
  content: `// アイテムを使用: 消費 + 効果適用
const item = Data.item[itemId];
if (!item) {
  await Script.message({ text: "アイテムが見つかりません。", face: "" });
  return false;
}

// 使用可能シーンチェック
if (item.usable_scene === "none" || item.usable_scene === "battle") {
  await Script.message({ text: item.name + "は今使えません。", face: "" });
  return false;
}

// 消費アイテムでなければ使えない
if (item.item_type !== "consumable") {
  await Script.message({ text: item.name + "は使用できません。", face: "" });
  return false;
}

// インベントリから消費
const removed = await Script.item_remove({ itemId, count: 1 });
if (!removed) {
  await Script.message({ text: item.name + "を持っていません。", face: "" });
  return false;
}

// 効果適用
const party = Variable["party"];
if (!Array.isArray(party)) return false;

// エフェクトごとに対象を判定して適用
function applyEffect(eff, targetMember, targetCh) {
  if (!targetMember.stats) return;
  const val = eff.value || 0;
  switch (eff.effect_type) {
    case "heal": {
      const maxHp = targetMember.stats?.hp || 9999;
      targetMember.currentHp = Math.min(maxHp, (targetMember.currentHp || 0) + val);
      break;
    }
    case "heal_mp": {
      const maxMp = targetMember.stats?.mp || 9999;
      targetMember.currentMp = Math.min(maxMp, (targetMember.currentMp || 0) + val);
      break;
    }
    case "damage": {
      targetMember.currentHp = Math.max(0, (targetMember.currentHp || 0) - val);
      break;
    }
    case "buff": {
      // バフ: 攻撃力を一時的に上げる（簡易実装）
      targetMember.stats.atk = (targetMember.stats.atk || 0) + val;
      break;
    }
    case "debuff": {
      targetMember.stats.def = Math.max(0, (targetMember.stats.def || 0) - val);
      break;
    }
  }
}

// アイテムの target で対象を決定（エフェクトの target は無視）
const itemTarget = item.target || "single_ally";
const isAll = itemTarget === "all_allies" || itemTarget === "all";

if (isAll) {
  for (const effect of (item.effects || [])) {
    for (let i = 0; i < party.length; i++) {
      applyEffect(effect, party[i], Data.character[party[i].characterId]);
    }
  }
  if (!silent) await Script.message({ text: "全員に" + item.name + "を使った！", face: "" });
} else {
  if (memberIndex < 0 || memberIndex >= party.length) return false;
  const m = party[memberIndex];
  const c = Data.character[m.characterId];
  const mName = c ? c.name : "???";
  for (const effect of (item.effects || [])) {
    applyEffect(effect, m, c);
  }
  if (!silent) await Script.message({ text: mName + "に" + item.name + "を使った！", face: "" });
}
return true;`,
  args: [
    { id: 'itemId', name: 'アイテムID', fieldType: 'string', required: true, defaultValue: '' },
    { id: 'memberIndex', name: 'メンバー番号', fieldType: 'number', required: true, defaultValue: 0 },
    { id: 'silent', name: 'メッセージ非表示', fieldType: 'boolean', required: false, defaultValue: false },
  ],
  returns: [{ id: 'success', name: '成功', fieldType: 'boolean', isArray: false }],
  fields: [],
  isAsync: true,
};

// ── Script: 装備変更（内部処理） ──

export const equipItemScript: Script = {
  id: 'equip_item',
  name: '装備変更',
  callId: 'equip_item',
  type: 'event',
  content: `// 装備変更: 現在の装備を外してインベントリに戻し、新しいアイテムを装備
const party = Variable["party"];
if (!Array.isArray(party) || memberIndex < 0 || memberIndex >= party.length) return false;
const member = party[memberIndex];

// スロット名チェック
const SLOTS = ["weapon", "shield", "head", "body", "accessory"];
if (!SLOTS.includes(slot)) return false;

// 装備するアイテムの検証
if (itemId) {
  const item = Data.item[itemId];
  if (!item) return false;
  // 装備スロットの一致チェック
  if (item.equip_slot !== slot) {
    await Script.message({ text: item.name + "はこの部位には装備できません。", face: "" });
    return false;
  }
  // インベントリから消費
  const removed = await Script.item_remove({ itemId, count: 1 });
  if (!removed) {
    await Script.message({ text: item.name + "を持っていません。", face: "" });
    return false;
  }
}

// 現在の装備を外してインベントリに戻す
const currentEquip = member[slot];
if (currentEquip) {
  await Script.item_add({ itemId: currentEquip, count: 1 });
}

// 新しいアイテムを装備（空文字なら装備解除のみ）
member[slot] = itemId || "";

const ch = Data.character[member.characterId];
const memberName = ch ? ch.name : "???";
if (!silent) {
  if (itemId) {
    const newItem = Data.item[itemId];
    await Script.message({ text: memberName + "は" + (newItem ? newItem.name : itemId) + "を装備した！", face: "" });
  } else {
    await Script.message({ text: memberName + "の" + slot + "を外した。", face: "" });
  }
}
return true;`,
  args: [
    { id: 'memberIndex', name: 'メンバー番号', fieldType: 'number', required: true, defaultValue: 0 },
    { id: 'slot', name: '装備部位', fieldType: 'string', required: true, defaultValue: 'weapon' },
    { id: 'itemId', name: 'アイテムID（空=解除）', fieldType: 'string', required: false, defaultValue: '' },
    { id: 'silent', name: 'メッセージ非表示', fieldType: 'boolean', required: false, defaultValue: false },
  ],
  returns: [{ id: 'success', name: '成功', fieldType: 'boolean', isArray: false }],
  fields: [],
  isAsync: true,
};

export const unequipItemScript: Script = {
  id: 'unequip_item',
  name: '装備解除',
  callId: 'unequip_item',
  type: 'event',
  content: `// 指定スロットの装備を解除してインベントリに戻す
return await Script.equip_item({ memberIndex, slot, itemId: "" });`,
  args: [
    { id: 'memberIndex', name: 'メンバー番号', fieldType: 'number', required: true, defaultValue: 0 },
    { id: 'slot', name: '装備部位', fieldType: 'string', required: true, defaultValue: 'weapon' },
  ],
  returns: [{ id: 'success', name: '成功', fieldType: 'boolean', isArray: false }],
  fields: [],
  isAsync: true,
};

// ── Script: パーティ初期化 ──

export const initPartyScript: Script = {
  id: 'init_party',
  name: 'パーティ初期化',
  callId: 'init_party',
  type: 'event',
  content: `// party_init から party を生成
const inits = Variable["party_init"];
if (!Array.isArray(inits)) return;

const STAT_KEYS = ["hp", "mp", "atk", "def", "matk", "mdef", "spd", "luk"];
const party = [];

for (const init of inits) {
  const ch = Data.character[init.characterId];
  if (!ch) continue;

  const jobId = ch.job || "";
  const job = jobId ? Data.job[jobId] : null;
  const growth = (job && job.growth_rates) || {};
  const level = init.level || 1;

  const stats = {};
  for (const k of STAT_KEYS) {
    const base = ch.base_stats[k] || 0;
    const rate = growth[k] || 0;
    stats[k] = Math.floor(base + rate * (level - 1) / 10);
  }

  // 初期装備
  const initialEquip = ch.initial_equipment || "";

  party.push({
    characterId: init.characterId,
    jobId,
    level,
    currentHp: stats.hp,
    currentMp: stats.mp,
    stats,
    weapon: initialEquip,
    shield: "",
    head: "",
    body: "",
    accessory: "",
  });
}

Variable["party"] = party;`,
  args: [],
  returns: [],
  fields: [],
  isAsync: false,
};

// ── Script: レベルアップ ──

export const levelUpScript: Script = {
  id: 'level_up',
  name: 'レベルアップ',
  callId: 'level_up',
  type: 'event',
  content: `// メンバーをレベルアップし、成長分を加算
const party = Variable["party"];
if (!Array.isArray(party) || memberIndex < 0 || memberIndex >= party.length) return false;
const member = party[memberIndex];
const ch = Data.character[member.characterId];
if (!ch) return false;

const jobId = member.jobId || ch.job;
const job = jobId ? Data.job[jobId] : null;
const growth = (job && job.growth_rates) || {};

member.level = (member.level || 1) + 1;

const STAT_KEYS = ["hp", "mp", "atk", "def", "matk", "mdef", "spd", "luk"];
if (!member.stats) member.stats = {};
for (const k of STAT_KEYS) {
  const rate = growth[k] || 0;
  const gain = Math.floor(rate / 10);
  member.stats[k] = (member.stats[k] || 0) + gain;
}
// 最大HP/MP 増加分を現在値にも加算
const hpGain = Math.floor((growth.hp || 0) / 10);
const mpGain = Math.floor((growth.mp || 0) / 10);
member.currentHp = (member.currentHp || 0) + hpGain;
member.currentMp = (member.currentMp || 0) + mpGain;

const memberName = ch.name || "???";
if (!silent) {
  await Script.message({ text: memberName + " はレベル " + member.level + " になった！", face: "" });
}
return true;`,
  args: [
    { id: 'memberIndex', name: 'メンバー番号', fieldType: 'number', required: true, defaultValue: 0 },
    { id: 'silent', name: 'メッセージ非表示', fieldType: 'boolean', required: false, defaultValue: false },
  ],
  returns: [{ id: 'success', name: '成功', fieldType: 'boolean', isArray: false }],
  fields: [],
  isAsync: true,
};

// ── Script: 全回復 + アイテム付与 ──

export const healAllScript: Script = {
  id: 'heal_all',
  name: '全回復',
  callId: 'heal_all',
  type: 'event',
  content: `const party = Variable["party"];
if (Array.isArray(party)) {
  for (const m of party) {
    if (m.stats) {
      m.currentHp = m.stats.hp;
      m.currentMp = m.stats.mp;
    }
  }
}
await Script.item_add({ itemId: "potion_hp", count: 3 });
await Script.item_add({ itemId: "potion_mp", count: 2 });
await Script.message({ text: "全員のHP・MPを回復し、\\nHPポーション×3、MPポーション×2を受け取った！", face: "" });`,
  args: [],
  returns: [],
  fields: [],
  isAsync: true,
};

// ── Script: パーティ全員レベルアップ ──

export const levelUpAllScript: Script = {
  id: 'level_up_all',
  name: '全員レベルアップ',
  callId: 'level_up_all',
  type: 'event',
  content: `const party = Variable["party"];
if (!Array.isArray(party)) return;
for (let i = 0; i < party.length; i++) {
  await Script.level_up({ memberIndex: i, silent: true });
}
await Script.message({ text: "パーティ全員のレベルが上がった！", face: "" });`,
  args: [],
  returns: [],
  fields: [],
  isAsync: true,
};

// ── Script: メニュー ──

export const menuOpenScript: Script = {
  id: 'menu_open',
  name: 'メニュー',
  callId: 'menu_open',
  type: 'event',
  content: `// パーティデータからメンバー一覧を構築
const party = Variable["party"];
if (!Array.isArray(party) || party.length === 0) return;

const members = party.map(m => {
  const ch = Data.character[m.characterId];
  const name = ch ? ch.name : "???";
  const maxHp = ch ? ch.base_stats.hp : 0;
  const maxMp = ch ? ch.base_stats.mp : 0;
  return {
    name,
    level: "Lv." + (m.level ?? 1),
    hp: "HP " + (m.currentHp ?? 0) + "/" + (m.stats?.hp ?? 0),
    mp: "MP " + (m.currentMp ?? 0) + "/" + (m.stats?.mp ?? 0),
    face: ch ? ch.face_graphic : "",
  };
});

// ゴールド表示
const goldText = UI["menu"].getObject("goldText");
if (goldText) goldText.setProperty("text", "content", (Variable["gold"] ?? 0) + " G");

// メニュー表示
UI["menu"].show();

// パーティメンバー一覧を TemplateController で生成
const template = UI["menu"].getObject("memberTemplate");
if (template) {
  const tc = template.getComponent("templateController");
  if (tc) await tc.applyList(members);
}

// レイアウト + フィット
const partyWin = UI["menu"].getObject("partyWindow");
if (partyWin) {
  const layout = partyWin.getComponent("layoutGroup");
  if (layout) layout.align();
  const fit = partyWin.getComponent("contentFit");
  if (fit) fit.fit();
}

// コマンドウィンドウ layout + fit
const cmdWin = UI["menu"].getObject("commandWindow");
if (cmdWin) {
  const cmdLayout = cmdWin.getComponent("layoutGroup");
  if (cmdLayout) cmdLayout.align();
  const cmdFit = cmdWin.getComponent("contentFit");
  if (cmdFit) cmdFit.fit();
}

// コマンド選択ループ
while (true) {
  // パーティ情報を毎回更新（アイテム使用後のHP変動を反映）
  const updParty = Variable["party"];
  if (Array.isArray(updParty)) {
    const updMembers = updParty.map(m => {
      const uc = Data.character[m.characterId];
      const un = uc ? uc.name : "???";
      const umh = uc ? uc.base_stats.hp : 0;
      const umm = uc ? uc.base_stats.mp : 0;
      return {
        name: un, level: "Lv." + (m.level ?? 1),
        hp: "HP " + (m.currentHp ?? 0) + "/" + (m.stats?.hp ?? 0),
        mp: "MP " + (m.currentMp ?? 0) + "/" + (m.stats?.mp ?? 0),
        face: uc ? uc.face_graphic : "",
      };
    });
    if (template) {
      const utc = template.getComponent("templateController");
      if (utc) await utc.applyList(updMembers);
    }
    if (partyWin) {
      const ul = partyWin.getComponent("layoutGroup");
      if (ul) ul.align();
      const uf = partyWin.getComponent("contentFit");
      if (uf) uf.fit();
    }
  }
  // ゴールド更新
  if (goldText) goldText.setProperty("text", "content", (Variable["gold"] ?? 0) + " G");

  const nav = cmdWin.getComponent("navigation");
  nav.activate();
  const selected = await nav.result();

  // キャンセル = メニューを閉じる
  if (selected === null) break;

  const cmdIndex = parseInt(selected, 10);
  switch (cmdIndex) {
    case 0: // アイテム
      UI["menu"].hide();
      await Script.item_screen();
      UI["menu"].show();
      break;
    case 1: // スキル
      await Script.message({ text: "スキル画面は準備中です。", face: "" });
      break;
    case 2: // 装備
      UI["menu"].hide();
      await Script.equip_screen();
      UI["menu"].show();
      break;
    case 3: // ステータス
      await Script.message({ text: "ステータス画面は準備中です。", face: "" });
      break;
    case 4: // セーブ
      await Script.message({ text: "セーブ機能は準備中です。", face: "" });
      break;
    case 5: // 終了
      break;
  }

  // 終了を選んだ場合もメニューを閉じる
  if (cmdIndex === 5) break;
}

UI["menu"].hide();`,
  args: [],
  returns: [],
  fields: [],
  isAsync: true,
};

// ── Script: アイテム画面 ──

export const itemScreenScript: Script = {
  id: 'item_screen',
  name: 'アイテム画面',
  callId: 'item_screen',
  type: 'event',
  content: `const inv = Variable["inventory"];
if (!Array.isArray(inv) || inv.length === 0) {
  await Script.message({ text: "アイテムを持っていません。", face: "" });
  return;
}

// 所持アイテム一覧を構築（全種類表示）
const allItems = inv.filter(e => e.count > 0);
if (allItems.length === 0) {
  await Script.message({ text: "アイテムを持っていません。", face: "" });
  return;
}

const itemRows = allItems.map(e => {
  const item = Data.item[e.itemId];
  return { name: item ? item.name : e.itemId, count: "x" + e.count };
});

// 画面表示
UI["item_screen"].show();

// TemplateController でアイテム一覧を生成
const tmpl = UI["item_screen"].getObject("itemTemplate");
if (tmpl) {
  const tc = tmpl.getComponent("templateController");
  if (tc) await tc.applyList(itemRows);
}

const listWin = UI["item_screen"].getObject("listWindow");

// NavigationItem の itemId をインデックスに書き換え
if (listWin) {
  const children = listWin.getChildren();
  let idx = 0;
  for (const child of children) {
    if (!child.visible) continue;
    const navItem = child.getComponentData("navigationItem");
    if (navItem) {
      child.setProperty("navigationItem", "itemId", String(idx));
      idx++;
    }
  }
}

// レイアウト
if (listWin) {
  const grid = listWin.getComponent("gridLayout");
  if (grid) grid.align();
}

// 説明テキスト
const descText = UI["item_screen"].getObject("descText");

// 初期説明表示
if (allItems.length > 0) {
  const firstItem = Data.item[allItems[0].itemId];
  if (firstItem && descText) descText.setProperty("text", "content", firstItem.description || "");
}

// カーソル移動時に説明を更新
const nav = listWin.getComponent("navigation");
nav.setOnIndexChange((idx) => {
  const entry = allItems[idx];
  if (!entry) return;
  const it = Data.item[entry.itemId];
  if (it && descText) descText.setProperty("text", "content", it.description || "");
});

// アイテム選択ループ
while (true) {
  nav.activate();
  const selected = await nav.result();

  if (selected === null) break; // キャンセル

  const itemIndex = parseInt(selected, 10);
  const invEntry = allItems[itemIndex];
  if (!invEntry) continue;
  const item = Data.item[invEntry.itemId];
  if (!item) continue;

  // 説明表示
  if (descText) descText.setProperty("text", "content", item.description || "");

  // 消費アイテム以外は選択しても何もしない
  if (item.item_type !== "consumable") continue;

  // 対象選択が必要か判定
  const target = item.target || "single_ally";
  if (target === "single_ally") {
    // キャラ選択ウィンドウ（メニューと同じテンプレート）
    const party = Variable["party"];
    if (!Array.isArray(party) || party.length === 0) continue;

    const charMembers = party.map(m => {
      const ch = Data.character[m.characterId];
      const cname = ch ? ch.name : "???";
      const maxHp = ch ? ch.base_stats.hp : 0;
      const maxMp = ch ? ch.base_stats.mp : 0;
      return {
        name: cname,
        level: "Lv." + (m.level ?? 1),
        hp: "HP " + (m.currentHp ?? 0) + "/" + (m.stats?.hp ?? 0),
        mp: "MP " + (m.currentMp ?? 0) + "/" + (m.stats?.mp ?? 0),
        face: ch ? ch.face_graphic : "",
      };
    });

    // ヘッダー + キャラウィンドウ表示、アイテムリスト非表示
    const charHeader = UI["item_screen"].getObject("charHeader");
    const charWin = UI["item_screen"].getObject("charWindow");
    if (charHeader) charHeader.visible = true;
    charWin.visible = true;
    listWin.visible = false;

    const charTmpl = UI["item_screen"].getObject("charTemplate");
    if (charTmpl) {
      const charTc = charTmpl.getComponent("templateController");
      if (charTc) await charTc.applyList(charMembers);
    }

    const charLayout = charWin.getComponent("layoutGroup");
    if (charLayout) charLayout.align();
    const charFit = charWin.getComponent("contentFit");
    if (charFit) charFit.fit();

    // NavigationItem の itemId をインデックスに書き換え
    {
      const charChildren = charWin.getChildren();
      let ci = 0;
      for (const ch of charChildren) {
        if (!ch.visible) continue;
        const ni = ch.getComponentData("navigationItem");
        if (ni) {
          ch.setProperty("navigationItem", "itemId", String(ci));
          ci++;
        }
      }
    }

    // キャラ選択ループ（使用後も HP 更新して留まる）
    while (true) {
      const charNav = charWin.getComponent("navigation");
      charNav.activate();
      const charSelected = await charNav.result();

      if (charSelected === null) break; // キャンセルでアイテム一覧に戻る

      const memberIndex = parseInt(charSelected, 10);
      const useResult = await Script.use_item({ itemId: invEntry.itemId, memberIndex, silent: true });

      // キャラ一覧を HP 更新して再表示（メッセージの前に）
      const updParty = Variable["party"];
      if (Array.isArray(updParty)) {
        const updCharMembers = updParty.map(m => {
          const uc = Data.character[m.characterId];
          const un = uc ? uc.name : "???";
          const umh = uc ? uc.base_stats.hp : 0;
          const umm = uc ? uc.base_stats.mp : 0;
          return {
            name: un, level: "Lv." + (m.level ?? 1),
            hp: "HP " + (m.currentHp ?? 0) + "/" + (m.stats?.hp ?? 0),
            mp: "MP " + (m.currentMp ?? 0) + "/" + (m.stats?.mp ?? 0),
            face: uc ? uc.face_graphic : "",
          };
        });
        if (charTmpl) {
          const uctc = charTmpl.getComponent("templateController");
          if (uctc) await uctc.applyList(updCharMembers);
        }
        if (charLayout) charLayout.align();
        if (charFit) charFit.fit();
        // navigationItem の itemId 再設定
        const uch = charWin.getChildren();
        let uci = 0;
        for (const c of uch) {
          if (!c.visible) continue;
          const ni = c.getComponentData("navigationItem");
          if (ni) { c.setProperty("navigationItem", "itemId", String(uci)); uci++; }
        }
      }

      // HP 更新後にメッセージ表示
      if (useResult) {
        const usedItem = Data.item[invEntry.itemId];
        const usedParty = Variable["party"];
        const usedMember = usedParty[memberIndex];
        const usedCh = Data.character[usedMember?.characterId];
        const usedName = usedCh ? usedCh.name : "???";
        await Script.message({ text: usedName + "に" + (usedItem ? usedItem.name : "アイテム") + "を使った！", face: "" });
      }

      // アイテム残数チェック
      const curEntry = Variable["inventory"].find(e => e.itemId === invEntry.itemId);
      if (!curEntry || curEntry.count <= 0) break;
    }

    // 元に戻す
    if (charHeader) charHeader.visible = false;
    charWin.visible = false;
    listWin.visible = true;

    // インベントリ更新後にアイテム一覧を再構築
    const updatedInv = Variable["inventory"];
    const updatedAll = updatedInv.filter(e => e.count > 0);
    const updatedRows = updatedAll.map(e => {
      const it = Data.item[e.itemId];
      return { name: it ? it.name : e.itemId, count: "x" + e.count };
    });
    if (tmpl) {
      const tc = tmpl.getComponent("templateController");
      if (tc) await tc.applyList(updatedRows);
    }
    if (listWin) {
      const lo = listWin.getComponent("gridLayout");
      if (lo) lo.align();
    }
    // allItems も更新
    allItems.length = 0;
    allItems.push(...updatedAll);

    if (updatedAll.length === 0) break;
  } else {
    // 全体対象などはそのまま使用
    await Script.use_item({ itemId: invEntry.itemId, memberIndex: 0 });
  }
}

UI["item_screen"].hide();`,
  args: [],
  returns: [],
  fields: [],
  isAsync: true,
};

// ── Script: 装備画面 ──

export const equipScreenScript: Script = {
  id: 'equip_screen',
  name: '装備画面',
  callId: 'equip_screen',
  type: 'event',
  content: `const party = Variable["party"];
if (!Array.isArray(party) || party.length === 0) return;

const SLOTS = [
  { key: "weapon", label: "武器" },
  { key: "shield", label: "盾" },
  { key: "head", label: "頭" },
  { key: "body", label: "体" },
  { key: "accessory", label: "アク" },
];

function buildCharMembers() {
  return party.map(m => {
    const ch = Data.character[m.characterId];
    const n = ch ? ch.name : "???";
    const mh = ch ? ch.base_stats.hp : 0;
    const mm = ch ? ch.base_stats.mp : 0;
    return { name: n, level: "Lv." + (m.level ?? 1), hp: "HP " + (m.stats?.hp ?? 0) + "/" + mh, mp: "MP " + (m.stats?.mp ?? 0) + "/" + mm, face: ch ? ch.face_graphic : "" };
  });
}

function setNavItemIds(win) {
  const children = win.getChildren();
  let i = 0;
  for (const c of children) {
    if (!c.visible) continue;
    const ni = c.getComponentData("navigationItem");
    if (ni) { c.setProperty("navigationItem", "itemId", String(i)); i++; }
  }
}

UI["equip_screen"].show();

const headerText = UI["equip_screen"].getObject("headerText");
const charWin = UI["equip_screen"].getObject("charWindow");
const slotWin = UI["equip_screen"].getObject("slotWindow");
const listWin = UI["equip_screen"].getObject("listWindow");
const charTmpl = UI["equip_screen"].getObject("charTemplate");
const slotTmpl = UI["equip_screen"].getObject("slotTemplate");
const itemTmpl = UI["equip_screen"].getObject("itemTemplate");

// キャラ選択ループ
while (true) {
  headerText.setProperty("text", "content", "キャラクターを選んでください");
  charWin.visible = true;
  slotWin.visible = false;
  listWin.visible = false;

  const charMembers = buildCharMembers();
  if (charTmpl) {
    const tc = charTmpl.getComponent("templateController");
    if (tc) await tc.applyList(charMembers);
  }
  const charLayout = charWin.getComponent("layoutGroup");
  if (charLayout) charLayout.align();
  const charFit = charWin.getComponent("contentFit");
  if (charFit) charFit.fit();
  setNavItemIds(charWin);

  const charNav = charWin.getComponent("navigation");
  charNav.activate();
  const charSel = await charNav.result();
  if (charSel === null) break;

  const memberIdx = parseInt(charSel, 10);
  const member = party[memberIdx];
  if (!member) continue;
  const ch = Data.character[member.characterId];
  const memberName = ch ? ch.name : "???";

  // スロット選択ループ
  charWin.visible = false;
  slotWin.visible = true;

  const statWin = UI["equip_screen"].getObject("statWindow");
  const statText = UI["equip_screen"].getObject("statText");
  const STAT_KEYS = ["atk", "def", "matk", "mdef", "spd", "luk"];
  const STAT_LABELS = { atk: "ATK", def: "DEF", matk: "MATK", mdef: "MDEF", spd: "SPD", luk: "LUK" };

  function formatStatLine(label, current, after) {
    const l = label.padEnd(5, " ");
    if (after === undefined || after === current) {
      return l + current;
    }
    const diff = after - current;
    const sign = diff > 0 ? "+" : "";
    return l + current + "  >>  " + after + "  (" + sign + diff + ")";
  }

  function getTotalEquipBonus() {
    const total = {};
    for (const s of SLOTS) {
      const eId = member[s.key] || "";
      if (!eId) continue;
      const it = Data.item[eId];
      if (!it || !it.status_bonus) continue;
      for (const k of STAT_KEYS) {
        total[k] = (total[k] || 0) + (it.status_bonus[k] || 0);
      }
    }
    return total;
  }

  function showStats(bonusDiff) {
    // bonusDiff: null = 現在ステータス（装備ボーナス込み）, object = 追加差分表示
    const equipBonus = getTotalEquipBonus();
    const lines = [];
    for (const k of STAT_KEYS) {
      const base = (member.stats && member.stats[k]) || 0;
      const current = base + (equipBonus[k] || 0);
      if (bonusDiff) {
        const diff = bonusDiff[k] || 0;
        lines.push(formatStatLine(STAT_LABELS[k], current, current + diff));
      } else {
        lines.push(formatStatLine(STAT_LABELS[k], current));
      }
    }
    if (statText) statText.setProperty("text", "content", lines.join("\\n"));
  }

  while (true) {
    headerText.setProperty("text", "content", memberName + " の装備");
    listWin.visible = false;
    if (statWin) statWin.visible = true;
    showStats(null);

    const slotRows = SLOTS.map(s => {
      const equipId = member[s.key] || "";
      const equipItem = equipId ? Data.item[equipId] : null;
      return { slotLabel: s.label, equipName: equipItem ? equipItem.name : "---" };
    });
    if (slotTmpl) {
      const tc = slotTmpl.getComponent("templateController");
      if (tc) await tc.applyList(slotRows);
    }
    const slotLayout = slotWin.getComponent("layoutGroup");
    if (slotLayout) slotLayout.align();
    setNavItemIds(slotWin);

    const slotNav = slotWin.getComponent("navigation");
    slotNav.activate();
    const slotSel = await slotNav.result();
    if (slotSel === null) {
      if (statWin) statWin.visible = false;
      break;
    }

    const slotIdx = parseInt(slotSel, 10);
    const slot = SLOTS[slotIdx];
    if (!slot) continue;

    // 装備候補一覧
    headerText.setProperty("text", "content", memberName + " の" + slot.label + "を選んでください");
    listWin.visible = true;

    const inv = Variable["inventory"];
    const candidates = [{ id: "", name: "--- 外す ---" }];
    if (Array.isArray(inv)) {
      for (const entry of inv) {
        if (entry.count <= 0) continue;
        const it = Data.item[entry.itemId];
        if (it && it.equip_slot === slot.key) {
          candidates.push({ id: entry.itemId, name: it.name });
        }
      }
    }

    const candidateRows = candidates.map(c => ({ name: c.name }));
    if (itemTmpl) {
      const tc = itemTmpl.getComponent("templateController");
      if (tc) await tc.applyList(candidateRows);
    }
    const listLayout = listWin.getComponent("layoutGroup");
    if (listLayout) listLayout.align();
    setNavItemIds(listWin);

    // ステータス比較表示に切り替え
    function getBonus(itemId) {
      if (!itemId) return {};
      const it = Data.item[itemId];
      return (it && it.status_bonus) || {};
    }
    const currentEquipId = member[slot.key] || "";
    const currentBonus = getBonus(currentEquipId);

    function updateStatPreview(candId) {
      const newBonus = getBonus(candId);
      const diff = {};
      for (const k of STAT_KEYS) {
        const curB = currentBonus[k] || 0;
        const newB = newBonus[k] || 0;
        diff[k] = newB - curB;
      }
      showStats(diff);
    }

    // 初期表示
    updateStatPreview(candidates[0]?.id || "");

    const listNav = listWin.getComponent("navigation");
    listNav.setOnIndexChange((idx) => {
      const c = candidates[idx];
      if (c) updateStatPreview(c.id);
    });
    listNav.activate();
    const itemSel = await listNav.result();

    if (itemSel === null) continue;

    const candIdx = parseInt(itemSel, 10);
    const cand = candidates[candIdx];
    if (!cand) continue;

    const equipResult = await Script.equip_item({ memberIndex: memberIdx, slot: slot.key, itemId: cand.id, silent: true });

    // スロット一覧をメッセージ前に更新
    if (equipResult) {
      const updSlotRows = SLOTS.map(s => {
        const eId = member[s.key] || "";
        const eIt = eId ? Data.item[eId] : null;
        return { slotLabel: s.label, equipName: eIt ? eIt.name : "---" };
      });
      if (slotTmpl) {
        const stc = slotTmpl.getComponent("templateController");
        if (stc) await stc.applyList(updSlotRows);
      }
      if (slotLayout) slotLayout.align();
      setNavItemIds(slotWin);
      showStats(null);
    }

    // メッセージ表示
    if (equipResult) {
      if (cand.id) {
        const eqItem = Data.item[cand.id];
        await Script.message({ text: memberName + "は" + (eqItem ? eqItem.name : cand.id) + "を装備した！", face: "" });
      } else {
        await Script.message({ text: memberName + "の" + slot.label + "を外した。", face: "" });
      }
    }
  }
}

UI["equip_screen"].hide();`,
  args: [],
  returns: [],
  fields: [],
  isAsync: true,
};
