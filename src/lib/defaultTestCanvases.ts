import '@/types/ui/register';
import { getUIComponent } from '@/types/ui';
import type { EditorUICanvas, EditorUIObject } from '@/stores/uiEditorSlice';

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
    x: 32, y: 32, width: 128, height: 128,
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

export const messageCanvas: EditorUICanvas = {
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


// ── UICanvas: 選択肢画面 ──
// 最大6項目。各項目はテキスト + カーソル（▶）で構成

const CHOICE_MAX = 6;
const CHOICE_ITEM_H = 36;
const CHOICE_PAD = 12;
const CHOICE_W = 300;

function createChoiceObjects(): EditorUIObject[] {
  const objects: EditorUIObject[] = [];

  // 背景 + NavigationComponent + LayoutGroup（縦並び自動配置）
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
      createUIComponentData('layoutGroup', { direction: 'vertical', spacing: 0, alignment: 'start', paddingTop: CHOICE_PAD, paddingBottom: CHOICE_PAD, paddingLeft: 32, paddingRight: 0 }),
      createUIComponentData('contentFit', { fitWidth: false, fitHeight: true, paddingTop: 0, paddingBottom: 0 }),
    ],
  });

  // 各項目（テキスト + NavigationItemComponent）— layoutGroup が y を自動配置
  for (let i = 0; i < CHOICE_MAX; i++) {
    objects.push({
      id: `choice_item_${i}`,
      name: `item${i}`,
      parentId: 'choice_bg',
      transform: {
        x: 0, y: 0, width: CHOICE_W - 48, height: CHOICE_ITEM_H,
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

  // カーソル（▶）+ NavigationCursorComponent — レイアウト除外
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
      createUIComponentData('navigationCursor', { offsetX: -20, offsetY: 0 }),
      createUIComponentData('layoutElement', { participate: false }),
    ],
  });

  return objects;
}

export const choiceCanvas: EditorUICanvas = {
  id: 'choice',
  name: '選択肢',
  objects: createChoiceObjects(),
  functions: [],
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

export const numberInputCanvas: EditorUICanvas = {
  id: 'number_input',
  name: '数字入力',
  objects: createNumberInputObjects(),
  functions: [],
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

export const textInputCanvas: EditorUICanvas = {
  id: 'text_input',
  name: '文字列入力',
  objects: [textInputBg, textInputLabel, textInputValue],
  functions: [],
};


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

export const statusCanvas: EditorUICanvas = {
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


// ── UICanvas: エフェクトテスト画面 ──

export const effectTestCanvas: EditorUICanvas = {
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


// ── UICanvas: アニメーションテスト画面 ──
// Tween API + AnimationComponent のテスト

export const animTestCanvas: EditorUICanvas = {
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


// ── UICanvas: パーティステータス（TemplateController + LayoutGroup テスト） ──

const PARTY_MEMBER_H = 48;

function createPartyStatusObjects(): EditorUIObject[] {
  const objects: EditorUIObject[] = [];

  // 背景 + LayoutGroup (vertical)
  objects.push({
    id: 'party_bg',
    name: 'background',
    transform: {
      x: 0, y: 0, width: 320, height: 280,
      anchorX: 'center', anchorY: 'center',
      pivotX: 0.5, pivotY: 0.5,
      rotation: 0, scaleX: 1, scaleY: 1, visible: false,
    },
    components: [
      createUIComponentData('shape', { shapeType: 'rectangle', fillColor: '#1a1a2e', strokeColor: '#4a4a6a', strokeWidth: 2, cornerRadius: 8 }),
      createUIComponentData('layoutGroup', { direction: 'vertical', spacing: 4, alignment: 'start', paddingTop: 12, paddingBottom: 12, paddingLeft: 16, paddingRight: 16 }),
      createUIComponentData('contentFit', { fitWidth: false, fitHeight: true, paddingTop: 0, paddingBottom: 0 }),
    ],
  });

  // タイトル
  objects.push({
    id: 'party_title',
    name: 'title',
    parentId: 'party_bg',
    transform: {
      x: 0, y: 0, width: 288, height: 28,
      anchorX: 'left', anchorY: 'top',
      pivotX: 0, pivotY: 0,
      rotation: 0, scaleX: 1, scaleY: 1, visible: true,
    },
    components: [
      createUIComponentData('text', { content: 'パーティ', fontSize: 18, color: '#ffdd44', align: 'left', verticalAlign: 'middle', lineHeight: 1.2 }),
      createUIComponentData('layoutElement', { participate: true, space: 4 }),
    ],
  });

  // メンバーテンプレート（非表示、TemplateController がクローンする）
  objects.push({
    id: 'party_member_template',
    name: 'memberTemplate',
    parentId: 'party_bg',
    transform: {
      x: 0, y: 0, width: 288, height: PARTY_MEMBER_H,
      anchorX: 'left', anchorY: 'top',
      pivotX: 0, pivotY: 0,
      rotation: 0, scaleX: 1, scaleY: 1, visible: false,
    },
    components: [
      createUIComponentData('shape', { shapeType: 'rectangle', fillColor: '#2a2a4e', cornerRadius: 4 }),
      createUIComponentData('templateController', {
        args: [
          { id: 'name', name: '名前', fieldType: 'string', defaultValue: '' },
          { id: 'hp', name: 'HP', fieldType: 'string', defaultValue: '' },
          { id: 'mp', name: 'MP', fieldType: 'string', defaultValue: '' },
        ],
        onSpawnActions: [],
        onApplyActions: [
          { type: 'uiSetProperty', data: { targetId: 'party_member_name', component: 'text', property: 'content', valueSource: { source: 'arg', argId: 'name' } } },
          { type: 'uiSetProperty', data: { targetId: 'party_member_hp', component: 'text', property: 'content', valueSource: { source: 'arg', argId: 'hp' } } },
          { type: 'uiSetProperty', data: { targetId: 'party_member_mp', component: 'text', property: 'content', valueSource: { source: 'arg', argId: 'mp' } } },
        ],
      }),
    ],
  });

  // テンプレートの子: 名前テキスト
  objects.push({
    id: 'party_member_name',
    name: 'name',
    parentId: 'party_member_template',
    transform: {
      x: 8, y: 4, width: 120, height: 20,
      anchorX: 'left', anchorY: 'top',
      pivotX: 0, pivotY: 0,
      rotation: 0, scaleX: 1, scaleY: 1, visible: true,
    },
    components: [
      createUIComponentData('text', { content: '---', fontSize: 16, color: '#ffffff', align: 'left', verticalAlign: 'middle', lineHeight: 1.2 }),
    ],
  });

  // テンプレートの子: HP テキスト
  objects.push({
    id: 'party_member_hp',
    name: 'hp',
    parentId: 'party_member_template',
    transform: {
      x: 8, y: 24, width: 120, height: 18,
      anchorX: 'left', anchorY: 'top',
      pivotX: 0, pivotY: 0,
      rotation: 0, scaleX: 1, scaleY: 1, visible: true,
    },
    components: [
      createUIComponentData('text', { content: 'HP: ---', fontSize: 14, color: '#88ff88', align: 'left', verticalAlign: 'middle', lineHeight: 1.2 }),
    ],
  });

  // テンプレートの子: MP テキスト
  objects.push({
    id: 'party_member_mp',
    name: 'mp',
    parentId: 'party_member_template',
    transform: {
      x: 140, y: 24, width: 120, height: 18,
      anchorX: 'left', anchorY: 'top',
      pivotX: 0, pivotY: 0,
      rotation: 0, scaleX: 1, scaleY: 1, visible: true,
    },
    components: [
      createUIComponentData('text', { content: 'MP: ---', fontSize: 14, color: '#88bbff', align: 'left', verticalAlign: 'middle', lineHeight: 1.2 }),
    ],
  });

  return objects;
}

export const partyStatusCanvas: EditorUICanvas = {
  id: 'party_status',
  name: 'パーティステータス',
  objects: createPartyStatusObjects(),
  functions: [],
};

// ── UICanvas: メニュー画面（RPGツクール風） ──

const MENU_W = 1280;
const MENU_H = 720;
const CMD_W = 240;
const CMD_H = 360;
const MEMBER_W = MENU_W - CMD_W - 48;
const MEMBER_H = 140;
const GOLD_H = 48;

function createMenuObjects(): EditorUIObject[] {
  const objects: EditorUIObject[] = [];

  // 全体背景（半透明黒）
  objects.push({
    id: 'menu_bg',
    name: 'background',
    transform: {
      x: 0, y: 0, width: MENU_W, height: MENU_H,
      anchorX: 'left', anchorY: 'top',
      pivotX: 0, pivotY: 0,
      rotation: 0, scaleX: 1, scaleY: 1, visible: true,
    },
    components: [
      createUIComponentData('shape', { shapeType: 'rectangle', fillColor: '#000000aa' }),
    ],
  });

  // ── 左: コマンドウィンドウ ──
  objects.push({
    id: 'menu_cmd',
    name: 'commandWindow',
    parentId: 'menu_bg',
    transform: {
      x: 16, y: 16, width: CMD_W, height: CMD_H,
      anchorX: 'left', anchorY: 'top',
      pivotX: 0, pivotY: 0,
      rotation: 0, scaleX: 1, scaleY: 1, visible: true,
    },
    components: [
      createUIComponentData('shape', { shapeType: 'rectangle', fillColor: '#1a1a2e', strokeColor: '#4a4a6a', strokeWidth: 2, cornerRadius: 8 }),
      createUIComponentData('navigation', { direction: 'vertical', wrap: true, initialIndex: 0 }),
      createUIComponentData('layoutGroup', { direction: 'vertical', spacing: 0, alignment: 'start', paddingTop: 12, paddingBottom: 12, paddingLeft: 16, paddingRight: 16 }),
      createUIComponentData('contentFit', { fitWidth: false, fitHeight: true }),
    ],
  });

  // コマンド項目
  const commands = ['アイテム', 'スキル', '装備', 'ステータス', 'セーブ', '終了'];
  for (let i = 0; i < commands.length; i++) {
    objects.push({
      id: `menu_cmd_${i}`,
      name: `cmd${i}`,
      parentId: 'menu_cmd',
      transform: {
        x: 0, y: 0, width: CMD_W - 32, height: 44,
        anchorX: 'left', anchorY: 'top',
        pivotX: 0, pivotY: 0,
        rotation: 0, scaleX: 1, scaleY: 1, visible: true,
      },
      components: [
        createUIComponentData('text', { content: commands[i], fontSize: 20, color: '#ffffff', align: 'left', verticalAlign: 'middle', lineHeight: 1.2 }),
        createUIComponentData('navigationItem', { itemId: String(i) }),
      ],
    });
  }

  // コマンドカーソル
  objects.push({
    id: 'menu_cmd_cursor',
    name: 'cmdCursor',
    parentId: 'menu_cmd',
    transform: {
      x: 0, y: 12, width: 16, height: 44,
      anchorX: 'left', anchorY: 'top',
      pivotX: 0, pivotY: 0,
      rotation: 0, scaleX: 1, scaleY: 1, visible: true,
    },
    components: [
      createUIComponentData('text', { content: '▶', fontSize: 16, color: '#ffdd44', align: 'center', verticalAlign: 'middle', lineHeight: 1.2 }),
      createUIComponentData('navigationCursor', { offsetX: -16, offsetY: 0 }),
      createUIComponentData('layoutElement', { participate: false }),
    ],
  });

  // ── 左下: ゴールドウィンドウ ──
  objects.push({
    id: 'menu_gold',
    name: 'goldWindow',
    parentId: 'menu_bg',
    transform: {
      x: 16, y: CMD_H + 32, width: CMD_W, height: GOLD_H,
      anchorX: 'left', anchorY: 'top',
      pivotX: 0, pivotY: 0,
      rotation: 0, scaleX: 1, scaleY: 1, visible: true,
    },
    components: [
      createUIComponentData('shape', { shapeType: 'rectangle', fillColor: '#1a1a2e', strokeColor: '#4a4a6a', strokeWidth: 2, cornerRadius: 8 }),
    ],
  });

  objects.push({
    id: 'menu_gold_text',
    name: 'goldText',
    parentId: 'menu_gold',
    transform: {
      x: 16, y: 0, width: CMD_W - 32, height: GOLD_H,
      anchorX: 'left', anchorY: 'top',
      pivotX: 0, pivotY: 0,
      rotation: 0, scaleX: 1, scaleY: 1, visible: true,
    },
    components: [
      createUIComponentData('text', { content: '0 G', fontSize: 18, color: '#ffdd44', align: 'right', verticalAlign: 'middle', lineHeight: 1.2 }),
    ],
  });

  // ── 右: パーティウィンドウ ──
  objects.push({
    id: 'menu_party',
    name: 'partyWindow',
    parentId: 'menu_bg',
    transform: {
      x: CMD_W + 32, y: 16, width: MEMBER_W, height: MENU_H - 32,
      anchorX: 'left', anchorY: 'top',
      pivotX: 0, pivotY: 0,
      rotation: 0, scaleX: 1, scaleY: 1, visible: true,
    },
    components: [
      createUIComponentData('shape', { shapeType: 'rectangle', fillColor: '#1a1a2e', strokeColor: '#4a4a6a', strokeWidth: 2, cornerRadius: 8 }),
      createUIComponentData('layoutGroup', { direction: 'vertical', spacing: 4, alignment: 'start', paddingTop: 12, paddingBottom: 12, paddingLeft: 16, paddingRight: 16 }),
      createUIComponentData('contentFit', { fitWidth: false, fitHeight: true }),
    ],
  });

  // パーティメンバーテンプレート
  objects.push({
    id: 'menu_member_template',
    name: 'memberTemplate',
    parentId: 'menu_party',
    transform: {
      x: 0, y: 0, width: MEMBER_W - 32, height: MEMBER_H,
      anchorX: 'left', anchorY: 'top',
      pivotX: 0, pivotY: 0,
      rotation: 0, scaleX: 1, scaleY: 1, visible: false,
    },
    components: [
      createUIComponentData('shape', { shapeType: 'rectangle', fillColor: '#2a2a4e', cornerRadius: 4 }),
      createUIComponentData('templateController', {
        args: [
          { id: 'name', name: '名前', fieldType: 'string', defaultValue: '' },
          { id: 'level', name: 'レベル', fieldType: 'string', defaultValue: '' },
          { id: 'hp', name: 'HP', fieldType: 'string', defaultValue: '' },
          { id: 'mp', name: 'MP', fieldType: 'string', defaultValue: '' },
          { id: 'face', name: '顔', fieldType: 'string', defaultValue: '' },
        ],
        onSpawnActions: [],
        onApplyActions: [
          { type: 'uiSetProperty', data: { targetId: 'menu_member_name', component: 'text', property: 'content', valueSource: { source: 'arg', argId: 'name' } } },
          { type: 'uiSetProperty', data: { targetId: 'menu_member_level', component: 'text', property: 'content', valueSource: { source: 'arg', argId: 'level' } } },
          { type: 'uiSetProperty', data: { targetId: 'menu_member_hp', component: 'text', property: 'content', valueSource: { source: 'arg', argId: 'hp' } } },
          { type: 'uiSetProperty', data: { targetId: 'menu_member_mp', component: 'text', property: 'content', valueSource: { source: 'arg', argId: 'mp' } } },
          { type: 'uiSetProperty', data: { targetId: 'menu_member_face', component: 'image', property: 'imageId', valueSource: { source: 'arg', argId: 'face' } } },
        ],
      }),
    ],
  });

  // テンプレート子: 顔画像
  objects.push({
    id: 'menu_member_face',
    name: 'face',
    parentId: 'menu_member_template',
    transform: {
      x: 8, y: 8, width: 64, height: 64,
      anchorX: 'left', anchorY: 'top',
      pivotX: 0, pivotY: 0,
      rotation: 0, scaleX: 1, scaleY: 1, visible: true,
    },
    components: [
      createUIComponentData('image', { imageId: '', opacity: 1 }),
    ],
  });

  // テンプレート子: 名前
  objects.push({
    id: 'menu_member_name',
    name: 'name',
    parentId: 'menu_member_template',
    transform: {
      x: 80, y: 8, width: 200, height: 24,
      anchorX: 'left', anchorY: 'top',
      pivotX: 0, pivotY: 0,
      rotation: 0, scaleX: 1, scaleY: 1, visible: true,
    },
    components: [
      createUIComponentData('text', { content: '---', fontSize: 18, color: '#ffffff', align: 'left', verticalAlign: 'middle', lineHeight: 1.2 }),
    ],
  });

  // テンプレート子: レベル
  objects.push({
    id: 'menu_member_level',
    name: 'level',
    parentId: 'menu_member_template',
    transform: {
      x: 300, y: 8, width: 120, height: 24,
      anchorX: 'left', anchorY: 'top',
      pivotX: 0, pivotY: 0,
      rotation: 0, scaleX: 1, scaleY: 1, visible: true,
    },
    components: [
      createUIComponentData('text', { content: 'Lv.1', fontSize: 18, color: '#aaaaaa', align: 'left', verticalAlign: 'middle', lineHeight: 1.2 }),
    ],
  });

  // テンプレート子: HP
  objects.push({
    id: 'menu_member_hp',
    name: 'hp',
    parentId: 'menu_member_template',
    transform: {
      x: 80, y: 40, width: 200, height: 20,
      anchorX: 'left', anchorY: 'top',
      pivotX: 0, pivotY: 0,
      rotation: 0, scaleX: 1, scaleY: 1, visible: true,
    },
    components: [
      createUIComponentData('text', { content: 'HP: ---', fontSize: 16, color: '#88ff88', align: 'left', verticalAlign: 'middle', lineHeight: 1.2 }),
    ],
  });

  // テンプレート子: MP
  objects.push({
    id: 'menu_member_mp',
    name: 'mp',
    parentId: 'menu_member_template',
    transform: {
      x: 80, y: 64, width: 200, height: 20,
      anchorX: 'left', anchorY: 'top',
      pivotX: 0, pivotY: 0,
      rotation: 0, scaleX: 1, scaleY: 1, visible: true,
    },
    components: [
      createUIComponentData('text', { content: 'MP: ---', fontSize: 16, color: '#88bbff', align: 'left', verticalAlign: 'middle', lineHeight: 1.2 }),
    ],
  });

  return objects;
}

export const menuCanvas: EditorUICanvas = {
  id: 'menu',
  name: 'メニュー',
  objects: createMenuObjects(),
  functions: [],
};

// ── UICanvas: アイテム画面 ──

const ITEM_LIST_W = 640;
const ITEM_DESC_W = 600;
const ITEM_ROW_H = 36;

function createItemScreenObjects(): EditorUIObject[] {
  const objects: EditorUIObject[] = [];

  // 全体背景
  objects.push({
    id: 'item_bg',
    name: 'background',
    transform: {
      x: 0, y: 0, width: 1280, height: 720,
      anchorX: 'left', anchorY: 'top',
      pivotX: 0, pivotY: 0,
      rotation: 0, scaleX: 1, scaleY: 1, visible: true,
    },
    components: [
      createUIComponentData('shape', { shapeType: 'rectangle', fillColor: '#000000aa' }),
    ],
  });

  // ── アイテム一覧ウィンドウ ──
  objects.push({
    id: 'item_list_win',
    name: 'listWindow',
    parentId: 'item_bg',
    transform: {
      x: 16, y: 16, width: ITEM_LIST_W, height: 640,
      anchorX: 'left', anchorY: 'top',
      pivotX: 0, pivotY: 0,
      rotation: 0, scaleX: 1, scaleY: 1, visible: true,
    },
    components: [
      createUIComponentData('shape', { shapeType: 'rectangle', fillColor: '#1a1a2e', strokeColor: '#4a4a6a', strokeWidth: 2, cornerRadius: 8 }),
      createUIComponentData('navigation', { direction: 'vertical', wrap: true, initialIndex: 0 }),
      createUIComponentData('layoutGroup', { direction: 'vertical', spacing: 0, alignment: 'start', paddingTop: 8, paddingBottom: 8, paddingLeft: 16, paddingRight: 16 }),
    ],
  });

  // アイテムテンプレート（TemplateController でインベントリから動的生成）
  objects.push({
    id: 'item_row_template',
    name: 'itemTemplate',
    parentId: 'item_list_win',
    transform: {
      x: 0, y: 0, width: ITEM_LIST_W - 32, height: ITEM_ROW_H,
      anchorX: 'left', anchorY: 'top',
      pivotX: 0, pivotY: 0,
      rotation: 0, scaleX: 1, scaleY: 1, visible: false,
    },
    components: [
      createUIComponentData('templateController', {
        args: [
          { id: 'name', name: '名前', fieldType: 'string', defaultValue: '' },
          { id: 'count', name: '個数', fieldType: 'string', defaultValue: '' },
        ],
        onSpawnActions: [],
        onApplyActions: [
          { type: 'uiSetProperty', data: { targetId: 'item_row_name', component: 'text', property: 'content', valueSource: { source: 'arg', argId: 'name' } } },
          { type: 'uiSetProperty', data: { targetId: 'item_row_count', component: 'text', property: 'content', valueSource: { source: 'arg', argId: 'count' } } },
        ],
      }),
      createUIComponentData('navigationItem', { itemId: '0' }),
    ],
  });

  // テンプレート子: アイテム名
  objects.push({
    id: 'item_row_name',
    name: 'name',
    parentId: 'item_row_template',
    transform: {
      x: 0, y: 0, width: ITEM_LIST_W - 120, height: ITEM_ROW_H,
      anchorX: 'left', anchorY: 'top',
      pivotX: 0, pivotY: 0,
      rotation: 0, scaleX: 1, scaleY: 1, visible: true,
    },
    components: [
      createUIComponentData('text', { content: '', fontSize: 18, color: '#ffffff', align: 'left', verticalAlign: 'middle', lineHeight: 1.2 }),
    ],
  });

  // テンプレート子: 個数
  objects.push({
    id: 'item_row_count',
    name: 'count',
    parentId: 'item_row_template',
    transform: {
      x: ITEM_LIST_W - 120, y: 0, width: 80, height: ITEM_ROW_H,
      anchorX: 'left', anchorY: 'top',
      pivotX: 0, pivotY: 0,
      rotation: 0, scaleX: 1, scaleY: 1, visible: true,
    },
    components: [
      createUIComponentData('text', { content: '', fontSize: 18, color: '#aaaaaa', align: 'right', verticalAlign: 'middle', lineHeight: 1.2 }),
    ],
  });

  // カーソル
  objects.push({
    id: 'item_list_cursor',
    name: 'listCursor',
    parentId: 'item_list_win',
    transform: {
      x: 0, y: 8, width: 16, height: ITEM_ROW_H,
      anchorX: 'left', anchorY: 'top',
      pivotX: 0, pivotY: 0,
      rotation: 0, scaleX: 1, scaleY: 1, visible: true,
    },
    components: [
      createUIComponentData('text', { content: '▶', fontSize: 16, color: '#ffdd44', align: 'center', verticalAlign: 'middle', lineHeight: 1.2 }),
      createUIComponentData('navigationCursor', { offsetX: -16, offsetY: 0 }),
      createUIComponentData('layoutElement', { participate: false }),
    ],
  });

  // ── 説明ウィンドウ ──
  objects.push({
    id: 'item_desc_win',
    name: 'descWindow',
    parentId: 'item_bg',
    transform: {
      x: ITEM_LIST_W + 32, y: 16, width: ITEM_DESC_W, height: 640,
      anchorX: 'left', anchorY: 'top',
      pivotX: 0, pivotY: 0,
      rotation: 0, scaleX: 1, scaleY: 1, visible: true,
    },
    components: [
      createUIComponentData('shape', { shapeType: 'rectangle', fillColor: '#1a1a2e', strokeColor: '#4a4a6a', strokeWidth: 2, cornerRadius: 8 }),
    ],
  });

  // 説明テキスト
  objects.push({
    id: 'item_desc_text',
    name: 'descText',
    parentId: 'item_desc_win',
    transform: {
      x: 16, y: 16, width: ITEM_DESC_W - 32, height: 608,
      anchorX: 'left', anchorY: 'top',
      pivotX: 0, pivotY: 0,
      rotation: 0, scaleX: 1, scaleY: 1, visible: true,
    },
    components: [
      createUIComponentData('text', { content: 'アイテムを選択してください', fontSize: 16, color: '#aaaaaa', align: 'left', verticalAlign: 'top', lineHeight: 1.4 }),
    ],
  });

  // ── キャラ選択ウィンドウ（使用時に表示） ──
  objects.push({
    id: 'item_char_win',
    name: 'charWindow',
    parentId: 'item_bg',
    transform: {
      x: ITEM_LIST_W + 32, y: 200, width: ITEM_DESC_W, height: 300,
      anchorX: 'left', anchorY: 'top',
      pivotX: 0, pivotY: 0,
      rotation: 0, scaleX: 1, scaleY: 1, visible: false,
    },
    components: [
      createUIComponentData('shape', { shapeType: 'rectangle', fillColor: '#1a1a2e', strokeColor: '#ffdd44', strokeWidth: 2, cornerRadius: 8 }),
      createUIComponentData('navigation', { direction: 'vertical', wrap: true, initialIndex: 0 }),
      createUIComponentData('layoutGroup', { direction: 'vertical', spacing: 0, alignment: 'start', paddingTop: 8, paddingBottom: 8, paddingLeft: 16, paddingRight: 16 }),
      createUIComponentData('contentFit', { fitWidth: false, fitHeight: true }),
    ],
  });

  // キャラ選択テンプレート
  objects.push({
    id: 'item_char_template',
    name: 'charTemplate',
    parentId: 'item_char_win',
    transform: {
      x: 0, y: 0, width: ITEM_DESC_W - 32, height: 40,
      anchorX: 'left', anchorY: 'top',
      pivotX: 0, pivotY: 0,
      rotation: 0, scaleX: 1, scaleY: 1, visible: false,
    },
    components: [
      createUIComponentData('templateController', {
        args: [{ id: 'label', name: 'ラベル', fieldType: 'string', defaultValue: '' }],
        onSpawnActions: [],
        onApplyActions: [
          { type: 'uiSetProperty', data: { targetId: 'item_char_label', component: 'text', property: 'content', valueSource: { source: 'arg', argId: 'label' } } },
        ],
      }),
      createUIComponentData('navigationItem', { itemId: '0' }),
    ],
  });

  objects.push({
    id: 'item_char_label',
    name: 'label',
    parentId: 'item_char_template',
    transform: {
      x: 0, y: 0, width: ITEM_DESC_W - 32, height: 40,
      anchorX: 'left', anchorY: 'top',
      pivotX: 0, pivotY: 0,
      rotation: 0, scaleX: 1, scaleY: 1, visible: true,
    },
    components: [
      createUIComponentData('text', { content: '', fontSize: 18, color: '#ffffff', align: 'left', verticalAlign: 'middle', lineHeight: 1.2 }),
    ],
  });

  // キャラ選択カーソル
  objects.push({
    id: 'item_char_cursor',
    name: 'charCursor',
    parentId: 'item_char_win',
    transform: {
      x: 0, y: 8, width: 16, height: 40,
      anchorX: 'left', anchorY: 'top',
      pivotX: 0, pivotY: 0,
      rotation: 0, scaleX: 1, scaleY: 1, visible: true,
    },
    components: [
      createUIComponentData('text', { content: '▶', fontSize: 16, color: '#ffdd44', align: 'center', verticalAlign: 'middle', lineHeight: 1.2 }),
      createUIComponentData('navigationCursor', { offsetX: -16, offsetY: 0 }),
      createUIComponentData('layoutElement', { participate: false }),
    ],
  });

  return objects;
}

export const itemScreenCanvas: EditorUICanvas = {
  id: 'item_screen',
  name: 'アイテム画面',
  objects: createItemScreenObjects(),
  functions: [],
};
