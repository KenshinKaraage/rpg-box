import { render, screen, fireEvent } from '@testing-library/react';
import { TextareaFieldConfig } from './TextareaFieldConfig';

describe('TextareaFieldConfig', () => {
  const defaultProps = {
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('表示', () => {
    it('最大文字数ラベルが表示される', () => {
      render(<TextareaFieldConfig {...defaultProps} />);
      expect(screen.getByText('最大文字数')).toBeInTheDocument();
    });

    it('表示行数ラベルが表示される', () => {
      render(<TextareaFieldConfig {...defaultProps} />);
      expect(screen.getByText('表示行数')).toBeInTheDocument();
    });

    it('プレースホルダーラベルが表示される', () => {
      render(<TextareaFieldConfig {...defaultProps} />);
      expect(screen.getByText('プレースホルダー')).toBeInTheDocument();
    });

    it('数値入力欄が2つ表示される（最大文字数と表示行数）', () => {
      render(<TextareaFieldConfig {...defaultProps} />);
      const spinbuttons = screen.getAllByRole('spinbutton');
      expect(spinbuttons).toHaveLength(2);
    });

    it('プレースホルダーテキスト入力欄が表示される', () => {
      render(<TextareaFieldConfig {...defaultProps} />);
      expect(screen.getByPlaceholderText('入力欄に表示するテキスト')).toBeInTheDocument();
    });

    it('maxLength が設定されている場合は入力欄に値が表示される', () => {
      render(<TextareaFieldConfig {...defaultProps} maxLength={500} />);
      const [maxLengthInput] = screen.getAllByRole('spinbutton');
      expect(maxLengthInput).toHaveValue(500);
    });

    it('rows が設定されている場合は入力欄に値が表示される', () => {
      render(<TextareaFieldConfig {...defaultProps} rows={5} />);
      const [, rowsInput] = screen.getAllByRole('spinbutton');
      expect(rowsInput).toHaveValue(5);
    });

    it('maxLength が未設定の場合は入力欄が空になる', () => {
      render(<TextareaFieldConfig {...defaultProps} />);
      const [maxLengthInput] = screen.getAllByRole('spinbutton');
      expect(maxLengthInput).toHaveValue(null);
    });

    it('rows が未設定の場合は入力欄が空になる', () => {
      render(<TextareaFieldConfig {...defaultProps} />);
      const [, rowsInput] = screen.getAllByRole('spinbutton');
      expect(rowsInput).toHaveValue(null);
    });

    it('placeholder が設定されている場合はテキスト入力欄に値が表示される', () => {
      render(<TextareaFieldConfig {...defaultProps} placeholder="説明文を入力" />);
      expect(screen.getByDisplayValue('説明文を入力')).toBeInTheDocument();
    });

    it('最大文字数入力欄のプレースホルダーが表示される', () => {
      render(<TextareaFieldConfig {...defaultProps} />);
      expect(screen.getByPlaceholderText('制限なし')).toBeInTheDocument();
    });

    it('表示行数入力欄のプレースホルダーが表示される', () => {
      render(<TextareaFieldConfig {...defaultProps} />);
      expect(screen.getByPlaceholderText('3')).toBeInTheDocument();
    });
  });

  describe('操作', () => {
    it('最大文字数を入力すると onChange が { maxLength: number } で呼ばれる', () => {
      const onChange = jest.fn();
      render(<TextareaFieldConfig onChange={onChange} />);

      const [maxLengthInput] = screen.getAllByRole('spinbutton');
      fireEvent.change(maxLengthInput!, { target: { value: '200' } });
      expect(onChange).toHaveBeenCalledWith({ maxLength: 200 });
    });

    it('表示行数を入力すると onChange が { rows: number } で呼ばれる', () => {
      const onChange = jest.fn();
      render(<TextareaFieldConfig onChange={onChange} />);

      const [, rowsInput] = screen.getAllByRole('spinbutton');
      fireEvent.change(rowsInput!, { target: { value: '8' } });
      expect(onChange).toHaveBeenCalledWith({ rows: 8 });
    });

    it('プレースホルダーを入力すると onChange が { placeholder: string } で呼ばれる', () => {
      const onChange = jest.fn();
      render(<TextareaFieldConfig onChange={onChange} />);

      fireEvent.change(screen.getByPlaceholderText('入力欄に表示するテキスト'), {
        target: { value: '詳細を入力してください' },
      });
      expect(onChange).toHaveBeenCalledWith({ placeholder: '詳細を入力してください' });
    });

    it('最大文字数を空にすると onChange が { maxLength: undefined } で呼ばれる', () => {
      const onChange = jest.fn();
      render(<TextareaFieldConfig onChange={onChange} maxLength={500} />);

      const [maxLengthInput] = screen.getAllByRole('spinbutton');
      fireEvent.change(maxLengthInput!, { target: { value: '' } });
      expect(onChange).toHaveBeenCalledWith({ maxLength: undefined });
    });

    it('表示行数を空にすると onChange が { rows: undefined } で呼ばれる', () => {
      const onChange = jest.fn();
      render(<TextareaFieldConfig onChange={onChange} rows={5} />);

      const [, rowsInput] = screen.getAllByRole('spinbutton');
      fireEvent.change(rowsInput!, { target: { value: '' } });
      expect(onChange).toHaveBeenCalledWith({ rows: undefined });
    });

    it('プレースホルダーを空にすると onChange が { placeholder: undefined } で呼ばれる', () => {
      const onChange = jest.fn();
      render(<TextareaFieldConfig onChange={onChange} placeholder="既存テキスト" />);

      fireEvent.change(screen.getByPlaceholderText('入力欄に表示するテキスト'), {
        target: { value: '' },
      });
      expect(onChange).toHaveBeenCalledWith({ placeholder: undefined });
    });
  });
});
