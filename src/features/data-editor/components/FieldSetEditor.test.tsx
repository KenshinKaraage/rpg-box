/**
 * フィールドセットエディタコンポーネントのテスト
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { FieldSetEditor } from './FieldSetEditor';
import type { FieldSet } from '@/types/fieldSet';

const mockFieldSet: FieldSet = {
  id: 'fs_status',
  name: 'ステータス',
  fields: [],
  description: 'キャラクターのステータス',
};

describe('FieldSetEditor', () => {
  const defaultProps = {
    fieldSet: mockFieldSet,
    onUpdate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('フィールドセットが未選択の場合はメッセージを表示する', () => {
    render(<FieldSetEditor {...defaultProps} fieldSet={null} />);

    expect(screen.getByText('フィールドセットを選択してください')).toBeInTheDocument();
  });

  it('フィールドセットIDを表示する', () => {
    render(<FieldSetEditor {...defaultProps} />);

    expect(screen.getByDisplayValue('fs_status')).toBeInTheDocument();
  });

  it('フィールドセット名を表示する', () => {
    render(<FieldSetEditor {...defaultProps} />);

    expect(screen.getByDisplayValue('ステータス')).toBeInTheDocument();
  });

  it('名前を変更するとonUpdateが呼ばれる', () => {
    render(<FieldSetEditor {...defaultProps} />);

    const nameInput = screen.getByLabelText('フィールドセット名');
    fireEvent.change(nameInput, { target: { value: '新しい名前' } });

    expect(defaultProps.onUpdate).toHaveBeenCalledWith('fs_status', { name: '新しい名前' });
  });

  it('説明を変更するとonUpdateが呼ばれる', () => {
    render(<FieldSetEditor {...defaultProps} />);

    const descInput = screen.getByLabelText('説明（オプション）');
    fireEvent.change(descInput, { target: { value: '新しい説明' } });

    expect(defaultProps.onUpdate).toHaveBeenCalledWith('fs_status', { description: '新しい説明' });
  });

  it('フィールドがない場合はメッセージを表示する', () => {
    render(<FieldSetEditor {...defaultProps} />);

    expect(screen.getByText('フィールドがありません')).toBeInTheDocument();
  });

  it('フィールド追加ボタンを表示する', () => {
    render(<FieldSetEditor {...defaultProps} />);

    expect(screen.getByText('フィールド追加')).toBeInTheDocument();
  });
});
