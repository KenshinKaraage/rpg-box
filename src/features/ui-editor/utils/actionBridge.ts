/**
 * SerializedAction <-> EditableAction 変換ユーティリティ
 *
 * UIエディタの ActionComponent は SerializedAction[] を保存するが、
 * ActionBlockEditor は EditableAction[] インスタンスを操作する。
 * この変換関数で両者を橋渡しする。
 *
 * EventAction と UIAction の両方のレジストリから検索する。
 */
import type { EditableAction } from '@/types/ui/actions/UIAction';
import { getAction } from '@/engine/actions';
import { getUIAction } from '@/types/ui/actions';
import type { SerializedAction } from '@/types/ui/components/ActionTypes';

/**
 * SerializedAction[] → EditableAction[] に変換
 *
 * EventAction レジストリと UIAction レジストリの両方を検索する。
 * 未知の type はスキップされる。
 */
export function deserializeActions(serialized: SerializedAction[]): EditableAction[] {
  const result: EditableAction[] = [];
  for (const s of serialized) {
    const Ctor = getAction(s.type) ?? getUIAction(s.type);
    if (!Ctor) continue;
    const instance = new Ctor();
    instance.fromJSON(s.data);
    result.push(instance);
  }
  return result;
}

/**
 * EditableAction[] → SerializedAction[] に変換
 */
export function serializeActions(actions: EditableAction[]): SerializedAction[] {
  return actions.map((action) => ({
    type: action.type,
    data: action.toJSON(),
  }));
}
