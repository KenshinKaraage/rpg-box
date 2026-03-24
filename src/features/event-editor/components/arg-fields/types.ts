/**
 * スクリプト引数フィールドレンダラーの型定義
 */
export interface ArgFieldProps {
  value: unknown;
  onChange: (value: unknown) => void;
  placeholder?: string;
}

export type ArgFieldRenderer = React.FC<ArgFieldProps>;
