import { render, screen, fireEvent } from '@testing-library/react';
import { ObjectActionBlock } from './ObjectActionBlock';
import { ObjectAction } from '@/engine/actions/ObjectAction';

describe('ObjectActionBlock', () => {
  const createProps = (operation: ObjectAction['operation'] = 'move') => {
    const action = new ObjectAction();
    action.targetName = 'NPC';
    action.operation = operation;
    action.x = 5;
    action.y = 10;
    action.direction = 'down';
    action.visible = true;
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

  it('削除ボタンをクリックするとonDeleteが呼ばれる', () => {
    const props = createProps();
    render(<ObjectActionBlock {...props} />);
    fireEvent.click(screen.getByLabelText('削除'));
    expect(props.onDelete).toHaveBeenCalledTimes(1);
  });
});
