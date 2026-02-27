import { render, screen } from '@testing-library/react';
import { MapCanvas } from './MapCanvas';

// WebGL はモックできないので canvas 要素の存在のみ確認
describe('MapCanvas', () => {
  it('canvas 要素をレンダリングする', () => {
    render(<MapCanvas mapId="m1" />);
    expect(screen.getByTestId('map-canvas')).toBeInTheDocument();
  });
});
