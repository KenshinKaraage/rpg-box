/**
 * 全アクションブロックのレジストリ登録
 *
 * アプリケーション起動時に一度だけ呼び出す
 */
import { registerActionBlock } from './actionBlockRegistry';
import { VariableOpActionBlock } from '../components/blocks/VariableOpActionBlock';
import { ConditionalActionBlock } from '../components/blocks/ConditionalActionBlock';
import { LoopActionBlock } from '../components/blocks/LoopActionBlock';
import { WaitActionBlock } from '../components/blocks/WaitActionBlock';
import { AudioActionBlock } from '../components/blocks/AudioActionBlock';
import { CameraActionBlock } from '../components/blocks/CameraActionBlock';
import { ScriptActionBlock } from '../components/blocks/ScriptActionBlock';
import { CallTemplateActionBlock } from '../components/blocks/CallTemplateActionBlock';
import { MapActionBlock } from '../components/blocks/MapActionBlock';
import { ObjectActionBlock } from '../components/blocks/ObjectActionBlock';
import { LogActionBlock } from '../components/blocks/LogActionBlock';
import { SwitchActionBlock } from '../components/blocks/SwitchActionBlock';

// ロジック
registerActionBlock({
  type: 'variableOp',
  label: '変数操作',
  category: 'logic',
  BlockComponent: VariableOpActionBlock,
});

registerActionBlock({
  type: 'conditional',
  label: '条件分岐',
  category: 'logic',
  BlockComponent: ConditionalActionBlock,
});

registerActionBlock({
  type: 'loop',
  label: 'ループ',
  category: 'logic',
  BlockComponent: LoopActionBlock,
});

registerActionBlock({
  type: 'switch',
  label: 'スイッチ',
  category: 'logic',
  BlockComponent: SwitchActionBlock,
});

// 基礎
registerActionBlock({
  type: 'wait',
  label: 'ウェイト',
  category: 'basic',
  BlockComponent: WaitActionBlock,
});

registerActionBlock({
  type: 'audio',
  label: 'オーディオ',
  category: 'basic',
  BlockComponent: AudioActionBlock,
});

registerActionBlock({
  type: 'camera',
  label: 'カメラ',
  category: 'basic',
  BlockComponent: CameraActionBlock,
});

registerActionBlock({
  type: 'map',
  label: 'マップ操作',
  category: 'basic',
  BlockComponent: MapActionBlock,
});

registerActionBlock({
  type: 'object',
  label: 'オブジェクト操作',
  category: 'basic',
  BlockComponent: ObjectActionBlock,
});

// スクリプト
registerActionBlock({
  type: 'script',
  label: 'スクリプト',
  category: 'script',
  BlockComponent: ScriptActionBlock,
});

// テンプレート
registerActionBlock({
  type: 'callTemplate',
  label: 'テンプレート呼出',
  category: 'template',
  BlockComponent: CallTemplateActionBlock,
});

// デバッグ
registerActionBlock({
  type: 'log',
  label: 'ログ出力',
  category: 'basic',
  BlockComponent: LogActionBlock,
});
