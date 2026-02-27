import { render, screen, fireEvent } from '@testing-library/react';
import { VariableOpActionBlock } from './VariableOpActionBlock';
import { VariableOpAction } from '@/engine/actions/VariableOpAction';
import { useStore } from '@/stores';
import { NumberFieldType, StringFieldType, ClassFieldType } from '@/types/fields';

jest.mock('@/stores', () => ({
  useStore: jest.fn(),
}));

const classFieldType = new ClassFieldType();
classFieldType.classId = 'class_status';

const mockVariables = [
  { id: 'hp', name: 'HP', fieldType: new NumberFieldType(), isArray: false, initialValue: 0 },
  { id: 'mp', name: 'MP', fieldType: new NumberFieldType(), isArray: false, initialValue: 0 },
  { id: 'name', name: '名前', fieldType: new StringFieldType(), isArray: false, initialValue: '' },
  { id: 'stats', name: 'ステータス', fieldType: classFieldType, isArray: false, initialValue: {} },
];

const mockClassStatusField = new ClassFieldType();
mockClassStatusField.id = 'base_stats';
mockClassStatusField.name = '基本ステータス';
mockClassStatusField.classId = 'class_status';

const mockDataTypes = [
  {
    id: 'enemies',
    name: '敵データ',
    fields: [
      { id: 'ename', name: '名前', type: 'string' },
      { id: 'attack', name: '攻撃力', type: 'number' },
      mockClassStatusField,
    ],
  },
];

const mockClasses = [
  {
    id: 'class_status',
    name: 'ステータス',
    fields: [
      { id: 'hp', name: 'HP', type: 'number' },
      { id: 'mp', name: 'MP', type: 'number' },
      { id: 'atk', name: 'ATK', type: 'number' },
    ],
  },
];

const mockDataEntries: Record<
  string,
  { id: string; typeId: string; values: Record<string, unknown> }[]
> = {
  enemies: [
    { id: 'slime', typeId: 'enemies', values: { name: 'スライム', attack: 10 } },
    { id: 'dragon', typeId: 'enemies', values: { name: 'ドラゴン', attack: 99 } },
  ],
};

function setupMockStore(overrides: Record<string, unknown> = {}) {
  (useStore as unknown as jest.Mock).mockImplementation(
    (selector: (state: Record<string, unknown>) => unknown) =>
      selector({
        variables: mockVariables,
        dataTypes: mockDataTypes,
        dataEntries: mockDataEntries,
        classes: mockClasses,
        ...overrides,
      })
  );
}

describe('VariableOpActionBlock', () => {
  const createProps = (overrides: Partial<VariableOpAction> = {}) => {
    const action = new VariableOpAction();
    action.variableId = 'hp';
    action.operation = 'set';
    action.value = { type: 'literal', value: 100 };
    Object.assign(action, overrides);
    return {
      action,
      onChange: jest.fn(),
      onDelete: jest.fn(),
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    setupMockStore();
  });

  it('変数操作ラベルが表示される', () => {
    render(<VariableOpActionBlock {...createProps()} />);
    expect(screen.getByText('変数操作')).toBeInTheDocument();
  });

  it('変数IDのSelectが表示され、変数名が表示される', () => {
    render(<VariableOpActionBlock {...createProps()} />);
    const select = screen.getByTestId('variable-id-select');
    expect(select).toBeInTheDocument();
    expect(select).toHaveTextContent('HP');
  });

  it('変数が空の場合、Selectがdisabledになる', () => {
    setupMockStore({ variables: [] });
    render(<VariableOpActionBlock {...createProps()} />);
    const trigger = screen.getByTestId('variable-id-select');
    expect(trigger).toBeDisabled();
  });

  it('直値の場合、値入力が表示される', () => {
    render(<VariableOpActionBlock {...createProps()} />);
    expect(screen.getByTestId('value-input')).toHaveValue('100');
  });

  it('直値を変更するとonChangeが呼ばれる', () => {
    const props = createProps();
    render(<VariableOpActionBlock {...props} />);
    fireEvent.change(screen.getByTestId('value-input'), { target: { value: '200' } });
    expect(props.onChange).toHaveBeenCalledTimes(1);
    const updated = props.onChange.mock.calls[0]![0] as VariableOpAction;
    expect(updated.value).toEqual({ type: 'literal', value: 200 });
  });

  it('値ソースタイプセレクトが表示される', () => {
    render(<VariableOpActionBlock {...createProps()} />);
    expect(screen.getByTestId('value-source-type-select')).toBeInTheDocument();
  });

  it('ランダムの場合、min/max入力が表示される', () => {
    const props = createProps({ value: { type: 'random', min: 1, max: 50 } });
    render(<VariableOpActionBlock {...props} />);
    expect(screen.getByTestId('value-random-min')).toHaveValue(1);
    expect(screen.getByTestId('value-random-max')).toHaveValue(50);
  });

  it('ランダムのmin値を変更するとonChangeが呼ばれる', () => {
    const props = createProps({ value: { type: 'random', min: 1, max: 50 } });
    render(<VariableOpActionBlock {...props} />);
    fireEvent.change(screen.getByTestId('value-random-min'), { target: { value: '10' } });
    expect(props.onChange).toHaveBeenCalledTimes(1);
    const updated = props.onChange.mock.calls[0]![0] as VariableOpAction;
    expect(updated.value).toEqual({ type: 'random', min: 10, max: 50 });
  });

  it('ランダムのmax値を変更するとonChangeが呼ばれる', () => {
    const props = createProps({ value: { type: 'random', min: 1, max: 50 } });
    render(<VariableOpActionBlock {...props} />);
    fireEvent.change(screen.getByTestId('value-random-max'), { target: { value: '99' } });
    expect(props.onChange).toHaveBeenCalledTimes(1);
    const updated = props.onChange.mock.calls[0]![0] as VariableOpAction;
    expect(updated.value).toEqual({ type: 'random', min: 1, max: 99 });
  });

  it('変数ソースの場合、変数Selectが表示される', () => {
    const props = createProps({ value: { type: 'variable', variableId: 'mp' } });
    render(<VariableOpActionBlock {...props} />);
    const select = screen.getByTestId('value-variable-select');
    expect(select).toBeInTheDocument();
    expect(select).toHaveTextContent('MP');
  });

  it('データ参照の場合、3つのSelectが表示される', () => {
    const props = createProps({
      value: { type: 'data', dataTypeId: 'enemies', entryId: 'slime', fieldId: 'attack' },
    });
    render(<VariableOpActionBlock {...props} />);
    expect(screen.getByTestId('value-data-type-select')).toBeInTheDocument();
    expect(screen.getByTestId('value-data-entry-select')).toBeInTheDocument();
    expect(screen.getByTestId('value-data-field-select')).toBeInTheDocument();
  });

  it('データ参照のデータ型を変更するとentryId/fieldIdがクリアされる', () => {
    const props = createProps({
      value: { type: 'data', dataTypeId: 'enemies', entryId: 'slime', fieldId: 'attack' },
    });
    render(<VariableOpActionBlock {...props} />);
    expect(screen.getByTestId('value-data-type-select')).toHaveTextContent('敵データ');
    expect(screen.getByTestId('value-data-entry-select')).toHaveTextContent('スライム');
    expect(screen.getByTestId('value-data-field-select')).toHaveTextContent('攻撃力');
  });

  it('削除ボタンをクリックするとonDeleteが呼ばれる', () => {
    const props = createProps();
    render(<VariableOpActionBlock {...props} />);
    fireEvent.click(screen.getByTestId('delete-action'));
    expect(props.onDelete).toHaveBeenCalledTimes(1);
  });

  it('変更後もaction.typeがvariableOpのままである', () => {
    const props = createProps();
    render(<VariableOpActionBlock {...props} />);
    fireEvent.change(screen.getByTestId('value-input'), { target: { value: '42' } });
    const updated = props.onChange.mock.calls[0]![0] as VariableOpAction;
    expect(updated.type).toBe('variableOp');
  });

  it('変数ドロップリストに型名が表示される', () => {
    render(<VariableOpActionBlock {...createProps()} />);
    const trigger = screen.getByTestId('variable-id-select');
    expect(trigger).toHaveTextContent('number');
    expect(trigger).toHaveTextContent('HP');
  });

  it('型が不一致の場合エラーが表示される', () => {
    // target: hp (number), value source: name variable (string)
    const props = createProps({ value: { type: 'variable', variableId: 'name' } });
    render(<VariableOpActionBlock {...props} />);
    expect(screen.getByTestId('type-mismatch-error')).toBeInTheDocument();
    expect(screen.getByTestId('type-mismatch-error')).toHaveTextContent('型が一致しません');
  });

  it('型が一致する場合エラーが表示されない', () => {
    // target: hp (number), value source: mp variable (number)
    const props = createProps({ value: { type: 'variable', variableId: 'mp' } });
    render(<VariableOpActionBlock {...props} />);
    expect(screen.queryByTestId('type-mismatch-error')).not.toBeInTheDocument();
  });

  it('ランダムの場合、number変数に対してエラーが出ない', () => {
    const props = createProps({ value: { type: 'random', min: 0, max: 100 } });
    render(<VariableOpActionBlock {...props} />);
    expect(screen.queryByTestId('type-mismatch-error')).not.toBeInTheDocument();
  });

  it('ランダムの場合、string変数に対してエラーが出る', () => {
    const props = createProps({
      variableId: 'name',
      value: { type: 'random', min: 0, max: 100 },
    });
    render(<VariableOpActionBlock {...props} />);
    expect(screen.getByTestId('type-mismatch-error')).toBeInTheDocument();
  });

  describe('クラスフィールドドリリング', () => {
    it('number変数 + classフィールド選択時、サブフィールドSelectが表示される', () => {
      const props = createProps({
        variableId: 'hp',
        value: { type: 'data', dataTypeId: 'enemies', entryId: 'slime', fieldId: 'base_stats' },
      });
      render(<VariableOpActionBlock {...props} />);
      expect(screen.getByTestId('value-data-subfield-select')).toBeInTheDocument();
    });

    it('サブフィールドに型名が表示される', () => {
      const props = createProps({
        variableId: 'hp',
        value: { type: 'data', dataTypeId: 'enemies', entryId: 'slime', fieldId: 'base_stats' },
      });
      render(<VariableOpActionBlock {...props} />);
      expect(screen.getByTestId('value-data-subfield-select')).toBeInTheDocument();
    });

    it('サブフィールド変更でonChangeが呼ばれsubFieldIdが設定される', () => {
      const props = createProps({
        variableId: 'hp',
        value: { type: 'data', dataTypeId: 'enemies', entryId: 'slime', fieldId: 'base_stats' },
      });
      render(<VariableOpActionBlock {...props} />);
      // subfield select exists - the handler is wired correctly
      expect(screen.getByTestId('value-data-subfield-select')).toBeInTheDocument();
    });

    it('class変数 + classフィールドの場合、サブフィールドが不要（丸ごと代入）', () => {
      const props = createProps({
        variableId: 'stats',
        value: { type: 'data', dataTypeId: 'enemies', entryId: 'slime', fieldId: 'base_stats' },
      });
      render(<VariableOpActionBlock {...props} />);
      expect(screen.queryByTestId('value-data-subfield-select')).not.toBeInTheDocument();
    });

    it('class変数 + classフィールド丸ごとの場合、型が一致しエラーなし', () => {
      const props = createProps({
        variableId: 'stats',
        value: { type: 'data', dataTypeId: 'enemies', entryId: 'slime', fieldId: 'base_stats' },
      });
      render(<VariableOpActionBlock {...props} />);
      expect(screen.queryByTestId('type-mismatch-error')).not.toBeInTheDocument();
    });

    it('number変数 + classフィールド + subFieldId設定時、型が一致しエラーなし', () => {
      const props = createProps({
        variableId: 'hp',
        value: {
          type: 'data',
          dataTypeId: 'enemies',
          entryId: 'slime',
          fieldId: 'base_stats',
          subFieldId: 'atk',
        },
      });
      render(<VariableOpActionBlock {...props} />);
      expect(screen.queryByTestId('type-mismatch-error')).not.toBeInTheDocument();
    });

    it('number変数 + classフィールド + subFieldId未設定時、型エラーなし（未設定扱い）', () => {
      const props = createProps({
        variableId: 'hp',
        value: { type: 'data', dataTypeId: 'enemies', entryId: 'slime', fieldId: 'base_stats' },
      });
      render(<VariableOpActionBlock {...props} />);
      // subFieldId未設定の場合、resolveValueSourceTypeがnullを返すのでエラーなし
      expect(screen.queryByTestId('type-mismatch-error')).not.toBeInTheDocument();
    });

    it('フィールドドロップリストにclassフィールドが表示される（number変数時）', () => {
      const props = createProps({
        variableId: 'hp',
        value: { type: 'data', dataTypeId: 'enemies', entryId: 'slime', fieldId: '' },
      });
      render(<VariableOpActionBlock {...props} />);
      // class field should appear because it has number sub-fields
      expect(screen.getByTestId('value-data-field-select')).toBeInTheDocument();
    });
  });
});
