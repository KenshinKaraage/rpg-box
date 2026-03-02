/**
 * UIAction ブロックエディタのレジストリ登録
 *
 * 既存の actionBlockRegistry に 'ui' カテゴリとして登録する。
 */
import { registerActionBlock } from '@/features/event-editor/registry/actionBlockRegistry';
import { SetPropertyBlock } from '../components/blocks/SetPropertyBlock';
import { SetVisibilityBlock } from '../components/blocks/SetVisibilityBlock';
import { PlayAnimationBlock } from '../components/blocks/PlayAnimationBlock';
import { CallFunctionBlock } from '../components/blocks/CallFunctionBlock';
import { NavigateBlock } from '../components/blocks/NavigateBlock';
import { TriggerObjectActionBlock } from '../components/blocks/TriggerObjectActionBlock';

registerActionBlock({
  type: 'uiSetProperty',
  label: 'プロパティ設定',
  category: 'ui',
  BlockComponent: SetPropertyBlock,
});

registerActionBlock({
  type: 'uiSetVisibility',
  label: '表示切替',
  category: 'ui',
  BlockComponent: SetVisibilityBlock,
});

registerActionBlock({
  type: 'uiPlayAnimation',
  label: 'アニメーション再生',
  category: 'ui',
  BlockComponent: PlayAnimationBlock,
});

registerActionBlock({
  type: 'uiCallFunction',
  label: '関数呼出',
  category: 'ui',
  BlockComponent: CallFunctionBlock,
});

registerActionBlock({
  type: 'uiNavigate',
  label: 'キャンバス遷移',
  category: 'ui',
  BlockComponent: NavigateBlock,
});

registerActionBlock({
  type: 'uiTriggerObjectAction',
  label: 'アクション発火',
  category: 'ui',
  BlockComponent: TriggerObjectActionBlock,
});
