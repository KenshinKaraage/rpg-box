import { render, screen, fireEvent } from '@testing-library/react';
import { NumberFieldEditor } from './NumberFieldEditor';

describe('NumberFieldEditor', () => {
  const defaultProps = {
    value: 0,
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('表示', () => {
    it('初期値を表示する', () => {
      render(<NumberFieldEditor {...defaultProps} value={42} />);
      expect(screen.getByRole('spinbutton')).toHaveValue(42);
    });

    it('NaN の場合は空欄を表示する', () => {
      render(<NumberFieldEditor {...defaultProps} value={NaN} />);
      expect(screen.getByRole('spinbutton')).toHaveValue(null);
    });
  });

  describe('操作', () => {
    it('数値入力で onChange が呼ばれる', () => {
      const onChange = jest.fn();
      render(<NumberFieldEditor {...defaultProps} onChange={onChange} />);

      fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '100' } });
      expect(onChange).toHaveBeenCalledWith(100);
    });

    it('空文字入力で NaN が渡される', () => {
      const onChange = jest.fn();
      render(<NumberFieldEditor {...defaultProps} onChange={onChange} />);

      fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '' } });
      expect(onChange).toHaveBeenCalledWith(NaN);
    });
  });

  describe('制約', () => {
    it('min 属性が設定される', () => {
      render(<NumberFieldEditor {...defaultProps} min={0} />);
      expect(screen.getByRole('spinbutton')).toHaveAttribute('min', '0');
    });

    it('max 属性が設定される', () => {
      render(<NumberFieldEditor {...defaultProps} max={999} />);
      expect(screen.getByRole('spinbutton')).toHaveAttribute('max', '999');
    });

    it('step 属性が設定される', () => {
      render(<NumberFieldEditor {...defaultProps} step={0.1} />);
      expect(screen.getByRole('spinbutton')).toHaveAttribute('step', '0.1');
    });
  });

  describe('エラー表示', () => {
    it('エラーメッセージが表示される', () => {
      render(<NumberFieldEditor {...defaultProps} error="エラーです" />);
      expect(screen.getByText('エラーです')).toBeInTheDocument();
    });

    it('エラー時にボーダーが赤くなる', () => {
      render(<NumberFieldEditor {...defaultProps} error="エラー" />);
      expect(screen.getByRole('spinbutton')).toHaveClass('border-red-500');
    });

    it('エラーがない場合はメッセージが表示されない', () => {
      render(<NumberFieldEditor {...defaultProps} />);
      expect(screen.queryByText('エラー')).not.toBeInTheDocument();
    });
  });

  describe('無効状態', () => {
    it('disabled で入力が無効になる', () => {
      render(<NumberFieldEditor {...defaultProps} disabled />);
      expect(screen.getByRole('spinbutton')).toBeDisabled();
    });
  });
});
