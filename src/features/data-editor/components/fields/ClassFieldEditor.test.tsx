/**
 * ClassFieldEditor のテスト
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { ClassFieldEditor } from './ClassFieldEditor';
import { NumberFieldType } from '@/types/fields/NumberFieldType';
import { useStore } from '@/stores';

jest.mock('@/stores', () => ({
  useStore: jest.fn(),
}));

const hpField = new NumberFieldType();
hpField.id = 'hp';
hpField.name = 'HP';

const mpField = new NumberFieldType();
mpField.id = 'mp';
mpField.name = 'MP';

const mockClasses = [
  {
    id: 'class_status',
    name: 'ステータス',
    fields: [hpField, mpField],
  },
];

describe('ClassFieldEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({ classes: mockClasses })
    );
  });

  it('classIdが空の場合「クラスが設定されていません」が表示される', () => {
    render(<ClassFieldEditor value={{}} onChange={jest.fn()} classId="" />);
    expect(screen.getByText('クラスが設定されていません')).toBeInTheDocument();
  });

  it('存在しないclassIdの場合エラーメッセージが表示される', () => {
    render(<ClassFieldEditor value={{}} onChange={jest.fn()} classId="nonexistent" />);
    expect(screen.getByText('クラス「nonexistent」が見つかりません')).toBeInTheDocument();
  });

  it('クラスのフィールドが展開表示される', () => {
    render(
      <ClassFieldEditor value={{ hp: 100, mp: 50 }} onChange={jest.fn()} classId="class_status" />
    );
    expect(screen.getByText('HP')).toBeInTheDocument();
    expect(screen.getByText('MP')).toBeInTheDocument();
  });

  it('フィールド値を変更するとonChangeが呼ばれる', () => {
    const onChange = jest.fn();
    render(
      <ClassFieldEditor value={{ hp: 100, mp: 50 }} onChange={onChange} classId="class_status" />
    );

    const inputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[0]!, { target: { value: '200' } });

    expect(onChange).toHaveBeenCalledWith({ hp: 200, mp: 50 });
  });

  it('エラーメッセージが表示される', () => {
    render(
      <ClassFieldEditor
        value={{}}
        onChange={jest.fn()}
        classId="class_status"
        error="入力してください"
      />
    );
    expect(screen.getByText('入力してください')).toBeInTheDocument();
  });

  it('必須フィールドに*マークが表示される', () => {
    const requiredField = new NumberFieldType();
    requiredField.id = 'str';
    requiredField.name = 'STR';
    requiredField.required = true;

    (useStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({
        classes: [{ id: 'class_req', name: 'テスト', fields: [requiredField] }],
      })
    );

    render(<ClassFieldEditor value={{}} onChange={jest.fn()} classId="class_req" />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });
});
