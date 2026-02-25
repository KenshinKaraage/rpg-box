import { render, screen } from '@testing-library/react';
import { MapPropertyPanel } from './MapPropertyPanel';

describe('MapPropertyPanel', () => {
  it('オブジェクト未選択時は「選択なし」を表示', () => {
    render(<MapPropertyPanel selectedObjectId={null} mapId="m1" layerId="l1" />);
    expect(screen.getByText(/オブジェクトを選択/)).toBeInTheDocument();
  });
});
