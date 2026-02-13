import { render, screen, fireEvent } from '@testing-library/react';
import { NumberFieldConfig } from './NumberFieldConfig';

describe('NumberFieldConfig', () => {
  const defaultProps = {
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('表示', () => {
    it('最小値・最大値・ステップのラベルが表示される', () => {
      render(<NumberFieldConfig {...defaultProps} />);
      expect(screen.getByText('最小値')).toBeInTheDocument();
      expect(screen.getByText('最大値')).toBeInTheDocument();
      expect(screen.getByText('ステップ')).toBeInTheDocument();
    });

    it('3つの数値入力欄が表示される', () => {
      render(<NumberFieldConfig {...defaultProps} />);
      const inputs = screen.getAllByRole('spinbutton');
      expect(inputs).toHaveLength(3);
    });

    it('min が設定されている場合は入力欄に値が表示される', () => {
      render(<NumberFieldConfig {...defaultProps} min={0} />);
      const [minInput] = screen.getAllByRole('spinbutton');
      expect(minInput).toHaveValue(0);
    });

    it('max が設定されている場合は入力欄に値が表示される', () => {
      render(<NumberFieldConfig {...defaultProps} max={100} />);
      const [, maxInput] = screen.getAllByRole('spinbutton');
      expect(maxInput).toHaveValue(100);
    });

    it('step が設定されている場合は入力欄に値が表示される', () => {
      render(<NumberFieldConfig {...defaultProps} step={5} />);
      const [, , stepInput] = screen.getAllByRole('spinbutton');
      expect(stepInput).toHaveValue(5);
    });

    it('値が未設定の場合は入力欄が空になる', () => {
      render(<NumberFieldConfig {...defaultProps} />);
      const inputs = screen.getAllByRole('spinbutton');
      inputs.forEach((input) => {
        expect(input).toHaveValue(null);
      });
    });

    it('最小値入力欄のプレースホルダーが表示される', () => {
      render(<NumberFieldConfig {...defaultProps} />);
      expect(screen.getAllByPlaceholderText('なし')).toHaveLength(2);
    });

    it('ステップ入力欄のプレースホルダーが表示される', () => {
      render(<NumberFieldConfig {...defaultProps} />);
      expect(screen.getByPlaceholderText('1')).toBeInTheDocument();
    });
  });

  describe('操作', () => {
    it('最小値を入力すると onChange が { min: number } で呼ばれる', () => {
      const onChange = jest.fn();
      render(<NumberFieldConfig onChange={onChange} />);

      const [minInput] = screen.getAllByRole('spinbutton');
      fireEvent.change(minInput!, { target: { value: '10' } });
      expect(onChange).toHaveBeenCalledWith({ min: 10 });
    });

    it('最大値を入力すると onChange が { max: number } で呼ばれる', () => {
      const onChange = jest.fn();
      render(<NumberFieldConfig onChange={onChange} />);

      const [, maxInput] = screen.getAllByRole('spinbutton');
      fireEvent.change(maxInput!, { target: { value: '999' } });
      expect(onChange).toHaveBeenCalledWith({ max: 999 });
    });

    it('ステップを入力すると onChange が { step: number } で呼ばれる', () => {
      const onChange = jest.fn();
      render(<NumberFieldConfig onChange={onChange} />);

      const [, , stepInput] = screen.getAllByRole('spinbutton');
      fireEvent.change(stepInput!, { target: { value: '5' } });
      expect(onChange).toHaveBeenCalledWith({ step: 5 });
    });

    it('最小値入力を空にすると onChange が { min: undefined } で呼ばれる', () => {
      const onChange = jest.fn();
      render(<NumberFieldConfig onChange={onChange} min={10} />);

      const [minInput] = screen.getAllByRole('spinbutton');
      fireEvent.change(minInput!, { target: { value: '' } });
      expect(onChange).toHaveBeenCalledWith({ min: undefined });
    });

    it('最大値入力を空にすると onChange が { max: undefined } で呼ばれる', () => {
      const onChange = jest.fn();
      render(<NumberFieldConfig onChange={onChange} max={100} />);

      const [, maxInput] = screen.getAllByRole('spinbutton');
      fireEvent.change(maxInput!, { target: { value: '' } });
      expect(onChange).toHaveBeenCalledWith({ max: undefined });
    });

    it('ステップ入力を空にすると onChange が { step: undefined } で呼ばれる', () => {
      const onChange = jest.fn();
      render(<NumberFieldConfig onChange={onChange} step={5} />);

      const [, , stepInput] = screen.getAllByRole('spinbutton');
      fireEvent.change(stepInput!, { target: { value: '' } });
      expect(onChange).toHaveBeenCalledWith({ step: undefined });
    });
  });
});
