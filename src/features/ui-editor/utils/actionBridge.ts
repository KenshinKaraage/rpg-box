/**
 * SerializedAction <-> EventAction 変換ユーティリティ
 *
 * UIエディタの ActionComponent は SerializedAction[] を保存するが、
 * イベントエディタの ActionBlockEditor は EventAction[] インスタンスを操作する。
 * この変換関数で両者を橋渡しする。
 */
import type { EventAction } from '@/engine/actions/EventAction';
import { getAction } from '@/engine/actions';
import type { SerializedAction } from '@/types/ui/components/ActionComponent';

/**
 * SerializedAction[] → EventAction[] に変換
 *
 * 未知の type はスキップされる（登録されていないアクション）
 */
export function deserializeActions(serialized: SerializedAction[]): EventAction[] {
  const result: EventAction[] = [];
  for (const s of serialized) {
    const Ctor = getAction(s.type);
    if (!Ctor) continue;
    const instance = new Ctor();
    instance.fromJSON(s.data);
    result.push(instance);
  }
  return result;
}

/**
 * EventAction[] → SerializedAction[] に変換
 */
export function serializeActions(actions: EventAction[]): SerializedAction[] {
  return actions.map((action) => ({
    type: action.type,
    data: action.toJSON(),
  }));
}
