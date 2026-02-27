import { render, screen, fireEvent } from '@testing-library/react';
import { CameraActionBlock } from './CameraActionBlock';
import { CameraAction } from '@/engine/actions/CameraAction';

describe('CameraActionBlock', () => {
  const createProps = (operation: CameraAction['operation'] = 'pan') => {
    const action = new CameraAction();
    action.operation = operation;
    action.x = 10;
    action.y = 20;
    action.scale = 2;
    action.duration = 30;
    action.effect = 'shake';
    action.intensity = 5;
    action.color = '#ff0000';
    return {
      action,
      onChange: jest.fn(),
      onDelete: jest.fn(),
    };
  };

  it('カメララベルが表示される', () => {
    render(<CameraActionBlock {...createProps()} />);
    expect(screen.getByText('カメラ')).toBeInTheDocument();
  });

  it('パン操作でX,Y入力が表示される', () => {
    render(<CameraActionBlock {...createProps('pan')} />);
    expect(screen.getByTestId('x-input')).toBeInTheDocument();
    expect(screen.getByTestId('y-input')).toBeInTheDocument();
    expect(screen.getByTestId('duration-input')).toBeInTheDocument();
  });

  it('操作を変更すると表示フィールドが変わる', () => {
    const props = createProps('pan');
    const { rerender } = render(<CameraActionBlock {...props} />);
    expect(screen.getByTestId('x-input')).toBeInTheDocument();
    expect(screen.queryByTestId('scale-input')).not.toBeInTheDocument();

    // Switch to zoom
    const zoomAction = new CameraAction();
    zoomAction.operation = 'zoom';
    zoomAction.scale = 2;
    rerender(
      <CameraActionBlock action={zoomAction} onChange={props.onChange} onDelete={props.onDelete} />
    );
    expect(screen.getByTestId('scale-input')).toBeInTheDocument();
    expect(screen.queryByTestId('x-input')).not.toBeInTheDocument();
  });

  it('X値を変更するとonChangeが呼ばれる', () => {
    const props = createProps('pan');
    render(<CameraActionBlock {...props} />);
    fireEvent.change(screen.getByTestId('x-input'), { target: { value: '50' } });
    expect(props.onChange).toHaveBeenCalledTimes(1);
    const updated = props.onChange.mock.calls[0]![0] as CameraAction;
    expect(updated.x).toBe(50);
    expect(updated.type).toBe('camera');
    expect(updated).toBeInstanceOf(CameraAction);
  });

  it('エフェクト操作でエフェクト種類セレクトが表示される', () => {
    render(<CameraActionBlock {...createProps('effect')} />);
    expect(screen.getByTestId('effect-select')).toBeInTheDocument();
    expect(screen.getByTestId('intensity-input')).toBeInTheDocument();
    expect(screen.getByTestId('color-input')).toBeInTheDocument();
    expect(screen.getByTestId('duration-input')).toBeInTheDocument();
  });

  it('削除ボタンをクリックするとonDeleteが呼ばれる', () => {
    const props = createProps();
    render(<CameraActionBlock {...props} />);
    fireEvent.click(screen.getByTestId('delete-action'));
    expect(props.onDelete).toHaveBeenCalledTimes(1);
  });
});
