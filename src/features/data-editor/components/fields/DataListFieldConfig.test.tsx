/**
 * DataListFieldConfig のテスト
 */
import { render, screen } from '@testing-library/react';
import { DataListFieldConfig } from './DataListFieldConfig';
import type { FieldConfigContext } from '@/types/fields/FieldType';

const mockDataTypes = [
  { id: 'tag_type', name: 'タグ' },
  { id: 'item_type', name: 'アイテム' },
];

describe('DataListFieldConfig', () => {
  const defaultProps = {
    referenceTypeId: '',
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('表示', () => {
    it('「参照データタイプ」ラベルが表示される', () => {
      render(<DataListFieldConfig {...defaultProps} />);
      expect(screen.getByText('参照データタイプ')).toBeInTheDocument();
    });

    it('context が未設定の場合、データタイプなしのメッセージが表示される', () => {
      render(<DataListFieldConfig {...defaultProps} />);
      expect(screen.getByText('利用可能なデータタイプがありません')).toBeInTheDocument();
    });

    it('context.dataTypes が空の場合、データタイプなしのメッセージが表示される', () => {
      const context: FieldConfigContext = { dataTypes: [] };
      render(<DataListFieldConfig {...defaultProps} context={context} />);
      expect(screen.getByText('利用可能なデータタイプがありません')).toBeInTheDocument();
    });

    it('context.dataTypes が設定されている場合、セレクトボックスが表示される', () => {
      const context: FieldConfigContext = { dataTypes: mockDataTypes };
      render(<DataListFieldConfig {...defaultProps} context={context} />);
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('referenceTypeId が設定されている場合、対応するデータタイプ名が表示される', () => {
      const context: FieldConfigContext = { dataTypes: mockDataTypes };
      render(
        <DataListFieldConfig referenceTypeId="tag_type" onChange={jest.fn()} context={context} />
      );
      expect(screen.getByText('タグ')).toBeInTheDocument();
    });

    it('referenceTypeId が未設定の場合、プレースホルダーが表示される', () => {
      const context: FieldConfigContext = { dataTypes: mockDataTypes };
      render(<DataListFieldConfig referenceTypeId="" onChange={jest.fn()} context={context} />);
      expect(screen.getByText('データタイプを選択')).toBeInTheDocument();
    });
  });

  describe('操作', () => {
    it('セレクトボックスが表示されていることを確認する', () => {
      const onChange = jest.fn();
      const context: FieldConfigContext = { dataTypes: mockDataTypes };
      render(<DataListFieldConfig referenceTypeId="" onChange={onChange} context={context} />);
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
  });
});
