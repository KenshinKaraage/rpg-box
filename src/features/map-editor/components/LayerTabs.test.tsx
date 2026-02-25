import { render, screen, fireEvent } from '@testing-library/react';
import { LayerTabs } from './LayerTabs';
import type { MapLayer } from '@/types/map';

const layers: MapLayer[] = [
  { id: 'l1', name: '地面', type: 'tile', visible: true, chipsetIds: [], tiles: [] },
  { id: 'l2', name: '装飾', type: 'tile', visible: false, chipsetIds: [], tiles: [] },
];

describe('LayerTabs', () => {
  it('レイヤー名を表示する', () => {
    render(
      <LayerTabs
        layers={layers}
        selectedLayerId="l1"
        onSelectLayer={jest.fn()}
        onToggleVisibility={jest.fn()}
      />
    );
    expect(screen.getByText('地面')).toBeInTheDocument();
    expect(screen.getByText('装飾')).toBeInTheDocument();
  });

  it('レイヤークリックで onSelectLayer が呼ばれる', () => {
    const onSelect = jest.fn();
    render(
      <LayerTabs
        layers={layers}
        selectedLayerId="l1"
        onSelectLayer={onSelect}
        onToggleVisibility={jest.fn()}
      />
    );
    fireEvent.click(screen.getByText('装飾'));
    expect(onSelect).toHaveBeenCalledWith('l2');
  });

  it('表示トグルボタンで onToggleVisibility が呼ばれる', () => {
    const onToggle = jest.fn();
    render(
      <LayerTabs
        layers={layers}
        selectedLayerId="l1"
        onSelectLayer={jest.fn()}
        onToggleVisibility={onToggle}
      />
    );
    const toggleBtns = screen.getAllByRole('button', { name: /表示|非表示/ });
    fireEvent.click(toggleBtns[0]!);
    expect(onToggle).toHaveBeenCalledWith('l1');
  });
});
