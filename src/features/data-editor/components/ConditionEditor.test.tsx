import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConditionEditor } from './ConditionEditor';
import { SelectFieldType } from '@/types/fields/SelectFieldType';
import { NumberFieldType } from '@/types/fields/NumberFieldType';

// Selectフィールドを作成するヘルパー
function createSelectField(id: string, name: string, options: { value: string; label: string }[]) {
  const field = new SelectFieldType();
  field.id = id;
  field.name = name;
  field.options = options;
  return { id, name, fieldType: field };
}

// Numberフィールドを作成するヘルパー
function createNumberField(id: string, name: string) {
  const field = new NumberFieldType();
  field.id = id;
  field.name = name;
  return { id, name, fieldType: field };
}

const typeField = createSelectField('type', 'アイテムタイプ', [
  { value: 'consumable', label: '消耗品' },
  { value: 'equipment', label: '装備' },
  { value: 'material', label: '素材' },
]);

const rarityField = createSelectField('rarity', 'レアリティ', [
  { value: 'common', label: 'コモン' },
  { value: 'rare', label: 'レア' },
]);

const hpField = createNumberField('hp', 'HP');

describe('ConditionEditor', () => {
  const defaultProps = {
    condition: undefined,
    onChange: jest.fn(),
    availableFields: [typeField, rarityField, hpField],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('表示', () => {
    it('タイトルが表示される', () => {
      render(<ConditionEditor {...defaultProps} />);
      expect(screen.getByText('表示条件')).toBeInTheDocument();
    });

    it('Select タイプのフィールドのみ表示される（Number は除外）', () => {
      render(<ConditionEditor {...defaultProps} />);
      // Select のトリガーにプレースホルダーが表示される
      expect(screen.getByText('フィールドを選択')).toBeInTheDocument();
    });

    it('条件がない場合はクリアボタンが表示されない', () => {
      render(<ConditionEditor {...defaultProps} />);
      expect(screen.queryByLabelText('条件をクリア')).not.toBeInTheDocument();
    });
  });

  describe('Select フィールドなしの場合', () => {
    it('空状態メッセージが表示される', () => {
      render(<ConditionEditor {...defaultProps} availableFields={[hpField]} />);
      expect(
        screen.getByText('条件対象にできるフィールド（選択タイプ）がありません')
      ).toBeInTheDocument();
    });
  });

  describe('条件あり', () => {
    it('フィールド選択済みの状態が表示される', () => {
      render(
        <ConditionEditor {...defaultProps} condition={{ fieldId: 'type', value: 'consumable' }} />
      );
      // 値選択セクションが表示される
      expect(screen.getByText('値')).toBeInTheDocument();
    });

    it('条件の説明テキストが表示される', () => {
      render(
        <ConditionEditor {...defaultProps} condition={{ fieldId: 'type', value: 'consumable' }} />
      );
      expect(screen.getByText(/「アイテムタイプ」が「消耗品」のときに表示/)).toBeInTheDocument();
    });

    it('クリアボタンが表示される', () => {
      render(
        <ConditionEditor {...defaultProps} condition={{ fieldId: 'type', value: 'consumable' }} />
      );
      expect(screen.getByLabelText('条件をクリア')).toBeInTheDocument();
    });

    it('クリアボタンで onChange(undefined) が呼ばれる', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(
        <ConditionEditor
          {...defaultProps}
          onChange={onChange}
          condition={{ fieldId: 'type', value: 'consumable' }}
        />
      );

      await user.click(screen.getByLabelText('条件をクリア'));
      expect(onChange).toHaveBeenCalledWith(undefined);
    });
  });
});
