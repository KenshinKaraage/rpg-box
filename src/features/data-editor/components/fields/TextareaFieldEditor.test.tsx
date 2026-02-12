import { render, screen, fireEvent } from '@testing-library/react';
import { TextareaFieldEditor } from './TextareaFieldEditor';

describe('TextareaFieldEditor', () => {
  const defaultProps = {
    value: '',
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('表示', () => {
    it('初期値を表示する', () => {
      render(<TextareaFieldEditor {...defaultProps} value="テスト文章" />);
      expect(screen.getByRole('textbox')).toHaveValue('テスト文章');
    });

    it('プレースホルダーが表示される', () => {
      render(<TextareaFieldEditor {...defaultProps} placeholder="説明を入力" />);
      expect(screen.getByPlaceholderText('説明を入力')).toBeInTheDocument();
    });

    it('デフォルトで4行', () => {
      render(<TextareaFieldEditor {...defaultProps} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('rows', '4');
    });

    it('rows を指定できる', () => {
      render(<TextareaFieldEditor {...defaultProps} rows={8} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('rows', '8');
    });
  });

  describe('操作', () => {
    it('テキスト入力で onChange が呼ばれる', () => {
      const onChange = jest.fn();
      render(<TextareaFieldEditor {...defaultProps} onChange={onChange} />);

      fireEvent.change(screen.getByRole('textbox'), { target: { value: '新しいテキスト' } });
      expect(onChange).toHaveBeenCalledWith('新しいテキスト');
    });
  });

  describe('文字数カウンター', () => {
    it('maxLength 設定時にカウンターが表示される', () => {
      render(<TextareaFieldEditor {...defaultProps} value="こんにちは" maxLength={100} />);
      expect(screen.getByText('5 / 100')).toBeInTheDocument();
    });

    it('maxLength 未設定時はカウンターが表示されない', () => {
      render(<TextareaFieldEditor {...defaultProps} value="テスト" />);
      expect(screen.queryByText(/\d+ \/ \d+/)).not.toBeInTheDocument();
    });
  });

  describe('エラー表示', () => {
    it('エラーメッセージが表示される', () => {
      render(<TextareaFieldEditor {...defaultProps} error="入力してください" />);
      expect(screen.getByText('入力してください')).toBeInTheDocument();
    });
  });

  describe('無効状態', () => {
    it('disabled で入力が無効になる', () => {
      render(<TextareaFieldEditor {...defaultProps} disabled />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });
  });
});
