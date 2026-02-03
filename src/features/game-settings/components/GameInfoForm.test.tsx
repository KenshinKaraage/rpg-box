import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GameInfoForm } from './GameInfoForm';
import { DEFAULT_GAME_SETTINGS } from '@/types/gameSettings';
import type { GameSettings } from '@/types/gameSettings';

describe('GameInfoForm', () => {
  const mockOnSubmit = jest.fn();
  const defaultProps = {
    initialValues: DEFAULT_GAME_SETTINGS,
    onSubmit: mockOnSubmit,
  };

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  describe('rendering', () => {
    it('renders all form fields', () => {
      render(<GameInfoForm {...defaultProps} />);

      expect(screen.getByLabelText('ゲームタイトル')).toBeInTheDocument();
      expect(screen.getByLabelText('バージョン')).toBeInTheDocument();
      expect(screen.getByLabelText('作者名')).toBeInTheDocument();
      expect(screen.getByLabelText('説明')).toBeInTheDocument();
      expect(screen.getByLabelText('画面幅')).toBeInTheDocument();
      expect(screen.getByLabelText('画面高さ')).toBeInTheDocument();
    });

    it('renders with initial values', () => {
      const customSettings: GameSettings = {
        title: 'Test Game',
        version: '2.0.0',
        author: 'Test Author',
        description: 'Test Description',
        resolution: { width: 1920, height: 1080 },
        startMapId: 'map_001',
        startPosition: { x: 5, y: 10 },
      };

      render(<GameInfoForm initialValues={customSettings} onSubmit={mockOnSubmit} />);

      expect(screen.getByLabelText('ゲームタイトル')).toHaveValue('Test Game');
      expect(screen.getByLabelText('バージョン')).toHaveValue('2.0.0');
      expect(screen.getByLabelText('作者名')).toHaveValue('Test Author');
      expect(screen.getByLabelText('説明')).toHaveValue('Test Description');
      expect(screen.getByLabelText('画面幅')).toHaveValue(1920);
      expect(screen.getByLabelText('画面高さ')).toHaveValue(1080);
    });
  });

  describe('validation', () => {
    it('shows error when title is empty', async () => {
      render(<GameInfoForm {...defaultProps} />);

      const titleInput = screen.getByLabelText('ゲームタイトル');
      await userEvent.clear(titleInput);

      const submitButton = screen.getByRole('button', { name: '保存' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('ゲームタイトルは必須です')).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('shows error when version format is invalid', async () => {
      render(<GameInfoForm {...defaultProps} />);

      const versionInput = screen.getByLabelText('バージョン');
      await userEvent.clear(versionInput);
      await userEvent.type(versionInput, 'invalid');

      const submitButton = screen.getByRole('button', { name: '保存' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/バージョン形式/)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('shows error when resolution width is too small', async () => {
      render(<GameInfoForm {...defaultProps} />);

      const widthInput = screen.getByLabelText('画面幅');
      await userEvent.clear(widthInput);
      await userEvent.type(widthInput, '100');

      const submitButton = screen.getByRole('button', { name: '保存' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/320以上/)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('submission', () => {
    it('calls onSubmit with form values on valid submission', async () => {
      render(<GameInfoForm {...defaultProps} />);

      const titleInput = screen.getByLabelText('ゲームタイトル');
      await userEvent.clear(titleInput);
      await userEvent.type(titleInput, 'My New Game');

      const submitButton = screen.getByRole('button', { name: '保存' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'My New Game',
          })
        );
      });
    });
  });

  describe('resolution presets', () => {
    it('has resolution preset selector', () => {
      render(<GameInfoForm {...defaultProps} />);

      expect(screen.getByText('プリセット')).toBeInTheDocument();
    });
  });
});
