import { render, screen, fireEvent } from '@testing-library/react';

import { useStore } from '@/stores';
import type { Script } from '@/types/script';
import { createScript } from '@/types/script';

import { ScriptSettingsPanel } from './ScriptSettingsPanel';

const testScript: Script = {
  ...createScript('s1', 'バトル開始', 'event'),
  description: '戦闘を開始するスクリプト',
  args: [{ id: 'arg1', name: 'enemyId', fieldType: 'string', required: true }],
};

describe('ScriptSettingsPanel', () => {
  const defaultProps = {
    script: testScript,
    onUpdate: jest.fn(),
  };

  it('shows empty state when no script selected', () => {
    render(<ScriptSettingsPanel script={null} onUpdate={jest.fn()} />);
    expect(screen.getByText('スクリプトを選択してください')).toBeInTheDocument();
  });

  it('shows script name input', () => {
    render(<ScriptSettingsPanel {...defaultProps} />);
    const input = screen.getByLabelText('名前');
    expect(input).toHaveValue('バトル開始');
  });

  it('calls onUpdate when name changes', () => {
    const onUpdate = jest.fn();
    render(<ScriptSettingsPanel {...defaultProps} onUpdate={onUpdate} />);
    const input = screen.getByLabelText('名前');
    fireEvent.change(input, { target: { value: '新しい名前' } });
    fireEvent.blur(input);
    expect(onUpdate).toHaveBeenCalledWith('s1', { name: '新しい名前' });
  });

  it('shows description textarea', () => {
    render(<ScriptSettingsPanel {...defaultProps} />);
    const textarea = screen.getByLabelText('説明');
    expect(textarea).toHaveValue('戦闘を開始するスクリプト');
  });

  it('calls onUpdate when description changes', () => {
    const onUpdate = jest.fn();
    render(<ScriptSettingsPanel {...defaultProps} onUpdate={onUpdate} />);
    const textarea = screen.getByLabelText('説明');
    fireEvent.change(textarea, { target: { value: '新しい説明' } });
    fireEvent.blur(textarea);
    expect(onUpdate).toHaveBeenCalledWith('s1', { description: '新しい説明' });
  });

  it('shows existing arguments', () => {
    render(<ScriptSettingsPanel {...defaultProps} />);
    expect(screen.getByText('enemyId')).toBeInTheDocument();
  });

  it('shows isAsync checkbox and calls onUpdate when toggled', () => {
    const onUpdate = jest.fn();
    render(<ScriptSettingsPanel {...defaultProps} onUpdate={onUpdate} />);
    const checkbox = screen.getByLabelText('完了まで待機する');
    expect(checkbox).not.toBeChecked();
    fireEvent.click(checkbox);
    expect(onUpdate).toHaveBeenCalledWith('s1', { isAsync: true });
  });

  it('shows all settings for internal scripts too', () => {
    const internalScript: Script = {
      ...createScript('i1', '_helper', 'internal'),
      parentId: 's1',
    };
    render(<ScriptSettingsPanel script={internalScript} onUpdate={jest.fn()} />);
    expect(screen.getByLabelText('完了まで待機する')).toBeInTheDocument();
    expect(screen.getByText('引数')).toBeInTheDocument();
    expect(screen.getByText('返り値')).toBeInTheDocument();
    expect(screen.getByLabelText('呼び出しID')).toBeInTheDocument();
  });

  describe('Undo連続入力のバッチ化', () => {
    beforeEach(() => {
      useStore.setState({ currentPage: 'script', undoStacks: {}, redoStacks: {} });
    });

    it('引数フィールドへの連続した onChange は Undo を1件だけ積む', () => {
      render(<ScriptSettingsPanel {...defaultProps} />);
      const idInput = screen.getByDisplayValue('arg1');

      fireEvent.change(idInput, { target: { value: 'arg1x' } });
      fireEvent.change(idInput, { target: { value: 'arg1xy' } });
      fireEvent.change(idInput, { target: { value: 'arg1xyz' } });

      expect(useStore.getState().undoStacks['script']).toHaveLength(1);
    });

    it('フォーカスが外れてから再度編集すると別のUndoが積まれる', () => {
      render(<ScriptSettingsPanel {...defaultProps} />);
      const idInput = screen.getByDisplayValue('arg1');

      fireEvent.change(idInput, { target: { value: 'arg1x' } });
      fireEvent.blur(idInput);
      fireEvent.change(idInput, { target: { value: 'arg1y' } });

      expect(useStore.getState().undoStacks['script']).toHaveLength(2);
    });

    it('名前の変更（blur確定）は単発でUndoを積む', () => {
      render(<ScriptSettingsPanel {...defaultProps} />);
      const input = screen.getByLabelText('名前');

      fireEvent.change(input, { target: { value: '新しい名前' } });
      fireEvent.blur(input);

      expect(useStore.getState().undoStacks['script']).toHaveLength(1);
    });

    it('待機フラグのトグル（単発操作）はUndoを1件積む', () => {
      render(<ScriptSettingsPanel {...defaultProps} />);
      const checkbox = screen.getByLabelText('完了まで待機する');

      fireEvent.click(checkbox);

      expect(useStore.getState().undoStacks['script']).toHaveLength(1);
    });

    it('名前を編集した直後に別フィールド（待機フラグ）を単発操作すると別のUndoが積まれる', () => {
      render(<ScriptSettingsPanel {...defaultProps} />);
      const input = screen.getByLabelText('名前');
      const checkbox = screen.getByLabelText('完了まで待機する');

      fireEvent.change(input, { target: { value: '新しい名前' } });
      fireEvent.blur(input);
      fireEvent.click(checkbox);

      expect(useStore.getState().undoStacks['script']).toHaveLength(2);
    });
  });
});
