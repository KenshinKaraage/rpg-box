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

/** mousedown → (必要なら移動先で) mouseup を発火してクリック/ドラッグ選択をシミュレートする。
 * mouseup は window に対して発火する必要がある（コンポーネントが window にリスナーを張るため）。 */
function dragSelect(
  canvas: HTMLCanvasElement,
  from: { clientX: number; clientY: number },
  to: { clientX: number; clientY: number } = from
) {
  fireEvent.mouseDown(canvas, from);
  if (to !== from) {
    fireEvent.mouseMove(window, to);
  }
  fireEvent.mouseUp(window, to);
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
    dragSelect(canvas, { clientX: 16, clientY: 16 });
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
    dragSelect(canvas, { clientX: 48, clientY: 16 });
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
    dragSelect(canvas, { clientX: 16, clientY: 48 });
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
    dragSelect(canvas, { clientX: 48, clientY: 16 });
    expect(onSelect).toHaveBeenCalledWith('cs2:1');
  });

  describe('複数タイル選択（スタンプ用）', () => {
    it('ドラッグして複数マスを選択すると onSelectRange が呼ばれる（通常タイル）', () => {
      const onSelect = jest.fn();
      const onSelectRange = jest.fn();
      render(
        <ChipPalette
          chipset={mockChipset}
          imageDataUrl={TEST_BLOB_URL}
          imageSize={IMAGE_SIZE}
          onSelectChip={onSelect}
          selectedChipId={null}
          onSelectRange={onSelectRange}
        />
      );
      const canvas = screen.getByRole('img') as HTMLCanvasElement;
      mockCanvasRect(canvas, 64, 64);

      // (0,0)から(48,48)へドラッグ → col0-1, row0-1 の 2x2 範囲
      dragSelect(canvas, { clientX: 16, clientY: 16 }, { clientX: 48, clientY: 48 });

      expect(onSelectRange).toHaveBeenCalledWith({
        chipsetId: 'cs1',
        startCol: 0,
        startRow: 0,
        width: 2,
        height: 2,
        cells: ['cs1:0', 'cs1:1', 'cs1:2', 'cs1:3'],
      });
      // 左上セルは selectedChipId としても通知される（表示中チップセットの情報を保つため）
      expect(onSelect).toHaveBeenCalledWith('cs1:0');
    });

    it('逆方向にドラッグしても範囲が正規化される', () => {
      const onSelectRange = jest.fn();
      render(
        <ChipPalette
          chipset={mockChipset}
          imageDataUrl={TEST_BLOB_URL}
          imageSize={IMAGE_SIZE}
          onSelectChip={jest.fn()}
          selectedChipId={null}
          onSelectRange={onSelectRange}
        />
      );
      const canvas = screen.getByRole('img') as HTMLCanvasElement;
      mockCanvasRect(canvas, 64, 64);

      // 右下(col1,row1)から左上(col0,row0)へドラッグ
      dragSelect(canvas, { clientX: 48, clientY: 48 }, { clientX: 16, clientY: 16 });

      expect(onSelectRange).toHaveBeenCalledWith({
        chipsetId: 'cs1',
        startCol: 0,
        startRow: 0,
        width: 2,
        height: 2,
        cells: ['cs1:0', 'cs1:1', 'cs1:2', 'cs1:3'],
      });
    });

    it('1マスのみのドラッグ（実質クリック）では onSelectRange は null で呼ばれ onSelectChip が使われる', () => {
      const onSelect = jest.fn();
      const onSelectRange = jest.fn();
      render(
        <ChipPalette
          chipset={mockChipset}
          imageDataUrl={TEST_BLOB_URL}
          imageSize={IMAGE_SIZE}
          onSelectChip={onSelect}
          selectedChipId={null}
          onSelectRange={onSelectRange}
        />
      );
      const canvas = screen.getByRole('img') as HTMLCanvasElement;
      mockCanvasRect(canvas, 64, 64);

      dragSelect(canvas, { clientX: 16, clientY: 16 });

      expect(onSelect).toHaveBeenCalledWith('cs1:0');
      expect(onSelectRange).toHaveBeenCalledWith(null);
    });

    it('オートタイルは行方向を無視し列方向のみで範囲を確定する', () => {
      const onSelectRange = jest.fn();
      render(
        <ChipPalette
          chipset={autotileChipset}
          imageDataUrl={TEST_BLOB_URL}
          imageSize={{ w: 64, h: 160 }}
          onSelectChip={jest.fn()}
          selectedChipId={null}
          onSelectRange={onSelectRange}
        />
      );
      const canvas = screen.getByRole('img') as HTMLCanvasElement;
      mockCanvasRect(canvas, 64, 32);

      // col0からcol1へドラッグ（縦方向の座標変化があってもrowは常に0扱い）
      dragSelect(canvas, { clientX: 16, clientY: 16 }, { clientX: 48, clientY: 16 });

      expect(onSelectRange).toHaveBeenCalledWith({
        chipsetId: 'cs2',
        startCol: 0,
        startRow: 0,
        width: 2,
        height: 1,
        cells: ['cs2:0', 'cs2:1'],
      });
    });
  });
});
