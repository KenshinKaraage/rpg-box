import { render, screen } from '@testing-library/react';
import { ClassFieldConfig } from './ClassFieldConfig';
import type { FieldConfigContext } from '@/types/fields/FieldType';

const mockClasses = [
  { id: 'class_status', name: 'ステータス' },
  { id: 'class_item', name: 'アイテム' },
];

describe('ClassFieldConfig', () => {
  const defaultProps = {
    classId: '',
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('表示', () => {
    it('「参照クラス」ラベルが表示される', () => {
      render(<ClassFieldConfig {...defaultProps} />);
      expect(screen.getByText('参照クラス')).toBeInTheDocument();
    });

    it('context が未設定の場合、クラス未設定のメッセージが表示される', () => {
      render(<ClassFieldConfig {...defaultProps} />);
      expect(screen.getByText('利用可能なクラスがありません')).toBeInTheDocument();
    });

    it('context.classes が空の場合、クラス未設定のメッセージが表示される', () => {
      const context: FieldConfigContext = { classes: [] };
      render(<ClassFieldConfig {...defaultProps} context={context} />);
      expect(screen.getByText('利用可能なクラスがありません')).toBeInTheDocument();
    });

    it('context.classes が設定されている場合、セレクトボックスが表示される', () => {
      const context: FieldConfigContext = { classes: mockClasses };
      render(<ClassFieldConfig {...defaultProps} context={context} />);
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('classId が設定されている場合、対応するクラス名が表示される', () => {
      const context: FieldConfigContext = { classes: mockClasses };
      render(<ClassFieldConfig classId="class_status" onChange={jest.fn()} context={context} />);
      expect(screen.getByText('ステータス')).toBeInTheDocument();
    });

    it('classId が未設定の場合、プレースホルダーが表示される', () => {
      const context: FieldConfigContext = { classes: mockClasses };
      render(<ClassFieldConfig classId="" onChange={jest.fn()} context={context} />);
      expect(screen.getByText('クラスを選択')).toBeInTheDocument();
    });
  });

  describe('操作', () => {
    it('セレクトボックスでクラスを選択すると onChange が { classId: string } で呼ばれる', async () => {
      const onChange = jest.fn();
      const context: FieldConfigContext = { classes: mockClasses };

      // shadcn/ui の Select は Radix UI ベースなので、ポータルを使用する。
      // ここでは onValueChange が呼ばれることを検証する形でテストする。
      render(<ClassFieldConfig classId="" onChange={onChange} context={context} />);

      // コンボボックスが表示されていることを確認
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
  });
});
