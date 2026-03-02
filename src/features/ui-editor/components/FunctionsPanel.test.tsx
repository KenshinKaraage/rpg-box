import { render, screen, fireEvent } from '@testing-library/react';
import { FunctionsPanel } from './FunctionsPanel';
import type { EditorUIFunction } from '@/stores/uiEditorSlice';

// Mock store
const mockAddUIFunction = jest.fn();
const mockUpdateUIFunction = jest.fn();
const mockDeleteUIFunction = jest.fn();

jest.mock('@/stores', () => ({
  useStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      selectedCanvasId: 'canvas_1',
      addUIFunction: mockAddUIFunction,
      updateUIFunction: mockUpdateUIFunction,
      deleteUIFunction: mockDeleteUIFunction,
    }),
}));

jest.mock('@/lib/utils', () => ({
  ...jest.requireActual('@/lib/utils'),
  generateId: (_prefix: string, _ids: string[]) => 'generated_id',
}));

function makeFunction(overrides: Partial<EditorUIFunction> = {}): EditorUIFunction {
  return {
    id: 'fn_1',
    name: 'テスト関数',
    args: [],
    actions: [],
    ...overrides,
  };
}

beforeEach(() => {
  mockAddUIFunction.mockClear();
  mockUpdateUIFunction.mockClear();
  mockDeleteUIFunction.mockClear();
});

describe('FunctionsPanel', () => {
  it('shows empty message when no functions', () => {
    render(<FunctionsPanel functions={[]} />);
    expect(screen.getByText('ファンクションなし')).toBeInTheDocument();
  });

  it('renders function list', () => {
    const functions = [
      makeFunction({ id: 'fn_1', name: '関数A' }),
      makeFunction({ id: 'fn_2', name: '関数B' }),
    ];
    render(<FunctionsPanel functions={functions} />);
    expect(screen.getByText('関数A')).toBeInTheDocument();
    expect(screen.getByText('関数B')).toBeInTheDocument();
  });

  it('calls addUIFunction when add button clicked', () => {
    render(<FunctionsPanel functions={[]} />);
    fireEvent.click(screen.getByTestId('add-function-btn'));
    expect(mockAddUIFunction).toHaveBeenCalledWith('canvas_1', expect.objectContaining({
      id: 'generated_id',
      name: '新しいファンクション',
      args: [],
      actions: [],
    }));
  });

  it('calls deleteUIFunction when delete clicked', () => {
    render(<FunctionsPanel functions={[makeFunction()]} />);
    fireEvent.click(screen.getByTestId('delete-function-fn_1'));
    expect(mockDeleteUIFunction).toHaveBeenCalledWith('canvas_1', 'fn_1');
  });

  it('expands function detail on toggle click', () => {
    render(<FunctionsPanel functions={[makeFunction()]} />);
    expect(screen.queryByTestId('function-detail-fn_1')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('toggle-function-fn_1'));
    expect(screen.getByTestId('function-detail-fn_1')).toBeInTheDocument();
  });

  it('shows name input in expanded detail', () => {
    render(<FunctionsPanel functions={[makeFunction()]} />);
    fireEvent.click(screen.getByTestId('toggle-function-fn_1'));

    const nameInput = screen.getByTestId('function-name-input-fn_1');
    expect(nameInput).toHaveValue('テスト関数');
  });

  it('updates function name on input change', () => {
    render(<FunctionsPanel functions={[makeFunction()]} />);
    fireEvent.click(screen.getByTestId('toggle-function-fn_1'));

    const nameInput = screen.getByTestId('function-name-input-fn_1');
    fireEvent.change(nameInput, { target: { value: '新名前' } });

    expect(mockUpdateUIFunction).toHaveBeenCalledWith('canvas_1', 'fn_1', { name: '新名前' });
  });

  it('adds arg when add arg button clicked', () => {
    render(<FunctionsPanel functions={[makeFunction()]} />);
    fireEvent.click(screen.getByTestId('toggle-function-fn_1'));
    fireEvent.click(screen.getByTestId('add-arg-fn_1'));

    expect(mockUpdateUIFunction).toHaveBeenCalledWith('canvas_1', 'fn_1', {
      args: [expect.objectContaining({ id: 'generated_id', name: '引数', fieldType: 'string' })],
    });
  });

  it('displays arg count badge', () => {
    const fn = makeFunction({
      args: [
        { id: 'arg_1', name: 'x', fieldType: 'number', defaultValue: 0 },
        { id: 'arg_2', name: 'y', fieldType: 'number', defaultValue: 0 },
      ],
    });
    render(<FunctionsPanel functions={[fn]} />);
    expect(screen.getByText('2args')).toBeInTheDocument();
  });
});
