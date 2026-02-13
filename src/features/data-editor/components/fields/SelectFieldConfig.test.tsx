import { render, screen, fireEvent } from '@testing-library/react';
import { SelectFieldConfig } from './SelectFieldConfig';
import type { SelectOption } from '@/types/fields/SelectFieldType';

const mockOptions: SelectOption[] = [
  { value: 'normal', label: '通常' },
  { value: 'rare', label: 'レア' },
];

describe('SelectFieldConfig', () => {
  const defaultProps = {
    options: [],
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('表示', () => {
    it('プレースホルダーラベルが表示される', () => {
      render(<SelectFieldConfig {...defaultProps} />);
      expect(screen.getByText('プレースホルダー')).toBeInTheDocument();
    });

    it('選択肢ラベルが表示される', () => {
      render(<SelectFieldConfig {...defaultProps} />);
      expect(screen.getByText('選択肢')).toBeInTheDocument();
    });

    it('選択肢が空のときメッセージが表示される', () => {
      render(<SelectFieldConfig {...defaultProps} options={[]} />);
      expect(screen.getByText('選択肢がありません')).toBeInTheDocument();
    });

    it('選択肢がある場合に一覧が表示される', () => {
      render(<SelectFieldConfig {...defaultProps} options={mockOptions} />);
      expect(screen.getByDisplayValue('normal')).toBeInTheDocument();
      expect(screen.getByDisplayValue('通常')).toBeInTheDocument();
      expect(screen.getByDisplayValue('rare')).toBeInTheDocument();
      expect(screen.getByDisplayValue('レア')).toBeInTheDocument();
    });

    it('「追加」ボタンが表示される', () => {
      render(<SelectFieldConfig {...defaultProps} />);
      expect(screen.getByRole('button', { name: /追加/ })).toBeInTheDocument();
    });

    it('各選択肢に削除ボタンが表示される', () => {
      render(<SelectFieldConfig {...defaultProps} options={mockOptions} />);
      expect(screen.getByRole('button', { name: '選択肢「通常」を削除' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '選択肢「レア」を削除' })).toBeInTheDocument();
    });

    it('placeholder が設定されている場合は入力欄に値が表示される', () => {
      render(<SelectFieldConfig {...defaultProps} placeholder="選んでください" />);
      expect(screen.getByDisplayValue('選んでください')).toBeInTheDocument();
    });

    it('placeholder が未設定の場合は入力欄が空になる', () => {
      render(<SelectFieldConfig {...defaultProps} />);
      expect(screen.getByPlaceholderText('選択してください')).toHaveValue('');
    });
  });

  describe('操作', () => {
    it('プレースホルダーを入力すると onChange が { placeholder: string } で呼ばれる', () => {
      const onChange = jest.fn();
      render(<SelectFieldConfig options={[]} onChange={onChange} />);

      fireEvent.change(screen.getByPlaceholderText('選択してください'), {
        target: { value: '種類を選んでください' },
      });
      expect(onChange).toHaveBeenCalledWith({ placeholder: '種類を選んでください' });
    });

    it('プレースホルダーを空にすると onChange が { placeholder: undefined } で呼ばれる', () => {
      const onChange = jest.fn();
      render(<SelectFieldConfig options={[]} onChange={onChange} placeholder="既存" />);

      fireEvent.change(screen.getByPlaceholderText('選択してください'), {
        target: { value: '' },
      });
      expect(onChange).toHaveBeenCalledWith({ placeholder: undefined });
    });

    it('「追加」ボタンをクリックすると新しい選択肢が追加される', () => {
      const onChange = jest.fn();
      render(<SelectFieldConfig options={[]} onChange={onChange} />);

      fireEvent.click(screen.getByRole('button', { name: /追加/ }));

      expect(onChange).toHaveBeenCalledTimes(1);
      const call = onChange.mock.calls[0];
      expect(call).toBeDefined();
      const [args] = call!;
      expect(args).toHaveProperty('options');
      const { options } = args as { options: SelectOption[] };
      expect(options).toHaveLength(1);
      expect(options[0]).toMatchObject({ label: '新しい選択肢' });
    });

    it('既存の選択肢がある状態で「追加」ボタンをクリックすると末尾に追加される', () => {
      const onChange = jest.fn();
      render(<SelectFieldConfig options={mockOptions} onChange={onChange} />);

      fireEvent.click(screen.getByRole('button', { name: /追加/ }));

      expect(onChange).toHaveBeenCalledTimes(1);
      const call = onChange.mock.calls[0];
      expect(call).toBeDefined();
      const [args] = call!;
      const { options } = args as { options: SelectOption[] };
      expect(options).toHaveLength(3);
      expect(options[0]).toEqual(mockOptions[0]);
      expect(options[1]).toEqual(mockOptions[1]);
    });

    it('削除ボタンをクリックすると対象の選択肢が削除される', () => {
      const onChange = jest.fn();
      render(<SelectFieldConfig options={mockOptions} onChange={onChange} />);

      fireEvent.click(screen.getByRole('button', { name: '選択肢「通常」を削除' }));

      expect(onChange).toHaveBeenCalledWith({
        options: [{ value: 'rare', label: 'レア' }],
      });
    });

    it('選択肢の値（value）を変更すると onChange が呼ばれる', () => {
      const onChange = jest.fn();
      render(<SelectFieldConfig options={mockOptions} onChange={onChange} />);

      const valueInputs = screen.getAllByPlaceholderText('値');
      fireEvent.change(valueInputs[0]!, { target: { value: 'common' } });

      expect(onChange).toHaveBeenCalledWith({
        options: [
          { value: 'common', label: '通常' },
          { value: 'rare', label: 'レア' },
        ],
      });
    });

    it('選択肢のラベルを変更すると onChange が呼ばれる', () => {
      const onChange = jest.fn();
      render(<SelectFieldConfig options={mockOptions} onChange={onChange} />);

      const labelInputs = screen.getAllByPlaceholderText('ラベル');
      fireEvent.change(labelInputs[0]!, { target: { value: 'コモン' } });

      expect(onChange).toHaveBeenCalledWith({
        options: [
          { value: 'normal', label: 'コモン' },
          { value: 'rare', label: 'レア' },
        ],
      });
    });

    it('2番目の選択肢のラベルを変更すると onChange が正しく呼ばれる', () => {
      const onChange = jest.fn();
      render(<SelectFieldConfig options={mockOptions} onChange={onChange} />);

      const labelInputs = screen.getAllByPlaceholderText('ラベル');
      fireEvent.change(labelInputs[1]!, { target: { value: 'スーパーレア' } });

      expect(onChange).toHaveBeenCalledWith({
        options: [
          { value: 'normal', label: '通常' },
          { value: 'rare', label: 'スーパーレア' },
        ],
      });
    });
  });
});
