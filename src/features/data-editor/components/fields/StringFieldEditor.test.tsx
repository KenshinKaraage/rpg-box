import { render, screen, fireEvent } from '@testing-library/react';
import { StringFieldEditor } from './StringFieldEditor';

describe('StringFieldEditor', () => {
  const defaultProps = {
    value: '',
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('表示', () => {
    it('初期値を表示する', () => {
      render(<StringFieldEditor {...defaultProps} value="テスト" />);
      expect(screen.getByRole('textbox')).toHaveValue('テスト');
    });

    it('プレースホルダーが表示される', () => {
      render(<StringFieldEditor {...defaultProps} placeholder="名前を入力" />);
      expect(screen.getByPlaceholderText('名前を入力')).toBeInTheDocument();
    });
  });

  describe('操作', () => {
    it('テキスト入力で onChange が呼ばれる', () => {
      const onChange = jest.fn();
      render(<StringFieldEditor {...defaultProps} onChange={onChange} />);

      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'hello' } });
      expect(onChange).toHaveBeenCalledWith('hello');
    });
  });

  describe('文字数カウンター', () => {
    it('maxLength 設定時にカウンターが表示される', () => {
      render(<StringFieldEditor {...defaultProps} value="abc" maxLength={50} />);
      expect(screen.getByText('3 / 50')).toBeInTheDocument();
    });

    it('maxLength 未設定時はカウンターが表示されない', () => {
      render(<StringFieldEditor {...defaultProps} value="abc" />);
      expect(screen.queryByText(/\d+ \/ \d+/)).not.toBeInTheDocument();
    });
  });

  describe('エラー表示', () => {
    it('エラーメッセージが表示される', () => {
      render(<StringFieldEditor {...defaultProps} error="必須です" />);
      expect(screen.getByText('必須です')).toBeInTheDocument();
    });

    it('エラー時にボーダーが赤くなる', () => {
      render(<StringFieldEditor {...defaultProps} error="必須" />);
      expect(screen.getByRole('textbox')).toHaveClass('border-red-500');
    });
  });

  describe('無効状態', () => {
    it('disabled で入力が無効になる', () => {
      render(<StringFieldEditor {...defaultProps} disabled />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });
  });
});
