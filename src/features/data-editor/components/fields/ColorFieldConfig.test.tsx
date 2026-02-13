import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ColorFieldConfig } from './ColorFieldConfig';

describe('ColorFieldConfig', () => {
  const defaultProps = {
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('表示', () => {
    it('HEX入力表示のチェックボックスが表示される', () => {
      render(<ColorFieldConfig {...defaultProps} />);
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('「HEX入力欄を表示」ラベルが表示される', () => {
      render(<ColorFieldConfig {...defaultProps} />);
      expect(screen.getByText('HEX入力欄を表示')).toBeInTheDocument();
    });

    it('showHexInput=true でチェックされた状態になる', () => {
      render(<ColorFieldConfig {...defaultProps} showHexInput={true} />);
      expect(screen.getByRole('checkbox')).toHaveAttribute('data-state', 'checked');
    });

    it('showHexInput=false でチェックされていない状態になる', () => {
      render(<ColorFieldConfig {...defaultProps} showHexInput={false} />);
      expect(screen.getByRole('checkbox')).toHaveAttribute('data-state', 'unchecked');
    });

    it('showHexInput が未設定でもチェックされていない状態になる', () => {
      render(<ColorFieldConfig {...defaultProps} />);
      expect(screen.getByRole('checkbox')).toHaveAttribute('data-state', 'unchecked');
    });
  });

  describe('操作', () => {
    it('チェックボックスをクリックすると onChange が { showHexInput: true } で呼ばれる', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(<ColorFieldConfig showHexInput={false} onChange={onChange} />);

      await user.click(screen.getByRole('checkbox'));
      expect(onChange).toHaveBeenCalledWith({ showHexInput: true });
    });

    it('チェック済みのチェックボックスをクリックすると onChange が { showHexInput: false } で呼ばれる', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(<ColorFieldConfig showHexInput={true} onChange={onChange} />);

      await user.click(screen.getByRole('checkbox'));
      expect(onChange).toHaveBeenCalledWith({ showHexInput: false });
    });

    it('ラベルをクリックしてもチェックが切り替わる', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(<ColorFieldConfig showHexInput={false} onChange={onChange} />);

      await user.click(screen.getByText('HEX入力欄を表示'));
      expect(onChange).toHaveBeenCalledWith({ showHexInput: true });
    });
  });
});
