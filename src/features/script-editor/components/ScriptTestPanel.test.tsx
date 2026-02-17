import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import type { Script } from '@/types/script';
import { createScript } from '@/types/script';

import { ScriptTestPanel } from './ScriptTestPanel';

// Mock the store - provide scripts and empty variables
const mockScripts: Script[] = [];

jest.mock('@/stores', () => ({
  useStore: jest.fn((selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      scripts: mockScripts,
      variables: [],
      classes: [],
      dataTypes: [],
      dataEntries: {},
    })
  ),
}));

describe('ScriptTestPanel', () => {
  beforeEach(() => {
    mockScripts.length = 0;
  });

  const testScript: Script = {
    ...createScript('s1', 'テストスクリプト', 'event'),
    content: 'return 42;',
    args: [{ id: 'arg1', name: 'level', fieldType: 'number', required: true }],
  };

  it('shows empty state when no script', () => {
    render(<ScriptTestPanel script={null} />);
    expect(screen.getByText('スクリプトを選択してください')).toBeInTheDocument();
  });

  it('shows execute button', () => {
    mockScripts.push(testScript);
    render(<ScriptTestPanel script={testScript} />);
    expect(screen.getByRole('button', { name: /実行/ })).toBeInTheDocument();
  });

  it('shows argument inputs based on script args', () => {
    mockScripts.push(testScript);
    render(<ScriptTestPanel script={testScript} />);
    expect(screen.getByLabelText('level')).toBeInTheDocument();
  });

  it('shows no args section when script has no args', () => {
    const noArgsScript: Script = {
      ...createScript('s2', 'シンプル', 'event'),
      content: 'return 1;',
    };
    mockScripts.push(noArgsScript);
    render(<ScriptTestPanel script={noArgsScript} />);
    expect(screen.queryByText('引数')).not.toBeInTheDocument();
  });

  it('executes script and shows result', async () => {
    mockScripts.push(testScript);
    render(<ScriptTestPanel script={testScript} />);
    fireEvent.click(screen.getByRole('button', { name: /実行/ }));
    await waitFor(() => {
      expect(screen.getByTestId('test-result')).toHaveTextContent('42');
    });
  });

  it('captures console.log output', async () => {
    const logScript: Script = {
      ...createScript('s3', 'ログスクリプト', 'event'),
      content: 'console.log("hello"); return 1;',
      args: [],
    };
    mockScripts.push(logScript);
    render(<ScriptTestPanel script={logScript} />);
    fireEvent.click(screen.getByRole('button', { name: /実行/ }));
    await waitFor(() => {
      expect(screen.getByTestId('console-output')).toHaveTextContent('hello');
    });
  });

  it('shows error when script throws', async () => {
    const errorScript: Script = {
      ...createScript('s4', 'エラースクリプト', 'event'),
      content: 'throw new Error("test error");',
      args: [],
    };
    mockScripts.push(errorScript);
    render(<ScriptTestPanel script={errorScript} />);
    fireEvent.click(screen.getByRole('button', { name: /実行/ }));
    await waitFor(() => {
      expect(screen.getByTestId('test-result')).toHaveTextContent('test error');
    });
  });

  it('resets state when script changes', async () => {
    mockScripts.push(testScript);
    const { rerender } = render(<ScriptTestPanel script={testScript} />);
    fireEvent.click(screen.getByRole('button', { name: /実行/ }));
    await waitFor(() => {
      expect(screen.getByTestId('test-result')).toBeInTheDocument();
    });

    const otherScript: Script = {
      ...createScript('s5', '別のスクリプト', 'event'),
      content: 'return 99;',
      args: [],
    };
    mockScripts.push(otherScript);
    rerender(<ScriptTestPanel script={otherScript} />);
    expect(screen.queryByTestId('test-result')).not.toBeInTheDocument();
  });
});
