import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { useStore } from '@/stores';

import { SaveIndicator } from './SaveIndicator';

describe('SaveIndicator', () => {
  beforeEach(() => {
    useStore.setState({ saveStatus: 'saved' });
  });

  it('renders save indicator', () => {
    render(<SaveIndicator />);
    expect(screen.getByTestId('save-indicator')).toBeInTheDocument();
  });

  it('shows saved state by default', () => {
    render(<SaveIndicator />);
    expect(screen.getByTestId('saved-text')).toHaveTextContent('保存済み');
  });

  it('shows unsaved state with yellow dot', () => {
    useStore.setState({ saveStatus: 'unsaved' });
    render(<SaveIndicator />);
    expect(screen.getByTestId('unsaved-dot')).toBeInTheDocument();
    expect(screen.getByText('未保存')).toBeInTheDocument();
  });

  it('shows saving state with spinner', () => {
    useStore.setState({ saveStatus: 'saving' });
    render(<SaveIndicator />);
    expect(screen.getByTestId('saving-spinner')).toBeInTheDocument();
    expect(screen.getByText('保存中...')).toBeInTheDocument();
  });

  it('has aria-live for accessibility', () => {
    render(<SaveIndicator />);
    expect(screen.getByTestId('save-indicator')).toHaveAttribute('aria-live', 'polite');
  });
});
