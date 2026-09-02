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

    it('空文字入力では onChange が呼ばれない（NaN を外に伝播させない）', () => {
      const onChange = jest.fn();
      render(<NumberFieldEditor {...defaultProps} onChange={onChange} />);

      fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '' } });
      expect(onChange).not.toHaveBeenCalled();
      expect(screen.getByRole('spinbutton')).toHaveValue(null); // 表示上は空欄のまま保持される
    });
  });

  describe('min/max クランプ（確定=blur時のみ適用）', () => {
    it('入力途中（onChange時点）ではクランプされない', () => {
      const onChange = jest.fn();
      render(
        <NumberFieldEditor {...defaultProps} value={20} min={20} max={999} onChange={onChange} />
      );

      fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '2' } });
      expect(onChange).toHaveBeenCalledWith(2);
      expect(screen.getByRole('spinbutton')).toHaveValue(2);
    });

    it('全消去してから新しい数値を入力できる（毎キー入力でスナップされない）', () => {
      const onChange = jest.fn();
      render(
        <NumberFieldEditor {...defaultProps} value={20} min={20} max={999} onChange={onChange} />
      );

      fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '' } });
      expect(screen.getByRole('spinbutton')).toHaveValue(null);
      fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '5' } });
      expect(screen.getByRole('spinbutton')).toHaveValue(5);
      expect(onChange).toHaveBeenLastCalledWith(5);
    });

    it('blur時にminより小さければminへクランプされる', () => {
      const onChange = jest.fn();
      render(
        <NumberFieldEditor {...defaultProps} value={5} min={20} max={999} onChange={onChange} />
      );

      fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '5' } });
      fireEvent.blur(screen.getByRole('spinbutton'));
      expect(onChange).toHaveBeenLastCalledWith(20);
      expect(screen.getByRole('spinbutton')).toHaveValue(20);
    });

    it('blur時にmaxを超えていればmaxへクランプされる', () => {
      const onChange = jest.fn();
      render(
        <NumberFieldEditor {...defaultProps} value={999} min={20} max={999} onChange={onChange} />
      );

      fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '5000' } });
      fireEvent.blur(screen.getByRole('spinbutton'));
      expect(onChange).toHaveBeenLastCalledWith(999);
      expect(screen.getByRole('spinbutton')).toHaveValue(999);
    });

    it('blur時に範囲内なら値がすでに一致している限りonChangeは再度呼ばれない', () => {
      const onChange = jest.fn();
      render(
        <NumberFieldEditor {...defaultProps} value={20} min={20} max={999} onChange={onChange} />
      );

      fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '50' } });
      onChange.mockClear();
      fireEvent.blur(screen.getByRole('spinbutton'));
      expect(onChange).not.toHaveBeenCalled();
      expect(screen.getByRole('spinbutton')).toHaveValue(50);
    });

    it('空欄のままblurするとmin値にフォールバックする', () => {
      const onChange = jest.fn();
      render(
        <NumberFieldEditor {...defaultProps} value={40} min={20} max={999} onChange={onChange} />
      );

      fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '' } });
      fireEvent.blur(screen.getByRole('spinbutton'));
      expect(onChange).toHaveBeenLastCalledWith(20);
      expect(screen.getByRole('spinbutton')).toHaveValue(20);
    });

    it('min未指定で空欄のままblurすると0にフォールバックする', () => {
      const onChange = jest.fn();
      render(<NumberFieldEditor {...defaultProps} value={40} onChange={onChange} />);

      fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '' } });
      fireEvent.blur(screen.getByRole('spinbutton'));
      expect(onChange).toHaveBeenLastCalledWith(0);
      expect(screen.getByRole('spinbutton')).toHaveValue(0);
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
