import { render, screen, fireEvent } from '@testing-library/react';
import { StringFieldConfig } from './StringFieldConfig';

describe('StringFieldConfig', () => {
  const defaultProps = {
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('表示', () => {
    it('最大文字数ラベルが表示される', () => {
      render(<StringFieldConfig {...defaultProps} />);
      expect(screen.getByText('最大文字数')).toBeInTheDocument();
    });

    it('プレースホルダーラベルが表示される', () => {
      render(<StringFieldConfig {...defaultProps} />);
      expect(screen.getByText('プレースホルダー')).toBeInTheDocument();
    });

    it('最大文字数入力欄が表示される（数値型）', () => {
      render(<StringFieldConfig {...defaultProps} />);
      expect(screen.getByRole('spinbutton')).toBeInTheDocument();
    });

    it('プレースホルダーテキスト入力欄が表示される', () => {
      render(<StringFieldConfig {...defaultProps} />);
      expect(screen.getByPlaceholderText('入力欄に表示するテキスト')).toBeInTheDocument();
    });

    it('maxLength が設定されている場合は入力欄に値が表示される', () => {
      render(<StringFieldConfig {...defaultProps} maxLength={100} />);
      expect(screen.getByRole('spinbutton')).toHaveValue(100);
    });

    it('maxLength が未設定の場合は入力欄が空になる', () => {
      render(<StringFieldConfig {...defaultProps} />);
      expect(screen.getByRole('spinbutton')).toHaveValue(null);
    });

    it('placeholder が設定されている場合はテキスト入力欄に値が表示される', () => {
      render(<StringFieldConfig {...defaultProps} placeholder="名前を入力" />);
      expect(screen.getByDisplayValue('名前を入力')).toBeInTheDocument();
    });

    it('placeholder が未設定の場合はテキスト入力欄が空になる', () => {
      render(<StringFieldConfig {...defaultProps} />);
      expect(screen.getByPlaceholderText('入力欄に表示するテキスト')).toHaveValue('');
    });

    it('最大文字数入力欄のプレースホルダーが表示される', () => {
      render(<StringFieldConfig {...defaultProps} />);
      expect(screen.getByPlaceholderText('制限なし')).toBeInTheDocument();
    });
  });

  describe('操作', () => {
    it('最大文字数を入力すると onChange が { maxLength: number } で呼ばれる', () => {
      const onChange = jest.fn();
      render(<StringFieldConfig onChange={onChange} />);

      fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '50' } });
      expect(onChange).toHaveBeenCalledWith({ maxLength: 50 });
    });

    it('最大文字数を空にすると onChange が { maxLength: undefined } で呼ばれる', () => {
      const onChange = jest.fn();
      render(<StringFieldConfig onChange={onChange} maxLength={100} />);

      fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '' } });
      expect(onChange).toHaveBeenCalledWith({ maxLength: undefined });
    });

    it('プレースホルダーを入力すると onChange が { placeholder: string } で呼ばれる', () => {
      const onChange = jest.fn();
      render(<StringFieldConfig onChange={onChange} />);

      fireEvent.change(screen.getByPlaceholderText('入力欄に表示するテキスト'), {
        target: { value: 'キャラクター名' },
      });
      expect(onChange).toHaveBeenCalledWith({ placeholder: 'キャラクター名' });
    });

    it('プレースホルダーを空にすると onChange が { placeholder: undefined } で呼ばれる', () => {
      const onChange = jest.fn();
      render(<StringFieldConfig onChange={onChange} placeholder="既存のテキスト" />);

      fireEvent.change(screen.getByPlaceholderText('入力欄に表示するテキスト'), {
        target: { value: '' },
      });
      expect(onChange).toHaveBeenCalledWith({ placeholder: undefined });
    });
  });
});
