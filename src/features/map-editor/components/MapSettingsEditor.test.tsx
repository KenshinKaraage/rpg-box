/**
 * MapSettingsEditor コンポーネントのテスト
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { MapSettingsEditor } from './MapSettingsEditor';
import type { GameMap } from '@/types/map';

const mockMap: GameMap = {
  id: 'map_1',
  name: 'フィールド',
  width: 40,
  height: 30,
  layers: [
    { id: 'layer_1', name: 'レイヤー1', type: 'tile' },
    { id: 'layer_2', name: 'レイヤー2', type: 'object' },
  ],
};

describe('MapSettingsEditor', () => {
  const defaultProps = {
    map: mockMap,
    onUpdateMap: jest.fn(),
    onAddLayer: jest.fn(),
    onUpdateLayer: jest.fn(),
    onDeleteLayer: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('マップ未選択時にメッセージが表示される', () => {
    render(<MapSettingsEditor {...defaultProps} map={null} />);

    expect(screen.getByText('マップを選択してください')).toBeInTheDocument();
  });

  it('マップ名入力欄に現在の値が表示される', () => {
    render(<MapSettingsEditor {...defaultProps} />);

    const input = screen.getByTestId('map-name-input');
    expect(input).toHaveValue('フィールド');
  });

  it('名前を編集するとonUpdateMapが呼ばれる', () => {
    render(<MapSettingsEditor {...defaultProps} />);

    const input = screen.getByTestId('map-name-input');
    fireEvent.change(input, { target: { value: '草原' } });

    expect(defaultProps.onUpdateMap).toHaveBeenCalledWith('map_1', { name: '草原' });
  });

  it('幅と高さの入力欄が表示される', () => {
    render(<MapSettingsEditor {...defaultProps} />);

    const widthInput = screen.getByTestId('map-width-input');
    const heightInput = screen.getByTestId('map-height-input');

    expect(widthInput).toHaveValue(40);
    expect(heightInput).toHaveValue(30);
  });

  it('レイヤー一覧が表示される', () => {
    render(<MapSettingsEditor {...defaultProps} />);

    expect(screen.getByTestId('layer-item-layer_1')).toBeInTheDocument();
    expect(screen.getByTestId('layer-item-layer_2')).toBeInTheDocument();
  });

  it('レイヤー追加ボタンでonAddLayerが呼ばれる', () => {
    render(<MapSettingsEditor {...defaultProps} />);

    fireEvent.click(screen.getByTestId('add-layer-button'));

    expect(defaultProps.onAddLayer).toHaveBeenCalledWith('map_1', {
      id: 'layer_3',
      name: 'レイヤー3',
      type: 'tile',
    });
  });

  it('レイヤー削除ボタンでonDeleteLayerが呼ばれる', () => {
    render(<MapSettingsEditor {...defaultProps} />);

    fireEvent.click(screen.getByTestId('delete-layer-layer_1'));

    expect(defaultProps.onDeleteLayer).toHaveBeenCalledWith('map_1', 'layer_1');
  });

  it('BGM未設定時に「未設定」と表示される', () => {
    render(<MapSettingsEditor {...defaultProps} />);

    expect(screen.getByTestId('bgm-display')).toHaveTextContent('未設定');
  });

  it('BGM設定時にIDが表示される', () => {
    const mapWithBgm = { ...mockMap, bgmId: 'bgm_battle' };
    render(<MapSettingsEditor {...defaultProps} map={mapWithBgm} />);

    expect(screen.getByTestId('bgm-display')).toHaveTextContent('bgm_battle');
  });
});
