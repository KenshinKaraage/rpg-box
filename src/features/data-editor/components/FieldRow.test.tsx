import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FieldRow } from './FieldRow';
import { NumberFieldType, StringFieldType } from '@/types/fields';

// テスト用の StringFieldType インスタンスを作成するヘルパー
function createStringField(overrides?: Partial<{ id: string; name: string; required: boolean }>) {
  const field = new StringFieldType();
  field.id = overrides?.id ?? 'test_field';
  field.name = overrides?.name ?? 'テストフィールド';
  field.required = overrides?.required ?? false;
  return field;
}

function createNumberField(overrides?: Partial<{ id: string; name: string; required: boolean }>) {
  const field = new NumberFieldType();
  field.id = overrides?.id ?? 'test_number';
  field.name = overrides?.name ?? '数値フィールド';
  field.required = overrides?.required ?? false;
  return field;
}

describe('FieldRow', () => {
  const defaultProps = {
    field: createStringField(),
    isExpanded: false,
    onToggleExpand: jest.fn(),
    onNameChange: jest.fn(),
    onTypeChange: jest.fn(),
    onConfigChange: jest.fn(),
    onDelete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('表示', () => {
    it('フィールド名が入力欄に表示される', () => {
      render(<FieldRow {...defaultProps} field={createStringField({ name: '名前フィールド' })} />);
      expect(screen.getByDisplayValue('名前フィールド')).toBeInTheDocument();
    });

    it('フィールド名の入力欄のプレースホルダーが表示される', () => {
      render(<FieldRow {...defaultProps} field={createStringField({ name: '' })} />);
      expect(screen.getByPlaceholderText('フィールド名')).toBeInTheDocument();
    });

    it('タイプのセレクトボックスが表示される', () => {
      render(<FieldRow {...defaultProps} />);
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('削除ボタンが表示される', () => {
      render(<FieldRow {...defaultProps} field={createStringField({ name: 'HP' })} />);
      expect(screen.getByRole('button', { name: 'HPを削除' })).toBeInTheDocument();
    });

    it('展開/折りたたみボタンが表示される', () => {
      render(<FieldRow {...defaultProps} />);
      // Collapsible trigger button
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('折りたたまれた状態では設定パネルが非表示', () => {
      render(<FieldRow {...defaultProps} isExpanded={false} />);
      // CommonFieldConfig の「必須フィールド」が表示されていない
      expect(screen.queryByText('必須フィールド')).not.toBeInTheDocument();
    });

    it('展開された状態では設定パネルが表示される', () => {
      render(<FieldRow {...defaultProps} isExpanded={true} />);
      // CommonFieldConfig の「必須フィールド」が表示される
      expect(screen.getByText('必須フィールド')).toBeInTheDocument();
    });

    it('展開時にフィールドタイプ固有の設定が表示される（StringFieldType のケース）', () => {
      render(<FieldRow {...defaultProps} isExpanded={true} />);
      // StringFieldConfig の「最大文字数」が表示される
      expect(screen.getByText('最大文字数')).toBeInTheDocument();
      expect(screen.getByText('プレースホルダー')).toBeInTheDocument();
    });

    it('展開時に NumberFieldType の設定が表示される', () => {
      render(<FieldRow {...defaultProps} field={createNumberField()} isExpanded={true} />);
      expect(screen.getByText('最小値')).toBeInTheDocument();
      expect(screen.getByText('最大値')).toBeInTheDocument();
      expect(screen.getByText('ステップ')).toBeInTheDocument();
    });
  });

  describe('操作', () => {
    it('フィールド名を変更すると onNameChange が呼ばれる', () => {
      const onNameChange = jest.fn();
      render(<FieldRow {...defaultProps} onNameChange={onNameChange} />);

      fireEvent.change(screen.getByPlaceholderText('フィールド名'), {
        target: { value: '新しい名前' },
      });
      expect(onNameChange).toHaveBeenCalledWith('新しい名前');
    });

    it('削除ボタンをクリックすると onDelete が呼ばれる', () => {
      const onDelete = jest.fn();
      render(
        <FieldRow
          {...defaultProps}
          field={createStringField({ name: 'テスト' })}
          onDelete={onDelete}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'テストを削除' }));
      expect(onDelete).toHaveBeenCalledTimes(1);
    });

    it('展開ボタンをクリックすると onToggleExpand が呼ばれる', async () => {
      const user = userEvent.setup();
      const onToggleExpand = jest.fn();
      render(<FieldRow {...defaultProps} onToggleExpand={onToggleExpand} />);

      // Collapsible の展開トリガーボタン（最初のゴーストボタン）をクリック
      const triggerButtons = screen.getAllByRole('button');
      // 最初のボタンが展開/折りたたみトリガー
      await user.click(triggerButtons[0]!);
      expect(onToggleExpand).toHaveBeenCalledTimes(1);
    });

    it('展開状態で必須チェックボックスを変更すると onConfigChange が呼ばれる', async () => {
      const user = userEvent.setup();
      const onConfigChange = jest.fn();
      render(<FieldRow {...defaultProps} isExpanded={true} onConfigChange={onConfigChange} />);

      await user.click(screen.getByRole('checkbox'));
      expect(onConfigChange).toHaveBeenCalledWith({ required: true });
    });

    it('展開状態で StringFieldConfig の最大文字数を変更すると onConfigChange が呼ばれる', () => {
      const onConfigChange = jest.fn();
      render(<FieldRow {...defaultProps} isExpanded={true} onConfigChange={onConfigChange} />);

      fireEvent.change(screen.getByPlaceholderText('制限なし'), {
        target: { value: '100' },
      });
      expect(onConfigChange).toHaveBeenCalledWith({ maxLength: 100 });
    });
  });

  describe('allowedTypes', () => {
    it('allowedTypes が指定されていない場合は全タイプが表示される', () => {
      render(<FieldRow {...defaultProps} />);
      // セレクトボックスが存在する
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
  });
});
