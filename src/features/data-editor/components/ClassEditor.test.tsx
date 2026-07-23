/**
 * ClassEditor コンポーネントのテスト
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ClassEditor } from './ClassEditor';
import { useStore } from '@/stores';
import type { CustomClass } from '@/types/customClass';
import { NumberFieldType, StringFieldType } from '@/types/fields';

// ResizeObserver mock for Radix UI components
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// テスト用のFieldTypeインスタンスを作成
const numberField = new NumberFieldType();
numberField.id = 'field_hp';
numberField.name = 'HP';

const stringField = new StringFieldType();
stringField.id = 'field_name';
stringField.name = '名前';

const mockClass: CustomClass = {
  id: 'class_status',
  name: 'ステータス',
  fields: [numberField, stringField],
  description: 'ステータス用のクラス',
};

describe('ClassEditor', () => {
  const defaultProps = {
    customClass: mockClass,
    onUpdateClass: jest.fn(),
    onAddField: jest.fn(),
    onReplaceField: jest.fn(),
    onDeleteField: jest.fn(),
    onReorderFields: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useStore.setState({ classes: [mockClass] });
  });

  it('クラスが未選択の場合はプレースホルダーが表示される', () => {
    render(<ClassEditor {...defaultProps} customClass={null} />);

    expect(screen.getByText('クラスを選択してください')).toBeInTheDocument();
  });

  it('クラスの情報が表示される', () => {
    render(<ClassEditor {...defaultProps} />);

    expect(screen.getByDisplayValue('class_status')).toBeInTheDocument();
    expect(screen.getByDisplayValue('ステータス')).toBeInTheDocument();
    expect(screen.getByDisplayValue('ステータス用のクラス')).toBeInTheDocument();
  });

  it('クラス名を変更するとonUpdateClassが呼ばれる', async () => {
    render(<ClassEditor {...defaultProps} />);

    const nameInput = screen.getByLabelText('クラス名');
    fireEvent.change(nameInput, { target: { value: '新しい名前' } });

    await waitFor(() => {
      expect(defaultProps.onUpdateClass).toHaveBeenCalledWith('class_status', {
        name: '新しい名前',
      });
    });
  });

  it('フィールド追加ボタンをクリックするとonAddFieldが呼ばれる', () => {
    render(<ClassEditor {...defaultProps} />);

    fireEvent.click(screen.getByText('フィールド追加'));

    expect(defaultProps.onAddField).toHaveBeenCalledWith('class_status', expect.any(Object));
  });

  it('フィールド削除ボタンをクリックするとonDeleteFieldが呼ばれる', () => {
    render(<ClassEditor {...defaultProps} />);

    const deleteButtons = screen.getAllByRole('button', { name: /を削除/ });
    fireEvent.click(deleteButtons[0]!);

    expect(defaultProps.onDeleteField).toHaveBeenCalledWith('class_status', 'field_hp');
  });

  it('フィールドがない場合はメッセージが表示される', () => {
    const emptyClass: CustomClass = {
      id: 'class_empty',
      name: '空のクラス',
      fields: [],
    };
    render(<ClassEditor {...defaultProps} customClass={emptyClass} />);

    expect(screen.getByText('フィールドがありません')).toBeInTheDocument();
  });

  describe('Undo連続入力のバッチ化', () => {
    beforeEach(() => {
      useStore.setState({ currentPage: 'classes', undoStacks: {}, redoStacks: {} });
    });

    it('同じフィールドへの連続した onChange は Undo を1件だけ積む', () => {
      render(<ClassEditor {...defaultProps} />);
      const nameInput = screen.getByLabelText('クラス名');

      fireEvent.change(nameInput, { target: { value: 'A' } });
      fireEvent.change(nameInput, { target: { value: 'AB' } });
      fireEvent.change(nameInput, { target: { value: 'ABC' } });

      expect(useStore.getState().undoStacks['classes']).toHaveLength(1);
    });

    it('フォーカスが外れてから再度編集すると別のUndoが積まれる', () => {
      render(<ClassEditor {...defaultProps} />);
      const nameInput = screen.getByLabelText('クラス名');

      fireEvent.change(nameInput, { target: { value: 'A' } });
      fireEvent.blur(nameInput);
      fireEvent.change(nameInput, { target: { value: 'B' } });

      expect(useStore.getState().undoStacks['classes']).toHaveLength(2);
    });

    it('クラスIDの変更（blur確定）は単発でUndoを積む', () => {
      render(<ClassEditor {...defaultProps} />);
      const idInput = screen.getByDisplayValue('class_status');

      fireEvent.change(idInput, { target: { value: 'class_status_2' } });
      fireEvent.blur(idInput);

      expect(useStore.getState().undoStacks['classes']).toHaveLength(1);
    });

    it('フィールド名の連続編集はUndoを1件だけ積む', () => {
      render(<ClassEditor {...defaultProps} />);
      const fieldNameInput = screen.getByDisplayValue('HP');

      fireEvent.change(fieldNameInput, { target: { value: 'H' } });
      fireEvent.change(fieldNameInput, { target: { value: 'HP2' } });

      expect(useStore.getState().undoStacks['classes']).toHaveLength(1);
    });
  });
});
