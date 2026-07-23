import { render, screen, fireEvent } from '@testing-library/react';
import { EventTemplateEditor } from './EventTemplateEditor';
import { useStore } from '@/stores';
import type { EventTemplate } from '@/types/event';

const mockTemplate: EventTemplate = {
  id: 'template_001',
  name: 'ダメージ計算',
  description: 'ダメージを計算するテンプレート',
  args: [],
  actions: [],
};

describe('EventTemplateEditor', () => {
  const defaultProps = {
    template: mockTemplate,
    existingIds: ['template_001', 'template_002'],
    onUpdate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('テンプレート未選択時はメッセージが表示される', () => {
    render(<EventTemplateEditor {...defaultProps} template={null} />);
    expect(screen.getByText('テンプレートを選択してください')).toBeInTheDocument();
  });

  it('テンプレート情報が表示される', () => {
    render(<EventTemplateEditor {...defaultProps} />);
    expect(screen.getByTestId('template-id-input')).toHaveValue('template_001');
    expect(screen.getByTestId('template-name-input')).toHaveValue('ダメージ計算');
    expect(screen.getByTestId('template-description-input')).toHaveValue(
      'ダメージを計算するテンプレート'
    );
  });

  it('名前を変更するとonUpdateが呼ばれる', () => {
    render(<EventTemplateEditor {...defaultProps} />);
    fireEvent.change(screen.getByTestId('template-name-input'), {
      target: { value: '新しい名前' },
    });
    expect(defaultProps.onUpdate).toHaveBeenCalledWith('template_001', { name: '新しい名前' });
  });

  it('説明を変更するとonUpdateが呼ばれる', () => {
    render(<EventTemplateEditor {...defaultProps} />);
    fireEvent.change(screen.getByTestId('template-description-input'), {
      target: { value: '新しい説明' },
    });
    expect(defaultProps.onUpdate).toHaveBeenCalledWith('template_001', {
      description: '新しい説明',
    });
  });

  it('IDを変更するとonUpdateが呼ばれる', () => {
    render(<EventTemplateEditor {...defaultProps} />);
    const idInput = screen.getByTestId('template-id-input');
    fireEvent.change(idInput, { target: { value: 'new_id' } });
    fireEvent.blur(idInput);
    expect(defaultProps.onUpdate).toHaveBeenCalledWith('template_001', { id: 'new_id' });
  });

  it('引数セクションが表示される', () => {
    render(<EventTemplateEditor {...defaultProps} />);
    expect(screen.getByText('引数')).toBeInTheDocument();
    expect(screen.getByText('引数がありません')).toBeInTheDocument();
  });

  describe('Undo連続入力のバッチ化', () => {
    beforeEach(() => {
      useStore.setState({
        currentPage: 'event',
        undoStacks: {},
        redoStacks: {},
        eventTemplates: [mockTemplate],
      });
    });

    it('同じフィールド（名前）への連続した onChange は Undo を1件だけ積む', () => {
      render(<EventTemplateEditor {...defaultProps} />);
      const nameInput = screen.getByTestId('template-name-input');

      fireEvent.change(nameInput, { target: { value: 'A' } });
      fireEvent.change(nameInput, { target: { value: 'AB' } });
      fireEvent.change(nameInput, { target: { value: 'ABC' } });

      expect(useStore.getState().undoStacks['event']).toHaveLength(1);
    });

    it('フォーカスが外れてから再度編集すると別のUndoが積まれる', () => {
      render(<EventTemplateEditor {...defaultProps} />);
      const nameInput = screen.getByTestId('template-name-input');

      fireEvent.change(nameInput, { target: { value: 'A' } });
      fireEvent.blur(nameInput);
      fireEvent.change(nameInput, { target: { value: 'B' } });

      expect(useStore.getState().undoStacks['event']).toHaveLength(2);
    });

    it('IDの変更（blur確定）は単発でUndoを積む', () => {
      render(<EventTemplateEditor {...defaultProps} />);
      const idInput = screen.getByTestId('template-id-input');

      fireEvent.change(idInput, { target: { value: 'new_id' } });
      fireEvent.blur(idInput);

      expect(useStore.getState().undoStacks['event']).toHaveLength(1);
    });

    it('名前と説明の連続編集は同一セッションで1件にまとまる', () => {
      render(<EventTemplateEditor {...defaultProps} />);
      const nameInput = screen.getByTestId('template-name-input');
      const descriptionInput = screen.getByTestId('template-description-input');

      fireEvent.change(nameInput, { target: { value: 'A' } });
      fireEvent.change(descriptionInput, { target: { value: 'desc' } });

      expect(useStore.getState().undoStacks['event']).toHaveLength(1);
    });
  });
});
