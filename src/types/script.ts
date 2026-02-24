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
 * スクリプト返り値定義
 * イベントアクションで返り値を変数に代入する際の型情報
 */
export interface ScriptReturn {
  /** 返り値ID（return オブジェクトのキー名） */
  id: string;
  /** 表示名 */
  name: string;
  /** FieldType の type 名 ('number', 'string', 'class' 等) */
  fieldType: string;
  /** クラスID（fieldType === 'class' の場合に必須） */
  classId?: string;
  /** 配列かどうか */
  isArray: boolean;
}

/**
 * コンポーネントスクリプトのフィールド定義
 * コンポーネントスクリプトの右パネルで設定するフィールドのスキーマ
 */
export interface ComponentField {
  /** フィールド名（JS識別子） */
  name: string;
  /** FieldType の type 名 ('number', 'string', 'boolean', 'array', 'object') */
  type: string;
  /** デフォルト値 */
  defaultValue: unknown;
  /** 表示名 */
  label: string;
}

/**
 * スクリプト
 */
export interface Script {
  /** スクリプトID */
  id: string;
  /** スクリプト名（表示用） */
  name: string;
  /** 呼び出し用ID（JS識別子、Script.callId() で呼び出し） */
  callId?: string;
  /** スクリプトの種類 */
  type: ScriptType;
  /** JavaScript ソースコード */
  content: string;
  /** 引数定義（event/component 用） */
  args: ScriptArg[];
  /** 返り値定義（イベントアクションでの変数代入に使用） */
  returns: ScriptReturn[];
  /** フィールド定義（component スクリプト用） */
  fields: ComponentField[];
  /** 完了まで待機するか（true: 呼び出し側で await 必須、内部で await 使用可能） */
  isAsync: boolean;
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
    returns: [],
    fields: [],
    isAsync: false,
    description: '',
  };
}
