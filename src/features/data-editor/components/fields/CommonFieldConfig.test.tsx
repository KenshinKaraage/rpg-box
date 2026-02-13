import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CommonFieldConfig } from './CommonFieldConfig';

describe('CommonFieldConfig', () => {
  const defaultProps = {
    required: false,
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('表示', () => {
    it('必須フィールドのチェックボックスが表示される', () => {
      render(<CommonFieldConfig {...defaultProps} />);
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('「必須フィールド」ラベルが表示される', () => {
      render(<CommonFieldConfig {...defaultProps} />);
      expect(screen.getByText('必須フィールド')).toBeInTheDocument();
    });

    it('required=true でチェックされた状態になる', () => {
      render(<CommonFieldConfig {...defaultProps} required={true} />);
      expect(screen.getByRole('checkbox')).toHaveAttribute('data-state', 'checked');
    });

    it('required=false でチェックされていない状態になる', () => {
      render(<CommonFieldConfig {...defaultProps} required={false} />);
      expect(screen.getByRole('checkbox')).toHaveAttribute('data-state', 'unchecked');
    });
  });

  describe('操作', () => {
    it('チェックボックスをクリックすると onChange が { required: true } で呼ばれる', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(<CommonFieldConfig required={false} onChange={onChange} />);

      await user.click(screen.getByRole('checkbox'));
      expect(onChange).toHaveBeenCalledWith({ required: true });
    });

    it('チェック済みのチェックボックスをクリックすると onChange が { required: false } で呼ばれる', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(<CommonFieldConfig required={true} onChange={onChange} />);

      await user.click(screen.getByRole('checkbox'));
      expect(onChange).toHaveBeenCalledWith({ required: false });
    });

    it('ラベルをクリックしてもチェックが切り替わる', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(<CommonFieldConfig required={false} onChange={onChange} />);

      await user.click(screen.getByText('必須フィールド'));
      expect(onChange).toHaveBeenCalledWith({ required: true });
    });
  });
});
