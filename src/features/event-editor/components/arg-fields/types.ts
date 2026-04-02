/**
 * スクリプト引数フィールドレンダラーの型定義
 */
export interface ArgFieldProps {
  value: unknown;
  onChange: (value: unknown) => void;
  placeholder?: string;
  /** データ参照先タイプID（dataSelect 用） */
  referenceTypeId?: string;
}

export type ArgFieldRenderer = React.FC<ArgFieldProps>;
