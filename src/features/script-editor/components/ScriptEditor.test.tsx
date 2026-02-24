import { render, screen, fireEvent } from '@testing-library/react';

import type { Script } from '@/types/script';

import { ScriptEditor } from './ScriptEditor';

jest.mock('@monaco-editor/react', () => {
  return {
    __esModule: true,
    default: function MockEditor(props: {
      value?: string;
      onChange?: (value: string | undefined) => void;
    }) {
      return (
        <div data-testid="monaco-editor">
          <textarea
            data-testid="monaco-textarea"
            value={props.value ?? ''}
            onChange={(e) => props.onChange?.(e.target.value)}
          />
        </div>
      );
    },
  };
});

const testScript: Script = {
  id: 'script-1',
  name: 'テストスクリプト',
  type: 'event',
  content: 'console.log("hello");',
  args: [],
  returns: [],
  fields: [],
  isAsync: false,
};

describe('ScriptEditor', () => {
  it('shows empty state when no script', () => {
    render(<ScriptEditor script={null} onContentChange={jest.fn()} scripts={[]} dataTypes={[]} />);

    expect(screen.getByText('スクリプトを選択してください')).toBeInTheDocument();
    expect(screen.queryByTestId('monaco-editor')).not.toBeInTheDocument();
  });

  it('shows editor when script provided', () => {
    render(
      <ScriptEditor script={testScript} onContentChange={jest.fn()} scripts={[]} dataTypes={[]} />
    );

    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    expect(screen.queryByText('スクリプトを選択してください')).not.toBeInTheDocument();
  });

  it('shows script name as header', () => {
    render(
      <ScriptEditor script={testScript} onContentChange={jest.fn()} scripts={[]} dataTypes={[]} />
    );

    expect(screen.getByText('テストスクリプト')).toBeInTheDocument();
  });

  it('calls onContentChange when editor value changes', () => {
    const onContentChange = jest.fn();
    render(
      <ScriptEditor
        script={testScript}
        onContentChange={onContentChange}
        scripts={[]}
        dataTypes={[]}
      />
    );

    const textarea = screen.getByTestId('monaco-textarea');
    fireEvent.change(textarea, { target: { value: 'const x = 1;' } });

    expect(onContentChange).toHaveBeenCalledWith('script-1', 'const x = 1;');
  });
});
