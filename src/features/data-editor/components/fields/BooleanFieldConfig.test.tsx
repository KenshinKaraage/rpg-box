import { render, screen, fireEvent } from '@testing-library/react';
import { BooleanFieldConfig } from './BooleanFieldConfig';

describe('BooleanFieldConfig', () => {
  const defaultProps = {
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('表示', () => {
    it('チェックボックスラベル設定欄のラベルが表示される', () => {
      render(<BooleanFieldConfig {...defaultProps} />);
      expect(screen.getByText('チェックボックスラベル')).toBeInTheDocument();
    });

    it('テキスト入力欄が表示される', () => {
      render(<BooleanFieldConfig {...defaultProps} />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('checkboxLabel が設定されている場合は入力欄に値が表示される', () => {
      render(<BooleanFieldConfig {...defaultProps} checkboxLabel="有効にする" />);
      expect(screen.getByRole('textbox')).toHaveValue('有効にする');
    });

    it('checkboxLabel が未設定の場合は入力欄が空になる', () => {
      render(<BooleanFieldConfig {...defaultProps} />);
      expect(screen.getByRole('textbox')).toHaveValue('');
    });

    it('入力欄のプレースホルダーが表示される', () => {
      render(<BooleanFieldConfig {...defaultProps} />);
      expect(
        screen.getByPlaceholderText('チェックボックスの横に表示するテキスト')
      ).toBeInTheDocument();
    });
  });

  describe('操作', () => {
    it('ラベルを入力すると onChange が { checkboxLabel: string } で呼ばれる', () => {
      const onChange = jest.fn();
      render(<BooleanFieldConfig onChange={onChange} />);

      fireEvent.change(screen.getByRole('textbox'), { target: { value: '機能を有効化' } });
      expect(onChange).toHaveBeenCalledWith({ checkboxLabel: '機能を有効化' });
    });

    it('入力を空にすると onChange が { checkboxLabel: undefined } で呼ばれる', () => {
      const onChange = jest.fn();
      render(<BooleanFieldConfig onChange={onChange} checkboxLabel="既存のラベル" />);

      fireEvent.change(screen.getByRole('textbox'), { target: { value: '' } });
      expect(onChange).toHaveBeenCalledWith({ checkboxLabel: undefined });
    });
  });
});
