import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BooleanFieldEditor } from './BooleanFieldEditor';

describe('BooleanFieldEditor', () => {
  const defaultProps = {
    value: false,
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('表示', () => {
    it('チェックボックスが表示される', () => {
      render(<BooleanFieldEditor {...defaultProps} />);
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('value=true で checked 状態', () => {
      render(<BooleanFieldEditor {...defaultProps} value={true} />);
      expect(screen.getByRole('checkbox')).toHaveAttribute('data-state', 'checked');
    });

    it('value=false で unchecked 状態', () => {
      render(<BooleanFieldEditor {...defaultProps} value={false} />);
      expect(screen.getByRole('checkbox')).toHaveAttribute('data-state', 'unchecked');
    });

    it('checkboxLabel が表示される', () => {
      render(<BooleanFieldEditor {...defaultProps} checkboxLabel="有効にする" />);
      expect(screen.getByText('有効にする')).toBeInTheDocument();
    });

    it('checkboxLabel がない場合はラベルが表示されない', () => {
      render(<BooleanFieldEditor {...defaultProps} />);
      expect(screen.queryByText(/有効/)).not.toBeInTheDocument();
    });
  });

  describe('操作', () => {
    it('クリックで onChange が true で呼ばれる', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(<BooleanFieldEditor {...defaultProps} onChange={onChange} />);

      await user.click(screen.getByRole('checkbox'));
      expect(onChange).toHaveBeenCalledWith(true);
    });
  });

  describe('エラー表示', () => {
    it('エラーメッセージが表示される', () => {
      render(<BooleanFieldEditor {...defaultProps} error="チェックしてください" />);
      expect(screen.getByText('チェックしてください')).toBeInTheDocument();
    });
  });

  describe('無効状態', () => {
    it('disabled でチェックボックスが無効になる', () => {
      render(<BooleanFieldEditor {...defaultProps} disabled />);
      expect(screen.getByRole('checkbox')).toBeDisabled();
    });
  });
});
