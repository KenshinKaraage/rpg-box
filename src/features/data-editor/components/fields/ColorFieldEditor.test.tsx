import { render, screen, fireEvent } from '@testing-library/react';
import { ColorFieldEditor } from './ColorFieldEditor';

describe('ColorFieldEditor', () => {
  const defaultProps = {
    value: '#ff0000',
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('表示', () => {
    it('カラーピッカーが表示される', () => {
      const { container } = render(<ColorFieldEditor {...defaultProps} />);
      const colorInput = container.querySelector('input[type="color"]');
      expect(colorInput).toBeInTheDocument();
      expect(colorInput).toHaveValue('#ff0000');
    });

    it('showHexInput=false で HEX テキストが表示される', () => {
      render(<ColorFieldEditor {...defaultProps} />);
      expect(screen.getByText('#ff0000')).toBeInTheDocument();
    });

    it('showHexInput=true で HEX 入力欄が表示される', () => {
      render(<ColorFieldEditor {...defaultProps} showHexInput />);
      const textInput = screen.getByPlaceholderText('#000000');
      expect(textInput).toHaveValue('#ff0000');
      expect(screen.queryByText('#ff0000')).not.toBeInTheDocument();
    });
  });

  describe('操作', () => {
    it('カラーピッカー変更で onChange が呼ばれる', () => {
      const onChange = jest.fn();
      const { container } = render(<ColorFieldEditor {...defaultProps} onChange={onChange} />);

      const colorInput = container.querySelector('input[type="color"]')!;
      fireEvent.change(colorInput, { target: { value: '#00ff00' } });
      expect(onChange).toHaveBeenCalledWith('#00ff00');
    });

    it('HEX 入力変更で onChange が呼ばれる', () => {
      const onChange = jest.fn();
      render(<ColorFieldEditor {...defaultProps} onChange={onChange} showHexInput />);

      const textInput = screen.getByPlaceholderText('#000000');
      fireEvent.change(textInput, { target: { value: '#0000ff' } });
      expect(onChange).toHaveBeenCalledWith('#0000ff');
    });
  });

  describe('エラー表示', () => {
    it('エラーメッセージが表示される', () => {
      render(<ColorFieldEditor {...defaultProps} error="無効な色" />);
      expect(screen.getByText('無効な色')).toBeInTheDocument();
    });
  });

  describe('無効状態', () => {
    it('disabled でカラーピッカーが無効になる', () => {
      const { container } = render(<ColorFieldEditor {...defaultProps} disabled />);
      const colorInput = container.querySelector('input[type="color"]');
      expect(colorInput).toBeDisabled();
    });
  });
});
