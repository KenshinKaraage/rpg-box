/**
 * ClassFieldType のテスト
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { ClassFieldType } from './ClassFieldType';
import { NumberFieldType } from './NumberFieldType';
import { useStore } from '@/stores';

// Mock useStore
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

describe('ClassFieldType', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({ classes: mockClasses })
    );
  });

  describe('基本プロパティ', () => {
    it('typeが"class"である', () => {
      const field = new ClassFieldType();
      expect(field.type).toBe('class');
    });

    it('classIdを設定できる', () => {
      const field = new ClassFieldType();
      field.classId = 'class_status';
      expect(field.classId).toBe('class_status');
    });
  });

  describe('getDefaultValue', () => {
    it('空のオブジェクトを返す', () => {
      const field = new ClassFieldType();
      expect(field.getDefaultValue()).toEqual({});
    });
  });

  describe('validate', () => {
    it('オブジェクト値は有効', () => {
      const field = new ClassFieldType();
      const result = field.validate({ hp: 100, mp: 50 });
      expect(result.valid).toBe(true);
    });

    it('required=trueで空オブジェクトは無効', () => {
      const field = new ClassFieldType();
      field.required = true;
      const result = field.validate({});
      expect(result.valid).toBe(false);
    });
  });

  describe('serialize/deserialize', () => {
    it('オブジェクトをシリアライズできる', () => {
      const field = new ClassFieldType();
      const value = { hp: 100, mp: 50 };
      expect(field.serialize(value)).toEqual(value);
    });

    it('オブジェクトをデシリアライズできる', () => {
      const field = new ClassFieldType();
      const data = { hp: 100, mp: 50 };
      expect(field.deserialize(data)).toEqual(data);
    });

    it('nullをデシリアライズすると空オブジェクトを返す', () => {
      const field = new ClassFieldType();
      expect(field.deserialize(null)).toEqual({});
    });
  });

  describe('getValue', () => {
    it('オブジェクトからそのまま値を取得', () => {
      const field = new ClassFieldType();
      const data = { hp: 100, mp: 50 };
      expect(field.getValue(data)).toEqual(data);
    });

    it('nullの場合はデフォルト値を返す', () => {
      const field = new ClassFieldType();
      expect(field.getValue(null)).toEqual({});
    });
  });

  describe('renderEditor', () => {
    it('classId未設定時はメッセージを表示', () => {
      const field = new ClassFieldType();

      const { container } = render(
        field.renderEditor({ value: {}, onChange: jest.fn() }) as React.ReactElement
      );

      expect(container.textContent).toContain('クラスが設定されていません');
    });

    it('存在しないクラスIDの場合はエラーメッセージを表示', () => {
      const field = new ClassFieldType();
      field.classId = 'nonexistent';

      const { container } = render(
        field.renderEditor({ value: {}, onChange: jest.fn() }) as React.ReactElement
      );

      expect(container.textContent).toContain('クラス「nonexistent」が見つかりません');
    });

    it('クラスのフィールドを展開表示', () => {
      const field = new ClassFieldType();
      field.classId = 'class_status';

      render(
        field.renderEditor({
          value: { hp: 100, mp: 50 },
          onChange: jest.fn(),
        }) as React.ReactElement
      );

      expect(screen.getByText('HP')).toBeInTheDocument();
      expect(screen.getByText('MP')).toBeInTheDocument();
    });

    it('フィールド値を変更できる', () => {
      const field = new ClassFieldType();
      field.classId = 'class_status';

      const onChange = jest.fn();
      render(
        field.renderEditor({
          value: { hp: 100 },
          onChange,
        }) as React.ReactElement
      );

      const hpInput = screen.getAllByRole('spinbutton')[0]!;
      fireEvent.change(hpInput, { target: { value: '200' } });

      expect(onChange).toHaveBeenCalledWith({ hp: 200 });
    });
  });
});
