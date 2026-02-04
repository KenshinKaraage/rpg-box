/**
 * フィールドセット一覧コンポーネントのテスト
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { FieldSetList } from './FieldSetList';
import type { FieldSet } from '@/types/fieldSet';

const mockFieldSets: FieldSet[] = [
  { id: 'fs_status', name: 'ステータス', fields: [] },
  { id: 'fs_effect', name: 'エフェクト', fields: [] },
];

describe('FieldSetList', () => {
  const defaultProps = {
    fieldSets: mockFieldSets,
    selectedId: null,
    onSelect: jest.fn(),
    onAdd: jest.fn(),
    onDelete: jest.fn(),
    onDuplicate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('フィールドセット一覧を表示する', () => {
    render(<FieldSetList {...defaultProps} />);

    expect(screen.getByText('ステータス')).toBeInTheDocument();
    expect(screen.getByText('エフェクト')).toBeInTheDocument();
  });

  it('フィールドセットが空の場合はメッセージを表示する', () => {
    render(<FieldSetList {...defaultProps} fieldSets={[]} />);

    expect(screen.getByText('フィールドセットがありません')).toBeInTheDocument();
  });

  it('追加ボタンをクリックするとonAddが呼ばれる', () => {
    render(<FieldSetList {...defaultProps} />);

    fireEvent.click(screen.getByTestId('add-fieldset-button'));

    expect(defaultProps.onAdd).toHaveBeenCalledTimes(1);
  });

  it('フィールドセットをクリックするとonSelectが呼ばれる', () => {
    render(<FieldSetList {...defaultProps} />);

    fireEvent.click(screen.getByTestId('fieldset-item-fs_status'));

    expect(defaultProps.onSelect).toHaveBeenCalledWith('fs_status');
  });

  it('選択中のフィールドセットがハイライトされる', () => {
    render(<FieldSetList {...defaultProps} selectedId="fs_status" />);

    const selectedItem = screen.getByTestId('fieldset-item-fs_status');
    expect(selectedItem).toHaveClass('bg-accent');
  });

  it('フィールド数を表示する', () => {
    const fieldSetsWithFields: FieldSet[] = [
      {
        id: 'fs_status',
        name: 'ステータス',
        fields: [
          {
            type: 'number',
            id: 'hp',
            name: 'HP',
          } as unknown as import('@/types/fields/FieldType').FieldType,
          {
            type: 'number',
            id: 'mp',
            name: 'MP',
          } as unknown as import('@/types/fields/FieldType').FieldType,
        ],
      },
    ];

    render(<FieldSetList {...defaultProps} fieldSets={fieldSetsWithFields} />);

    expect(screen.getByText('2 フィールド')).toBeInTheDocument();
  });
});
