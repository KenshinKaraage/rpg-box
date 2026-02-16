/**
 * スクリプト関連の型定義
 *
 * イベントスクリプト、コンポーネントスクリプト、内部スクリプトの
 * ドメインモデルを定義する。
 */

/**
 * スクリプトの種類
 * - event: イベントスクリプト（ScriptAction から呼び出し）
 * - component: コンポーネントスクリプト（オブジェクトにアタッチ）
 * - internal: 内部スクリプト（親スクリプトのヘルパー）
 */
export type ScriptType = 'event' | 'component' | 'internal';

/**
 * スクリプト引数定義
 * イベントスクリプト/コンポーネントスクリプトの呼び出し時に渡すパラメータ
 */
export interface ScriptArg {
  /** 引数ID（スクリプト内で参照用） */
  id: string;
  /** 表示名 */
  name: string;
  /** FieldType の type 名 ('number', 'string' 等) */
  fieldType: string;
  /** 必須かどうか */
  required: boolean;
  /** デフォルト値 */
  defaultValue?: unknown;
}

/**
 * スクリプト
 */
export interface Script {
  /** スクリプトID */
  id: string;
  /** スクリプト名 */
  name: string;
  /** スクリプトの種類 */
  type: ScriptType;
  /** JavaScript ソースコード */
  content: string;
  /** 引数定義（event/component 用） */
  args: ScriptArg[];
  /** 親スクリプトID（internal のみ） */
  parentId?: string;
  /** 説明 */
  description?: string;
}

/**
 * スクリプトのファクトリ関数
 */
export function createScript(id: string, name: string, type: ScriptType): Script {
  return {
    id,
    name,
    type,
    content: '',
    args: [],
    description: '',
  };
}
