/**
 * DataSelectFieldConfig のテスト
 */
import { render, screen } from '@testing-library/react';
import { DataSelectFieldConfig } from './DataSelectFieldConfig';
import type { FieldConfigContext } from '@/types/fields/FieldType';

const mockDataTypes = [
  { id: 'type_character', name: 'キャラクター' },
  { id: 'type_item', name: 'アイテム' },
];

describe('DataSelectFieldConfig', () => {
  const defaultProps = {
    referenceTypeId: '',
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('表示', () => {
    it('「参照データタイプ」ラベルが表示される', () => {
      render(<DataSelectFieldConfig {...defaultProps} />);
      expect(screen.getByText('参照データタイプ')).toBeInTheDocument();
    });

    it('context が未設定の場合、データタイプ未設定のメッセージが表示される', () => {
      render(<DataSelectFieldConfig {...defaultProps} />);
      expect(screen.getByText('利用可能なデータタイプがありません')).toBeInTheDocument();
    });

    it('context.dataTypes が空の場合、データタイプ未設定のメッセージが表示される', () => {
      const context: FieldConfigContext = { dataTypes: [] };
      render(<DataSelectFieldConfig {...defaultProps} context={context} />);
      expect(screen.getByText('利用可能なデータタイプがありません')).toBeInTheDocument();
    });

    it('context.dataTypes が設定されている場合、セレクトボックスが表示される', () => {
      const context: FieldConfigContext = { dataTypes: mockDataTypes };
      render(<DataSelectFieldConfig {...defaultProps} context={context} />);
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('referenceTypeId が設定されている場合、対応するデータタイプ名が表示される', () => {
      const context: FieldConfigContext = { dataTypes: mockDataTypes };
      render(
        <DataSelectFieldConfig
          referenceTypeId="type_character"
          onChange={jest.fn()}
          context={context}
        />
      );
      expect(screen.getByText('キャラクター')).toBeInTheDocument();
    });

    it('referenceTypeId が未設定の場合、プレースホルダーが表示される', () => {
      const context: FieldConfigContext = { dataTypes: mockDataTypes };
      render(<DataSelectFieldConfig referenceTypeId="" onChange={jest.fn()} context={context} />);
      expect(screen.getByText('データタイプを選択')).toBeInTheDocument();
    });
  });

  describe('操作', () => {
    it('セレクトボックスが表示されていることを確認する', () => {
      const onChange = jest.fn();
      const context: FieldConfigContext = { dataTypes: mockDataTypes };

      render(<DataSelectFieldConfig referenceTypeId="" onChange={onChange} context={context} />);

      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
  });
});
