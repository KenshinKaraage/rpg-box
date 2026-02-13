/**
 * DataTableFieldEditor のテスト
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataTableFieldEditor } from './DataTableFieldEditor';
import { useStore } from '@/stores';
import type { DataTableColumn } from '@/types/fields/DataTableFieldType';

// Mock useStore
jest.mock('@/stores', () => ({
  useStore: jest.fn(),
}));

// createFieldTypeInstance をモック（DataTableFieldEditor は registry から直接 import）
jest.mock('@/types/fields/registry', () => ({
  createFieldTypeInstance: jest.fn((type: string) => {
    if (type === 'number') {
      return {
        getDefaultValue: () => 0,
        renderEditor: ({
          value,
          onChange,
          disabled,
        }: {
          value: number;
          onChange: (v: number) => void;
          disabled?: boolean;
        }) => (
          <input
            data-testid="number-editor"
            type="number"
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            disabled={disabled}
          />
        ),
      };
    }
    return undefined;
  }),
}));

const mockEntries = [
  { id: 'fire', typeId: 'element_type', values: { name: '火属性' } },
  { id: 'water', typeId: 'element_type', values: { name: '水属性' } },
  { id: 'thunder', typeId: 'element_type', values: {} },
];

const mockColumns: DataTableColumn[] = [{ id: 'rate', name: '耐性率', fieldType: 'number' }];

describe('DataTableFieldEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({
        dataEntries: {
          element_type: mockEntries,
        },
      })
    );
  });

  describe('referenceTypeId が未設定の場合', () => {
    it('設定なしのメッセージが表示される', () => {
      render(
        <DataTableFieldEditor value={[]} onChange={jest.fn()} referenceTypeId="" columns={[]} />
      );
      expect(screen.getByText('データタイプが設定されていません')).toBeInTheDocument();
    });
  });

  describe('エントリが存在しない場合', () => {
    it('エントリなしのメッセージが表示される', () => {
      (useStore as unknown as jest.Mock).mockImplementation((selector) =>
        selector({
          dataEntries: {
            empty_type: [],
          },
        })
      );

      render(
        <DataTableFieldEditor
          value={[]}
          onChange={jest.fn()}
          referenceTypeId="empty_type"
          columns={[]}
        />
      );
      expect(screen.getByText('エントリが存在しません')).toBeInTheDocument();
    });
  });

  describe('テーブル表示', () => {
    it('選択済み行が表示される', () => {
      render(
        <DataTableFieldEditor
          value={[{ id: 'fire', values: { rate: 50 } }]}
          onChange={jest.fn()}
          referenceTypeId="element_type"
          columns={mockColumns}
        />
      );
      expect(screen.getByText('火属性')).toBeInTheDocument();
    });

    it('カラム名が表示される', () => {
      render(
        <DataTableFieldEditor
          value={[{ id: 'fire', values: { rate: 50 } }]}
          onChange={jest.fn()}
          referenceTypeId="element_type"
          columns={mockColumns}
        />
      );
      expect(screen.getByText('耐性率')).toBeInTheDocument();
    });

    it('削除ボタンが表示される', () => {
      render(
        <DataTableFieldEditor
          value={[{ id: 'fire', values: { rate: 50 } }]}
          onChange={jest.fn()}
          referenceTypeId="element_type"
          columns={mockColumns}
        />
      );
      expect(screen.getByRole('button', { name: '火属性を削除' })).toBeInTheDocument();
    });

    it('追加ボタンが表示される', () => {
      render(
        <DataTableFieldEditor
          value={[]}
          onChange={jest.fn()}
          referenceTypeId="element_type"
          columns={mockColumns}
        />
      );
      expect(screen.getByRole('button', { name: '追加' })).toBeInTheDocument();
    });

    it('全エントリが選択済みの場合、追加UIが非表示', () => {
      render(
        <DataTableFieldEditor
          value={[
            { id: 'fire', values: { rate: 50 } },
            { id: 'water', values: { rate: 100 } },
            { id: 'thunder', values: { rate: -50 } },
          ]}
          onChange={jest.fn()}
          referenceTypeId="element_type"
          columns={mockColumns}
        />
      );
      expect(screen.queryByRole('button', { name: '追加' })).not.toBeInTheDocument();
    });
  });

  describe('操作', () => {
    it('削除ボタンをクリックすると行が削除される', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(
        <DataTableFieldEditor
          value={[
            { id: 'fire', values: { rate: 50 } },
            { id: 'water', values: { rate: 100 } },
          ]}
          onChange={onChange}
          referenceTypeId="element_type"
          columns={mockColumns}
        />
      );

      await user.click(screen.getByRole('button', { name: '火属性を削除' }));
      expect(onChange).toHaveBeenCalledWith([{ id: 'water', values: { rate: 100 } }]);
    });
  });

  describe('disabled', () => {
    it('disabled の場合、削除ボタンが非表示', () => {
      render(
        <DataTableFieldEditor
          value={[{ id: 'fire', values: { rate: 50 } }]}
          onChange={jest.fn()}
          referenceTypeId="element_type"
          columns={mockColumns}
          disabled
        />
      );
      expect(screen.queryByRole('button', { name: '火属性を削除' })).not.toBeInTheDocument();
    });

    it('disabled の場合、追加UIが非表示', () => {
      render(
        <DataTableFieldEditor
          value={[]}
          onChange={jest.fn()}
          referenceTypeId="element_type"
          columns={mockColumns}
          disabled
        />
      );
      expect(screen.queryByRole('button', { name: '追加' })).not.toBeInTheDocument();
    });
  });

  describe('エラー表示', () => {
    it('error が指定された場合、エラーメッセージが表示される', () => {
      render(
        <DataTableFieldEditor
          value={[]}
          onChange={jest.fn()}
          referenceTypeId="element_type"
          columns={mockColumns}
          error="1件以上追加してください"
        />
      );
      expect(screen.getByText('1件以上追加してください')).toBeInTheDocument();
    });
  });
});
