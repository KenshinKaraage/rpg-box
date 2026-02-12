import { render, screen } from '@testing-library/react';
import { SelectFieldEditor } from './SelectFieldEditor';

const mockOptions = [
  { value: 'normal', label: '通常' },
  { value: 'rare', label: 'レア' },
  { value: 'legendary', label: '伝説' },
];

describe('SelectFieldEditor', () => {
  const defaultProps = {
    value: 'normal',
    onChange: jest.fn(),
    options: mockOptions,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('表示', () => {
    it('選択中の値のラベルが表示される', () => {
      render(<SelectFieldEditor {...defaultProps} value="rare" />);
      expect(screen.getByText('レア')).toBeInTheDocument();
    });

    it('プレースホルダーが表示される（値が空の場合）', () => {
      render(<SelectFieldEditor {...defaultProps} value="" placeholder="選択してね" />);
      expect(screen.getByText('選択してね')).toBeInTheDocument();
    });

    it('デフォルトプレースホルダーが表示される', () => {
      render(<SelectFieldEditor {...defaultProps} value="" />);
      expect(screen.getByText('選択してください')).toBeInTheDocument();
    });
  });

  describe('エラー表示', () => {
    it('エラーメッセージが表示される', () => {
      render(<SelectFieldEditor {...defaultProps} error="選択必須" />);
      expect(screen.getByText('選択必須')).toBeInTheDocument();
    });
  });

  describe('無効状態', () => {
    it('disabled でトリガーが無効になる', () => {
      render(<SelectFieldEditor {...defaultProps} disabled />);
      expect(screen.getByRole('combobox')).toBeDisabled();
    });
  });
});
