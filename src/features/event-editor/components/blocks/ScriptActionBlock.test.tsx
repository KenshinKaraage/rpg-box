import { render, screen, fireEvent } from '@testing-library/react';
import { ScriptActionBlock } from './ScriptActionBlock';
import { ScriptAction } from '@/engine/actions/ScriptAction';
import { useStore } from '@/stores';

// テスト用スクリプトをストアにセット
function setTestScripts() {
  useStore.setState({
    scripts: [
      {
        id: 'msg',
        name: 'メッセージ',
        type: 'event' as const,
        content: '',
        args: [
          { id: 'text', name: 'テキスト', fieldType: 'string', required: true },
          { id: 'face', name: '顔グラ', fieldType: 'string', required: false },
        ],
        returns: [],
        fields: [],
        isAsync: true,
      },
      {
        id: 'heal',
        name: '回復',
        type: 'event' as const,
        content: '',
        args: [],
        returns: [],
        fields: [],
        isAsync: false,
      },
    ],
  });
}

describe('ScriptActionBlock', () => {
  beforeEach(() => {
    setTestScripts();
  });

  const createProps = (scriptId = '') => {
    const action = new ScriptAction();
    action.scriptId = scriptId;
    return {
      action,
      onChange: jest.fn(),
      onDelete: jest.fn(),
    };
  };

  it('スクリプト選択ドロップダウンが表示される', () => {
    render(<ScriptActionBlock {...createProps()} />);
    expect(screen.getByTestId('script-select')).toBeInTheDocument();
  });

  it('削除ボタンをクリックするとonDeleteが呼ばれる', () => {
    const props = createProps();
    render(<ScriptActionBlock {...props} />);
    fireEvent.click(screen.getByTestId('delete-action'));
    expect(props.onDelete).toHaveBeenCalledTimes(1);
  });

  it('引数を持つスクリプト選択時に引数フォームが表示される', () => {
    const props = createProps('msg');
    render(<ScriptActionBlock {...props} />);
    expect(screen.getByText('引数')).toBeInTheDocument();
    expect(screen.getByText('テキスト')).toBeInTheDocument();
    expect(screen.getByText('顔グラ')).toBeInTheDocument();
  });

  it('引数なしスクリプト選択時に引数フォームが表示されない', () => {
    const props = createProps('heal');
    render(<ScriptActionBlock {...props} />);
    expect(screen.queryByText('引数')).not.toBeInTheDocument();
  });
});
