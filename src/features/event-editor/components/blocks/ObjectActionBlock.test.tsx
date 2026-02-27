import { render, screen, fireEvent } from '@testing-library/react';
import { ObjectActionBlock } from './ObjectActionBlock';
import { ObjectAction } from '@/engine/actions/ObjectAction';

describe('ObjectActionBlock', () => {
  const createProps = (operation: ObjectAction['operation'] = 'move') => {
    const action = new ObjectAction();
    action.targetId = 'obj-001';
    action.operation = operation;
    action.x = 5;
    action.y = 10;
    action.speed = 3;
    action.angle = 90;
    action.duration = 30;
    action.enabled = true;
    return {
      action,
      onChange: jest.fn(),
      onDelete: jest.fn(),
    };
  };

  it('オブジェクト操作ラベルが表示される', () => {
    render(<ObjectActionBlock {...createProps()} />);
    expect(screen.getByText('オブジェクト操作')).toBeInTheDocument();
  });

  it('対象IDが表示される', () => {
    render(<ObjectActionBlock {...createProps()} />);
    expect(screen.getByTestId('target-id-input')).toHaveValue('obj-001');
  });

  it('デフォルト操作(move)でx, yが表示される', () => {
    render(<ObjectActionBlock {...createProps('move')} />);
    expect(screen.getByTestId('x-input')).toHaveValue(5);
    expect(screen.getByTestId('y-input')).toHaveValue(10);
    expect(screen.getByTestId('speed-input')).toHaveValue(3);
  });

  it('プロパティを変更するとonChangeが呼ばれる', () => {
    const props = createProps();
    render(<ObjectActionBlock {...props} />);
    fireEvent.change(screen.getByTestId('target-id-input'), {
      target: { value: 'obj-002' },
    });
    expect(props.onChange).toHaveBeenCalledTimes(1);
    const updated = props.onChange.mock.calls[0]![0] as ObjectAction;
    expect(updated.targetId).toBe('obj-002');
    expect(updated.type).toBe('object');
  });

  it('削除ボタンをクリックするとonDeleteが呼ばれる', () => {
    const props = createProps();
    render(<ObjectActionBlock {...props} />);
    fireEvent.click(screen.getByTestId('delete-action'));
    expect(props.onDelete).toHaveBeenCalledTimes(1);
  });
});
