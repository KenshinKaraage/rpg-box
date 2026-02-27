import { render, screen, fireEvent } from '@testing-library/react';
import { ScriptActionBlock } from './ScriptActionBlock';
import { ScriptAction } from '@/engine/actions/ScriptAction';

describe('ScriptActionBlock', () => {
  const createProps = (scriptId = 'script-001') => {
    const action = new ScriptAction();
    action.scriptId = scriptId;
    return {
      action,
      onChange: jest.fn(),
      onDelete: jest.fn(),
    };
  };

  it('スクリプトラベルが表示される', () => {
    render(<ScriptActionBlock {...createProps()} />);
    expect(screen.getByText('スクリプト')).toBeInTheDocument();
  });

  it('スクリプトIDが表示される', () => {
    render(<ScriptActionBlock {...createProps('my-script')} />);
    expect(screen.getByTestId('script-id-input')).toHaveValue('my-script');
  });

  it('スクリプトIDを変更するとonChangeが呼ばれる', () => {
    const props = createProps();
    render(<ScriptActionBlock {...props} />);
    fireEvent.change(screen.getByTestId('script-id-input'), {
      target: { value: 'new-script' },
    });
    expect(props.onChange).toHaveBeenCalledTimes(1);
    const updated = props.onChange.mock.calls[0]![0] as ScriptAction;
    expect(updated.scriptId).toBe('new-script');
    expect(updated.type).toBe('script');
  });

  it('削除ボタンをクリックするとonDeleteが呼ばれる', () => {
    const props = createProps();
    render(<ScriptActionBlock {...props} />);
    fireEvent.click(screen.getByTestId('delete-action'));
    expect(props.onDelete).toHaveBeenCalledTimes(1);
  });
});
