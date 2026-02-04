/**
 * FieldSetFieldType のテスト
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { FieldSetFieldType } from './FieldSetFieldType';
import { NumberFieldType } from './NumberFieldType';

describe('FieldSetFieldType', () => {
  describe('基本プロパティ', () => {
    it('typeが"fieldSet"である', () => {
      const field = new FieldSetFieldType();
      expect(field.type).toBe('fieldSet');
    });

    it('fieldSetIdを設定できる', () => {
      const field = new FieldSetFieldType();
      field.fieldSetId = 'fs_status';
      expect(field.fieldSetId).toBe('fs_status');
    });
  });

  describe('getDefaultValue', () => {
    it('空のオブジェクトを返す', () => {
      const field = new FieldSetFieldType();
      expect(field.getDefaultValue()).toEqual({});
    });
  });

  describe('validate', () => {
    it('オブジェクト値は有効', () => {
      const field = new FieldSetFieldType();
      const result = field.validate({ hp: 100, mp: 50 });
      expect(result.valid).toBe(true);
    });

    it('required=trueで空オブジェクトは無効', () => {
      const field = new FieldSetFieldType();
      field.required = true;
      const result = field.validate({});
      expect(result.valid).toBe(false);
    });
  });

  describe('serialize/deserialize', () => {
    it('オブジェクトをシリアライズできる', () => {
      const field = new FieldSetFieldType();
      const value = { hp: 100, mp: 50 };
      expect(field.serialize(value)).toEqual(value);
    });

    it('オブジェクトをデシリアライズできる', () => {
      const field = new FieldSetFieldType();
      const data = { hp: 100, mp: 50 };
      expect(field.deserialize(data)).toEqual(data);
    });

    it('nullをデシリアライズすると空オブジェクトを返す', () => {
      const field = new FieldSetFieldType();
      expect(field.deserialize(null)).toEqual({});
    });
  });

  describe('getValue', () => {
    it('オブジェクトからそのまま値を取得', () => {
      const field = new FieldSetFieldType();
      const data = { hp: 100, mp: 50 };
      expect(field.getValue(data)).toEqual(data);
    });

    it('nullの場合はデフォルト値を返す', () => {
      const field = new FieldSetFieldType();
      expect(field.getValue(null)).toEqual({});
    });
  });

  describe('renderEditor', () => {
    it('フィールドセット未設定時はメッセージを表示', () => {
      const field = new FieldSetFieldType();
      field.id = 'test';
      field.name = 'テスト';

      const onChange = jest.fn();
      const { container } = render(
        field.renderEditor({ value: {}, onChange }) as React.ReactElement
      );

      expect(container.textContent).toContain('フィールドセットが設定されていません');
    });

    it('フィールドセットを展開表示', () => {
      const field = new FieldSetFieldType();
      field.id = 'status';
      field.name = 'ステータス';
      field.fieldSetId = 'fs_status';

      // フィールドセットを設定
      const hpField = new NumberFieldType();
      hpField.id = 'hp';
      hpField.name = 'HP';

      const mpField = new NumberFieldType();
      mpField.id = 'mp';
      mpField.name = 'MP';

      field.setFieldSet({
        id: 'fs_status',
        name: 'ステータス',
        fields: [hpField, mpField],
      });

      const onChange = jest.fn();
      render(
        field.renderEditor({
          value: { hp: 100, mp: 50 },
          onChange,
        }) as React.ReactElement
      );

      // フィールドセットのフィールドが表示される
      expect(screen.getByText('HP')).toBeInTheDocument();
      expect(screen.getByText('MP')).toBeInTheDocument();
    });

    it('フィールド値を変更できる', () => {
      const field = new FieldSetFieldType();
      field.id = 'status';
      field.name = 'ステータス';
      field.fieldSetId = 'fs_status';

      const hpField = new NumberFieldType();
      hpField.id = 'hp';
      hpField.name = 'HP';

      field.setFieldSet({
        id: 'fs_status',
        name: 'ステータス',
        fields: [hpField],
      });

      const onChange = jest.fn();
      render(
        field.renderEditor({
          value: { hp: 100 },
          onChange,
        }) as React.ReactElement
      );

      // HP入力を変更
      const hpInput = screen.getByRole('spinbutton');
      fireEvent.change(hpInput, { target: { value: '200' } });

      expect(onChange).toHaveBeenCalledWith({ hp: 200 });
    });
  });
});
