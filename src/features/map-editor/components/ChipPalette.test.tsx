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

  it('チップをクリックすると onSelectChip が呼ばれる', () => {
    const onSelect = jest.fn();
    render(
      <ChipPalette
        chipset={mockChipset}
        imageDataUrl="data:image/png;base64,test"
        imageSize={{ w: 64, h: 64 }}
        onSelectChip={onSelect}
        selectedChipId={null}
      />
    );
    const chips = screen.getAllByRole('button', { name: /チップ/ });
    fireEvent.click(chips[0]!);
    expect(onSelect).toHaveBeenCalledWith('cs1:0');
  });
});
