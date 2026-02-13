/**
 * DataTableFieldConfig のテスト
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataTableFieldConfig } from './DataTableFieldConfig';
import type { DataTableColumn } from '@/types/fields/DataTableFieldType';

// getFieldTypeOptions をモック
jest.mock('@/types/fields', () => ({
  getFieldTypeOptions: jest.fn(() => [
    { type: 'number', label: '数値' },
    { type: 'string', label: '文字列' },
    { type: 'boolean', label: 'ブーリアン' },
  ]),
}));

const mockContext = {
  dataTypes: [
    { id: 'element_type', name: '属性' },
    { id: 'status_type', name: '異常状態' },
  ],
};

describe('DataTableFieldConfig', () => {
  describe('参照データタイプ', () => {
    it('データタイプがない場合、メッセージが表示される', () => {
      render(
        <DataTableFieldConfig
          referenceTypeId=""
          columns={[]}
          context={{ dataTypes: [] }}
          onChange={jest.fn()}
        />
      );
      expect(screen.getByText('利用可能なデータタイプがありません')).toBeInTheDocument();
    });

    it('データタイプ選択肢が表示される', () => {
      render(
        <DataTableFieldConfig
          referenceTypeId=""
          columns={[]}
          context={mockContext}
          onChange={jest.fn()}
        />
      );
      expect(screen.getByText('参照データタイプ')).toBeInTheDocument();
    });
  });

  describe('カラム定義', () => {
    it('既存カラムが表示される', () => {
      const columns: DataTableColumn[] = [{ id: 'rate', name: '耐性率', fieldType: 'number' }];
      render(
        <DataTableFieldConfig
          referenceTypeId="element_type"
          columns={columns}
          context={mockContext}
          onChange={jest.fn()}
        />
      );
      expect(screen.getByDisplayValue('耐性率')).toBeInTheDocument();
    });

    it('列追加ボタンが表示される', () => {
      render(
        <DataTableFieldConfig
          referenceTypeId=""
          columns={[]}
          context={mockContext}
          onChange={jest.fn()}
        />
      );
      expect(screen.getByRole('button', { name: '列を追加' })).toBeInTheDocument();
    });

    it('列追加ボタンをクリックするとカラムが追加される', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(
        <DataTableFieldConfig
          referenceTypeId=""
          columns={[]}
          context={mockContext}
          onChange={onChange}
        />
      );

      await user.click(screen.getByRole('button', { name: '列を追加' }));
      expect(onChange).toHaveBeenCalledWith({
        columns: [expect.objectContaining({ name: '', fieldType: 'number' })],
      });
    });

    it('列削除ボタンをクリックするとカラムが削除される', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      const columns: DataTableColumn[] = [{ id: 'rate', name: '耐性率', fieldType: 'number' }];
      render(
        <DataTableFieldConfig
          referenceTypeId=""
          columns={columns}
          context={mockContext}
          onChange={onChange}
        />
      );

      await user.click(screen.getByRole('button', { name: '耐性率を削除' }));
      expect(onChange).toHaveBeenCalledWith({ columns: [] });
    });

    it('列名を変更するとonChangeが呼ばれる', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      const columns: DataTableColumn[] = [{ id: 'rate', name: '耐性率', fieldType: 'number' }];
      render(
        <DataTableFieldConfig
          referenceTypeId=""
          columns={columns}
          context={mockContext}
          onChange={onChange}
        />
      );

      const input = screen.getByDisplayValue('耐性率');
      await user.type(input, 'X');

      // 最後の呼び出しを確認（末尾に X が追加される）
      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
      expect(lastCall[0].columns[0].name).toBe('耐性率X');
    });
  });
});
