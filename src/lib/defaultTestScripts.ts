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
    hp: "HP: " + (m.stats?.hp ?? 0),
    mp: "MP: " + (m.stats?.mp ?? 0),
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
if (!Array.isArray(party) || memberIndex < 0 || memberIndex >= party.length) {
  return false;
}
const member = party[memberIndex];
const ch = Data.character[member.characterId];
const memberName = ch ? ch.name : "???";

for (const effect of (item.effects || [])) {
  if (effect.effect_type === "heal" && member.stats) {
    const maxHp = ch ? ch.base_stats.hp : 9999;
    member.stats.hp = Math.min(maxHp, (member.stats.hp || 0) + (effect.value || 0));
  }
}

await Script.message({ text: memberName + "に" + item.name + "を使った！", face: "" });
return true;`,
  args: [
    { id: 'itemId', name: 'アイテムID', fieldType: 'string', required: true, defaultValue: '' },
    { id: 'memberIndex', name: 'メンバー番号', fieldType: 'number', required: true, defaultValue: 0 },
  ],
  returns: [{ id: 'success', name: '成功', fieldType: 'boolean', isArray: false }],
  fields: [],
  isAsync: true,
};


