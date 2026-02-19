/**
 * MapList コンポーネントのテスト
 */

// DOMRect polyfill for Radix ContextMenu
if (typeof DOMRect === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).DOMRect = class DOMRect {
    x: number;
    y: number;
    width: number;
    height: number;
    top: number;
    right: number;
    bottom: number;
    left: number;
    constructor(x = 0, y = 0, width = 0, height = 0) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
      this.top = y;
      this.right = x + width;
      this.bottom = y + height;
      this.left = x;
    }
    toJSON() {
      return { x: this.x, y: this.y, width: this.width, height: this.height };
    }
    static fromRect(rect?: { x?: number; y?: number; width?: number; height?: number }) {
      return new DOMRect(rect?.x ?? 0, rect?.y ?? 0, rect?.width ?? 0, rect?.height ?? 0);
    }
  };
}

import { render, screen, fireEvent } from '@testing-library/react';
import { MapList } from './MapList';
import type { GameMap } from '@/types/map';

const mockMaps: GameMap[] = [
  {
    id: 'map_1',
    name: 'フィールド',
    width: 40,
    height: 30,
    layers: [
      { id: 'layer_1', name: 'レイヤー1', type: 'tile' },
      { id: 'layer_2', name: 'レイヤー2', type: 'object' },
    ],
  },
  {
    id: 'map_2',
    name: 'ダンジョン',
    width: 20,
    height: 15,
    layers: [{ id: 'layer_3', name: 'レイヤー1', type: 'tile' }],
  },
];

describe('MapList', () => {
  const defaultProps = {
    maps: mockMaps,
    selectedId: null,
    onSelect: jest.fn(),
    onAdd: jest.fn(),
    onDelete: jest.fn(),
    onDuplicate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('マップ名が表示される', () => {
    render(<MapList {...defaultProps} />);

    expect(screen.getByText('フィールド')).toBeInTheDocument();
    expect(screen.getByText('ダンジョン')).toBeInTheDocument();
  });

  it('サイズとレイヤー数が表示される', () => {
    render(<MapList {...defaultProps} />);

    expect(screen.getByText('40x30 · 2 レイヤー')).toBeInTheDocument();
    expect(screen.getByText('20x15 · 1 レイヤー')).toBeInTheDocument();
  });

  it('空の場合はメッセージが表示される', () => {
    render(<MapList {...defaultProps} maps={[]} />);

    expect(screen.getByText('マップがありません')).toBeInTheDocument();
  });

  it('追加ボタンをクリックするとonAddが呼ばれる', () => {
    render(<MapList {...defaultProps} />);

    fireEvent.click(screen.getByTestId('add-map-button'));

    expect(defaultProps.onAdd).toHaveBeenCalledTimes(1);
  });

  it('マップをクリックするとonSelectが呼ばれる', () => {
    render(<MapList {...defaultProps} />);

    fireEvent.click(screen.getByTestId('map-item-map_1'));

    expect(defaultProps.onSelect).toHaveBeenCalledWith('map_1');
  });

  it('選択中のマップがハイライトされる', () => {
    render(<MapList {...defaultProps} selectedId="map_1" />);

    const selectedItem = screen.getByTestId('map-item-map_1');
    expect(selectedItem).toHaveClass('bg-accent');
  });

  it('コンテキストメニューの削除でonDeleteが呼ばれる', () => {
    render(<MapList {...defaultProps} />);

    const item = screen.getByTestId('map-item-map_1');
    fireEvent.contextMenu(item);

    const deleteItems = screen.getAllByText('削除');
    fireEvent.click(deleteItems[0]!);

    expect(defaultProps.onDelete).toHaveBeenCalledWith('map_1');
  });

  it('コンテキストメニューの複製でonDuplicateが呼ばれる', () => {
    render(<MapList {...defaultProps} />);

    const item = screen.getByTestId('map-item-map_1');
    fireEvent.contextMenu(item);

    const duplicateItems = screen.getAllByText('複製');
    fireEvent.click(duplicateItems[0]!);

    expect(defaultProps.onDuplicate).toHaveBeenCalledWith('map_1');
  });
});
