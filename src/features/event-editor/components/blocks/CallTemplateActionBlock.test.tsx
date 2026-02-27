import { render, screen, fireEvent } from '@testing-library/react';
import { CallTemplateActionBlock } from './CallTemplateActionBlock';
import { CallTemplateAction } from '@/engine/actions/CallTemplateAction';
import { useStore } from '@/stores';

jest.mock('@/stores', () => ({
  useStore: jest.fn(),
}));

const mockTemplates = [
  { id: 'tpl-001', name: '宝箱イベント', args: [], actions: [] },
  { id: 'tpl-002', name: '会話イベント', args: [], actions: [] },
];

describe('CallTemplateActionBlock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useStore as unknown as jest.Mock).mockImplementation((selector: (state: unknown) => unknown) =>
      selector({ eventTemplates: mockTemplates })
    );
  });

  const createProps = (templateId = 'tpl-001') => {
    const action = new CallTemplateAction();
    action.templateId = templateId;
    return {
      action,
      onChange: jest.fn(),
      onDelete: jest.fn(),
    };
  };

  it('テンプレート呼出ラベルが表示される', () => {
    render(<CallTemplateActionBlock {...createProps()} />);
    expect(screen.getByText('テンプレート呼出')).toBeInTheDocument();
  });

  it('選択されたテンプレート名が表示される', () => {
    render(<CallTemplateActionBlock {...createProps('tpl-001')} />);
    expect(screen.getByTestId('template-select')).toHaveTextContent('宝箱イベント');
  });

  it('テンプレートが未選択の場合プレースホルダーが表示される', () => {
    render(<CallTemplateActionBlock {...createProps('')} />);
    expect(screen.getByTestId('template-select')).toHaveTextContent('テンプレートを選択...');
  });

  it('ストアからテンプレート一覧を取得する', () => {
    render(<CallTemplateActionBlock {...createProps()} />);
    expect(useStore).toHaveBeenCalled();
  });

  it('削除ボタンをクリックするとonDeleteが呼ばれる', () => {
    const props = createProps();
    render(<CallTemplateActionBlock {...props} />);
    fireEvent.click(screen.getByTestId('delete-action'));
    expect(props.onDelete).toHaveBeenCalledTimes(1);
  });
});
