import { render, screen, fireEvent } from '@testing-library/react';
import { MapActionBlock } from './MapActionBlock';
import { MapAction } from '@/engine/actions/MapAction';
import { useStore } from '@/stores';

jest.mock('@/stores', () => ({
  useStore: jest.fn(),
}));

const mockMaps = [
  { id: 'map-001', name: 'フィールド' },
  { id: 'src-map', name: 'ダンジョン' },
];

const mockVariables = [
  { id: 'result-var', name: '結果', fieldType: {}, isArray: false, initialValue: 0 },
];

describe('MapActionBlock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useStore as unknown as jest.Mock).mockImplementation((selector: (state: unknown) => unknown) =>
      selector({ maps: mockMaps, variables: mockVariables })
    );
  });

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

  it('デフォルト操作(changeMap)でマップ名が表示される', () => {
    render(<MapActionBlock {...createProps('changeMap')} />);
    expect(screen.getByTestId('target-map-select')).toHaveTextContent('フィールド');
    expect(screen.getByTestId('x-input')).toHaveValue(10);
    expect(screen.getByTestId('y-input')).toHaveValue(20);
  });

  it('操作をgetChipに変更するとフィールドが切り替わる', () => {
    const props = createProps('getChip');
    render(<MapActionBlock {...props} />);
    expect(screen.getByTestId('source-map-select')).toHaveTextContent('ダンジョン');
    expect(screen.getByTestId('chip-x-input')).toHaveValue(5);
    expect(screen.getByTestId('chip-y-input')).toHaveValue(6);
    expect(screen.getByTestId('layer-input')).toHaveValue(0);
    expect(screen.getByTestId('result-variable-select')).toHaveTextContent('結果');
    expect(screen.queryByTestId('target-map-select')).not.toBeInTheDocument();
  });

  it('ストアからマップと変数が取得される', () => {
    render(<MapActionBlock {...createProps()} />);
    expect(useStore).toHaveBeenCalled();
  });

  it('クローンがクラスインスタンスを保持する', () => {
    const props = createProps('changeMap');
    render(<MapActionBlock {...props} />);
    // Trigger onChange via x input (still an Input element)
    fireEvent.change(screen.getByTestId('x-input'), {
      target: { value: '99' },
    });
    const updated = props.onChange.mock.calls[0]![0];
    expect(updated).toBeInstanceOf(MapAction);
    expect(updated.x).toBe(99);
  });

  it('削除ボタンをクリックするとonDeleteが呼ばれる', () => {
    const props = createProps();
    render(<MapActionBlock {...props} />);
    fireEvent.click(screen.getByTestId('delete-action'));
    expect(props.onDelete).toHaveBeenCalledTimes(1);
  });

  it('マップが空の場合でもセレクトが表示される', () => {
    (useStore as unknown as jest.Mock).mockImplementation((selector: (state: unknown) => unknown) =>
      selector({ maps: [], variables: [] })
    );
    const props = createProps('changeMap');
    props.action.targetMapId = '';
    render(<MapActionBlock {...props} />);
    expect(screen.getByTestId('target-map-select')).toBeInTheDocument();
  });

  it('変数が空の場合でもセレクトが表示される', () => {
    (useStore as unknown as jest.Mock).mockImplementation((selector: (state: unknown) => unknown) =>
      selector({ maps: [], variables: [] })
    );
    const props = createProps('getChip');
    props.action.resultVariableId = '';
    render(<MapActionBlock {...props} />);
    expect(screen.getByTestId('result-variable-select')).toBeInTheDocument();
  });
});
