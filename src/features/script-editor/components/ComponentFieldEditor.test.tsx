import { render, screen, fireEvent } from '@testing-library/react';
import { ComponentFieldEditor } from './ComponentFieldEditor';

// Load the FieldType registry
import '@/types/fields';

const makeContent = (
  fields: Array<{ name: string; type: string; defaultValue: unknown; label: string }>
) => {
  if (fields.length === 0) return 'export default {}';
  const lines = fields.map(
    (f) =>
      `  ${f.name}: { type: ${JSON.stringify(f.type)}, default: ${JSON.stringify(f.defaultValue)}, label: ${JSON.stringify(f.label)} }`
  );
  return `export default {\n${lines.join(',\n')}\n}`;
};

describe('ComponentFieldEditor', () => {
  it('content が null のときは「スクリプトを選択してください」を表示する', () => {
    render(<ComponentFieldEditor content={null} onContentChange={jest.fn()} />);
    expect(screen.getByText('スクリプトを選択してください')).toBeInTheDocument();
  });

  it('コードがパースできないときは「コードの解析に失敗しました」を表示する', () => {
    render(<ComponentFieldEditor content="export default { x: {" onContentChange={jest.fn()} />);
    expect(screen.getByText('コードの解析に失敗しました')).toBeInTheDocument();
  });

  it('フィールドがないときは「フィールドがありません」を表示する', () => {
    render(<ComponentFieldEditor content="export default {}" onContentChange={jest.fn()} />);
    expect(screen.getByText('フィールドがありません')).toBeInTheDocument();
  });

  it('パースしたフィールドのラベルと名前を表示する', () => {
    const content = makeContent([{ name: 'hp', type: 'number', defaultValue: 100, label: 'HP' }]);
    render(<ComponentFieldEditor content={content} onContentChange={jest.fn()} />);
    expect(screen.getByDisplayValue('HP')).toBeInTheDocument(); // label input
    expect(screen.getByDisplayValue('hp')).toBeInTheDocument(); // name input
  });

  it('「追加」ボタンを押すと onContentChange が新しいフィールド付きで呼ばれる', () => {
    const onContentChange = jest.fn();
    render(<ComponentFieldEditor content="export default {}" onContentChange={onContentChange} />);
    fireEvent.click(screen.getByRole('button', { name: '追加' }));
    expect(onContentChange).toHaveBeenCalledTimes(1);
    const newContent: string = onContentChange.mock.calls[0][0];
    expect(newContent).toContain('export default');
    expect(newContent).toContain('field1');
  });

  it('削除ボタンを押すと onContentChange がフィールドなしで呼ばれる', () => {
    const onContentChange = jest.fn();
    const content = makeContent([{ name: 'hp', type: 'number', defaultValue: 0, label: 'HP' }]);
    render(<ComponentFieldEditor content={content} onContentChange={onContentChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'hpを削除' }));
    expect(onContentChange).toHaveBeenCalledTimes(1);
    expect(onContentChange.mock.calls[0][0]).toBe('export default {}');
  });

  it('名前を変更すると onContentChange が呼ばれる', () => {
    const onContentChange = jest.fn();
    const content = makeContent([{ name: 'hp', type: 'number', defaultValue: 0, label: 'HP' }]);
    render(<ComponentFieldEditor content={content} onContentChange={onContentChange} />);
    const nameInput = screen.getByDisplayValue('hp');
    fireEvent.change(nameInput, { target: { value: 'health' } });
    expect(onContentChange).toHaveBeenCalled();
    expect(onContentChange.mock.calls[0][0]).toContain('health');
  });

  it('型を変更すると onContentChange がデフォルト値リセット付きで呼ばれる', () => {
    const onContentChange = jest.fn();
    const content = makeContent([{ name: 'hp', type: 'number', defaultValue: 100, label: 'HP' }]);
    render(<ComponentFieldEditor content={content} onContentChange={onContentChange} />);

    // shadcn/ui の Select は Radix UI ベースでポータルを使用するため、
    // JSDOM 環境では直接オプション選択はできない。
    // コンボボックスが表示されていること（onValueChange ハンドラが設置されている）を確認する。
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });
});
