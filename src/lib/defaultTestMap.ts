import type { GameMap, MapObject, Prefab } from '@/types/map';
import { TransformComponent } from '@/types/components/TransformComponent';
import { ColliderComponent } from '@/types/components/ColliderComponent';
import { ControllerComponent } from '@/types/components/ControllerComponent';
import { TalkTriggerComponent } from '@/types/components/triggers/TalkTriggerComponent';
import { MovementComponent } from '@/types/components/MovementComponent';
import { SpriteComponent } from '@/types/components/SpriteComponent';
import { VariablesComponent } from '@/types/components/VariablesComponent';
import { ScriptAction } from '@/engine/actions/ScriptAction';
import { SwitchAction } from '@/engine/actions/SwitchAction';
import { CameraAction } from '@/engine/actions/CameraAction';
import { ObjectAction } from '@/engine/actions/ObjectAction';
import { WaitAction } from '@/engine/actions/WaitAction';
import { VariableOpAction } from '@/engine/actions/VariableOpAction';

const OBJ_LAYER_ID = 'layer_obj';

export type AssetNameToId = (name: string) => string;

// ── Map helpers ──

/** アセット名→IDのマッピング（importDefaultAssets 後に構築） */

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
  const waitShake = new WaitAction();
  waitShake.frames = 30;

  // 11. メッセージ
  const msgShake = new ScriptAction();
  msgShake.scriptId = 'message';
  msgShake.args = { text: 'カメラシェイクしました。', face: '', close: false };

  // 12. CameraAction: フラッシュ（白）
  const flash = new CameraAction();
  flash.operation = 'effect';
  flash.effect = 'flash';
  flash.color = '#ffffff';
  flash.duration = 20;

  // 13. WaitAction: フラッシュ待ち
  const waitFlash = new WaitAction();
  waitFlash.frames = 20;

  // 14. メッセージ
  const msgFlash = new ScriptAction();
  msgFlash.scriptId = 'message';
  msgFlash.args = { text: 'フラッシュしました。', face: '', close: false };

  // 15. CameraAction: フェードアウト（黒）
  const fadeOut = new CameraAction();
  fadeOut.operation = 'effect';
  fadeOut.effect = 'fadeOut';
  fadeOut.color = '#000000';
  fadeOut.duration = 30;

  // 16. メッセージ（フェードアウト中に表示）
  const msgFadeOut = new ScriptAction();
  msgFadeOut.scriptId = 'message';
  msgFadeOut.args = { text: '画面が暗くなりました。', face: '', close: false };

  // 17. CameraAction: フェードイン（黒から戻す）
  const fadeIn = new CameraAction();
  fadeIn.operation = 'effect';
  fadeIn.effect = 'fadeIn';
  fadeIn.color = '#000000';
  fadeIn.duration = 30;

  // 18. メッセージ
  const msgFadeIn = new ScriptAction();
  msgFadeIn.scriptId = 'message';
  msgFadeIn.args = { text: 'フェードインしました。', face: '', close: false };

  // 19. CameraAction: ズーム
  const zoomIn = new CameraAction();
  zoomIn.operation = 'zoom';
  zoomIn.scale = 2;

  // 20. メッセージ
  const msgZoom = new ScriptAction();
  msgZoom.scriptId = 'message';
  msgZoom.args = { text: 'ズーム2倍です。', face: '', close: false };

  // 21. CameraAction: リセット（ズーム解除）
  const camReset = new CameraAction();
  camReset.operation = 'reset';

  // 22. ObjectAction: NPC を歩行移動
  const walkNpc = new ObjectAction();
  walkNpc.operation = 'move';
  walkNpc.moveType = 'walk';
  walkNpc.targetName = 'NPC';
  walkNpc.x = 9;
  walkNpc.y = 5;

  // 23. メッセージ
  const msgWalk = new ScriptAction();
  msgWalk.scriptId = 'message';
  msgWalk.args = { text: 'NPCが (9,5) まで歩きました。', face: '', close: false };

  // 24. ObjectAction: NPC をテレポートで元の位置に戻す
  const moveNpcBack = new ObjectAction();
  moveNpcBack.operation = 'move';
  moveNpcBack.moveType = 'teleport';
  moveNpcBack.targetName = 'NPC';
  moveNpcBack.x = 7;
  moveNpcBack.y = 5;

  // 25. 完了メッセージ
  const msgDone = new ScriptAction();
  msgDone.scriptId = 'message';
  msgDone.args = { text: '操作テスト完了！', face: '' };

  const talk = new TalkTriggerComponent();
  talk.direction = 'any';
  talk.facePlayer = true;
  talk.actions = [
    msgStart, faceRight, msgFace, faceDown,
    hideNpc, msgHide, showNpc, msgShow,
    shake, waitShake, msgShake,
    flash, waitFlash, msgFlash,
    fadeOut, msgFadeOut, fadeIn, msgFadeIn,
    zoomIn, msgZoom, camReset,
    walkNpc, msgWalk, moveNpcBack,
    msgDone,
  ];

  return {
    id: 'npc_action_test',
    name: '操作テスト係',
    components: [transform, collider, sprite, talk],
  };
}

// ── Map: データ連携テスト用NPC追加 ──

export function createTestMap(resolveAssetId: AssetNameToId): GameMap {
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
          // 村人（メッセージテスト）
          createNpcObject('npc_villager', '村人', 7, 5, createScriptActions('message', [
            { text: 'ようこそ！ここはテスト村です。', face: '', close: false },
            { text: 'Xキーでメニューを開けます。', face: '' },
          ]), resolveAssetId),
          // 商人（アイテム購入テスト）
          createNpcObject('npc_shop', '商人', 9, 5, createScriptActions('shop_buy', [{}]), resolveAssetId),
          // 回復役（HP/MP全回復 + アイテムくれる）
          createNpcObject('npc_healer', '回復役', 7, 7, createScriptActions('heal_all', [{}]), resolveAssetId),
          // レベルアップ係
          createNpcObject('npc_trainer', '訓練士', 9, 7, createScriptActions('level_up_all', [{}]), resolveAssetId),
          // 占い師（イベントブロック + VariablesComponent テスト）
          createFortunetellerObject(11, 5, resolveAssetId),
          // 操作テスト（Camera/Object アクション）
          createActionTestObject(11, 7, resolveAssetId),
        ],
      },
    ],
  };
}

// ── Store に投入 ──

// ── Prefab: NPC テンプレート ──

export function createNpcPrefabs(resolveAssetId: AssetNameToId): Prefab[] {
  // 基本 NPC: スプライト + コライダー（話しかけられる NPC のベース）
  const basicCollider = new ColliderComponent();
  basicCollider.width = 1;
  basicCollider.height = 1;
  basicCollider.collideLayers = [OBJ_LAYER_ID];

  const basicTalk = new TalkTriggerComponent();
  basicTalk.direction = 'any';
  basicTalk.facePlayer = true;

  // 歩行 NPC: 基本 NPC + ランダム移動
  const walkMovement = new MovementComponent();
  walkMovement.pattern = 'random';
  walkMovement.speed = 1;
  walkMovement.activeness = 3;

  return [
    {
      id: 'prefab_npc_basic',
      name: 'NPC（基本）',
      prefab: {
        components: [
          basicCollider.clone(),
          createWalkSprite('walk_ian', resolveAssetId),
          basicTalk.clone(),
        ],
      },
    },
    {
      id: 'prefab_npc_walk',
      name: 'NPC（歩行）',
      prefab: {
        components: [
          basicCollider.clone(),
          createWalkSprite('walk_marguerite', resolveAssetId),
          basicTalk.clone(),
          walkMovement.clone(),
        ],
      },
    },
    {
      id: 'prefab_npc_static',
      name: 'NPC（固定）',
      prefab: {
        components: [
          basicCollider.clone(),
          createWalkSprite('walk_lex', resolveAssetId),
        ],
      },
    },
  ];
}

// ── Store に投入 ──


