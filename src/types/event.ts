import type { EventAction } from '@/engine/actions/EventAction';
import type { FieldType } from '@/types/fields/FieldType';

/**
 * テンプレート引数の定義
 * EventTemplate に渡すパラメータの型を定義する
 */
export interface TemplateArg {
  id: string;
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fieldType: FieldType<any>;
  required: boolean;
}

/**
 * イベントテンプレートの定義
 * 再利用可能なイベントのひな形を表す
 */
export interface EventTemplate {
  id: string;
  name: string;
  description?: string;
  args: TemplateArg[];
  actions: EventAction[];
}

/**
 * 新規イベントテンプレートを作成する
 * @param id テンプレートID
 * @param name テンプレート名
 * @returns デフォルト値で初期化されたEventTemplate
 */
export function createEventTemplate(id: string, name: string): EventTemplate {
  return { id, name, description: '', args: [], actions: [] };
}
