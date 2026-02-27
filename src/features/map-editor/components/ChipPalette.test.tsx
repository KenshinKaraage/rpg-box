import { render, screen, fireEvent } from '@testing-library/react';
import { ChipPalette } from './ChipPalette';

const mockChipset = {
  id: 'cs1',
  name: 'テストチップセット',
  imageId: 'img1',
  tileWidth: 32,
  tileHeight: 32,
  autotile: false,
  animated: false,
  animFrameCount: 1,
  animIntervalMs: 100,
  fields: [],
  chips: [],
};

const autotileChipset = { ...mockChipset, id: 'cs2', autotile: true };

// テスト用 blob URL（短い参照文字列）
const TEST_BLOB_URL = 'blob:http://localhost/test-uuid';
// 64×64 の imageSize（32px タイル → 2×2 グリッド）
const IMAGE_SIZE = { w: 64, h: 64 };

/** canvas の getBoundingClientRect を CSS 1:1 にモック */
function mockCanvasRect(canvas: HTMLCanvasElement, w: number, h: number) {
  Object.defineProperty(canvas, 'getBoundingClientRect', {
    value: () => ({ left: 0, top: 0, right: w, bottom: h, width: w, height: h }),
    configurable: true,
  });
}

describe('ChipPalette', () => {
  it('チップセットが未選択の場合にメッセージを表示', () => {
    render(
      <ChipPalette
        chipset={null}
        imageDataUrl={null}
        imageSize={null}
        onSelectChip={jest.fn()}
        selectedChipId={null}
      />
    );
    expect(screen.getByText(/チップセットを選択/)).toBeInTheDocument();
  });

  it('チップセットが指定されると canvas を描画する', () => {
    render(
      <ChipPalette
        chipset={mockChipset}
        imageDataUrl={TEST_BLOB_URL}
        imageSize={IMAGE_SIZE}
        onSelectChip={jest.fn()}
        selectedChipId={null}
      />
    );
    const canvas = screen.getByRole('img', { name: 'チップパレット' });
    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveAttribute('width', '64');
    expect(canvas).toHaveAttribute('height', '64');
  });

  it('クリック座標からチップ ID を計算して onSelectChip を呼ぶ（通常タイル）', () => {
    const onSelect = jest.fn();
    render(
      <ChipPalette
        chipset={mockChipset}
        imageDataUrl={TEST_BLOB_URL}
        imageSize={IMAGE_SIZE}
        onSelectChip={onSelect}
        selectedChipId={null}
      />
    );
    const canvas = screen.getByRole('img') as HTMLCanvasElement;
    mockCanvasRect(canvas, 64, 64);

    // (16, 16) → col=0, row=0 → chipIndex=0
    fireEvent.click(canvas, { clientX: 16, clientY: 16 });
    expect(onSelect).toHaveBeenCalledWith('cs1:0');
  });

  it('右列のチップをクリックすると col=1 になる（通常タイル）', () => {
    const onSelect = jest.fn();
    render(
      <ChipPalette
        chipset={mockChipset}
        imageDataUrl={TEST_BLOB_URL}
        imageSize={IMAGE_SIZE}
        onSelectChip={onSelect}
        selectedChipId={null}
      />
    );
    const canvas = screen.getByRole('img') as HTMLCanvasElement;
    mockCanvasRect(canvas, 64, 64);

    // (48, 16) → col=1, row=0 → chipIndex=1
    fireEvent.click(canvas, { clientX: 48, clientY: 16 });
    expect(onSelect).toHaveBeenCalledWith('cs1:1');
  });

  it('2行目のチップをクリックすると row=1 になる（通常タイル）', () => {
    const onSelect = jest.fn();
    render(
      <ChipPalette
        chipset={mockChipset}
        imageDataUrl={TEST_BLOB_URL}
        imageSize={IMAGE_SIZE}
        onSelectChip={onSelect}
        selectedChipId={null}
      />
    );
    const canvas = screen.getByRole('img') as HTMLCanvasElement;
    mockCanvasRect(canvas, 64, 64);

    // (16, 48) → col=0, row=1 → chipIndex=2
    fireEvent.click(canvas, { clientX: 16, clientY: 48 });
    expect(onSelect).toHaveBeenCalledWith('cs1:2');
  });

  it('オートタイル: クリックすると col 番号のチップ ID を返す', () => {
    const onSelect = jest.fn();
    render(
      <ChipPalette
        chipset={autotileChipset}
        imageDataUrl={TEST_BLOB_URL}
        imageSize={{ w: 64, h: 160 }} // autotile: 2 cols × 5 variants（高さ 160 = 32×5）
        onSelectChip={onSelect}
        selectedChipId={null}
      />
    );
    // autotile の canvas 高さは tileHeight=32 のみ
    const canvas = screen.getByRole('img') as HTMLCanvasElement;
    expect(canvas).toHaveAttribute('height', '32');
    mockCanvasRect(canvas, 64, 32);

    // (48, 16) → col=1 → chipId='cs2:1'
    fireEvent.click(canvas, { clientX: 48, clientY: 16 });
    expect(onSelect).toHaveBeenCalledWith('cs2:1');
  });
});
