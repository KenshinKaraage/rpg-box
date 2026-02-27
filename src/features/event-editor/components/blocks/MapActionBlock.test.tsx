import { render, screen, fireEvent } from '@testing-library/react';
import { MapActionBlock } from './MapActionBlock';
import { MapAction } from '@/engine/actions/MapAction';

describe('MapActionBlock', () => {
  const createProps = (operation: MapAction['operation'] = 'changeMap') => {
    const action = new MapAction();
    action.operation = operation;
    action.targetMapId = 'map-001';
    action.x = 10;
    action.y = 20;
    action.transition = 'fade';
    action.sourceMapId = 'src-map';
    action.chipX = 5;
    action.chipY = 6;
    action.layer = 0;
    action.resultVariableId = 'result-var';
    return {
      action,
      onChange: jest.fn(),
      onDelete: jest.fn(),
    };
  };

  it('マップ操作ラベルが表示される', () => {
    render(<MapActionBlock {...createProps()} />);
    expect(screen.getByText('マップ操作')).toBeInTheDocument();
  });

  it('デフォルト操作(changeMap)でマップIDが表示される', () => {
    render(<MapActionBlock {...createProps('changeMap')} />);
    expect(screen.getByTestId('target-map-id-input')).toHaveValue('map-001');
    expect(screen.getByTestId('x-input')).toHaveValue(10);
    expect(screen.getByTestId('y-input')).toHaveValue(20);
  });

  it('操作をgetChipに変更するとフィールドが切り替わる', () => {
    const props = createProps('getChip');
    render(<MapActionBlock {...props} />);
    expect(screen.getByTestId('source-map-id-input')).toHaveValue('src-map');
    expect(screen.getByTestId('chip-x-input')).toHaveValue(5);
    expect(screen.getByTestId('chip-y-input')).toHaveValue(6);
    expect(screen.getByTestId('layer-input')).toHaveValue(0);
    expect(screen.getByTestId('result-variable-id-input')).toHaveValue('result-var');
    expect(screen.queryByTestId('target-map-id-input')).not.toBeInTheDocument();
  });

  it('プロパティを変更するとonChangeが呼ばれる', () => {
    const props = createProps('changeMap');
    render(<MapActionBlock {...props} />);
    fireEvent.change(screen.getByTestId('target-map-id-input'), {
      target: { value: 'map-002' },
    });
    expect(props.onChange).toHaveBeenCalledTimes(1);
    const updated = props.onChange.mock.calls[0]![0] as MapAction;
    expect(updated.targetMapId).toBe('map-002');
    expect(updated.type).toBe('map');
  });

  it('削除ボタンをクリックするとonDeleteが呼ばれる', () => {
    const props = createProps();
    render(<MapActionBlock {...props} />);
    fireEvent.click(screen.getByTestId('delete-action'));
    expect(props.onDelete).toHaveBeenCalledTimes(1);
  });
});
