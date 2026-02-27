import { render, screen, fireEvent } from '@testing-library/react';
import { CallTemplateActionBlock } from './CallTemplateActionBlock';
import { CallTemplateAction } from '@/engine/actions/CallTemplateAction';

describe('CallTemplateActionBlock', () => {
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

  it('テンプレートIDが表示される', () => {
    render(<CallTemplateActionBlock {...createProps('my-template')} />);
    expect(screen.getByTestId('template-id-input')).toHaveValue('my-template');
  });

  it('テンプレートIDを変更するとonChangeが呼ばれる', () => {
    const props = createProps();
    render(<CallTemplateActionBlock {...props} />);
    fireEvent.change(screen.getByTestId('template-id-input'), {
      target: { value: 'new-template' },
    });
    expect(props.onChange).toHaveBeenCalledTimes(1);
    const updated = props.onChange.mock.calls[0]![0] as CallTemplateAction;
    expect(updated.templateId).toBe('new-template');
    expect(updated.type).toBe('callTemplate');
  });

  it('削除ボタンをクリックするとonDeleteが呼ばれる', () => {
    const props = createProps();
    render(<CallTemplateActionBlock {...props} />);
    fireEvent.click(screen.getByTestId('delete-action'));
    expect(props.onDelete).toHaveBeenCalledTimes(1);
  });
});
