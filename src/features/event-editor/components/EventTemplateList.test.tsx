/**
 * EventTemplateList コンポーネントのテスト
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { EventTemplateList } from './EventTemplateList';
import type { EventTemplate } from '@/types/event';
import type { EventAction } from '@/engine/actions/EventAction';

const mockAction = { type: 'wait' } as unknown as EventAction;

const mockTemplates: EventTemplate[] = [
  {
    id: 'template_001',
    name: 'ダメージ計算',
    description: 'ダメージ計算テンプレート',
    args: [],
    actions: [mockAction, mockAction],
  },
  {
    id: 'template_002',
    name: 'HP回復',
    description: '',
    args: [],
    actions: [mockAction],
  },
];

describe('EventTemplateList', () => {
  const defaultProps = {
    templates: mockTemplates,
    selectedId: null,
    onSelect: jest.fn(),
    onAdd: jest.fn(),
    onDelete: jest.fn(),
    onDuplicate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('テンプレート名が表示される', () => {
    render(<EventTemplateList {...defaultProps} />);

    expect(screen.getByText('ダメージ計算')).toBeInTheDocument();
    expect(screen.getByText('HP回復')).toBeInTheDocument();
  });

  it('アクション数が表示される', () => {
    render(<EventTemplateList {...defaultProps} />);

    expect(screen.getByText('2 アクション')).toBeInTheDocument();
    expect(screen.getByText('1 アクション')).toBeInTheDocument();
  });

  it('空の場合はメッセージが表示される', () => {
    render(<EventTemplateList {...defaultProps} templates={[]} />);

    expect(screen.getByText('テンプレートがありません')).toBeInTheDocument();
  });

  it('追加ボタンをクリックするとonAddが呼ばれる', () => {
    render(<EventTemplateList {...defaultProps} />);

    fireEvent.click(screen.getByTestId('add-template-button'));

    expect(defaultProps.onAdd).toHaveBeenCalledTimes(1);
  });

  it('テンプレートをクリックするとonSelectが呼ばれる', () => {
    render(<EventTemplateList {...defaultProps} />);

    fireEvent.click(screen.getByTestId('template-item-template_001'));

    expect(defaultProps.onSelect).toHaveBeenCalledWith('template_001');
  });

  it('選択中のテンプレートがハイライトされる', () => {
    render(<EventTemplateList {...defaultProps} selectedId="template_001" />);

    const selectedItem = screen.getByTestId('template-item-template_001');
    expect(selectedItem).toHaveClass('bg-accent');
  });
});
