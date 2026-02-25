/**
 * LayerEditor コンポーネントのテスト
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { LayerEditor } from './LayerEditor';
import type { MapLayer, Chipset } from '@/types/map';

const mockLayers: MapLayer[] = [
  { id: 'layer_1', name: 'レイヤー1', type: 'tile', visible: true, chipsetIds: [] },
  { id: 'layer_2', name: 'レイヤー2', type: 'object', visible: true, chipsetIds: [] },
];

const mockChipsets: Chipset[] = [
  {
    id: 'cs_001',
    name: 'フィールド',
    imageId: '',
    tileWidth: 32,
    tileHeight: 32,
    autotile: false,
    animated: false,
    animFrameCount: 3,
    animIntervalMs: 200,
    fields: [],
    chips: [],
  },
  {
    id: 'cs_002',
    name: '洞窟',
    imageId: '',
    tileWidth: 32,
    tileHeight: 32,
    autotile: true,
    animated: false,
    animFrameCount: 3,
    animIntervalMs: 200,
    fields: [],
    chips: [],
  },
];

const defaultProps = {
  layers: mockLayers,
  chipsets: mockChipsets,
  onAddLayer: jest.fn(),
  onUpdateLayer: jest.fn(),
  onDeleteLayer: jest.fn(),
  onReorderLayers: jest.fn(),
};

describe('LayerEditor', () => {
  beforeEach(() => jest.clearAllMocks());

  it('レイヤー一覧が表示される', () => {
    render(<LayerEditor {...defaultProps} />);
    expect(screen.getByDisplayValue('レイヤー1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('レイヤー2')).toBeInTheDocument();
  });

  it('追加ボタンで onAddLayer が呼ばれる', () => {
    render(<LayerEditor {...defaultProps} />);
    fireEvent.click(screen.getByTestId('add-layer-button'));
    expect(defaultProps.onAddLayer).toHaveBeenCalledTimes(1);
  });

  it('削除ボタンで onDeleteLayer が呼ばれる', () => {
    render(<LayerEditor {...defaultProps} />);
    fireEvent.click(screen.getByTestId('delete-layer-layer_1'));
    expect(defaultProps.onDeleteLayer).toHaveBeenCalledWith('layer_1');
  });

  it('名前変更で onUpdateLayer が呼ばれる', () => {
    render(<LayerEditor {...defaultProps} />);
    const input = screen.getByTestId('layer-name-layer_1');
    fireEvent.change(input, { target: { value: '新しい名前' } });
    expect(defaultProps.onUpdateLayer).toHaveBeenCalledWith('layer_1', { name: '新しい名前' });
  });

  it('表示/非表示トグルで visible が切り替わる', () => {
    render(<LayerEditor {...defaultProps} />);
    fireEvent.click(screen.getByTestId('toggle-visible-layer_1'));
    expect(defaultProps.onUpdateLayer).toHaveBeenCalledWith('layer_1', { visible: false });
  });

  it('visible=false のレイヤーは data-visible=false になる', () => {
    const hiddenLayers: MapLayer[] = [
      { id: 'layer_1', name: 'レイヤー1', type: 'tile', chipsetIds: [], visible: false },
    ];
    render(<LayerEditor {...defaultProps} layers={hiddenLayers} />);
    expect(screen.getByTestId('toggle-visible-layer_1')).toHaveAttribute('data-visible', 'false');
  });

  it('▼ボタンで下のレイヤーと入れ替わる', () => {
    render(<LayerEditor {...defaultProps} />);
    fireEvent.click(screen.getByTestId('move-down-layer_1'));
    expect(defaultProps.onReorderLayers).toHaveBeenCalledWith(0, 1);
  });

  it('▲ボタンで上のレイヤーと入れ替わる', () => {
    render(<LayerEditor {...defaultProps} />);
    fireEvent.click(screen.getByTestId('move-up-layer_2'));
    expect(defaultProps.onReorderLayers).toHaveBeenCalledWith(1, 0);
  });

  it('先頭レイヤーの▲ボタンは disabled', () => {
    render(<LayerEditor {...defaultProps} />);
    expect(screen.getByTestId('move-up-layer_1')).toBeDisabled();
  });

  it('末尾レイヤーの▼ボタンは disabled', () => {
    render(<LayerEditor {...defaultProps} />);
    expect(screen.getByTestId('move-down-layer_2')).toBeDisabled();
  });

  it('tile レイヤーにはチップセット追加セレクトが表示される', () => {
    render(<LayerEditor {...defaultProps} />);
    expect(screen.getByTestId('add-chipset-select-layer_1')).toBeInTheDocument();
  });

  it('object レイヤーにはチップセット追加セレクトが表示されない', () => {
    render(<LayerEditor {...defaultProps} />);
    expect(screen.queryByTestId('add-chipset-select-layer_2')).not.toBeInTheDocument();
  });

  it('割り当て済みチップセットがバッジで表示される', () => {
    const layers: MapLayer[] = [
      { id: 'layer_1', name: 'レイヤー1', type: 'tile', visible: true, chipsetIds: ['cs_001'] },
    ];
    render(<LayerEditor {...defaultProps} layers={layers} />);
    expect(screen.getByText('フィールド')).toBeInTheDocument();
  });

  it('バッジの×ボタンでチップセットが外れる', () => {
    const layers: MapLayer[] = [
      { id: 'layer_1', name: 'レイヤー1', type: 'tile', visible: true, chipsetIds: ['cs_001'] },
    ];
    render(<LayerEditor {...defaultProps} layers={layers} />);
    fireEvent.click(screen.getByTestId('remove-chipset-layer_1-cs_001'));
    expect(defaultProps.onUpdateLayer).toHaveBeenCalledWith('layer_1', { chipsetIds: [] });
  });

  it('全チップセット割り当て済みの場合はセレクトが非表示', () => {
    const layers: MapLayer[] = [
      {
        id: 'layer_1',
        name: 'レイヤー1',
        type: 'tile',
        visible: true,
        chipsetIds: ['cs_001', 'cs_002'],
      },
    ];
    render(<LayerEditor {...defaultProps} layers={layers} />);
    expect(screen.queryByTestId('add-chipset-select-layer_1')).not.toBeInTheDocument();
  });
});
